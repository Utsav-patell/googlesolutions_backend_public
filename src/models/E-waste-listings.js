const mongoose = require("mongoose");

const EWasteListingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        units: {
            type: String,
            required: true,
            enum: ["kg", "g", "liters", "pieces", "packs"],
        },
        price: {
            type: Number,
            min: 0, 
        },
        category: {
            type: String,
            required: true,
            enum: ["Mobile", "Laptop", "Battery", "Other"],
        },
        customCategory: {
            type: String,
            trim: true,
            validate: {
                validator: function (value) {
                    return this.category === "Other" ? value?.trim().length > 0 : true;
                },
                message: "Custom category is required when 'Other' is selected.",
            },
        },
        listingType: {
            type: String,
            required: true,
            enum: ["donation", "selling", "exchange"],
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: true,
                index: "2dsphere",
            },
            name: { type: String, required: true },
        },
        images: {
            type: [String], 
            default: [],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["available", "reserved", "claimed", "expired"],
            default: "available",
        },
        expiryDate: {
            type: Date,
        },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, 
        requests: [
            {
                organizationId: { 
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: "User", 
                    required: true 
                },
                status: { 
                    type: String, 
                    enum: ["pending", "approved", "rejected"], 
                    default: "pending" 
                },
                priceOffered: { 
                    type: Number, 
                    min: 0, 
                    required: function () { return this.listingType === "selling"; } 
                }, 
                pickupSlot: { 
                    type: Date,  
                    required: true,
                    validate: {
                        validator: function (value) {
                            return value instanceof Date && !isNaN(value);
                        },
                        message: "Pickup slot must be a valid date-time format.",
                    },
                },
                requestedAt: { 
                    type: Date, 
                    default: Date.now 
                },
            },
        ],
    },
    { timestamps: true }
);

EWasteListingSchema.index({ location: "2dsphere" });

EWasteListingSchema.index({ title: "text", description: "text" });
EWasteListingSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model("EWasteListing", EWasteListingSchema);
