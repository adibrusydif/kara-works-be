import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications
 *     description: Retrieve a list of all applications with optional filters. Includes related event and user data.
 *     tags: [Applications]
 *     parameters:
 *       - in: query
 *         name: event_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter applications by event ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter applications by user ID
 *         example: "550e8400-e29b-41d4-a716-446655440001"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter applications by status
 *         example: "applied"
 *     responses:
 *       200:
 *         description: Successfully retrieved list of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get a single application by ID
 *     description: Retrieve detailed information about a specific application, including related event and user data
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the application
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Successfully retrieved application details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Application'
 *       404:
 *         description: Application not found
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

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Create a new application
 *     description: Allow a user to apply to an event. Validates that both event and user exist before creating the application.
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_id
 *               - user_id
 *             properties:
 *               event_id:
 *                 type: string
 *                 format: uuid
 *                 description: The unique identifier of the event
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: The unique identifier of the user applying
 *                 example: "550e8400-e29b-41d4-a716-446655440001"
 *               application_status:
 *                 type: string
 *                 description: The status of the application (defaults to 'applied' if not provided)
 *                 example: "applied"
 *           example:
 *             event_id: "550e8400-e29b-41d4-a716-446655440000"
 *             user_id: "550e8400-e29b-41d4-a716-446655440001"
 *             application_status: "applied"
 *     responses:
 *       201:
 *         description: Application created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Application'
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "event_id is required"
 *       404:
 *         description: Event or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Event with id \"550e8400-e29b-41d4-a716-446655440000\" not found"
 *       409:
 *         description: User has already applied to this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "User has already applied to this event"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/applications/{id}:
 *   put:
 *     summary: Update an application
 *     description: Update application details such as status, clock-in/out QR data, or proof images
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the application to update
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_status:
 *                 type: string
 *                 description: The status of the application
 *                 example: "accepted"
 *               clock_in_qr_data:
 *                 type: string
 *                 description: QR code data for clock-in
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               clock_out_qr_data:
 *                 type: string
 *                 description: QR code data for clock-out
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               clock_in_prove:
 *                 type: string
 *                 format: uri
 *                 description: URL to clock-in proof image
 *                 example: "https://example.com/proofs/clock-in.jpg"
 *               clock_out_prove:
 *                 type: string
 *                 format: uri
 *                 description: URL to clock-out proof image
 *                 example: "https://example.com/proofs/clock-out.jpg"
 *           example:
 *             application_status: "accepted"
 *             clock_in_qr_data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Application updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Application'
 *       400:
 *         description: Validation error - no fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No fields to update"
 *       404:
 *         description: Application not found
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

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     summary: Delete an application
 *     description: Remove an application from the system
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the application to delete
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       204:
 *         description: Application deleted successfully (no content)
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/applications/event/{eventId}:
 *   get:
 *     summary: Get applications by event
 *     description: Retrieve all applications for a specific event, including related user data
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the event
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Successfully retrieved applications for the event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/applications/user/{userId}:
 *   get:
 *     summary: Get applications by user
 *     description: Retrieve all applications submitted by a specific user, including related event data
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the user
 *         example: "550e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       200:
 *         description: Successfully retrieved applications for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/applications/status/{status}:
 *   get:
 *     summary: Get applications by status
 *     description: Retrieve all applications with a specific status, including related event and user data
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: The application status to filter by
 *         example: "applied"
 *     responses:
 *       200:
 *         description: Successfully retrieved applications with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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