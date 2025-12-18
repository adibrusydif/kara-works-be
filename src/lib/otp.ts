import crypto from 'crypto'
import { supabase } from './supabase.js'

const BYPASS_OTP = '0000'
const ENABLE_BYPASS = 'true'
const HASH_OTP = 'false'

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

export function generateOTP(): string {
  if (ENABLE_BYPASS) {
    return BYPASS_OTP
  }
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function storeOTP(phoneNumber: string, otpCode: string): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  const otpToStore = (HASH_OTP && !ENABLE_BYPASS) 
    ? hashOTP(otpCode) 
    : otpCode

  const { error } = await supabase
    .from('otp_verification')
    .insert({
      phone_number: phoneNumber,
      otp_code: otpToStore,
      expires_at: expiresAt.toISOString(),
      verified: false
    })

  if (error) {
    throw new Error('Failed to store OTP')
  }
}

export async function verifyOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
  if (ENABLE_BYPASS && otpCode === BYPASS_OTP) {
    await storeOTP(phoneNumber, otpCode)
    return true
  }

  if (!/^\d{4}$/.test(otpCode)) {
    return false
  }

  const otpToCheck = HASH_OTP ? hashOTP(otpCode) : otpCode

  const { data, error } = await supabase
    .from('otp_verification')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('otp_code', otpToCheck)
    .eq('verified', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return false
  }

  await supabase
    .from('otp_verification')
    .update({ verified: true })
    .eq('otp_id', data.otp_id)

  return true
}

export async function checkRateLimit(phoneNumber: string): Promise<boolean> {
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  const { count, error } = await supabase
    .from('otp_verification')
    .select('*', { count: 'exact', head: true })
    .eq('phone_number', phoneNumber)
    .gte('created_at', oneHourAgo.toISOString())

  if (error) {
    return false
  }

  return (count || 0) < 5
}

export async function cleanupExpiredOTPs(): Promise<void> {
  await supabase
    .from('otp_verification')
    .delete()
    .lt('expires_at', new Date().toISOString())
}