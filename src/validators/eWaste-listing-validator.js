const { body } = require("express-validator");
const { handleValidationErrors } = require("../middlewares/handle-validation-errors");

const validateEWaste = [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    body("units").isIn(["kg", "g", "liters", "pieces", "packs"]).withMessage("Invalid unit"),
    body("category").notEmpty().withMessage("Category is required"),
    body("listingType")
        .isString().withMessage("Listing type must be a string")
        .isIn(["donation", "selling", "exchange"]).withMessage("Invalid listing type"),

    
    body("customCategory")
        .if(body("category").equals("Other"))
        .notEmpty().withMessage("Custom category is required when 'Other' is selected"),

    body("price")
        .if(body("listingType").equals("selling"))
        .isFloat({ min: 0 })
        .withMessage("Price must be a non-negative number for selling listings"),


    body("locationName").notEmpty().withMessage("Location name is required"),
    body("latitude")
        .notEmpty().withMessage("Latitude is required")
        .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
    body("longitude")
        .notEmpty().withMessage("Longitude is required")
        .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),

    body("expiryDate")
        .optional()
        .isISO8601().withMessage("Invalid date format")
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error("Expiry date must be a future date");
            }
            return true;
        }),

    handleValidationErrors,
];

module.exports = {validateEWaste};