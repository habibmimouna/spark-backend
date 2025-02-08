import nodemailer from 'nodemailer';



const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: false,
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: 'yasminehassine585@gmail.com', 
    pass: 'scmv qrgc gktp kcgp'  
  },
  tls: {
    rejectUnauthorized: false  
  }
});

export const sendResetPasswordEmail = async (email: string, token: string) => {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
  } catch (error) {
    console.error('SMTP verification failed:', error);
  }

  try {
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (
  email: string,
  firstName: string,
  password: string
) => {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const loginUrl = 'http://localhost:5173/patient/login';

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to Our Healthcare Platform',
      html: `
        <h1>Welcome to Our Healthcare Platform, ${firstName}!</h1>
        <p>Your account has been successfully created. Here are your login credentials:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>For security reasons, we recommend changing your password after your first login.</p>
        <p>You can login to your account here:</p>
        <a href="${loginUrl}">Login to Your Account</a>
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Your Healthcare Team</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};