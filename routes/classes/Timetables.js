const express = require('express');
const router = express.Router();
const {
  addTimetable,
  getTimetable,
  editTimetable,
  deleteTimetable,
  deleteAllTimetables,
} = require('../../controllers/classes/Timetables');

router.post('/', addTimetable);
router.get('/:classID', getTimetable);
router.post('/edit', editTimetable);
router.delete('/:classID', deleteTimetable);
router.delete('/timetable/all', deleteAllTimetables);

module.exports = router;
