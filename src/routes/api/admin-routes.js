const express = require("express");
const { getAllUsers, deactivateUser, activateUser } = require("../../controllers/admin-controller");
const authenticate = require("../../middlewares/authenticate-user");
const checkRole = require("../../middlewares/role-check");

const router = express.Router();

router.get("/users",authenticate, checkRole(['admin']), getAllUsers); 
router.patch("/users/:id/deactivate", authenticate, checkRole(['admin']), deactivateUser);
router.patch("/users/:id/activate", authenticate, checkRole(['admin']), activateUser);

module.exports = router;