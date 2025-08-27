#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('🚀 Starting Legal Metrology Production Server...')

// Check if build exists
const distPath = path.join(process.cwd(), 'dist')
if (!fs.existsSync(path.join(distPath, 'index.html'))) {
  console.log('❌ Production build not found. Building now...')
  execSync('npm run build', { stdio: 'inherit' })
}

console.log('✅ Production build ready')
console.log('🌐 Starting server...')

// Start the production server
import('./server/production.js')
