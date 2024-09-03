const db = require('../../db/db');

// Get Medical Fee
const getMedicalFee = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT aid_amount FROM medical_aid ORDER BY id DESC LIMIT 1');
        if (rows.length > 0) {
            res.status(200).json({ medicalFee: rows[0].aid_amount });
        } else {
            res.status(404).json({ message: 'Medical fee not found' });
        }
    } catch (error) {
        console.error('Error fetching medical fee:', error);
        res.status(500).json({ message: 'Failed to fetch medical fee' });
    }
};

// Update Medical Fee
const updateMedicalFee = async (req, res) => {
    const { medicalFee } = req.body;

    if (medicalFee == null || medicalFee === '') {
        return res.status(400).json({ message: 'Medical fee amount cannot be null or empty' });
    }

    try {
        const [rows] = await db.query('SELECT id FROM medical_aid ORDER BY id DESC LIMIT 1');
        if (rows.length > 0) {
            const medicalAidId = rows[0].id;
            await db.query('UPDATE medical_aid SET aid_amount = ?, updated_at = NOW() WHERE id = ?', [medicalFee, medicalAidId]);
            res.status(200).json({ message: 'Medical fee updated successfully' });
        } else {
            res.status(404).json({ message: 'No medical fee found to update' });
        }
    } catch (error) {
        console.error('Error updating medical fee:', error);
        res.status(500).json({ message: 'Failed to update medical fee' });
    }
};
module.exports = {
    getMedicalFee,
    updateMedicalFee,
};
