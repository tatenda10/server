const express = require('express');
const multer = require('multer');
const { getSchemeBooks,searchSchemeBooks, saveSchemeBook, downloadDocument } = require('../../controllers/schemebooks/SchemeBooks');

const router = express.Router();

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'scheme_books'); // Directory to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // File naming convention
  }
});

const upload = multer({ storage });

// Routes
router.get('/scheme-books', getSchemeBooks); // Route to get all scheme books
router.post('/scheme-books', upload.single('document'), saveSchemeBook); // Route to upload a scheme book
router.get('/scheme_books/:fileName', downloadDocument); // Route to download a document
router.get('/search-scheme-books', searchSchemeBooks);

module.exports = router;
