import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import 'dotenv/config'

// Import routes
import usersRouter from './routes/users.js'
import campaignsRouter from './routes/campaigns.js'
import investmentsRouter from './routes/investments.js'
import tokensRouter from './routes/tokens.js'
import nftsRouter from './routes/nfts.js'
import updatesRouter from './routes/updates.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: ['http://localhost:8080', 'https://your-frontend-domain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'FanStage API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

// API routes
app.route('/api/users', usersRouter)
app.route('/api/campaigns', campaignsRouter)
app.route('/api/investments', investmentsRouter)
app.route('/api/tokens', tokensRouter)
app.route('/api/nfts', nftsRouter)
app.route('/api/updates', updatesRouter)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({
    error: 'Internal server error',
    message: err.message
  }, 500)
})

const port = parseInt(process.env.PORT || '3000')

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`🚀 FanStage API is running on http://localhost:${info.port}`)
  console.log(`📚 API Documentation: http://localhost:${info.port}/api`)
  console.log(`🏥 Health Check: http://localhost:${info.port}/health`)
})
