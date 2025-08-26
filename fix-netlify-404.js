#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

console.log('🔧 Fixing Netlify 404 errors for SPA routing...')

// Ensure public directory exists
const publicDir = 'public'
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir)
  console.log('✅ Created public directory')
}

// Create _redirects file
const redirectsContent = '/*    /index.html   200\n'
const redirectsPath = path.join(publicDir, '_redirects')

fs.writeFileSync(redirectsPath, redirectsContent)
console.log('✅ Created _redirects file for SPA routing')

// Verify build directory has _redirects after build
const distDir = 'dist'
if (fs.existsSync(distDir)) {
  const distRedirectsPath = path.join(distDir, '_redirects')
  if (fs.existsSync(distRedirectsPath)) {
    console.log('✅ _redirects file exists in dist directory')
  } else {
    console.log('⚠️  _redirects file missing in dist - run npm run build')
  }
} else {
  console.log('��️  Run npm run build to create dist directory')
}

console.log('\n🚀 Netlify deployment should now work without 404 errors!')
console.log('\nBuild command: npm run build')
console.log('Publish directory: dist')
console.log('Node version: 18')
