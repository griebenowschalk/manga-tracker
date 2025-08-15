import { Resend } from 'resend';

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
) => {
  const resend = new Resend(process.env.RESEND_API_KEY || '');

  const message = `
    You are receiving this email because you (or someone else) has requested the reset of a password. 
    Please make a PUT request to: \n\n ${resetUrl}
  `;

  try {
    await resend.emails.send({
      from: `noreply@${process.env.RESEND_FROM_EMAIL}`,
      to: email,
      subject: 'Password reset token',
      text: message,
    });

    console.log('Password reset email sent');
  } catch (error) {
    console.log('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const resend = new Resend(process.env.RESEND_API_KEY || '');

  try {
    await resend.emails.send({
      from: `noreply@${process.env.RESEND_FROM_EMAIL}`,
      to: email,
      subject: 'Welcome to Bootcamp API',
      text: `Welcome ${name}! Thank you for joining our platform.`,
    });

    console.log('Welcome email sent');
  } catch (error) {
    console.log('Error sending welcome email:', error);
    // Don't throw error for welcome email as it's not critical
  }
};
