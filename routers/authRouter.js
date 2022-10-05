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
router.post(
  "/recpwd/send&:mode",
  authMdlw.noToken,
  authController.sendPasswordRecoveryKey
);

//POST /api/auth/recpwd/entry&:identifierType&:identifier&:key
router.post(
  "/recpwd/entry&:identifierType&:identifier&:key",
  authMdlw.noToken,
  authController.authentifyPasswordRecoveryKey
);

//POST /api/auth/recpwd/reinit/:identifierType&:identifier&:code
router.post(
  "/recpwd/reinit/:identifierType&:identifier&:code",
  authController.reinitPassword
);

module.exports = router;
