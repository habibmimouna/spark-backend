import { Request, Response } from 'express';
import { Appointment, IAppointment } from '../models/Appointment';

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