import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()


/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve a list of all events with optional filters. Includes related creator and hotel data.
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: creator_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter events by creator ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter events by status (pending, posted, finished)
 *         example: "posted"
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events from this date onwards
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events up to this date
 *         example: "2024-12-31T23:59:59Z"
 *     responses:
 *       200:
 *         description: Successfully retrieved list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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


/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get a single event by ID
 *     description: Retrieve detailed information about a specific event, including related creator and hotel data
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the event
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Successfully retrieved event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
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

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event. Validates that the creator exists and all required fields are provided.
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_creator_id
 *               - event_name
 *               - event_date
 *               - event_salary
 *               - event_person_count
 *             properties:
 *               event_creator_id:
 *                 type: string
 *                 format: uuid
 *                 description: The unique identifier of the user creating the event
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               event_name:
 *                 type: string
 *                 description: The name of the event
 *                 example: "Wedding Reception"
 *               event_photo:
 *                 type: string
 *                 format: uri
 *                 description: URL to event photo
 *                 example: "https://example.com/events/photo.jpg"
 *               event_description:
 *                 type: string
 *                 description: Description of the event
 *                 example: "Elegant wedding reception with live music"
 *               event_date:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time of the event
 *                 example: "2024-12-25T18:00:00Z"
 *               event_salary:
 *                 type: number
 *                 format: decimal
 *                 description: Salary per worker for this event
 *                 example: 500000
 *               event_person_count:
 *                 type: integer
 *                 description: Number of workers needed
 *                 example: 10
 *               event_status:
 *                 type: string
 *                 enum: [pending, posted, finished]
 *                 description: Status of the event (defaults to 'posted' if not provided)
 *                 example: "posted"
 *           example:
 *             event_creator_id: "550e8400-e29b-41d4-a716-446655440000"
 *             event_name: "Wedding Reception"
 *             event_date: "2024-12-25T18:00:00Z"
 *             event_salary: 500000
 *             event_person_count: 10
 *             event_status: "posted"
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingCreator:
 *                 value:
 *                   error: "event_creator_id is required"
 *               invalidDate:
 *                 value:
 *                   error: "event_date must be a valid date"
 *               invalidSalary:
 *                 value:
 *                   error: "event_salary must be a positive number"
 *       404:
 *         description: Creator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "User with id \"550e8400-e29b-41d4-a716-446655440000\" not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event
 *     description: Update event details. All fields are optional - only provided fields will be updated.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the event to update
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_name:
 *                 type: string
 *                 description: The name of the event
 *                 example: "Updated Event Name"
 *               event_photo:
 *                 type: string
 *                 format: uri
 *                 description: URL to event photo
 *               event_description:
 *                 type: string
 *                 description: Description of the event
 *               event_date:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time of the event
 *               event_salary:
 *                 type: number
 *                 format: decimal
 *                 description: Salary per worker
 *               event_person_count:
 *                 type: integer
 *                 description: Number of workers needed
 *               event_status:
 *                 type: string
 *                 enum: [pending, posted, finished]
 *                 description: Status of the event
 *           example:
 *             event_name: "Updated Event Name"
 *             event_status: "posted"
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No fields to update"
 *       404:
 *         description: Event not found
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

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     description: Remove an event from the system
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the event to delete
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       204:
 *         description: Event deleted successfully (no content)
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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


/**
 * @swagger
 * /api/events/creator/{creatorId}:
 *   get:
 *     summary: Get events by creator
 *     description: Retrieve all events created by a specific user
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: creatorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the event creator
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Successfully retrieved events for the creator
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/events/status/{status}:
 *   get:
 *     summary: Get events by status
 *     description: Retrieve all events with a specific status
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, posted, finished]
 *         description: The event status to filter by
 *         example: "posted"
 *     responses:
 *       200:
 *         description: Successfully retrieved events with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/events/{id}/generate-clock-in-qr:
 *   post:
 *     summary: Generate clock-in QR code
 *     description: Generate a temporary QR code for workers to clock in to an event. The QR code contains event_id, creator_id, timestamp, and type.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the event
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QRCodeResponse'
 *             example:
 *               payload:
 *                 event_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 creator_id: "550e8400-e29b-41d4-a716-446655440001"
 *                 generated_at: "2024-01-01T12:00:00Z"
 *                 type: "clock_in"
 *               qr: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *       404:
 *         description: Event not found
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

/**
 * @swagger
 * /api/events/{id}/generate-clock-out-qr:
 *   post:
 *     summary: Generate clock-out QR code
 *     description: Generate a temporary QR code for workers to clock out from an event. The QR code contains event_id, creator_id, timestamp, and type.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the event
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QRCodeResponse'
 *             example:
 *               payload:
 *                 event_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 creator_id: "550e8400-e29b-41d4-a716-446655440001"
 *                 generated_at: "2024-01-01T20:00:00Z"
 *                 type: "clock_out"
 *               qr: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *       404:
 *         description: Event not found
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

/**
 * @swagger
 * /api/events/{id}/finish:
 *   post:
 *     summary: Finish an event
 *     description: Mark an event as finished and credit all workers who clocked out. This will update wallet balances and create wallet transactions for each worker.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the event to finish
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Event finished successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Event finished and workers credited successfully"
 *                 processedCount:
 *                   type: integer
 *                   description: Number of workers who were credited
 *                   example: 5
 *                 processed:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       application_id:
 *                         type: string
 *                         format: uuid
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *             example:
 *               message: "Event finished and workers credited successfully"
 *               processedCount: 5
 *               processed:
 *                 - application_id: "550e8400-e29b-41d4-a716-446655440002"
 *                   user_id: "550e8400-e29b-41d4-a716-446655440003"
 *       400:
 *         description: Event already finished
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Event already finished"
 *       404:
 *         description: Event not found
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