const express = require("express");
const { getAllTransactions, getTransactionById, completeTransaction, cancelTransaction } = require("../../controllers/transaction-controller");
const authenticate = require("../../middlewares/authenticate-user");

const router = express.Router();
router.get("/", authenticate, getAllTransactions);

router.get("/:transactionId", authenticate, getTransactionById);

router.patch("/:transactionId/cancel",authenticate, cancelTransaction);

router.patch("/:transactionId/complete", authenticate,completeTransaction);

module.exports = router;