const express = require('express');
const router = express.Router();
const {
  addAnnouncement,
  editAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements
} = require('../../controllers/announcements/Announcements');

router.post('/', addAnnouncement);
router.put('/:AnnouncementID', editAnnouncement);
router.delete('/:AnnouncementID', deleteAnnouncement);
router.get('/', getAllAnnouncements);

module.exports = router;
