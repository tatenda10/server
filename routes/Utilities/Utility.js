const express = require('express');
const {
   
    
    getRateFee,
    updateRateFee,
} = require('../../controllers/Utilities/RateFee');
const {
   
    
    getMedicalFee,
    updateMedicalFee,
} = require('../../controllers/Utilities/MedicalFee');



const router = express.Router();

// Route to update or alter student balance


// Route to get the current medical fee
router.get('/fee/medical', getMedicalFee);

// Route to update the medical fee
router.put('/fee/medical/update', updateMedicalFee);

// Route to get the current USD to ZIG rate fee
router.get('/fee/rate', getRateFee);

// Route to update the USD to ZIG rate fee
router.put('/fee/rate/update', updateRateFee);

module.exports = router;
