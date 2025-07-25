const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const SECRET = 'mysecret';

// Middleware to verify token and check admin
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });

    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [decoded.id], (err, results) => {
      if (err || results.length === 0) return res.status(403).json({ error: 'User not found' });

      const user = results[0];
      if (!user.is_admin) return res.status(403).json({ error: 'Access denied (not admin)' });

      req.user = user;
      next();
    });
  });
}

// Get all users (admin-only)
router.get('/users', verifyAdmin, (req, res) => {
  const sql = 'SELECT id, username, email, is_admin, created_at FROM users';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to get users' });
    res.json(results);
  });
});

// Delete a user (admin-only)
router.delete('/users/:id', verifyAdmin, (req, res) => {
  const userId = req.params.id;

  // Prevent deletion of admin users
  const checkSql = 'SELECT * FROM users WHERE id = ?';
  db.query(checkSql, [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userToDelete = results[0];
    if (userToDelete.is_admin) {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    const deleteSql = 'DELETE FROM users WHERE id = ?';
    db.query(deleteSql, [userId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete user' });
      res.json({ message: 'User deleted successfully' });
    });
  });
});

// Get all blog posts (admin-only)
router.get('/posts', verifyAdmin, (req, res) => {
  const sql = `
    SELECT posts.id, posts.title, posts.user_id, users.username, posts.created_at
    FROM posts
    LEFT JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch posts' });
    res.json(results);
  });
});

// Delete a blog post (admin-only)
router.delete('/posts/:id', verifyAdmin, (req, res) => {
  const postId = req.params.id;

  const sql = 'DELETE FROM posts WHERE id = ?';
  db.query(sql, [postId], (err) => {
    if (err) {
      console.error('Failed to delete post:', err);
      return res.status(500).json({ error: 'Failed to delete post' });
    }
    res.json({ message: 'Post deleted successfully' });
  });
});

// Total users
router.get('/stats/users', verifyAdmin, (req, res) => {
  db.query('SELECT COUNT(*) AS totalUsers FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to count users' });
    res.json(results[0]);
  });
});

// Total posts
router.get('/stats/posts', verifyAdmin, (req, res) => {
  db.query('SELECT COUNT(*) AS totalPosts FROM posts', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to count posts' });
    res.json(results[0]);
  });
});

// Total categories
router.get('/stats/categories', verifyAdmin, (req, res) => {
  db.query('SELECT COUNT(*) AS totalCategories FROM categories', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to count categories' });
    res.json(results[0]);
  });
});


module.exports = router;
