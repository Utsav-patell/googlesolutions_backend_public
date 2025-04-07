const { body } = require("express-validator");
const {handleValidationErrors,handleUpdateProfileValidation} = require("../middlewares/handle-validation-errors");

const validateSignup = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("A name gives identity—just like every device has a serial number! Please enter your name."),

    body("email")
        .isEmail()
        .withMessage("This email format looks off—like a broken circuit. Please enter a valid email."),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Weak passwords are like outdated batteries—easily drained! Use at least 6 characters."),

    body("role")
        .isIn(["user", "organization", "admin"])
        .withMessage("Role mismatch! Choose between 'user', 'organization', or 'admin' to stay on track."),

    body("organizationName")
        .if(body("role").equals("organization"))
        .notEmpty()
        .withMessage("Every organization has a footprint—yours needs a name! Please enter the organization name."),

    body("organizationAddress")
        .if(body("role").equals("organization"))
        .notEmpty()
        .withMessage("A location matters—just like proper e-waste disposal sites! Please enter the organization address."),

    body("purpose")
        .if(body("role").equals("admin"))
        .notEmpty()
        .withMessage("Admins need a clear purpose—just like responsible recycling. Please specify your purpose."),
    handleValidationErrors,
];

validatelogin = [
    body("email").isEmail().withMessage("This email format looks off—like a broken circuit. Please enter a valid email."),
    body("password").isLength({ min: 6 }).withMessage("Weak passwords are like outdated batteries—easily drained! Use at least 6 characters."),
    handleValidationErrors,
];

const validateUpdateProfile = [
    body("name").optional().isString().withMessage("Name must be a valid string."),
    body("organizationName").optional().isString().withMessage("Organization name must be a valid string."),
    body("organizationAddress").optional().isString().withMessage("Organization address must be a valid string."),
    body("purpose").optional().isString().withMessage("Purpose must be a valid string."),
    
    handleUpdateProfileValidation, 
];

module.exports = { validateSignup,validatelogin,validateUpdateProfile };