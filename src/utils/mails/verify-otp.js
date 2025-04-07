const redisClient = require("../../config/redis");
const User = require("../../models/users");
const generateToken = require("../generate-tokens");


const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Uh-oh, we couldn't find that user—like a lost device in the clutter. Check your details and try again!" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Your email is already verified—like a gadget that's already been powered up!" });
    }

// Fetching the OTP which was stored during sendOTP. 
    const storedOTP = await redisClient.get(email);

    if (!storedOTP) {
      return res.status(400).json({ message: "Oops! Your OTP has expired—like an outdated charger that's lost its charge. Request a new one and try again!" });
    }

    
    if (storedOTP !== otp) {
      return res.status(400).json({ message: "Oops! That OTP doesn't match—like a wrong cable for your device. Double-check and try again!" });
    }

    user.isVerified = true;
    await user.save();
    const token = generateToken(user._id, user.role, user.email);
    // User will be provided the token.
    await redisClient.del(email);
    res.status(200).json({ message: "Success! Your email is verified—like recycling a gadget the right way. You're all set!", token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = verifyOTP;