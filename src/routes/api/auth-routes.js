const express = require("express");
const {signup,login, requestPasswordReset, resetPassword, changePassword, resendOTP} = require("../../controllers/auth-controller");
const verifyOTP = require("../../utils/mails/verify-otp");
const { validateSignup,validatelogin } = require("../../validators/auth-validator");
const authenticate = require("../../middlewares/authenticate-user");

const router = express.Router(); 

router.post("/signup", validateSignup , signup);
router.post("/login", validatelogin ,login);
router.put("/change-password", authenticate, changePassword);

router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;