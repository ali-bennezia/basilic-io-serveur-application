const express = require("express");
const router = express.Router();

//Contrôleurs.
const authController = require("./../controllers/authController");

// POST /api/auth/token/authentify
router.post("/token/authentify", authController.authentifyToken);

//POST /api/auth/recpwd/send&:mode
router.post("/recpwd/send&:mode", authController.sendPasswordRecoveryKey);

module.exports = router;
