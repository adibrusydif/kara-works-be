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