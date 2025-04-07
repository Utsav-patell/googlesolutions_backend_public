const express = require("express");
const { getProfile, getOrganizations, updateProfile } = require("../../controllers/user-controller");
const authenticate = require("../../middlewares/authenticate-user");
const { validateUpdateProfile } = require("../../validators/auth-validator");

const router = express.Router(); 

// This will give you the logged in users profile. means personal profile.
router.get("/", authenticate, getProfile);
// This will give us all organization profiles list
router.get('/organizations', getOrganizations);

// Will be used to update profile info.
router.put('/update', authenticate, validateUpdateProfile,updateProfile);



module.exports = router;