import { Request, Response } from 'express';
import { Appointment, IAppointment } from '../models/Appointment';
import User, { IUser } from '../models/User';
import Patient, { IPatient } from '../models/Patient';
import { sendAppointmentStatusEmail } from '../services/emailService';

interface AddAppointmentRequest {
  time: string;
  patient: string;
  treatment: string;
  duration: string;
}

interface UpdateAppointmentRequest {
  status?: 'Pending' | 'Accepted' | 'Rejected';
}

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointments = await Appointment.find();
    res.status(200).json(appointments);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error fetching appointments:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addAppointment = async (
  req: Request<{}, {}, AddAppointmentRequest>,
  res: Response
): Promise<void> => {
  const { time, patient, treatment, duration } = req.body;

  if (!time || !patient || !treatment || !duration) {
    res.status(400).json({ message: 'All fields are required' });
    return;
  }

  try {
    const appointment: IAppointment = new Appointment({
      time,
      patient,
      treatment,
      duration,
      status: 'Pending',
    });

    const newAppointment = await appointment.save();
    res.status(201).json(newAppointment);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error adding appointment:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAppointment = async (
  req: Request<{ id: string }, {}, UpdateAppointmentRequest>,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;


  if (!status || !['Pending', 'Accepted', 'Rejected'].includes(status)) {
    res.status(400).json({ message: 'Invalid status value' });
    return;
  }

  try {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    appointment.status = status;
    const updatedAppointment = await appointment.save();

    res.status(200).json(updatedAppointment);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error updating appointment:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }


};

export const deleteAppointment = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error deleting appointment:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDoctorAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.userId;
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate('patient', 'firstName lastName email phoneNumber')
      .sort({ time: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const getPatientAppointments = async (req: Request, res: Response): Promise<void> => {
  try {

    const patient = await Patient.findOne({ _id: req.user?.patientId });
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    const appointments = await Appointment.find({ patient: patient._id })
      .populate('doctor', 'firstName lastName medicalSpecialty')
      .sort({ time: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const bookAppointment = async (req: Request, res: Response): Promise<void> => {
  try {

    const { doctorId, time, treatment, duration, notes } = req.body;

    const patient = await Patient.findOne({ _id: req.user?.patientId });
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    const doctor = await User.findById(doctorId);
    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }

    if (patient.assignedDoctor.toString() !== doctorId) {
      res.status(403).json({ message: 'You can only book appointments with your assigned doctor' });
      return;
    }

    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      time: new Date(time),
      status: { $ne: 'Rejected' }
    });

    if (conflictingAppointment) {
      res.status(400).json({ message: 'This time slot is already booked' });
      return;
    }

    const appointment = new Appointment({
      doctor: doctorId,
      patient: patient._id,
      time: new Date(time),
      treatment,
      duration,
      notes,
      status: 'Pending'
    });

    await appointment.save();

    const populatedAppointment = await appointment
      .populate('doctor', 'firstName lastName medicalSpecialty')

    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const doctorId = req.user?.userId;

    const appointment = await Appointment.findOne({
      _id: id,
      doctor: doctorId
    }).populate<{ patient: IPatient }>('patient', 'firstName lastName email')
      .populate<{ doctor: IUser }>('doctor', 'firstName lastName');

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    if (!['Accepted', 'Rejected'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    appointment.status = status;
    await appointment.save();
    if (appointment.doctor?.firstName && appointment.patient) {

      try {
        const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
        const doctorName = `${appointment.doctor.firstName} ${appointment.doctor.lastName}`;

        await sendAppointmentStatusEmail(
          appointment.patient.email,
          patientName,
          doctorName,
          appointment.time,
          status as 'Accepted' | 'Rejected',
          appointment.treatment
        );
      } catch (emailError) {
        console.error('Failed to send appointment status email:', emailError);

      }
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};