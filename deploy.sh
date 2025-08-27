#!/bin/bash

echo "🚀 Building Legal Metrology Application for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the frontend
echo "🏗️ Building frontend..."
npm run build

# Test the build
echo "🧪 Testing production build..."
node -e "
const fs = require('fs');
const path = require('path');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(path.join(distPath, 'index.html'))) {
  console.log('✅ Build successful - index.html found');
  console.log('📁 Build directory contents:');
  fs.readdirSync(distPath).forEach(file => console.log('  -', file));
} else {
  console.error('❌ Build failed - index.html not found');
  process.exit(1);
}
"

echo "✅ Deployment build complete!"
echo "💡 To run in production: npm start"
echo "🔗 The app will serve both frontend and API on the same port"
