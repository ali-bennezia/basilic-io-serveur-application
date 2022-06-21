//Configuration initiale.

const express = require("express");
const router = express.Router();

//Contrôleurs.
const followController = require("./../controllers/followController");

//Middlewares.
const authMdlw = require("./../middlewares/authentificationMiddlewares");

//API

//GET /follows/post/:mode&:userIdB
router.get(
  "/post/:mode&:userIdB",
  authMdlw.checkTokenAuthenticity,
  followController.follow
);

module.exports = router;
