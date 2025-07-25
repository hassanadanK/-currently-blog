const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Routes
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

app.use('/api/users', userRoutes);   // e.g. /api/users/profile
app.use('/api/posts', postRoutes);   // e.g. /api/posts
app.use('/api/auth', authRoutes);    // e.g. /api/auth/login
app.use('/api/admin', adminRoutes);  // e.g. /api/admin/users
app.use('/api/categories', categoryRoutes);
// Start server
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
