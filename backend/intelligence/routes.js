const { Router } = require("express"); 

const { handleAI } = require("./controllers");

const router = Router();

router.get("/", handleAI);

module.exports = router;