import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/hotels:
 *   get:
 *     summary: Get all hotels
 *     description: Retrieve a list of all hotels, ordered by hotel name
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: Successfully retrieved list of hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 *             example:
 *               data:
 *                 - hotel_id: "550e8400-e29b-41d4-a716-446655440000"
 *                   hotel_email: "hotel@example.com"
 *                   hotel_name: "Grand Hotel"
 *                   hotel_logo: "https://example.com/logos/grand-hotel.png"
 *                   created_at: "2024-01-01T00:00:00Z"
 *                   updated_at: "2024-01-01T00:00:00Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/hotels/{id}:
 *   get:
 *     summary: Get a single hotel by ID
 *     description: Retrieve detailed information about a specific hotel
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the hotel
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Successfully retrieved hotel details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *             example:
 *               data:
 *                 hotel_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 hotel_email: "hotel@example.com"
 *                 hotel_name: "Grand Hotel"
 *                 hotel_logo: "https://example.com/logos/grand-hotel.png"
 *                 created_at: "2024-01-01T00:00:00Z"
 *                 updated_at: "2024-01-01T00:00:00Z"
 *       404:
 *         description: Hotel not found
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

/**
 * @swagger
 * /api/hotels:
 *   post:
 *     summary: Create a new hotel
 *     description: Add a new hotel to the system. Email must be unique.
 *     tags: [Hotels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_email
 *               - hotel_name
 *             properties:
 *               hotel_email:
 *                 type: string
 *                 format: email
 *                 description: Unique email address for the hotel
 *                 example: "hotel@example.com"
 *               hotel_name:
 *                 type: string
 *                 description: Name of the hotel
 *                 example: "Grand Hotel"
 *               hotel_logo:
 *                 type: string
 *                 format: uri
 *                 description: URL to hotel logo image
 *                 example: "https://example.com/logos/grand-hotel.png"
 *           example:
 *             hotel_email: "hotel@example.com"
 *             hotel_name: "Grand Hotel"
 *             hotel_logo: "https://example.com/logos/grand-hotel.png"
 *     responses:
 *       201:
 *         description: Hotel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *             example:
 *               data:
 *                 hotel_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 hotel_email: "hotel@example.com"
 *                 hotel_name: "Grand Hotel"
 *                 hotel_logo: "https://example.com/logos/grand-hotel.png"
 *                 created_at: "2024-01-01T00:00:00Z"
 *                 updated_at: "2024-01-01T00:00:00Z"
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingEmail:
 *                 value:
 *                   error: "hotel_email is required"
 *               missingName:
 *                 value:
 *                   error: "hotel_name is required"
 *       409:
 *         description: Hotel with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Hotel with this email already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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


/**
 * @swagger
 * /api/hotels/{id}:
 *   put:
 *     summary: Update a hotel
 *     description: Update hotel details. All fields are optional - only provided fields will be updated.
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the hotel to update
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotel_email:
 *                 type: string
 *                 format: email
 *                 description: Updated email address (must be unique)
 *                 example: "newemail@example.com"
 *               hotel_name:
 *                 type: string
 *                 description: Updated hotel name
 *                 example: "Updated Hotel Name"
 *               hotel_logo:
 *                 type: string
 *                 format: uri
 *                 description: Updated URL to hotel logo
 *                 example: "https://example.com/logos/new-logo.png"
 *           example:
 *             hotel_name: "Updated Hotel Name"
 *             hotel_logo: "https://example.com/logos/new-logo.png"
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *             example:
 *               data:
 *                 hotel_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 hotel_email: "hotel@example.com"
 *                 hotel_name: "Updated Hotel Name"
 *                 hotel_logo: "https://example.com/logos/new-logo.png"
 *                 created_at: "2024-01-01T00:00:00Z"
 *                 updated_at: "2024-01-02T00:00:00Z"
 *       400:
 *         description: Validation error - no fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No fields to update"
 *       404:
 *         description: Hotel not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Hotel with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Hotel with this email already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/hotels/{id}:
 *   delete:
 *     summary: Delete a hotel
 *     description: Remove a hotel from the system
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the hotel to delete
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       204:
 *         description: Hotel deleted successfully (no content)
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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