const express = require("express");
const { addReview, getReviews } = require("../../controllers/review-controller");
const authenticate = require("../../middlewares/authenticate-user");
const checkRole = require("../../middlewares/role-check");

const router = express.Router();

router.post("/add/:organizationId", authenticate,checkRole(['user']), addReview);
router.get("/:organizationId", getReviews);

module.exports = router;