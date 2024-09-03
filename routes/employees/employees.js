// src/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const { deleteEmployee, getTeachers ,addEmployee, editEmployee, getAllEmployees, getEmployeeById, searchEmployees } = require('../../controllers/employees/employees');

router.post('/', async (req, res) => {
  try {
    const employeeId = await addEmployee(req.body);
    res.status(200).send({ message: 'Employee created successfully', employeeId });
  } catch (error) {
    res.status(500).send({ message: 'Error creating employee', error });
  }
});

router.put('/:employeeId', async (req, res) => {
  try {
    const affectedRows = await editEmployee(req.params.employeeId, req.body);
    if (affectedRows === 0) {
      return res.status(404).send({ message: 'Employee not found' });
    }
    res.status(200).send({ message: 'Employee updated successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error updating employee', error });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await getAllEmployees();
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: 'Error retrieving employees', error });
  }
});

router.get('/:employeeId', async (req, res) => {
  try {
    const employee = await getEmployeeById(req.params.employeeId);
    if (!employee) {
      return res.status(404).send({ message: 'Employee not found' });
    }
    res.status(200).send(employee);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching employee', error });
  }
});

router.get('/searchemployees', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const employees = await searchEmployees(searchQuery);
    res.status(200).send(employees);
  } catch (error) {
    res.status(500).send({ message: 'Error searching employees', error });
  }
});

router.put('/employees/:EmployeeID', deleteEmployee);

router.get('/teachers/teachers', getTeachers);

module.exports = router;
