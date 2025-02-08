import { Schema, model, Document } from 'mongoose';

export interface IAppointment extends Document {
  doctor: Schema.Types.ObjectId;
  patient: Schema.Types.ObjectId;
  time: Date;
  treatment: string;
  duration: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  notes?: string;
}

const AppointmentSchema = new Schema<IAppointment>({
  doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  time: { type: Date, required: true },
  treatment: { type: String, required: true },
  duration: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Rejected'], 
    default: 'Pending' 
  },
  notes: { type: String }
}, { timestamps: true });

// Add index for efficient querying
AppointmentSchema.index({ doctor: 1, time: 1 });
AppointmentSchema.index({ patient: 1, time: 1 });

export const Appointment = model<IAppointment>('Appointment', AppointmentSchema);