import jwt from 'jsonwebtoken'

const JWT_SECRET = 'karaworks-jwt-secret'
const JWT_EXPIRES_IN =  '30d'

export interface JWTPayload {
  userId: string
  phone: string
  role?: string
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}