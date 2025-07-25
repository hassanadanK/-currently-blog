const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Update user
router.put('/:id', authMiddleware, (req, res) => {
  const userId = req.params.id;
  const { username, email, password } = req.body;

  let updateFields = [];
  let values = [];

  if (username) {
    updateFields.push('username = ?');
    values.push(username);
  }
  if (email) {
    updateFields.push('email = ?');
    values.push(email);
  }
  if (password) {
    updateFields.push('password = ?');
    values.push(password);
  }

  values.push(userId);

  const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: 'Update failed' });

    // Fetch updated user
    db.query('SELECT id, username, email FROM users WHERE id = ?', [userId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Could not fetch user' });
      res.json({ user: rows[0] });
    });
  });
});

module.exports = router;
