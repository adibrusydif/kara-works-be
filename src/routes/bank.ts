import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()


/**
 * @swagger
 * /api/banks:
 *   get:
 *     summary: Get all banks
 *     tags: [Banks]
 *     responses:
 *       200:
 *         description: List of all banks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bank'
 */
// Get all banks
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bank')
      .select('*')
      .order('bank_name', { ascending: true })

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/banks/{id}:
 *   get:
 *     summary: Get a single bank by ID
 *     description: Retrieve detailed information about a specific bank
 *     tags: [Banks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the bank
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Successfully retrieved bank details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Bank'
 *             example:
 *               data:
 *                 bank_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 bank_name: "Bank BCA"
 *                 created_at: "2024-01-01T00:00:00Z"
 *                 updated_at: "2024-01-01T00:00:00Z"
 *       404:
 *         description: Bank not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Bank not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get single bank by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('bank')
      .select('*')
      .eq('bank_id', id)
      .single()

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/banks:
 *   post:
 *     summary: Create a new bank
 *     description: Add a new bank to the system
 *     tags: [Banks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bank_name
 *             properties:
 *               bank_name:
 *                 type: string
 *                 description: The name of the bank
 *                 example: "Bank BCA"
 *           example:
 *             bank_name: "Bank BCA"
 *     responses:
 *       201:
 *         description: Bank created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Bank'
 *             example:
 *               data:
 *                 bank_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 bank_name: "Bank BCA"
 *                 created_at: "2024-01-01T00:00:00Z"
 *                 updated_at: "2024-01-01T00:00:00Z"
 *       400:
 *         description: Validation error - bank_name is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "bank_name is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Add bank
router.post('/', async (req, res) => {
  try {
    const { bank_name } = req.body

    if (!bank_name) {
      return res.status(400).json({ error: 'bank_name is required' })
    }

    const { data, error } = await supabase
      .from('bank')
      .insert([{ bank_name }])
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})


/**
 * @swagger
 * /api/banks/{id}:
 *   put:
 *     summary: Update a bank
 *     description: Update the details of an existing bank
 *     tags: [Banks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the bank to update
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bank_name
 *             properties:
 *               bank_name:
 *                 type: string
 *                 description: The updated name of the bank
 *                 example: "Bank BCA Updated"
 *           example:
 *             bank_name: "Bank BCA Updated"
 *     responses:
 *       200:
 *         description: Bank updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Bank'
 *             example:
 *               data:
 *                 bank_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 bank_name: "Bank BCA Updated"
 *                 created_at: "2024-01-01T00:00:00Z"
 *                 updated_at: "2024-01-02T00:00:00Z"
 *       400:
 *         description: Validation error - bank_name is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "bank_name is required"
 *       404:
 *         description: Bank not found
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

// Update bank
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { bank_name } = req.body

    if (!bank_name) {
      return res.status(400).json({ error: 'bank_name is required' })
    }

    const { data, error } = await supabase
      .from('bank')
      .update({ bank_name })
      .eq('bank_id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/banks/{id}:
 *   delete:
 *     summary: Delete a bank
 *     description: Remove a bank from the system
 *     tags: [Banks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the bank to delete
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       204:
 *         description: Bank deleted successfully (no content)
 *       404:
 *         description: Bank not found
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

// Delete bank
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('bank')
      .delete()
      .eq('bank_id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router