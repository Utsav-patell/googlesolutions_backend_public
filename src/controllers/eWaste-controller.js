const redisClient = require("../config/redis");
const EWasteListings = require("../models/E-waste-listings");
const Transactions = require("../models/transactions");


// Listing Type - "donation", "selling", "exchange"
const createListing = async (req, res) => {
    console.log("Entered Here");
    try {
        const { 
            title, description, quantity, units, category, customCategory, locationName, latitude, longitude, 
            listingType, images, expiryDate 
        } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: "Latitude and Longitude are required." });
        }

        const newListing = new EWasteListings({
            title,
            description,
            quantity,
            units,
            category,
            customCategory: category === "Other" ? customCategory : null,
            location: {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)],  // Ensure correct order [lng, lat]
                name: locationName
            },
            images,
            user: req.user.userId,
            listingType, 
            interestedOrganizations: [],
            expiryDate,
        });

        await newListing.save();
        res.status(201).json({ message: "E-Waste listing created successfully!", listing: newListing });

    } catch (error) {
        console.error("Error creating listing:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};


const getAllEWasteListings = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            lat, 
            long, 
            radius, 
            sort, 
            minPrice, 
            maxPrice, 
            listingType, 
            id 
        } = req.body;

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let query = { status: "available" };

        if (id) {
            const listing = await EWasteListings.findById(id).lean();
            if (!listing) return res.status(404).json({ message: "E-Waste listing not found" });
            return res.status(200).json({ listing });
        }

        if (category) {
            query.category = { $in: Array.isArray(category) ? category : category.split(",") };
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        if (listingType) {
            const validListingTypes = ["donation", "selling", "exchange"];
            if (!validListingTypes.includes(listingType)) {
                return res.status(400).json({ message: "Invalid listingType provided" });
            }
            query.listingType = listingType;
        }

        // Fixing GeoSpatial Query
        if (lat && long && radius) {
            query.location = {
                $geoWithin: {
                    $centerSphere: [[parseFloat(long), parseFloat(lat)], parseFloat(radius) / 6378.1]
                }
            };
        }

        let sortOptions = {};
        if (sort === "latest") sortOptions.createdAt = -1;
        if (sort === "quantity") sortOptions.quantity = -1;

        const cacheKey = `ewaste_listings:${JSON.stringify(query)}:sort=${sort}:page=${page}&limit=${limit}`;

        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const listings = await EWasteListings.find(query)
            .skip(skip)
            .limit(parseInt(limit, 10))
            .sort(sortOptions)
            .lean();

        const total = await EWasteListings.countDocuments(query);

        const response = {
            totalListings: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            listings
        };

        await redisClient.setEx(cacheKey, 600, JSON.stringify(response));

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching e-waste listings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const searchEWasteListings = async (req, res) => {
    try {
        const { searchTerm, page = 1, limit = 10 } = req.query;

        if (!searchTerm) {
            return res.status(400).json({ message: "Search term is required" });
        }

        const query = { 
            $text: { $search: searchTerm }, 
            status: "available"
        };
        const total = await EWasteListings.countDocuments(query);


        const listings = await EWasteListings.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

            res.status(200).json({
                totalListings: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                listings
            });
    } catch (error) {
        console.error("Error searching listings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const updateEWasteListing = async (req, res) => {
    try {
        const { title, description, quantity, category, location, units, customCategory, price, expiryDate, listingType } = req.body;

        // Find the listing by ID
        const listing = await EWasteListings.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

                if (listing.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: "You are not authorized to update this listing" });
        }

        
        const updateData = {
            title,
            description,
            quantity,
            category,
            location,
            units,
            customCategory: category === "Other" ? customCategory : null,
            price,
            expiryDate,
            listingType,
        };


        const updatedListing = await EWasteListings.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedListing);
    } catch (error) {
        console.error("Error updating e-waste listing:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const deleteEWasteListing = async (req, res) => {
    try {
        
        const listing = await EWasteListings.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (listing.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: "You are not authorized to delete this listing" });
        }

        await listing.deleteOne(); 

        res.status(200).json({ message: "Listing successfully deleted" });
    } catch (error) {
        console.error("Error deleting e-waste listing:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Controller for organization to request the ewaste listed by user 
const requestToClaim = async (req, res) => {
    try {
        const { listingId } = req.params;
        const { priceOffered, pickupSlot } = req.body;
        const organizationId = req.user.userId;

        const listing = await EWasteListings.findById(listingId);
        if (!listing) return res.status(404).json({ message: "Listing not found" });

        if (listing.status === "claimed") {
            return res.status(400).json({ message: "E-Waste has already been claimed" });
        }

        const existingRequest = listing.requests.find(
            (req) => req.organizationId.toString() === organizationId
        );

        if (existingRequest) {
            return res.status(400).json({ message: "You have already requested this listing" });
        }

        if (priceOffered !== undefined && isNaN(priceOffered)) {
            return res.status(400).json({ message: "Invalid offered price" });
        }


        if (!pickupSlot || isNaN(Date.parse(pickupSlot))) {
            return res.status(400).json({ message: "Invalid pickup slot format" });
        }
        const newRequest = {
            organizationId,
            status: "pending",
            priceOffered,
            pickupSlot: new Date(pickupSlot),
        };

        listing.requests.push(newRequest);

        listing.status = "reserved";

        await listing.save();

        res.status(200).json({ message: "Request to claim has been sent", request:newRequest });
    } catch (error) {
        console.error("Error requesting to claim:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// User approve or reject the request of organizations
const approveOrRejectRequest = async (req, res) => {
    try {
        const { listingId } = req.params;
        const { organizationId, action } = req.body; // "approve" or "reject"

        const listing = await EWasteListings.findById(listingId);
        if (!listing) return res.status(404).json({ message: "Listing not found" });

        if (listing.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const requestIndex = listing.requests.findIndex(
            (req) => req.organizationId.toString() === organizationId
        );

        if (requestIndex === -1) {
            return res.status(400).json({ message: "No such request found" });
        }

        const request = listing.requests[requestIndex];


        if (request.status === "approved" || request.status === "rejected") {
            return res.status(400).json({ message: `Request already ${request.status}, action not allowed.` });
        }

        if (action === "approve") {
            listing.requests[requestIndex].status = "approved";


            listing.requests.forEach((req, index) => {
                if (index !== requestIndex) req.status = "rejected";
            });

            listing.status = "claimed";
            listing.requestedBy = listing.requests[requestIndex].organizationId;
            listing.price = listing.requests[requestIndex].priceOffered;

            const transaction = new Transactions({
                eWaste: listingId,
                sender: req.user.userId,
                receiver: organizationId,
                transactionType: listing.listingType,
                status: "pending",
                price: request.offeredPrice,  
                pickupSlot: request.pickupSlot,
            });

            await Promise.all([listing.save(), transaction.save()]);

            return res.status(200).json({ message: "Request approved, transaction initiated", transaction });

        } else if (action === "reject") {
            listing.requests[requestIndex].status = "rejected";

            if (!listing.requests.some((req) => req.status === "pending")) {
                listing.status = "available";
            }

            await listing.save();
            return res.status(200).json({ message: "Request rejected" });

        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

    } catch (error) {
        console.error("Error approving/rejecting request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getMyEWasteListings = async (req, res) => {
    try {
        const { userId, role } = req.user;
        console.log("User ID:", userId);
        if (role !== 'user') {
            return res.status(403).json({ message: "Access denied" });
        }

        const {
            page = 1,
            limit = 10,
            status,
            sort // "price_asc", "price_desc"
        } = req.body || {};

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = { user: userId };
        console.log("Query:", query);
        if (status) {
            const allowedStatuses = ["available", "reserved", "claimed", "expired"];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid status filter" });
            }
            query.status = status;
        }

        let sortOptions = {};
        if (sort === "price_asc") sortOptions.price = 1;
        else if (sort === "price_desc") sortOptions.price = -1;
        else sortOptions.createdAt = -1; // default to latest

        const listings = await EWasteListings.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sortOptions)
            .lean();

        const total = await EWasteListings.countDocuments(query);

        res.status(200).json({
            totalListings: total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            listings
        });

    } catch (error) {
        console.error("Error fetching user's e-waste listings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



module.exports = { createListing, getAllEWasteListings,deleteEWasteListing,updateEWasteListing,searchEWasteListings,approveOrRejectRequest,requestToClaim, getMyEWasteListings};