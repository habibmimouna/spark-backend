import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
const patientController = require('../controllers/patientController');
const router = require('express').Router();



router.post('/login', patientController.loginPatient);

router.post('/', authenticateToken, patientController.addPatient);
router.get('/', patientController.getPatients);
router.get('/:id', authenticateToken, patientController.getPatient);
router.put('/:id', authenticateToken, patientController.updatePatient);
router.delete('/:id', authenticateToken, patientController.deletePatient);

module.exports = router;