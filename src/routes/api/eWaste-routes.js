const express = require("express");
const { createListing, getAllEWasteListings, updateEWasteListing, deleteEWasteListing, searchEWasteListings, approveOrRejectRequest, requestToClaim, getMyEWasteListings } = require("../../controllers/eWaste-controller");
const authenticate = require("../../middlewares/authenticate-user");
const checkRole = require("../../middlewares/role-check");
const { validateEWaste } = require("../../validators/eWaste-listing-validator");
const checkOwnership = require("../../middlewares/ownership-check");

const router = express.Router(); 


router.post("/", authenticate, getAllEWasteListings);

router.post("/my-listings", authenticate, checkRole(['user']), getMyEWasteListings);

router.get("/search", authenticate,checkRole(['organization']),searchEWasteListings);

router.post("/create", authenticate,checkRole(['user']), validateEWaste,createListing);

router.patch("/update/:id", authenticate, checkRole(['user']), checkOwnership ,updateEWasteListing);

router.delete("/delete/:id", authenticate, checkRole(['user']), checkOwnership ,deleteEWasteListing);

router.post("/:listingId/requests", authenticate, checkRole(['user']),approveOrRejectRequest);

router.post("/:listingId/request", authenticate,checkRole(['organization']), requestToClaim);

module.exports = router;