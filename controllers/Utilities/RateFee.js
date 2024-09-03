const db = require('../../db/db');

// Controller to get the rate fee where id is 1
const getRateFee = async (req, res) => {
    try {
        const [result] = await db.query(`SELECT usd_to_zig_rate FROM rates WHERE id = 1`);
        if (result && result.length > 0) {
            res.status(200).json({ rateFee: result[0].usd_to_zig_rate });
        } else {
            res.status(404).json({ message: 'Rate fee not found' });
        }
    } catch (error) {
        console.error('Error getting rate fee:', error);
        res.status(500).json({ message: 'Failed to get rate fee' });
    }
};

// Controller to update the rate fee where id is 1
const updateRateFee = async (req, res) => {
    const { newRateFee } = req.body;

    try {
        const [result] = await db.query(`UPDATE rates SET usd_to_zig_rate = ?, created_at = CURRENT_TIMESTAMP WHERE id = 1`, [newRateFee]);
        if (result.affectedRows) {
            res.status(200).json({ message: 'Rate fee updated successfully' });
        } else {
            res.status(404).json({ message: 'Rate fee not found to update' });
        }
    } catch (error) {
        console.error('Error updating rate fee:', error);
        res.status(500).json({ message: 'Failed to update rate fee' });
    }
};

module.exports = {
    getRateFee,
    updateRateFee,
};
