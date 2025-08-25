import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true })
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/'
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png|doc|docx/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'))
    }
  }
})

// In-memory storage for demo (replace with database in production)
let traders = []
let users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwdeMt8xaUTlrM8VW', // password: admin123
    role: 'admin'
  }
]

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    console.log('Login attempt:', { username, password: '***' })

    const user = users.find(u => u.username === username)
    console.log('User found:', user ? 'yes' : 'no')
    if (!user) {
      console.log('User not found for username:', username)
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    console.log('Comparing password with hash...')
    const validPassword = await bcrypt.compare(password, user.password)
    console.log('Password valid:', validPassword)
    if (!validPassword) {
      console.log('Password comparison failed')
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json(req.user)
})

// Trader routes
app.get('/api/traders', authenticateToken, (req, res) => {
  res.json(traders)
})

app.post('/api/traders', authenticateToken, upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'indent', maxCount: 1 }
]), (req, res) => {
  try {
    const {
      traderId,
      challanNumber,
      traderName,
      feeAmount,
      subscriptionPeriod,
      feeSubmissionDate,
      reverificationDate
    } = req.body

    const newTrader = {
      id: Date.now(),
      traderId,
      challanNumber,
      traderName,
      feeAmount: parseFloat(feeAmount),
      subscriptionPeriod: parseInt(subscriptionPeriod),
      feeSubmissionDate,
      reverificationDate,
      certificateFile: req.files?.certificate?.[0]?.filename || null,
      indentFile: req.files?.indent?.[0]?.filename || null,
      createdAt: new Date().toISOString()
    }

    traders.push(newTrader)
    res.status(201).json(newTrader)
  } catch (error) {
    console.error('Error creating trader:', error)
    res.status(500).json({ message: 'Error creating trader' })
  }
})

app.get('/api/traders/:id', authenticateToken, (req, res) => {
  const trader = traders.find(t => t.id === parseInt(req.params.id))
  if (!trader) {
    return res.status(404).json({ message: 'Trader not found' })
  }
  res.json(trader)
})

app.put('/api/traders/:id', authenticateToken, upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'indent', maxCount: 1 }
]), (req, res) => {
  try {
    const traderId = parseInt(req.params.id)
    const traderIndex = traders.findIndex(t => t.id === traderId)
    
    if (traderIndex === -1) {
      return res.status(404).json({ message: 'Trader not found' })
    }

    const {
      traderId: newTraderId,
      challanNumber,
      traderName,
      feeAmount,
      subscriptionPeriod,
      feeSubmissionDate,
      reverificationDate
    } = req.body

    const updatedTrader = {
      ...traders[traderIndex],
      traderId: newTraderId,
      challanNumber,
      traderName,
      feeAmount: parseFloat(feeAmount),
      subscriptionPeriod: parseInt(subscriptionPeriod),
      feeSubmissionDate,
      reverificationDate,
      updatedAt: new Date().toISOString()
    }

    // Update files if new ones are uploaded
    if (req.files?.certificate?.[0]) {
      updatedTrader.certificateFile = req.files.certificate[0].filename
    }
    if (req.files?.indent?.[0]) {
      updatedTrader.indentFile = req.files.indent[0].filename
    }

    traders[traderIndex] = updatedTrader
    res.json(updatedTrader)
  } catch (error) {
    console.error('Error updating trader:', error)
    res.status(500).json({ message: 'Error updating trader' })
  }
})

app.delete('/api/traders/:id', authenticateToken, (req, res) => {
  const traderId = parseInt(req.params.id)
  const traderIndex = traders.findIndex(t => t.id === traderId)
  
  if (traderIndex === -1) {
    return res.status(404).json({ message: 'Trader not found' })
  }

  traders.splice(traderIndex, 1)
  res.json({ message: 'Trader deleted successfully' })
})

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const now = new Date()
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const upcomingReverifications = traders.filter(trader => {
    const reverificationDate = new Date(trader.reverificationDate)
    return reverificationDate <= oneWeekFromNow && reverificationDate >= now
  })

  const expiringSoon = traders.filter(trader => {
    const reverificationDate = new Date(trader.reverificationDate)
    return reverificationDate <= oneMonthFromNow && reverificationDate >= now
  })

  res.json({
    totalTraders: traders.length,
    upcomingReverifications: upcomingReverifications.length,
    expiringSoon: expiringSoon.length,
    totalFeeAmount: traders.reduce((sum, trader) => sum + trader.feeAmount, 0)
  })
})

// Export data route
app.get('/api/export', authenticateToken, (req, res) => {
  try {
    // For now, just return the data - client will handle Excel/ZIP generation
    res.json(traders)
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ message: 'Export failed' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Legal Metrology API Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check available at http://localhost:${PORT}/health`)
})
