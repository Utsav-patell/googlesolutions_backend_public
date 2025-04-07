const EWasteListings = require("../models/E-waste-listings");
const Transactions = require("../models/transactions");


// Either User or Organization cancel the transaction.
const cancelTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await Transactions.findById(transactionId);
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });

        if (transaction.status !== "pending") {
            return res.status(400).json({ message: "Transaction cannot be canceled" });
        }

        if (transaction.sender.toString() !== req.user.userId && transaction.receiver.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        transaction.status = "canceled";

        const listing = await EWasteListings.findById(transaction.eWaste);
        if (listing) {
            listing.status = "available";
            listing.requests = [];
        }

        // Use Promise.all for concurrent saves
        await Promise.all([
            listing ? listing.save() : Promise.resolve(),
            transaction.save()
        ]);

        res.status(200).json({ message: "Transaction canceled", transaction });

    } catch (error) {
        console.error("Error canceling transaction:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// When a user make the payment then we will call this controller
const completeTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await Transactions.findById(transactionId);
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });

        if (transaction.status !== "pending") {
            return res.status(400).json({ message: "Transaction cannot be completed" });
        }

        if (transaction.receiver._id.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        transaction.status = "completed";
        
        
        const listing = await EWasteListings.findById(transaction.eWaste);
        if (listing) {
            listing.status = "claimed";
        }

        if (transaction.type === "donation") {
            const sender = await User.findById(transaction.sender);
            sender.coinsEarned += 10; // Example: Reward 10 coins
        }

        await Promise.all([
            listing ? listing.save() : Promise.resolve(),
            transaction.save(),
            transaction.type === "donation" && sender ? sender.save() : Promise.resolve()
        ]);

        res.status(200).json({ message: "Transaction completed", transaction });

    } catch (error) {
        console.error("Error completing transaction:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// We will get all the transaction of a particular user.
const getAllTransactions = async (req, res) => {
    try {
        const { role } = req.user; 

        let filter = {};
        if (role === "user") {
            filter.sender = req.user.userId; 
        } else if (role === "organization") {
            filter.receiver = req.user.userId; 
        } else {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const transactions = await Transactions.find(filter)
        .populate("eWaste","-requests -createdAt -updatedAt -__v")
            .populate("sender", "name email")
            .populate("receiver", "name email")
            .select("eWaste sender receiver status transactionType paymentDetails coinsEarned pickupSlot createdAt");     
        res.status(200).json({ transactions });

    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get transaction by id
const getTransactionById = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await Transactions.findById(transactionId)
    .populate("eWaste","-requests -createdAt -updatedAt -__v")
    .populate("sender", "name email")
    .populate("receiver", "name email")
    .select("eWaste sender receiver status transactionType paymentDetails coinsEarned pickupSlot createdAt"); // Include pickupSlot


        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        
        if (
            transaction.sender._id.toString() !== req.user.userId &&
            transaction.receiver._id.toString() !== req.user.userId
        ) {
            return res.status(403).json({ message: "Unauthorized to view this transaction" });
        }

        res.status(200).json({ transaction });

    } catch (error) {
        console.error("Error fetching transaction by ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {

    
    cancelTransaction,
    completeTransaction,
    getAllTransactions,
    getTransactionById
}