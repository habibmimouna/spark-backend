import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment } from '../controllers/appointmentController';

const router = express.Router();
router.use(authenticateToken as express.RequestHandler);

router.get('/', getAppointments);
router.post('/', addAppointment);
router.patch('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
