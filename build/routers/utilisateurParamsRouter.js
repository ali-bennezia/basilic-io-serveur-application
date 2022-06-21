"use strict";
//Initialization.
const express = require("express");
const router = express.Router();
//Utilitaires.
const multer = require("multer");
//Contrôleurs.
const utilisateurParamsController = require("./../controllers/utilisateurParamsController");
//Middlewares.
const authentificationMiddlewares = require("./../middlewares/authentificationMiddlewares");
//API
// PATCH /api/users/params/patch/:id
router.patch("/patch/:id", authentificationMiddlewares.checkTokenAuthenticity, multer().any(), utilisateurParamsController.patchParams);
// PUT /api/users/params/reset/:id
router.put("/reset/:id", authentificationMiddlewares.checkTokenAuthenticity, utilisateurParamsController.resetParams);
// GET /api/users/params/get/:id
router.get("/get/:id", authentificationMiddlewares.checkTokenAuthenticity, utilisateurParamsController.getParams);
module.exports = router;
