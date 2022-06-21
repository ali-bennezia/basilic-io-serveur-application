"use strict";
const express = require("express");
const router = express.Router();
//Middlewares.
const authMdlw = require("./../middlewares/authentificationMiddlewares");
//Contrôleurs.
const authController = require("./../controllers/authController");
//POST /api/auth/token/refresh
router.post("/token/refresh", authController.refreshToken);
//POST /api/auth/token/authentify
router.post("/token/authentify", authController.authentifyToken);
//POST /api/auth/recpwd/send&:mode
router.post("/recpwd/send&:mode", authMdlw.noToken, authController.sendPasswordRecoveryKey);
//POST /api/auth/recpwd/entry&:userId&:key
router.post("/recpwd/entry&:userId&:key", authMdlw.noToken, authController.authentifyPasswordRecoveryKey);
//POST /api/auth/recpwd/reinit&:userId&:code
router.post("/recpwd/reinit&:userId&:code", authController.reinitPassword);
module.exports = router;
