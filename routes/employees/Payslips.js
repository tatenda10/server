const express = require('express');
const router = express.Router();
const { getPayslipsForEmployee, createPayslip,updatePayslip,deletePayslip } = require('../../controllers/employees/Payslips');

// Define routes
router.get('/:employeeNumber', getPayslipsForEmployee);
router.post('/', createPayslip);


router.put('/:PayslipID', updatePayslip);
router.delete('/:PayslipID', deletePayslip);

module.exports = router;
