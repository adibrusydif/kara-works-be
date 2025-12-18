import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt.js'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    phone: string
    role?: string
  }
}

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  // Auth endpoints (all public)
  '/api/auth/register',
  '/api/auth/request-otp',
  '/api/auth/verify-otp',
  
  // Public GET endpoints
  { path: '/api/banks', method: 'GET' },
  { path: '/api/banks/:id', method: 'GET' },
  { path: '/api/hotels', method: 'GET' },
  { path: '/api/hotels/:id', method: 'GET' },
  { path: '/api/events', method: 'GET' },
  { path: '/api/events/:id', method: 'GET' },
  { path: '/api/fee', method: 'GET' },
  
  // Health and static routes
  '/healthz',
  '/',
  '/about',
  '/api-data',
  '/api-docs',
  '/test-upload',
  '/dashboard',
]

// Check if route is public
function isPublicRoute(path: string, method: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(path)) {
    return true
  }
  
  // Check method-specific routes
  const route = PUBLIC_ROUTES.find(r => {
    if (typeof r === 'object') {
      // Handle dynamic routes (e.g., /api/banks/:id)
      const routePattern = r.path.replace(/:[^/]+/g, '[^/]+')
      const regex = new RegExp(`^${routePattern}$`)
      return regex.test(path) && r.method === method
    }
    return false
  })
  
  return !!route
}

// High-level authentication middleware
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Check if route is public
  if (isPublicRoute(req.path, req.method)) {
    return next() // Skip authentication for public routes
  }

  // Require authentication for protected routes
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid access token in the Authorization header'
    })
  }

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch (error: any) {
    return res.status(403).json({ 
      error: error.message || 'Invalid or expired token' 
    })
  }
}