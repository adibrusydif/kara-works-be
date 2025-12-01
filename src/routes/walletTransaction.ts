import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// Build a base query we can reuse in filters
function buildBaseQuery() {
  return supabase
    .from('wallet_transaction')
    .select(`
      transaction_id,
      wallet_id,
      transaction_amount,
      transaction_date,
      transaction_event_id,
      transaction_wd_id,
      wallet:wallet_id (
        wallet_id,
        wallet_balance,
        user:user_id (
          user_id,
          user_name,
          user_phone,
          hotel:hotel_id (
            hotel_id,
            hotel_name
          )
        )
      ),
      event:transaction_event_id (
        event_id,
        event_name,
        event_salary,
        event_creator_id
      )
    `)
    .order('transaction_date', { ascending: false })
}

/**
 * @swagger
 * /api/wallet-transactions:
 *   get:
 *     summary: Get all wallet transactions
 *     description: Retrieve a paginated list of all wallet transactions. Includes related wallet, user, hotel, and event data.
 *     tags: [Wallet Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of transactions per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Successfully retrieved wallet transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   description: Number of items per page
 *                   example: 20
 *                 count:
 *                   type: integer
 *                   description: Total number of transactions
 *                   example: 150
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WalletTransaction'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */


// GET /api/wallet-transactions?page=&limit=
router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1)
    const limit = Number(req.query.limit ?? 20)
    const offset = (page - 1) * limit

    const query = buildBaseQuery().range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      page,
      limit,
      count,
      data,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})


/**
 * @swagger
 * /api/wallet-transactions/event/{eventId}:
 *   get:
 *     summary: Get wallet transactions by event
 *     description: Retrieve all wallet transactions related to a specific event. Includes related wallet, user, and hotel data.
 *     tags: [Wallet Transactions]
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
 *         description: Successfully retrieved transactions for the event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WalletTransaction'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// GET /api/wallet-transactions/event/:eventId
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params

    const { data, error } = await buildBaseQuery()
      .eq('transaction_event_id', eventId)

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/wallet-transactions/user/{userId}:
 *   get:
 *     summary: Get wallet transactions by user
 *     description: Retrieve all wallet transactions for a specific user. Includes related wallet, hotel, and event data.
 *     tags: [Wallet Transactions]
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
 *         description: Successfully retrieved transactions for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WalletTransaction'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// GET /api/wallet-transactions/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const { data, error } = await buildBaseQuery()
      .eq('wallet.user.user_id', userId)

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/wallet-transactions/hotel/{hotelId}:
 *   get:
 *     summary: Get wallet transactions by hotel
 *     description: Retrieve all wallet transactions for users associated with a specific hotel. Includes related wallet, user, and event data.
 *     tags: [Wallet Transactions]
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
 *         description: Successfully retrieved transactions for the hotel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WalletTransaction'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// GET /api/wallet-transactions/hotel/:hotelId
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params

    const { data, error } = await buildBaseQuery()
      .eq('wallet.user.hotel.hotel_id', hotelId)

    if (error) throw error

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/wallet-transactions/month/{year}/{month}:
 *   get:
 *     summary: Get wallet transactions by month
 *     description: Retrieve all wallet transactions for a specific month. Includes related wallet, user, hotel, and event data.
 *     tags: [Wallet Transactions]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *         description: Year (4 digits)
 *         example: 2024
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *         example: 12
 *     responses:
 *       200:
 *         description: Successfully retrieved transactions for the month
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WalletTransaction'
 *                 range:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                       format: date-time
 *                       description: Start of the month
 *                       example: "2024-12-01T00:00:00.000Z"
 *                     end:
 *                       type: string
 *                       format: date-time
 *                       description: End of the month
 *                       example: "2024-12-31T23:59:59.999Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// GET /api/wallet-transactions/month/:year/:month
router.get('/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params
    const start = new Date(Number(year), Number(month) - 1, 1)
    const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999)

    const { data, error } = await buildBaseQuery()
      .gte('transaction_date', start.toISOString())
      .lte('transaction_date', end.toISOString())

    if (error) throw error

    res.json({ data, range: { start: start.toISOString(), end: end.toISOString() } })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router