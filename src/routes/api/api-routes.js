const express = require("express");
const authRoutes = require("./auth-routes");
const profileRoutes = require("./users-routes");
const adminRoutes = require('./admin-routes');
const ewasteRoutes = require('./eWaste-routes');
const reviewRoutes = require('./review-routes');
const transactionRoutes = require('./transaction-routes');   

const apiRoutes = express.Router();
// Add feature wise main routes here. 
// And then we will add auth related all routes in authRoutes 
apiRoutes.use("/auth", authRoutes); 
apiRoutes.use("/profile", profileRoutes);
apiRoutes.use("/admin", adminRoutes);
apiRoutes.use("/ewaste", ewasteRoutes);
apiRoutes.use("/transaction",transactionRoutes );
apiRoutes.use("/review", reviewRoutes);


module.exports = apiRoutes;