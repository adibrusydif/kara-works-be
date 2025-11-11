import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// Get all users (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { hotel_id, role, bank_id } = req.query

    let query = supabase
      .from('user')
      .select('*, hotel:hotel_id(*), bank:bank_id(*)')
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (hotel_id) {
      query = query.eq('hotel_id', hotel_id as string)
    }
    if (role) {
      query = query.eq('user_role', role as string)
    }
    if (bank_id) {
      query = query.eq('bank_id', bank_id as string)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get single user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('user')
      .select('*, hotel:hotel_id(*), bank:bank_id(*)')
      .eq('user_id', id)
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ error: 'User not found' })
    }

     // Get wallet balance for the user
     const { data: wallet, error: walletError } = await supabase
     .from('wallet')
     .select('wallet_balance')
     .eq('user_id', id)
     .single()

   if (!walletError && wallet) {
     data.wallet_balance = wallet.wallet_balance
   } else {
     data.wallet_balance = 0.00
   }

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Add user
router.post('/', async (req, res) => {
    try {
      const {
        user_phone,
        user_name,
        user_photo,
        user_role,
        hotel_id,
        bank_id,
        bank_account_name,
        bank_account_id
      } = req.body
  
      // Validation
      if (!user_phone) {
        return res.status(400).json({ error: 'user_phone is required' })
      }
      if (!user_name) {
        return res.status(400).json({ error: 'user_name is required' })
      }
      if (!user_role) {
        return res.status(400).json({ error: 'user_role is required' })
      }
  
      // Validate user_role must be "hotel" or "worker"
      if (user_role !== 'hotel' && user_role !== 'worker') {
        return res.status(400).json({ 
          error: 'user_role must be either "hotel" or "worker"' 
        })
      }
  
      // If user_role is "hotel", hotel_id is required
      if (user_role === 'hotel' && !hotel_id) {
        return res.status(400).json({ 
          error: 'hotel_id is required when user_role is "hotel"' 
        })
      }

       // Validate hotel_id exists in database if provided
    if (hotel_id) {
        const { data: hotel, error: hotelError } = await supabase
          .from('hotel')
          .select('hotel_id')
          .eq('hotel_id', hotel_id)
          .single()
  
        if (hotelError || !hotel) {
          return res.status(404).json({ 
            error: `Hotel with id "${hotel_id}" not found` 
          })
        }
      }
  
      const { data: userData, error } = await supabase
        .from('user')
        .insert([
          {
            user_phone,
            user_name,
            user_photo,
            user_role,
            hotel_id,
            bank_id,
            bank_account_name,
            bank_account_id
          }
        ])
        .select()
        .single()
  
      if (error) throw error
  
      // Automatically create wallet for the new user
    const { data: walletData, error: walletError } = await supabase
        .from('wallet')
        .insert([
        {
            user_id: userData.user_id,
            wallet_balance: 0.00
        }
        ])
        .select()
        .single()

    if (walletError) {
        // If wallet creation fails, log error but don't fail the user creation
        console.error('Failed to create wallet for user:', walletError)
        // Continue with response even if wallet creation fails
    }

    // Return user data with wallet info
    res.status(201).json({ 
        data: userData,
        wallet: walletData || null
    })
    } catch (error: any) {
      // Handle unique constraint violation (phone already exists)
      if (error.code === '23505') {
        return res.status(409).json({ error: 'User with this phone number already exists' })
      }
      // Handle foreign key constraint violation
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Invalid hotel_id or bank_id' })
      }
      res.status(500).json({ error: error.message })
    }
  })

// Update user
router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params
      const {
        user_phone,
        user_name,
        user_photo,
        user_role,
        hotel_id,
        bank_id,
        bank_account_name,
        bank_account_id
      } = req.body
  
      // Build update object (only include provided fields)
      const updates: any = {}
      if (user_phone !== undefined) updates.user_phone = user_phone
      if (user_name !== undefined) updates.user_name = user_name
      if (user_photo !== undefined) updates.user_photo = user_photo
      if (user_role !== undefined) {
        // Validate user_role must be "hotel" or "worker"
        if (user_role !== 'hotel' && user_role !== 'worker') {
          return res.status(400).json({ 
            error: 'user_role must be either "hotel" or "worker"' 
          })
        }
        updates.user_role = user_role
      }
      if (hotel_id !== undefined) updates.hotel_id = hotel_id
      if (bank_id !== undefined) updates.bank_id = bank_id
      if (bank_account_name !== undefined) updates.bank_account_name = bank_account_name
      if (bank_account_id !== undefined) updates.bank_account_id = bank_account_id
  
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }
  
      // If updating user_role to "hotel", ensure hotel_id is provided
      if (updates.user_role === 'hotel') {
        // If hotel_id is being updated, check it's provided
        // If hotel_id is not in updates, check if it exists in the current user
        if (updates.hotel_id === null || updates.hotel_id === undefined) {
          // Check current user's hotel_id
          const { data: currentUser } = await supabase
            .from('user')
            .select('hotel_id')
            .eq('user_id', id)
            .single()
  
          if (!currentUser?.hotel_id) {
            return res.status(400).json({ 
              error: 'hotel_id is required when user_role is "hotel". Either provide hotel_id in the update or ensure the user already has a hotel_id.' 
            })
          }
        }
      }
  
      const { data, error } = await supabase
        .from('user')
        .update(updates)
        .eq('user_id', id)
        .select()
        .single()
  
      if (error) throw error
  
      if (!data) {
        return res.status(404).json({ error: 'User not found' })
      }
  
      res.json({ data })
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({ error: 'User with this phone number already exists' })
      }
      // Handle foreign key constraint violation
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Invalid hotel_id or bank_id' })
      }
      res.status(500).json({ error: error.message })
    }
  })

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('user')
      .delete()
      .eq('user_id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get users by hotel
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params

    const { data, error } = await supabase
      .from('user')
      .select('*, hotel:hotel_id(*), bank:bank_id(*)')
      .eq('hotel_id', hotelId)
      .order('user_name', { ascending: true })

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get users by role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params

    const { data, error } = await supabase
      .from('user')
      .select('*, hotel:hotel_id(*), bank:bank_id(*)')
      .eq('user_role', role)
      .order('user_name', { ascending: true })

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router