// suggestionsController.js

const db = require('../../db/db');

// Function to add a new suggestion
const addSuggestion = async (req, res) => {
    try {
        const { suggestion } = req.body;
        if (!suggestion) {
            return res.status(400).json({ error: 'Suggestion content is required' });
        }

        // Insert the suggestion into the database
        await db.query('INSERT INTO suggestions (suggestion) VALUES (?)', [suggestion]);

        // Return a success message
        res.status(201).json({ message: 'Suggestion successfully inserted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Function to get all suggestions with pagination
const getSuggestions = async (req, res) => {
    try {
        // Get the page and limit from the query parameters
        const { page = 1, limit = 100 } = req.query;

        // Calculate the offset for pagination
        const offset = (page - 1) * limit;

        // Query the database with pagination
        const result = await db.query('SELECT * FROM suggestions ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    addSuggestion,
    getSuggestions,
};
