import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// GET /api/fee – returns the only fee row

/**
 * @swagger
 * /api/fee:
 *   get:
 *     summary: Get fee configuration
 *     description: Retrieve the current fee configuration (bank fee and platform fee). There is only one fee row in the system.
 *     tags: [Fee]
 *     responses:
 *       200:
 *         description: Successfully retrieved fee configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Fee'
 *             example:
 *               data:
 *                 id: true
 *                 bank_fee: 15000
 *                 platform_fee: 5
 *                 updated_at: "2024-01-01T00:00:00Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('fee')
      .select('*')
      .eq('id', true)          // or .eq('id', 1) if you used an int PK
      .single()

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/fee:
 *   put:
 *     summary: Update fee configuration
 *     description: Update the bank fee and/or platform fee. Both fields are optional - only provided fields will be updated.
 *     tags: [Fee]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bank_fee:
 *                 type: number
 *                 format: decimal
 *                 description: Bank fee amount (e.g., 15000 for Rp 15,000)
 *                 example: 15000
 *               platform_fee:
 *                 type: number
 *                 format: decimal
 *                 description: Platform fee percentage (e.g., 5 for 5%)
 *                 example: 5
 *           example:
 *             bank_fee: 15000
 *             platform_fee: 5
 *     responses:
 *       200:
 *         description: Fee configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Fee'
 *             example:
 *               data:
 *                 id: true
 *                 bank_fee: 15000
 *                 platform_fee: 5
 *                 updated_at: "2024-01-02T00:00:00Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// PUT /api/fee – update bank/platform fee
router.put('/', async (req, res) => {
  try {
    const { bank_fee, platform_fee } = req.body

    const { data, error } = await supabase
      .from('fee')
      .update({
        ...(bank_fee !== undefined ? { bank_fee } : {}),
        ...(platform_fee !== undefined ? { platform_fee } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)            // same note as above
      .select()
      .single()

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router