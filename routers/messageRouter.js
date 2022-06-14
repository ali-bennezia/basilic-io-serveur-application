//Initialization.

const express = require("express");
const router = express.Router();

//Middlewares.

const authMdlw = require("./../middlewares/authentificationMiddlewares");

//Contrôleurs.

const msgController = require("./../controllers/messageController");

//API

// GET /conversations/messages/get/:userIdA&:userIdB&:amount&:timestamp
router.get(
  "/conversations/messages/get/:userIdA&:userIdB&:amount&:timestamp",
  authMdlw.checkTokenAccountValidity,
  msgController.getConvoMessagesWithTimestamp
);

// GET /conversations/messages/get/:userIdA&:userIdB&:amount
router.get(
  "/conversations/messages/get/:userIdA&:userIdB&:amount",
  authMdlw.checkTokenAccountValidity,
  msgController.getConvoMessages
);

// GET /conversations/get/:userId&:amount&:timestamp
router.get(
  "/conversations/get/:userId&:amount&:timestamp",
  authMdlw.checkTokenAccountValidity,
  msgController.getConvosWithTimestamp
);

// GET /conversations/get/:userId&:amount
router.get(
  "/conversations/get/:userId&:amount",
  authMdlw.checkTokenAccountValidity,
  msgController.getConvos
);

module.exports = router;
