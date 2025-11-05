import express from 'express'
import multer from 'multer'
import { supabase } from '../lib/supabase.js'
import { uploadFile, generateFileName } from '../lib/storage.js'

const router = express.Router()

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

// Upload user photo
router.post('/users/:userId/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { userId } = req.params
    const fileName = generateFileName(req.file.originalname, 'user')

    // Upload to Supabase Storage - user-photos bucket
    const { url } = await uploadFile({
      bucket: 'user-photos',
      path: `${userId}/${fileName}`,
      file: req.file.buffer,
      contentType: req.file.mimetype
    })

    // Update user record with photo URL
    const { data, error } = await supabase
      .from('user')
      .update({ user_photo: url })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    res.json({ data, photoUrl: url })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Upload hotel logo
router.post('/hotels/:hotelId/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { hotelId } = req.params
    const fileName = generateFileName(req.file.originalname, 'logo')

    // Upload to Supabase Storage - hotel-logos bucket
    const { url } = await uploadFile({
      bucket: 'hotel-logos',
      path: `${hotelId}/${fileName}`,
      file: req.file.buffer,
      contentType: req.file.mimetype
    })

    const { data, error } = await supabase
      .from('hotel')
      .update({ hotel_logo: url })
      .eq('hotel_id', hotelId)
      .select()
      .single()

    if (error) throw error

    res.json({ data, logoUrl: url })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Upload event photo
router.post('/events/:eventId/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { eventId } = req.params
    const fileName = generateFileName(req.file.originalname, 'event')

    // Upload to Supabase Storage - event-photos bucket
    const { url } = await uploadFile({
      bucket: 'event-photos',
      path: `${eventId}/${fileName}`,
      file: req.file.buffer,
      contentType: req.file.mimetype
    })

    const { data, error } = await supabase
      .from('event')
      .update({ event_photo: url })
      .eq('event_id', eventId)
      .select()
      .single()

    if (error) throw error

    res.json({ data, photoUrl: url })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router