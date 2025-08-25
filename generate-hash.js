import bcrypt from 'bcryptjs'

const password = 'admin123'
const saltRounds = 12

// Generate new hash
const newHash = bcrypt.hashSync(password, saltRounds)
console.log('New hash for admin123:', newHash)

// Test with existing hash
const existingHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwdeMt8xaUTlrM8VW'
const existingMatches = bcrypt.compareSync(password, existingHash)
console.log('Existing hash matches:', existingMatches)

// Test with new hash
const newMatches = bcrypt.compareSync(password, newHash)
console.log('New hash matches:', newMatches)
