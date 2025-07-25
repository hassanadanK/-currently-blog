const db = require('../db');
const jwt = require('jsonwebtoken');

exports.createPost = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  let userId;
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret'); // Use the same secret as login
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const { title, content } = req.body;
  const image = req.file ? req.file.filename : null;

  const sql = 'INSERT INTO posts (title, content, image, user_id) VALUES (?, ?, ?, ?)';
  db.query(sql, [title, content, image, userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.status(201).json({ message: 'Post created successfully', postId: result.insertId });
  });
};
