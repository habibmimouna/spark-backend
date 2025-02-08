import { Request, Response } from 'express';
import { Appointment, IAppointment } from '../models/Appointment';
import User from '../models/User';
import Patient from '../models/Patient';

// Define the structure of the request body for adding an appointment
interface AddAppointmentRequest {
  time: string;
  patient: string;
  treatment: string;
  duration: string;
}

// Define the structure of the request body for updating an appointment
interface UpdateAppointmentRequest {
  status?: 'Pending' | 'Accepted' | 'Rejected';
}

// Fetch all appointments
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

// Add a new appointment
export const addAppointment = async (
  req: Request<{}, {}, AddAppointmentRequest>,
  res: Response
): Promise<void> => {
  const { time, patient, treatment, duration } = req.body;

  // Validate request body
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
      status: 'Pending', // Default status
    });

    const newAppointment = await appointment.save();
    res.status(201).json(newAppointment); // 201 Created
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error adding appointment:', error.message);
    res.status(500).json({ message: 'Internal server error' }); // 500 Internal Server Error
  }
};

// Update an appointment (e.g., accept or reject)
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

    // Update the appointment status
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
    console.log("eeeeeeeeeeee",req.user?.patientId);
    
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
    console.log("ffffff",req.body);
    
    const { doctorId, time, treatment, duration, notes } = req.body;
    
    // Find the patient using the authenticated user's ID
    const patient = await Patient.findOne({ _id: req.user?.patientId });
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    // Validate doctor exists and is assigned to patient
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }

    // Verify this doctor is assigned to the patient
    if (patient.assignedDoctor.toString() !== doctorId) {
      res.status(403).json({ message: 'You can only book appointments with your assigned doctor' });
      return;
    }

    // Check for time conflicts
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
      // .populate('patient', 'firstName lastName email phoneNumber');

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
    }).populate('patient', 'firstName lastName email');

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

    res.status(200).json(appointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};