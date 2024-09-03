const db = require('../../db/db'); // Adjust the path to your database config

const publishResults = async (req, res) => {
  const { TermID, Year, Published } = req.body;

  try {
    await db.query(
      `UPDATE gradelevelresults SET Published = ? WHERE TermID = ? AND Year = ?`,
      [Published, TermID, Year]
    );

    res.status(200).json({ message: `Results ${Published ? 'published' : 'unpublished'} successfully.` });
  } catch (error) {
    console.error('Error publishing/unpublishing results:', error);
    res.status(500).json({ message: 'Failed to publish/unpublish results.' });
  }
};

module.exports = {
  publishResults,
};
