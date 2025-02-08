import { Schema, model, Document } from 'mongoose';

export interface IAppointment extends Document {
  time: string;
  patient: string;
  treatment: string;
  duration: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

const AppointmentSchema = new Schema<IAppointment>({
  time: { type: String, required: true },
  patient: { type: String, required: true },
  treatment: { type: String, required: true },
  duration: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
});

export const Appointment = model<IAppointment>('Appointment', AppointmentSchema);