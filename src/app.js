require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const scrapeRouter = require("./routes/scrape");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Error:", err.message));

// Mount API routes
app.use("/api/scrape", scrapeRouter);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});