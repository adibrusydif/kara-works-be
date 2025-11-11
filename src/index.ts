import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import bankRouter from './routes/bank.js'
import uploadRouter from './routes/upload.js'
import hotelRouter from './routes/hotel.js'
import userRouter from './routes/user.js'
import eventRouter from './routes/event.js'
import applicationRouter from './routes/application.js'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())


// Home route - HTML
app.get('/', (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Express on Vercel</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/api-data">API Data</a>
          <a href="/healthz">Health</a>
        </nav>
        <h1>Welcome to Express on Vercel 🚀</h1>
        <p>This is a minimal example without a database or forms.</p>
        <img src="/logo.png" alt="Logo" width="120" />
      </body>
    </html>
  `)
})

app.get('/about', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'components', 'about.htm'))
})

// Example API endpoint - JSON
app.get('/api-data', (req, res) => {
  res.json({
    message: 'Here is some sample API data',
    items: ['apple', 'banana', 'cherry'],
  })
})

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Bank routes
app.use('/api/banks', bankRouter)

// Upload routes
app.use('/api/upload', uploadRouter)

// Hotel routes
app.use('/api/hotels', hotelRouter)

// User routes
app.use('/api/users', userRouter)

// Event routes
app.use('/api/events', eventRouter)

// Application routes
app.use('/api/applications', applicationRouter)

app.get('/test-upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'test-upload.html'))
})

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'))
})

export default app
