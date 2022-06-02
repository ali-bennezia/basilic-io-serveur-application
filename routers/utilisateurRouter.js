const express = require("express");
const router = express.Router();

//Contrôleurs.

const utilisateurController = require("./../controllers/utilisateurController");

//Middlewares.

const authentificationMiddlewares = require("./../middlewares/authentificationMiddlewares");

//API

// POST /api/users/register
router.post(
  "/register",
  authentificationMiddlewares.noToken,
  utilisateurController.registerUser
);

// POST /api/users/signin
router.post(
  "/signin",
  authentificationMiddlewares.noToken,
  utilisateurController.signinUser
);

// GET /api/users/validation/send
router.get(
  "/validation/send/:mode",
  authentificationMiddlewares.checkTokenAccountInvalidity,
  utilisateurController.sendValidation
);

// POST /api/users/validation/confirm
router.post(
  "/validation/confirm",
  authentificationMiddlewares.checkTokenAccountInvalidity,
  utilisateurController.confirmValidation
);

// GET /api/users/get/:id
router.get(
  "/get/:id",
  authentificationMiddlewares.checkTokenAuthenticity,
  utilisateurController.getUserData
);

// PATCH /api/users/patch/:id
router.patch(
  "/patch/:id",
  authentificationMiddlewares.checkTokenAuthenticity,
  utilisateurController.patchUserData
);

// DELETE /api/users/delete/:id
router.delete(
  "/delete/:id",
  authentificationMiddlewares.checkTokenAuthenticity,
  utilisateurController.deleteUser
);

// GET /api/users/profiles/get/:id
router.get("/profiles/get/:id", utilisateurController.getProfile);

module.exports = router;
