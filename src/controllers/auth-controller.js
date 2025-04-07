const User = require("../models/users");
const Admin = require("../models/admin");
const Organization = require("../models/organizations");
const sendOTPEmail = require("../utils/mails/send-otp");
const generateToken = require("../utils/generate-tokens");

const redisClient = require("../config/redis");

const signup = async (req, res) => {
  try {
      const { name, email, password, role, organizationName, organizationAddress, purpose, location } = req.body;
      
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
          return res.status(400).json({ message: "This email is already plugged in—try a different one to avoid duplicates!" });
      }

      let newUser;
      if (role === "organization") {
          newUser = new Organization({ name, email: email.toLowerCase(), password, role, organizationName, organizationAddress, location });
          
          if (newUser) {
              const pattern = "organizations:*"; 
              const keys = await redisClient.keys(pattern);
              if (keys.length > 0) {
                  await redisClient.del(...keys);
              }
          }
      } else if (role === "admin") {
          newUser = new Admin({ name, email: email.toLowerCase(), password, role, purpose, location });
      } else {
          newUser = new User({ name, email: email.toLowerCase(), password, role, location });
      }

      const otp = Math.floor(1000 + Math.random() * 9000);
      await sendOTPEmail(email, otp, 'account_creation');

      await newUser.save();

      res.status(201).json({ message: 'Account created! Now, verify your email to power up your account.' });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

// {
//   "name": "John Doe",
//   "email": "john@example.com",
//   "password": "securePassword123",
//   "role": "user",
//   "location": {
//       "type": "Point",
//       "coordinates": [77.1025, 28.7041], 
//       "name": "New Delhi, India"
//   }
// }

const resendOTP = async (req, res) => {
  try {
      const { email } = req.body;

      if (!email) {
          return res.status(400).json({ message: "Email is required" });
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }


      if (user.isVerified) {
          return res.status(400).json({ message: "Email is already verified" });
      }


      const otp = Math.floor(1000 + Math.random() * 9000);
      await sendOTPEmail(email, otp, 'resend_otp');

      res.status(200).json({ message: "OTP has been resent. Please check your email." });

  } catch (error) {
      console.error("Error resending OTP:", error);
      res.status(500).json({ message: "Internal server error" });
  }
};


  const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
     
      const user = await User.findOne({ email:email.toLowerCase() });
      if (!user) {
        return res.status(400).json({ message: "We couldn't find that user—like a device lost in the digital landfill. Please check your details and try again!" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ message: "Your account has been deactivated. Please contact support." });
    }
     
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "That password doesn't match—like an incompatible charger. Double-check and try again!" });
      }
  
     
      if (!user.isVerified) {
        return res.status(400).json({ message: "Email not verified—like a recycling process left incomplete. Please verify your email to finish the process" });
      }
  
 
      const token = generateToken(user._id, user.role, user.email);
  
 
      res.status(200).json({
        message: "Login successful—your access is now ready, like a well-recycled resource!",
        token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.userId;

       
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

    
        const isPasswordValid = await user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Old password is incorrect." });
        }

        
        user.password = newPassword;
        await user.save();

        return res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const requestPasswordReset = async (req, res) => {
  try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
          return res.status(400).json({ message: "User with this email does not exist." });
      }

      const otp = Math.floor(1000 + Math.random() * 9000);
      const cacheKey = `resetOTP:${email}`;

      
      await redisClient.setEx(cacheKey, 600, otp.toString());

      await sendOTPEmail(email, otp, "reset_password");

      return res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Internal server error." });
  }
};

const resetPassword = async (req, res) => {
  try {
      const { email, otp, newPassword } = req.body;
      const cacheKey = `resetOTP:${email}`;

      
      const storedOTP = await redisClient.get(cacheKey);
      
      if (!storedOTP || storedOTP !== otp) {
          return res.status(400).json({ message: "Invalid or expired OTP." });
      }

      
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
          return res.status(400).json({ message: "User not found." });
      }
      user.password = newPassword;

      await user.save();

      
      await redisClient.del(cacheKey);

      return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Internal server error." });
  }
};
  module.exports = {
    login,
    signup,
    changePassword,
    resetPassword,
    requestPasswordReset,
    resendOTP
  };