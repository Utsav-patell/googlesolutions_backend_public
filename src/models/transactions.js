const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    eWaste: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EWasteListing",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "completed", "canceled", "failed"],
        default: "pending"
    },
    transactionType: {
        type: String,
        enum: ["donation", "selling", "exchange"],
        required: true
    },
    paymentDetails: {
        transactionId: { type: String, trim: true },
        amount: { type: Number, min: 0 }
    },
    receipt: {
        type: String, 
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    coinsEarned: {
        type: Number,
        default: 0,
    },
    pickupSlot: {  
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

TransactionSchema.pre("save", function (next) {
    if (this.transactionType === "donation") {
        // Todo: Add here logic of the coins to generate.
        this.coinsEarned = 10; 
    } else {
        this.coinsEarned = 0;
    }
    next();
});

module.exports = mongoose.model("Transaction", TransactionSchema);