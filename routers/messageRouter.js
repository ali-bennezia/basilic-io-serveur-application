//Initialization.

const express = require("express");
const router = express.Router();

//Middlewares.

const authMdlw = require("./../middlewares/authentificationMiddlewares");

//Contrôleurs.

const msgController = require("./../controllers/messageController");

//API

// GET /conversations/get/:userIdA&:userIdB&:amount&:timestamp
router.get(
  "/conversations/get/:userIdA&:userIdB&:amount&:timestamp",
  authMdlw.checkTokenAccountValidity,
  msgController.getConvoMessagesWithTimestamp
);

// GET /conversations/get/:userIdA&:userIdB&:amount
router.get(
  "/conversations/get/:userIdA&:userIdB&:amount",
  authMdlw.checkTokenAccountValidity,
  msgController.getConvoMessages
);

module.exports = router;
