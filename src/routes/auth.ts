import express from 'express'
import { supabase } from '../lib/supabase.js'
import { generateOTP, storeOTP, verifyOTP, checkRateLimit } from '../lib/otp.js'
import { generateAccessToken, verifyAccessToken } from '../lib/jwt.js'

const router = express.Router()

const ENABLE_BYPASS = 'true'
const BYPASS_OTP = '0000'

/**
 * @swagger
 * /api/auth/request-otp:
 *   post:
 *     summary: Request OTP (OAuth flow step 1)
 *     description: Request 4-digit OTP code. In development mode, returns bypass OTP "0000"
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *             properties:
 *               phone_number:
 *                 type: string
 *                 description: Phone number with country code
 *                 example: "+6281234567890"
 *     responses:
 *       200:
 *         description: OTP generated successfully
 *       400:
 *         description: Invalid phone number or rate limit exceeded
 *       429:
 *         description: Too many requests
 */
router.post('/request-otp', async (req, res) => {
  try {
    const { phone_number } = req.body

    if (!phone_number) {
      return res.status(400).json({ error: 'phone_number is required' })
    }

    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    const cleanPhone = phone_number.replace(/\s/g, '')
    
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' })
    }

    // Check if user is registered
    const { data: existingUser, error: userError } = await supabase
      .from('user')
      .select('user_id, user_phone, user_name')
      .eq('user_phone', cleanPhone)
      .single()

    if (!existingUser || userError) {
      return res.status(404).json({ 
        error: 'Phone number not registered. Please register first.' 
      })
    }

    const canRequest = await checkRateLimit(cleanPhone)
    if (!canRequest) {
      return res.status(429).json({ 
        error: 'Too many OTP requests. Please try again later.' 
      })
    }

    const otpCode = generateOTP()
    await storeOTP(cleanPhone, otpCode)

    if (ENABLE_BYPASS) {
      return res.json({ 
        message: 'OTP generated (development mode)',
        otp_code: BYPASS_OTP,
        note: 'Use 0000 as OTP code in development mode'
      })
    }

    res.json({ 
      message: 'OTP sent successfully to your WhatsApp'
    })
  } catch (error: any) {
    console.error('Error requesting OTP:', error)
    res.status(500).json({ error: error.message || 'Failed to generate OTP' })
  }
})

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and get access token (OAuth flow step 2)
 *     description: Verify 4-digit OTP code and return JWT access token. Use "0000" in development.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *               - otp_code
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: "+6281234567890"
 *               otp_code:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *                 description: 4-digit OTP code
 *                 example: "0000"
 *     responses:
 *       200:
 *         description: OTP verified, access token returned
 *       400:
 *         description: Invalid OTP format
 *       401:
 *         description: Invalid or expired OTP
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone_number, otp_code } = req.body

    if (!phone_number || !otp_code) {
      return res.status(400).json({ 
        error: 'phone_number and otp_code are required' 
      })
    }

    if (!/^\d{4}$/.test(otp_code)) {
      return res.status(400).json({ 
        error: 'OTP code must be exactly 4 digits' 
      })
    }

    const cleanPhone = phone_number.replace(/\s/g, '')

    const isValid = await verifyOTP(cleanPhone, otp_code)
    
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid or expired OTP code',
        hint: ENABLE_BYPASS ? 'In development mode, use "0000" as OTP' : undefined
      })
    }

    let { data: user, error: userError } = await supabase
      .from('user')
      .select('*')
      .eq('user_phone', cleanPhone)
      .single()

    if (!user || userError) {
      const { data: newUser, error: createError } = await supabase
        .from('user')
        .insert([{
          user_phone: cleanPhone,
          user_name: `User ${cleanPhone.slice(-4)}`,
          user_role: 'worker'
        }])
        .select()
        .single()

      if (createError) {
        throw createError
      }

      await supabase
        .from('wallet')
        .insert([{
          user_id: newUser.user_id,
          wallet_balance: 0.00
        }])

      user = newUser
    }

    const accessToken = generateAccessToken({
      userId: user.user_id,
      phone: user.user_phone,
      role: user.user_role
    })

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: '30d',
      user: {
        user_id: user.user_id,
        user_phone: user.user_phone,
        user_name: user.user_name,
        user_role: user.user_role,
        user_photo: user.user_photo
      }
    })
  } catch (error: any) {
    console.error('Error verifying OTP:', error)
    res.status(500).json({ error: error.message || 'Failed to verify OTP' })
  }
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user info
 *     description: Get authenticated user information using access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *       401:
 *         description: Unauthorized
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const payload = verifyAccessToken(token)

    const { data: user, error } = await supabase
      .from('user')
      .select('*, hotel:hotel_id(*), bank:bank_id(*)')
      .eq('user_id', payload.userId)
      .single()

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { data: wallet } = await supabase
      .from('wallet')
      .select('wallet_balance')
      .eq('user_id', user.user_id)
      .single()

    res.json({ 
      user: {
        ...user,
        wallet_balance: wallet?.wallet_balance || 0.00
      }
    })
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Invalid token' })
  }
})

export default router