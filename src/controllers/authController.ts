import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { sendResetPasswordEmail } from '../services/emailService';


const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userExists = await User.findOne({ email: req.body.email });
        if (userExists) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }

        const user = new User(req.body);
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
        console.log("req",req.body);
        
        const user = await User.findOne({ email });
        console.log(user);
        

        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
        console.log(token);
        

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        await sendResetPasswordEmail(email, token);

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    login,
    resetPassword,
};