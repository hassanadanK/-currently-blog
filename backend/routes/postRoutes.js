const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

/**
 * CREATE POST
 */
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  const { title, content, category_id } = req.body;
  const image = req.file ? req.file.filename : null;
  const userId = req.user.id;

  const sql = 'INSERT INTO posts (title, content, image, user_id, category_id) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [title, content, image, userId, category_id], (err, result) => {
    if (err) {
      console.error('Error saving post:', err);
      return res.status(500).json({ error: 'Failed to save post' });
    }
    res.status(201).json({ message: 'Post created', postId: result.insertId });
  });
});

/**
 * GET ALL POSTS (With Author and Optional Category Filter)
 */
router.get('/', (req, res) => {
  const { category_id } = req.query;

  let sql = `
    SELECT posts.*, users.username, categories.name AS category_name
    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN categories ON posts.category_id = categories.id
  `;
  const params = [];

  if (category_id) {
    sql += ' WHERE posts.category_id = ?';
    params.push(category_id);
  }

  sql += ' ORDER BY posts.created_at DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching posts:', err);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }

    res.json(results);
  });
});

/**
 * GET SINGLE POST
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT posts.*, users.username, categories.name AS category_name
    FROM posts 
    JOIN users ON posts.user_id = users.id
    LEFT JOIN categories ON posts.category_id = categories.id 
    WHERE posts.id = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(results[0]);
  });
});

/**
 * UPDATE POST (Only by Owner)
 */
router.put('/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, content, category_id } = req.body;
  const userId = req.user.id;
  const image = req.file ? req.file.filename : null;

  const checkSql = 'SELECT * FROM posts WHERE id = ?';
  db.query(checkSql, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = results[0];
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: Not your post' });
    }

    let updateSql = 'UPDATE posts SET title = ?, content = ?, category_id = ?';
    const params = [title, content, category_id];

    if (image) {
      updateSql += ', image = ?';
      params.push(image);
    }

    updateSql += ' WHERE id = ? AND user_id = ?';
    params.push(id, userId);

    db.query(updateSql, params, (err) => {
      if (err) {
        console.error('Error updating post:', err);
        return res.status(500).json({ error: 'Failed to update post' });
      }
      res.json({ message: 'Post updated successfully' });
    });
  });
});

/**
 * DELETE POST (Only by Owner)
 */
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const getUserSql = 'SELECT is_admin FROM users WHERE id = ?';
  db.query(getUserSql, [userId], (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(401).json({ error: 'Unauthorized user' });
    }

    const isAdmin = userResults[0].is_admin;

    // If admin, delete any post
    let deleteSql = 'DELETE FROM posts WHERE id = ?';
    let params = [id];

    // If not admin, only delete own posts
    if (!isAdmin) {
      deleteSql += ' AND user_id = ?';
      params.push(userId);
    }

    db.query(deleteSql, params, (err, result) => {
      if (err) {
        console.error('Error deleting post:', err);
        return res.status(500).json({ error: 'Failed to delete post' });
      }

      if (result.affectedRows === 0) {
        return res.status(403).json({ error: 'Unauthorized or post not found' });
      }

      res.json({ message: 'Post deleted successfully' });
    });
  });
});

module.exports = router;
