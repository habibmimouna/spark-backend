import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment, bookAppointment, getDoctorAppointments, getPatientAppointments, updateAppointmentStatus } from '../controllers/appointmentController';

const router = express.Router();
router.use(authenticateToken as express.RequestHandler);

router.get('/', getAppointments);
router.post('/', addAppointment);
router.patch('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

// Doctor routes
router.get('/doctor', getDoctorAppointments);
router.patch('/:id/status', updateAppointmentStatus);

// Patient routes
router.get('/patient', getPatientAppointments);
router.post('/book', bookAppointment);

export default router;
