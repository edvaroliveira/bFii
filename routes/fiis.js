const express = require("express");
const { getFiisData } = require("../controllers/fiisController");
const router = express.Router();

router.get("/", getFiisData);

module.exports = router;
