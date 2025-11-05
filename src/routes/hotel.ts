import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// Get all hotels
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hotel')
      .select('*')
      .order('hotel_name', { ascending: true })

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get single hotel by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('hotel')
      .select('*')
      .eq('hotel_id', id)
      .single()

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Add hotel
router.post('/', async (req, res) => {
  try {
    const { hotel_email, hotel_name, hotel_logo } = req.body

    // Validation
    if (!hotel_email) {
      return res.status(400).json({ error: 'hotel_email is required' })
    }
    if (!hotel_name) {
      return res.status(400).json({ error: 'hotel_name is required' })
    }

    const { data, error } = await supabase
      .from('hotel')
      .insert([{ hotel_email, hotel_name, hotel_logo }])
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ data })
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Hotel with this email already exists' })
    }
    res.status(500).json({ error: error.message })
  }
})

// Update hotel
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { hotel_email, hotel_name, hotel_logo } = req.body

    // Build update object (only include provided fields)
    const updates: any = {}
    if (hotel_email !== undefined) updates.hotel_email = hotel_email
    if (hotel_name !== undefined) updates.hotel_name = hotel_name
    if (hotel_logo !== undefined) updates.hotel_logo = hotel_logo

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const { data, error } = await supabase
      .from('hotel')
      .update(updates)
      .eq('hotel_id', id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ error: 'Hotel not found' })
    }

    res.json({ data })
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Hotel with this email already exists' })
    }
    res.status(500).json({ error: error.message })
  }
})

// Delete hotel
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('hotel')
      .delete()
      .eq('hotel_id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router