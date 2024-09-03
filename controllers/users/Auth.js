const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../db/db'); // Ensure correct path to db

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    
    const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (results.length === 0) {
      console.log('No user found with username:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Password mismatch for user:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    

    res.json({ token });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const addUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check if the username already exists
    const [existingUser] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (existingUser.length > 0) {
      console.log('Username already exists:', username);
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    
    console.log('User added successfully:', username);
    res.status(201).json({ message: 'User added successfully' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


const changePassword = async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  try {
    
    const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (results.length === 0) {
      console.log('No user found with username:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
   
      return res.status(400).json({ message: 'Invalid old password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE username = ?', [hashedNewPassword, username]);
  

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
   
    res.status(500).json({ message: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    console.log('Get users request received');
    const [results] = await db.query('SELECT id, username FROM users'); // Only select id and username for security
    res.status(200).json(results);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const editUser = async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  try {
    console.log('Edit user request received');
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const updateQuery = hashedPassword
      ? 'UPDATE users SET username = ?, password = ? WHERE id = ?'
      : 'UPDATE users SET username = ? WHERE id = ?';
    const updateValues = hashedPassword ? [username, hashedPassword, id] : [username, id];

    await db.query(updateQuery, updateValues);
    console.log('User updated in database:', { id, username });
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('Delete user request received');
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    console.log('User deleted from database:', { id });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, addUser, changePassword, getUsers, editUser, deleteUser };
