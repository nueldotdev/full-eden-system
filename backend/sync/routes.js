
const { Router } = require("express");

const { handleSync } = require("./controllers");

const router = Router();

router.get("/", handleSync);

module.exports = router;