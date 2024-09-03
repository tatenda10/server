// suggestionsRoutes.js

const express = require('express');
const router = express.Router();
const { addSuggestion, getSuggestions } = require('../../controllers/Suggestions/Suggestions'); // Adjust the path if necessary

// Route to add a new suggestion
router.post('/', addSuggestion);

// Route to get all suggestions with pagination
router.get('/', getSuggestions);

module.exports = router;
