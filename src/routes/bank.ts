import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

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