import bcrypt from 'bcryptjs'

// Test the hash comparison
const password = 'admin123'
const storedHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwdeMt8xaUTlrM8VW'

console.log('Testing password comparison:')
console.log('Password:', password)
console.log('Stored hash:', storedHash)

bcrypt.compare(password, storedHash, (err, result) => {
  if (err) {
    console.error('Error comparing:', err)
  } else {
    console.log('Comparison result:', result)
  }
})

// Test making a direct API call
async function testLogin() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    })
    
    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)
  } catch (error) {
    console.error('API test error:', error)
  }
}

// Test after a small delay
setTimeout(testLogin, 1000)
