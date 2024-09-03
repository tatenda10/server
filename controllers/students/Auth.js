const db = require('../../db/db'); // Ensure correct path to db




const changeStudentPassword = async (req, res) => {
    const { regNumber, newPassword } = req.body;

    if (!regNumber  || !newPassword) {
        return res.status(400).json({ message: 'Please provide registration number, old password, and new password.' });
    }

    try {
        // Query the student by registration number
        const [rows] = await db.execute('SELECT * FROM students WHERE RegNumber = ?', [regNumber]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }

     
        await db.execute('UPDATE students SET PasswordHash = ? WHERE RegNumber = ?', [newPassword, regNumber]);

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};


module.exports = { changeStudentPassword };