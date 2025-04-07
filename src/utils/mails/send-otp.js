const nodemailer = require('nodemailer');
const redis = require('redis');
const redisClient = require('../../config/redis');
const client = redis.createClient();


const sendOTPEmail = async (email, otp, purpose) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',  
    auth: {
      user: process.env.EMAIL_USER_ID,
      pass: process.env.EMAIL_USER_PASSWORD,
    },
  });

  let subject = '';
  let text = '';

  switch (purpose) {
    case 'account_creation':
      subject = 'Account Creation - OTP: Power Up Your Profile!';
      text = `Your OTP to activate your account is: ${otp}. Use it to power up your registration process!`;
      break;
    case 'forgot_password':
      subject = 'Password Reset - OTP: Reboot Your Access!';
      text = `Your OTP to reset your password is: ${otp}. Use it to reboot your account access`;
      break;
    case 'reset_password':
      subject = 'Password Reset Confirmation - OTP: Finalizing Your Upgrade!';
      text = `Your OTP for confirming the password reset is: ${otp}. Use it to complete your account upgrade!`;
      break;
    default:
      subject = 'OTP Verification: Clear Your Path!';
      text = `Your OTP is: ${otp}. Use it to verify your action and keep everything running smoothly`;
      break;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    text: text,
  };

  try {
   
    //    600 Seconds = 10 minutes.
    redisClient.setEx(email, 600, String(otp)); 
    await transporter.sendMail(mailOptions);

    console.log(`OTP sent to ${email} and stored in Redis`);

  } catch (err) {
    console.error('Error sending OTP email:', err);
    throw new Error('Failed to send OTP email. Please try again later.');
  }
};

module.exports = sendOTPEmail;