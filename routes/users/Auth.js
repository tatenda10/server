const express = require('express');
const router = express.Router();
const { login, addUser,changePassword ,getUsers,editUser,deleteUser} = require('../../controllers/users/Auth');

router.post('/login', login);
router.post('/add-user', addUser);
router.post('/change-password', changePassword);
router.get('/users', getUsers);
router.put('/users/:id', editUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
