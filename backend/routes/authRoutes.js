
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const SECRET = 'mysecret';

// Register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if username or email already exists
  const checkSql = 'SELECT * FROM users WHERE username = ? OR email = ?';
  db.query(checkSql, [username, email], (err, results) => {
    if (err) {
      console.error('Error checking duplicates:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (results.length > 0) {
      const existing = results[0];
      const errorMsg =
        existing.username === username
          ? 'Username already taken'
          : 'Email already registered';
      return res.status(400).json({ error: errorMsg });
    }

    // If no duplicate, insert user
    const insertSql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(insertSql, [username, email, password], (err) => {
      if (err) {
        console.error('Error inserting user:', err);
        return res.status(500).json({ error: 'Registration failed' });
      }

      res.json({ message: 'User registered successfully' });
    });
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin  // ✅ Include email in response
      }
    });
  });
});

module.exports = router;
