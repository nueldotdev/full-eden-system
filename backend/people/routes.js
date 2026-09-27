const { Router } = require("express");

const { handleGetPeople, handleAddPeople } = require("./controllers");

const router = Router();

router.get("/get_people", handleGetPeople);
router.post("/add_people", handleAddPeople);

module.exports = router;