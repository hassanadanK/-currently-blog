const express = require('express');
const router = express.Router();
const multer = require('multer');
const postController = require('../controllers/postController');

// configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // where to save
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

// route to create a blog post
router.post('/', upload.single('image'), postController.createPost);

module.exports = router;
