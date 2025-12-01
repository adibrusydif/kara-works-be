import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users with optional filters. Includes related hotel and bank data.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter users by hotel ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [hotel, worker]
 *         description: Filter users by role
 *         example: "worker"
 *       - in: query
 *         name: bank_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter users by bank ID
 *         example: "550e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       200:
 *         description: Successfully retrieved list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     description: Retrieve detailed information about a specific user, including related hotel, bank data, and wallet balance
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the user
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Successfully retrieved user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         wallet_balance:
 *                           type: number
 *                           format: decimal
 *                           description: Current wallet balance
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user. A wallet will be automatically created with balance 0. If user_role is "hotel", hotel_id is required.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_phone
 *               - user_name
 *               - user_role
 *             properties:
 *               user_phone:
 *                 type: string
 *                 description: Unique phone number for the user
 *                 example: "+6281234567890"
 *               user_name:
 *                 type: string
 *                 description: Name of the user
 *                 example: "John Doe"
 *               user_photo:
 *                 type: string
 *                 format: uri
 *                 description: URL to user photo
 *                 example: "https://example.com/photos/user.jpg"
 *               user_role:
 *                 type: string
 *                 enum: [hotel, worker]
 *                 description: Role of the user
 *                 example: "worker"
 *               hotel_id:
 *                 type: string
 *                 format: uuid
 *                 description: Hotel ID (required if user_role is "hotel")
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               bank_id:
 *                 type: string
 *                 format: uuid
 *                 description: Bank ID
 *                 example: "550e8400-e29b-41d4-a716-446655440001"
 *               bank_account_name:
 *                 type: string
 *                 description: Bank account holder name
 *                 example: "John Doe"
 *               bank_account_id:
 *                 type: string
 *                 description: Bank account number
 *                 example: "1234567890"
 *           example:
 *             user_phone: "+6281234567890"
 *             user_name: "John Doe"
 *             user_role: "worker"
 *             bank_id: "550e8400-e29b-41d4-a716-446655440001"
 *             bank_account_name: "John Doe"
 *             bank_account_id: "1234567890"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 wallet:
 *                   type: object
 *                   properties:
 *                     wallet_id:
 *                       type: string
 *                       format: uuid
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     wallet_balance:
 *                       type: number
 *                       format: decimal
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingPhone:
 *                 value:
 *                   error: "user_phone is required"
 *               invalidRole:
 *                 value:
 *                   error: "user_role must be either \"hotel\" or \"worker\""
 *               missingHotelId:
 *                 value:
 *                   error: "hotel_id is required when user_role is \"hotel\""
 *       404:
 *         description: Hotel not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Hotel with id \"550e8400-e29b-41d4-a716-446655440000\" not found"
 *       409:
 *         description: User with this phone number already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "User with this phone number already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Update user details. All fields are optional - only provided fields will be updated. If updating user_role to "hotel", hotel_id must be provided or already exist.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the user to update
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_phone:
 *                 type: string
 *                 description: Updated phone number (must be unique)
 *                 example: "+6281234567891"
 *               user_name:
 *                 type: string
 *                 description: Updated user name
 *                 example: "John Doe Updated"
 *               user_photo:
 *                 type: string
 *                 format: uri
 *                 description: Updated photo URL
 *               user_role:
 *                 type: string
 *                 enum: [hotel, worker]
 *                 description: Updated user role
 *               hotel_id:
 *                 type: string
 *                 format: uuid
 *                 description: Updated hotel ID
 *               bank_id:
 *                 type: string
 *                 format: uuid
 *                 description: Updated bank ID
 *               bank_account_name:
 *                 type: string
 *                 description: Updated bank account name
 *               bank_account_id:
 *                 type: string
 *                 description: Updated bank account number
 *           example:
 *             user_name: "John Doe Updated"
 *             bank_account_id: "9876543210"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noFields:
 *                 value:
 *                   error: "No fields to update"
 *               invalidRole:
 *                 value:
 *                   error: "user_role must be either \"hotel\" or \"worker\""
 *               missingHotelId:
 *                 value:
 *                   error: "hotel_id is required when user_role is \"hotel\""
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User with this phone number already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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


/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Remove a user from the system
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the user to delete
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       204:
 *         description: User deleted successfully (no content)
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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


/**
 * @swagger
 * /api/users/hotel/{hotelId}:
 *   get:
 *     summary: Get users by hotel
 *     description: Retrieve all users associated with a specific hotel, including related hotel and bank data
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the hotel
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Successfully retrieved users for the hotel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/users/role/{role}:
 *   get:
 *     summary: Get users by role
 *     description: Retrieve all users with a specific role (hotel or worker), including related hotel and bank data
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hotel, worker]
 *         description: The user role to filter by
 *         example: "worker"
 *     responses:
 *       200:
 *         description: Successfully retrieved users with the specified role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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