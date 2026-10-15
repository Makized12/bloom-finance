
const express = require("express");
const Transaction = require("./Transaction");

const router = express.Router();

// Get all transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not load transactions.",
    });
  }
});

// Add a transaction
router.post("/", async (req, res) => {
  try {
    const { name, amount, type, category, date } = req.body;

    const transaction = await Transaction.create({
      name,
      amount,
      type,
      category,
      date,
    });

    res.status(201).json({
      success: true,
      transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete a transaction
router.delete("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    res.json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid transaction ID.",
    });
  }
});

module.exports = router;
