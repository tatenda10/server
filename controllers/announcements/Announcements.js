const db = require('../../db/db');

const addAnnouncement = async (req, res) => {
  const { Target, Date: announcementDate, Description } = req.body;

  // Format the date to 'YYYY-MM-DD'
  const formattedDate = new Date(announcementDate).toISOString().split('T')[0];

  try {
    await db.query(
      'INSERT INTO announcements (Target, Date, Description) VALUES (?, ?, ?)',
      [Target, formattedDate, Description]
    );
    res.status(201).json({ message: 'Announcement added successfully' });
  } catch (error) {
    console.error('Error adding announcement:', error);
    res.status(500).json({ error: 'Failed to add announcement' });
  }
};

const editAnnouncement = async (req, res) => {
  const { AnnouncementID } = req.params;
  const { Target, Date: announcementDate, Description } = req.body;

  // Format the date to 'YYYY-MM-DD'
  const formattedDate = new Date(announcementDate).toISOString().split('T')[0];

  try {
    await db.query(
      'UPDATE announcements SET Target = ?, Date = ?, Description = ? WHERE AnnouncementID = ?',
      [Target, formattedDate, Description, AnnouncementID]
    );
    res.status(200).json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

const deleteAnnouncement = async (req, res) => {
  const { AnnouncementID } = req.params;

  try {
    await db.query(
      'DELETE FROM announcements WHERE AnnouncementID = ?',
      [AnnouncementID]
    );
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

const getAllAnnouncements = async (req, res) => {
  try {
    const [announcements] = await db.query('SELECT * FROM announcements ORDER BY AnnouncementID DESC');
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

module.exports = {
  addAnnouncement,
  editAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements
};
