const db = require('../../db/db'); // Ensure this imports the correct version

const addEmployee = async (employeeData) => {
    const {
        Department, Role, Name, Surname, DateOfBirth,
        Address, PhoneNumber, NationalIDNumber,
        Gender, EmployeeNumber, Password
    } = employeeData;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const query = `
            INSERT INTO employees (Department, Role, Name, Surname, DateOfBirth, Address, PhoneNumber, NationalIDNumber, Gender, EmployeeNumber, Password, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
        `;
        const values = [
            Department, Role, Name, Surname, DateOfBirth,
            Address, PhoneNumber, NationalIDNumber,
            Gender, EmployeeNumber, Password
        ];

        const [result] = await connection.query(query, values);

        const incrementCountQuery = `
            UPDATE cached_counts
            SET count = count + 1
            WHERE table_name = 'employees'
        `;
        await connection.query(incrementCountQuery);

        await connection.commit();
        return result.insertId;
    } catch (err) {
        await connection.rollback();
        console.error('Error adding employee:', err);
        throw err;
    } finally {
        connection.release();
    }
};

const editEmployee = async (employeeId, employeeData) => {
    const {
        Department, Role, Name, Surname, DateOfBirth,
        Address, PhoneNumber, NationalIDNumber,
        Gender, EmployeeNumber, Password
    } = employeeData;

    const query = `
        UPDATE employees
        SET Department = ?, Role = ?, Name = ?, Surname = ?, DateOfBirth = ?, Address = ?, PhoneNumber = ?, NationalIDNumber = ?, Gender = ?, EmployeeNumber = ?, Password = ?
        WHERE EmployeeID = ?
    `;
    const values = [
        Department, Role, Name, Surname, DateOfBirth,
        Address, PhoneNumber, NationalIDNumber,
        Gender, EmployeeNumber, Password, employeeId
    ];

    try {
        const [result] = await db.query(query, values);
        return result.affectedRows;
    } catch (err) {
        console.error('Error updating employee:', err);
        throw err;
    }
};

const getAllEmployees = async () => {
    const connection = await db.getConnection();
    try {
        const employeeQuery = `SELECT * FROM employees WHERE active = true`;
        const [employees] = await connection.query(employeeQuery);

        const countQuery = `SELECT count FROM cached_counts WHERE table_name = 'employees'`;
        const [countResult] = await connection.query(countQuery);
        const employeeCount = countResult[0]?.count || 0;

        return { employees, employeeCount };
    } catch (err) {
        console.error('Error retrieving employees:', err);
        throw err;
    } finally {
        connection.release();
    }
};

const getEmployeeById = async (employeeId) => {
    try {
        const query = `SELECT * FROM employees WHERE EmployeeID = ? AND active = true`;
        const [rows] = await db.query(query, [employeeId]);
        return rows[0];
    } catch (err) {
        console.error('Error fetching employee:', err);
        throw err;
    }
};

const searchEmployees = async (searchQuery) => {
    try {
        const query = `
            SELECT * FROM employees 
            WHERE active = true AND (EmployeeNumber LIKE ? OR Name LIKE ? OR Surname LIKE ?)
        `;
        const likeQuery = `%${searchQuery}%`;
        const [rows] = await db.query(query, [likeQuery, likeQuery, likeQuery]);
        return rows;
    } catch (err) {
        console.error('Error searching employees:', err);
        throw err;
    }
};

const getTeachers = async (req, res) => {
    try {
        const [teachers] = await db.query("SELECT EmployeeNumber, name, surname FROM employees WHERE role = 'Teacher' AND active = true");
        res.json(teachers);
    } catch (error) {
        res.status(500).send('Error fetching teachers');
    }
};

const deleteEmployee = async (req, res) => {
    const { EmployeeID } = req.params;

    try {
        await db.query(`UPDATE employees SET active = false WHERE EmployeeID = ?`, [EmployeeID]);

        res.status(200).json({ message: 'Employee deleted successfully.' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Failed to delete employee.' });
    }
};

module.exports = {
    addEmployee,
    editEmployee,
    getAllEmployees,
    getEmployeeById,
    searchEmployees,
    getTeachers,
    deleteEmployee
};
