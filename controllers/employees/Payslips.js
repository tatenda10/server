const db = require('../../db/db'); // Adjust this to your actual db module path

// Function to get payslips for a specific employee with additional employee details
const getPayslipsForEmployee = async (req, res) => {
    const { employeeNumber } = req.params;
    try {
        const [payslips] = await db.query(`
            SELECT p.*, e.Name, e.Surname, e.Department, e.Role 
            FROM payslips p
            JOIN employees e ON p.EmployeeNumber = e.EmployeeNumber
            WHERE p.EmployeeNumber = ?
        `, [employeeNumber]);

        res.json(payslips);
    } catch (err) {
        console.error('Error fetching payslips:', err);
        res.status(500).json({ error: 'Failed to fetch payslips' });
    }
};

// Function to create a new payslip
const createPayslip = async (req, res) => {
    const { employeeNumber, month, year, earnings, deductions } = req.body;
    try {
        const earningsTotal = earnings.reduce((acc, item) => acc + item.amount, 0);
        const deductionsTotal = deductions.reduce((acc, item) => acc + item.amount, 0);
        const netSalary = earningsTotal - deductionsTotal;
        
        const [result] = await db.query(`
            INSERT INTO payslips (EmployeeNumber, Month, Year, Earnings, Deductions, NetSalary) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [employeeNumber, month, year, JSON.stringify(earnings), JSON.stringify(deductions), netSalary]);
        
        res.status(201).json({ payslipID: result.insertId });
    } catch (err) {
        console.error('Error creating payslip:', err);
        res.status(500).json({ error: 'Failed to create payslip' });
    }
};


const updatePayslip = async (req, res) => {
    const { PayslipID } = req.params;
    const { Month, Year, Earnings, Deductions } = req.body;
  
    // Calculate Net Salary
    const totalEarnings = Earnings.reduce((total, earning) => total + parseFloat(earning.amount), 0);
    const totalDeductions = Deductions.reduce((total, deduction) => total + parseFloat(deduction.amount), 0);
    const NetSalary = totalEarnings - totalDeductions;
  
    try {
      await db.query(
        'UPDATE payslips SET Month = ?, Year = ?, Earnings = ?, Deductions = ?, NetSalary = ? WHERE PayslipID = ?',
        [Month, Year, JSON.stringify(Earnings), JSON.stringify(Deductions), NetSalary, PayslipID]
      );
      res.status(200).json({ message: 'Payslip updated successfully' });
    } catch (error) {
      console.error('Error updating payslip:', error);
      res.status(500).json({ error: 'Failed to update payslip' });
    }
  };
  
  
  
const deletePayslip = async (req, res) => {
    const { PayslipID } = req.params;
  
    try {
      await db.query('DELETE FROM payslips WHERE PayslipID = ?', [PayslipID]);
      res.status(200).json({ message: 'Payslip deleted successfully' });
    } catch (error) {
      console.error('Error deleting payslip:', error);
      res.status(500).json({ error: 'Failed to delete payslip' });
    }
  };

// Export the functions
module.exports = {
    getPayslipsForEmployee,
    createPayslip,
    updatePayslip,
    deletePayslip
};
