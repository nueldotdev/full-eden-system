const { Router } = require("express");

const { handleGetActiveRule, handlePostRule } = require("./controllers");

const router = Router();

router.get("/get_active_rule", handleGetActiveRule);
router.post("/create_rule", handlePostRule);

module.exports = router;