const db = require('../../db/db');

// Get the registration amounts for both form ranges
const getRegistrationAmounts = async (req, res) => {
  try {
    const [registrations] = await db.query(`SELECT form_range, amount FROM registrations`);
    res.status(200).json({ data: registrations });
  } catch (error) {
    console.error('Error fetching registration amounts:', error);
    res.status(500).json({ message: 'Failed to fetch registration amounts' });
  }
};

// Update the registration amount for a specific form range
const updateRegistrationAmount = async (req, res) => {
  const { formRange, newAmount } = req.body;

  try {
    // Ensure the form range is either "Form 1-4" or "Form 5-6"
    if (!['Form 1-4', 'Form 5-6'].includes(formRange)) {
      return res.status(400).json({ message: 'Invalid form range provided' });
    }

    // Update the registration amount for the specified form range
    await db.query(
      `UPDATE registrations SET amount = ?, updated_at = NOW() WHERE form_range = ?`,
      [newAmount, formRange]
    );

    res.status(200).json({ message: 'Registration amount updated successfully' });
  } catch (error) {
    console.error('Error updating registration amount:', error);
    res.status(500).json({ message: 'Failed to update registration amount' });
  }
};

module.exports = {
  getRegistrationAmounts,
  updateRegistrationAmount
};
