import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient';
import { sendResetPasswordEmail, sendWelcomeEmail } from '../services/emailService';


const generateRandomPassword = (): string => {
    // Generate a random password with at least one uppercase, one lowercase, one number, and one special character
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

const loginPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
        const patient = await Patient.findOne({ email });

        if (!patient || !(await patient.comparePassword(password))) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const token = jwt.sign({ patientId: patient._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });

        res.json({
            token,
            patient: {
                id: patient._id,
                email: patient.email,
                firstName: patient.firstName,
                lastName: patient.lastName
            }
        });
    } catch (error) {
        next(error);
    }
};

const addPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const patientExists = await Patient.findOne({ email: req.body.email });
        if (patientExists) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }

        const generatedPassword = generateRandomPassword();
      
        const patientData = {
            ...req.body,
            password: generatedPassword
        };
        
        const patient = new Patient(patientData);
        await patient.save();

        try {
            await sendWelcomeEmail(
                patient.email,
                patient.firstName,
                generatedPassword
            );
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.status(201).json({
            message: 'Patient added successfully',
            patient: {
                id: patient._id,
                email: patient.email,
                firstName: patient.firstName,
                lastName: patient.lastName
            }
        });
    } catch (error) {
        next(error);
    }
};

const getPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doctorId = (req as any).user.userId; // Assuming middleware sets this
        const patients = await Patient.find({ assignedDoctor: doctorId })
            .select('-password -resetPasswordToken -resetPasswordExpires');
        res.json(patients);
    } catch (error) {
        next(error);
    }
};

const getPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const patient = await Patient.findById(req.params.id)
            .select('-password -resetPasswordToken -resetPasswordExpires');
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        res.json(patient);
    } catch (error) {
        next(error);
    }
};

const updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { password, ...updateData } = req.body;
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }

        res.json(patient);
    } catch (error) {
        next(error);
    }
};

const deletePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    loginPatient,
    addPatient,
    getPatients,
    getPatient,
    updatePatient,
    deletePatient
};