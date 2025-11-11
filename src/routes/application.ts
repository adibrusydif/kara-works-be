import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// Get all applications (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { event_id, user_id, status } = req.query

    let query = supabase
      .from('application')
      .select('*, event:event_id(*), user:user_id(*)')
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (event_id) {
      query = query.eq('event_id', event_id as string)
    }
    if (user_id) {
      query = query.eq('user_id', user_id as string)
    }
    if (status) {
      query = query.eq('application_status', status as string)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get single application by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('application')
      .select('*, event:event_id(*), user:user_id(*)')
      .eq('application_id', id)
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ error: 'Application not found' })
    }

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Add application (user applies to event)
router.post('/', async (req, res) => {
  try {
    const {
      event_id,
      user_id,
      application_status
    } = req.body

    // Validation
    if (!event_id) {
      return res.status(400).json({ error: 'event_id is required' })
    }
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Validate event_id exists in database
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('event_id')
      .eq('event_id', event_id)
      .single()

    if (eventError || !event) {
      return res.status(404).json({ 
        error: `Event with id "${event_id}" not found` 
      })
    }

    // Validate user_id exists in database
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('user_id')
      .eq('user_id', user_id)
      .single()

    if (userError || !user) {
      return res.status(404).json({ 
        error: `User with id "${user_id}" not found` 
      })
    }

    const { data, error } = await supabase
      .from('application')
      .insert([
        {
          event_id,
          user_id,
          application_status: application_status || 'applied'
        }
      ])
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ data })
  } catch (error: any) {
    // Handle unique constraint violation (user already applied to this event)
    if (error.code === '23505') {
      return res.status(409).json({ error: 'User has already applied to this event' })
    }
    // Handle foreign key constraint violation
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid event_id or user_id' })
    }
    res.status(500).json({ error: error.message })
  }
})

// Update application
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      application_status,
      clock_in_qr_data,
      clock_out_qr_data,
      clock_in_prove,
      clock_out_prove
    } = req.body

    // Build update object (only include provided fields)
    const updates: any = {}
    if (application_status !== undefined) updates.application_status = application_status
    if (clock_in_qr_data !== undefined) updates.clock_in_qr_data = clock_in_qr_data
    if (clock_out_qr_data !== undefined) updates.clock_out_qr_data = clock_out_qr_data
    if (clock_in_prove !== undefined) updates.clock_in_prove = clock_in_prove
    if (clock_out_prove !== undefined) updates.clock_out_prove = clock_out_prove

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const { data, error } = await supabase
      .from('application')
      .update(updates)
      .eq('application_id', id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ error: 'Application not found' })
    }

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete application
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('application')
      .delete()
      .eq('application_id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get applications by event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params

    const { data, error } = await supabase
      .from('application')
      .select('*, event:event_id(*), user:user_id(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get applications by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const { data, error } = await supabase
      .from('application')
      .select('*, event:event_id(*), user:user_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get applications by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params

    const { data, error } = await supabase
      .from('application')
      .select('*, event:event_id(*), user:user_id(*)')
      .eq('application_status', status)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router