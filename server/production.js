import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, '../dist')))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
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
    username: 'UPSWP240434261',
    password: '$2a$12$rQOmFZcm6S.Qz8nxEp8lX.JKJwq3L1MEWZ2HZ4K5VRG8wJxQfr9lW',
    role: 'admin'
  }
]

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'legal-metrology-production-secret-2024'

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

// API Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const user = users.find(u => u.username === username)
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    let validPassword = await bcrypt.compare(password, user.password)
    
    // Fallback for demo
    if (!validPassword && username === 'UPSWP240434261' && password === 'Atul@135') {
      validPassword = true
    }
    
    if (!validPassword) {
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
    res.json(traders)
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ message: 'Export failed' })
  }
})

// Serve uploaded files
app.get('/api/uploads/:filename', (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(uploadsDir, filename)
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' })
  }
  
  res.sendFile(filePath)
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`🚀 Legal Metrology Production Server running on port ${PORT}`)
  console.log(`📊 Health check available at /api/health`)
})
