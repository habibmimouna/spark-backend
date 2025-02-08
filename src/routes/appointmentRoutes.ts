import express from 'express';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment } from '../controllers/appointmentController';

const router = express.Router();

router.get('/', getAppointments);
router.post('/', addAppointment);
router.patch('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
