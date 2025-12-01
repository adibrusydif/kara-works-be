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


/**
 * @swagger
 * /api/upload/users/{userId}/photo:
 *   post:
 *     summary: Upload user photo
 *     description: Upload a photo for a user. The file will be stored in Supabase Storage and the user record will be updated with the photo URL. Maximum file size is 5MB.
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the user
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (max 5MB)
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 photoUrl:
 *                   type: string
 *                   format: uri
 *                   description: URL of the uploaded photo
 *             example:
 *               data:
 *                 user_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 user_photo: "https://example.com/user-photos/550e8400-e29b-41d4-a716-446655440000/user-1234567890.jpg"
 *               photoUrl: "https://example.com/user-photos/550e8400-e29b-41d4-a716-446655440000/user-1234567890.jpg"
 *       400:
 *         description: No file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No file uploaded"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/upload/hotels/{hotelId}/logo:
 *   post:
 *     summary: Upload hotel logo
 *     description: Upload a logo for a hotel. The file will be stored in Supabase Storage and the hotel record will be updated with the logo URL. Maximum file size is 5MB.
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the hotel
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - logo
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (max 5MB)
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *                 logoUrl:
 *                   type: string
 *                   format: uri
 *                   description: URL of the uploaded logo
 *             example:
 *               data:
 *                 hotel_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 hotel_logo: "https://example.com/hotel-logos/550e8400-e29b-41d4-a716-446655440000/logo-1234567890.png"
 *               logoUrl: "https://example.com/hotel-logos/550e8400-e29b-41d4-a716-446655440000/logo-1234567890.png"
 *       400:
 *         description: No file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No file uploaded"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/upload/events/{eventId}/photo:
 *   post:
 *     summary: Upload event photo
 *     description: Upload a photo for an event. The file will be stored in Supabase Storage and the event record will be updated with the photo URL. Maximum file size is 5MB.
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the event
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (max 5MB)
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *                 photoUrl:
 *                   type: string
 *                   format: uri
 *                   description: URL of the uploaded photo
 *             example:
 *               data:
 *                 event_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 event_photo: "https://example.com/event-photos/550e8400-e29b-41d4-a716-446655440000/event-1234567890.jpg"
 *               photoUrl: "https://example.com/event-photos/550e8400-e29b-41d4-a716-446655440000/event-1234567890.jpg"
 *       400:
 *         description: No file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No file uploaded"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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