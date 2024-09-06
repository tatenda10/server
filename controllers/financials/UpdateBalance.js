const db = require('../../db/db');

// Update balance in the balances table
const updateBalance = async (req, res) => {
  const { reg_number, form, term, year, balance, balance_type, currency } = req.body;

  try {
    // Step 1: Check if the reg_number exists in the students table
    const [studentResult] = await db.query(
      `
      SELECT COUNT(*) AS count FROM students WHERE RegNumber = ?
      `,
      [reg_number]
    );

    if (studentResult[0].count === 0) {
      return res.status(404).json({ message: 'Student not found with the provided reg_number' });
    }

    // Step 2: If the student exists, proceed to update the balance
    const [result] = await db.query(
      `
      UPDATE balances 
      SET form = ?, term = ?, year = ?, balance = ?, balance_type = ?, currency = ?, updated_at = NOW()
      WHERE reg_number = ?
      `,
      [form, term, year, balance, balance_type, currency, reg_number]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Balance record not found for this reg_number' });
    }

    res.status(200).json({ message: 'Balance updated successfully' });
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ error: 'Failed to update balance' });
  }
};

module.exports = {
  updateBalance
};
