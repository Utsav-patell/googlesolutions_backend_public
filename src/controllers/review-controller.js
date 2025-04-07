const Review = require("../models/review");
const User = require("../models/users");
const transactions = require("../models/transactions");

const addReview = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const { rating, review } = req.body;
        const userId = req.user.userId;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const completedTransaction = await transactions.findOne({
            sender: userId,
            receiver: organizationId,
            status: "completed"
        });

        if (!completedTransaction) {
            return res.status(403).json({ message: "You can only review organizations you have transacted with." });
        }

        const organization = await User.findById(organizationId);
        if (!organization || organization.role !== "organization") {
            return res.status(404).json({ message: "Organization not found" });
        }

        const newReview = new Review({
            user: userId,
            organization: organizationId,
            rating,
            review
        });

        await newReview.save();


        organization.reviews.push(newReview._id);

        const reviews = await Review.find({ organization: organizationId });
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        organization.averageRating = totalRating / reviews.length;

        await organization.save();

        res.status(200).json({ message: "Review added successfully", newReview });

    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getReviews = async (req, res) => {
    try {
        const { organizationId } = req.params;

        const reviews = await Review.find({ organization: organizationId }).populate("user", "name email");

        res.status(200).json({ reviews });

    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    addReview,getReviews
}
