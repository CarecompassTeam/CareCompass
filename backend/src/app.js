const express = require("express");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "CareCompass backend is running"
  });
});

app.listen(PORT, () => {
  console.log(`CareCompass backend running on http://localhost:${PORT}`);
});
