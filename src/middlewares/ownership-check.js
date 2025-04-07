const EWasteListings = require("../models/E-waste-listings");

const checkOwnership = async (req, res, next) => {
    const listing = await EWasteListings.findById(req.params.id);

    if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
    }

   
    if (listing.user.toString() !== req.user.userId.toString()) {
        return res.status(403).json({ message: "You are not authorized to edit or delete this listing." });
    }

    req.listing = listing;
    next();
};

module.exports = checkOwnership;