import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// Get all events (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { creator_id, status, date_from, date_to } = req.query

    let query = supabase
    .from('event')
    .select('*, event_creator:event_creator_id(*, hotel:hotel_id(hotel_name, hotel_id, hotel_logo))')
    .order('event_date', { ascending: false })

    // Apply filters if provided
    if (creator_id) {
      query = query.eq('event_creator_id', creator_id as string)
    }
    if (status) {
      query = query.eq('event_status', status as string)
    }
    if (date_from) {
      query = query.gte('event_date', date_from as string)
    }
    if (date_to) {
      query = query.lte('event_date', date_to as string)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get single event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
    .from('event')
    .select('*, event_creator:event_creator_id(*, hotel:hotel_id(hotel_name, hotel_id, hotel_logo))')
    .eq('event_id', id)
    .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ error: 'Event not found' })
    }

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Add event
router.post('/', async (req, res) => {
  try {
    const {
      event_creator_id,
      event_name,
      event_photo,
      event_description,
      event_date,
      event_salary,
      event_person_count,
      event_status
    } = req.body

    // Validation
    if (!event_creator_id) {
      return res.status(400).json({ error: 'event_creator_id is required' })
    }
    if (!event_name) {
      return res.status(400).json({ error: 'event_name is required' })
    }
    if (!event_date) {
      return res.status(400).json({ error: 'event_date is required' })
    }
    if (event_salary === undefined || event_salary === null) {
      return res.status(400).json({ error: 'event_salary is required' })
    }
    if (event_person_count === undefined || event_person_count === null) {
      return res.status(400).json({ error: 'event_person_count is required' })
    }

    // Validate event_creator_id exists in database
    const { data: creator, error: creatorError } = await supabase
      .from('user')
      .select('user_id')
      .eq('user_id', event_creator_id)
      .single()

    if (creatorError || !creator) {
      return res.status(404).json({ 
        error: `User with id "${event_creator_id}" not found` 
      })
    }

    // Validate event_date is a valid date
    const date = new Date(event_date)
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'event_date must be a valid date' })
    }

    // Validate event_salary is a positive number
    if (typeof event_salary !== 'number' || event_salary < 0) {
      return res.status(400).json({ error: 'event_salary must be a positive number' })
    }

    // Validate event_person_count is a positive integer
    if (!Number.isInteger(event_person_count) || event_person_count < 1) {
      return res.status(400).json({ error: 'event_person_count must be a positive integer' })
    }

    const { data, error } = await supabase
      .from('event')
      .insert([
        {
          event_creator_id,
          event_name,
          event_photo,
          event_description,
          event_date,
          event_salary,
          event_person_count,
          event_status: event_status || 'posted'
        }
      ])
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ data })
  } catch (error: any) {
    // Handle foreign key constraint violation
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid event_creator_id' })
    }
    res.status(500).json({ error: error.message })
  }
})

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      event_name,
      event_photo,
      event_description,
      event_date,
      event_salary,
      event_person_count,
      event_status
    } = req.body

    // Build update object (only include provided fields)
    const updates: any = {}
    if (event_name !== undefined) updates.event_name = event_name
    if (event_photo !== undefined) updates.event_photo = event_photo
    if (event_description !== undefined) updates.event_description = event_description
    if (event_date !== undefined) {
      // Validate event_date is a valid date
      const date = new Date(event_date)
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'event_date must be a valid date' })
      }
      updates.event_date = event_date
    }
    if (event_salary !== undefined) {
      if (typeof event_salary !== 'number' || event_salary < 0) {
        return res.status(400).json({ error: 'event_salary must be a positive number' })
      }
      updates.event_salary = event_salary
    }
    if (event_person_count !== undefined) {
      if (!Number.isInteger(event_person_count) || event_person_count < 1) {
        return res.status(400).json({ error: 'event_person_count must be a positive integer' })
      }
      updates.event_person_count = event_person_count
    }
    if (event_status !== undefined) updates.event_status = event_status

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const { data, error } = await supabase
      .from('event')
      .update(updates)
      .eq('event_id', id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ error: 'Event not found' })
    }

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('event')
      .delete()
      .eq('event_id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get events by creator
router.get('/creator/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params

    const { data, error } = await supabase
      .from('event')
      .select('*, event_creator:event_creator_id(*)')
      .eq('event_creator_id', creatorId)
      .order('event_date', { ascending: false })

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get events by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params

    const { data, error } = await supabase
      .from('event')
      .select('*, event_creator:event_creator_id(*)')
      .eq('event_status', status)
      .order('event_date', { ascending: false })

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

import QRCode from 'qrcode'
import { buildClockQrPayload } from '../utils/clockQr.js'

// Generates a temporary clock-in QR for an event
router.post('/:id/generate-clock-in-qr', async (req, res) => {
  try {
    const { id } = req.params

    const { data: event, error } = await supabase
      .from('event')
      .select('event_id, event_creator_id')
      .eq('event_id', id)
      .single()

    if (error || !event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    const payload = buildClockQrPayload({
      eventId: event.event_id,
      creatorId: event.event_creator_id,
      type: 'clock_in',
    })

    const qrDataURL = await QRCode.toDataURL(JSON.stringify(payload))

    res.json({
      payload,
      qr: qrDataURL,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Generates a temporary clock-out QR for an event
router.post('/:id/generate-clock-out-qr', async (req, res) => {
  try {
    const { id } = req.params

    const { data: event, error } = await supabase
      .from('event')
      .select('event_id, event_creator_id')
      .eq('event_id', id)
      .single()

    if (error || !event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    const payload = buildClockQrPayload({
      eventId: event.event_id,
      creatorId: event.event_creator_id,
      type: 'clock_out',
    })

    const qrDataURL = await QRCode.toDataURL(JSON.stringify(payload))

    res.json({
      payload,
      qr: qrDataURL,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/finish', async (req, res) => {
    try {
      const { id } = req.params
      const finishedAt = new Date().toISOString()
  
      // 1) pull event and guard
      const { data: event, error: eventError } = await supabase
        .from('event')
        .select('event_id, event_salary, event_status')
        .eq('event_id', id)
        .single()
  
      if (eventError || !event) {
        return res.status(404).json({ error: 'Event not found' })
      }
      if (event.event_status === 'finished') {
        return res.status(400).json({ error: 'Event already finished' })
      }
  
      // 2) get applications that clocked out
      const { data: applications, error: appsError } = await supabase
        .from('application')
        .select('application_id, user_id, clock_out_qr_data')
        .eq('event_id', id)
        .not('clock_out_qr_data', 'is', null)
  
      if (appsError) throw appsError
      if (!applications || applications.length === 0) {
        // still finish the event if there were none
        await supabase.from('event').update({ event_status: 'finished' }).eq('event_id', id)
        return res.json({ message: 'Event finished, no clocked-out workers found', processed: 0 })
      }
  
      const salary = Number(event.event_salary) || 0
  
      // 3) credit each worker
      const processed = []
      for (const application of applications) {
        const userId = application.user_id
  
        // fetch (or create) wallet
        const { data: wallet, error: walletError } = await supabase
          .from('wallet')
          .select('wallet_id, wallet_balance')
          .eq('user_id', userId)
          .single()
  
        let walletId = wallet?.wallet_id
        let currentBalance = Number(wallet?.wallet_balance ?? 0)
  
        if (walletError || !wallet) {
          const { data: newWallet, error: createWalletError } = await supabase
            .from('wallet')
            .insert({ user_id: userId, wallet_balance: 0 })
            .select()
            .single()
  
          if (createWalletError) throw createWalletError
          walletId = newWallet.wallet_id
          currentBalance = 0
        }
  
        const newBalance = currentBalance + salary
  
        const { error: updateBalanceError } = await supabase
          .from('wallet')
          .update({ wallet_balance: newBalance })
          .eq('wallet_id', walletId)
  
        if (updateBalanceError) throw updateBalanceError
  
        const { error: txError } = await supabase.from('wallet_transaction').insert({
          wallet_id: walletId,
          transaction_event_id: id,
          transaction_wd_id: null,
          transaction_amount: salary,
          transaction_date: finishedAt,
        })
  
        if (txError) throw txError
  
        const { error: appUpdateError } = await supabase
          .from('application')
          .update({ application_status: 'finished' })
          .eq('application_id', application.application_id)
  
        if (appUpdateError) throw appUpdateError
  
        processed.push({ application_id: application.application_id, user_id: userId })
      }
  
      // 4) mark the event finished
      const { error: eventFinishError } = await supabase
        .from('event')
        .update({ event_status: 'finished', updated_at: finishedAt })
        .eq('event_id', id)
  
      if (eventFinishError) throw eventFinishError
  
      res.json({
        message: 'Event finished and workers credited successfully',
        processedCount: processed.length,
        processed,
      })
    } catch (error: any) {
      console.error('finish event error', error)
      res.status(500).json({ error: error.message || 'Failed to finish event' })
    }
  })

export default router