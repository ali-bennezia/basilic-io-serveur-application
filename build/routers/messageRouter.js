"use strict";
//Initialization.
const express = require("express");
const router = express.Router();
//Librairies.
const multer = require("multer");
//Middlewares.
const authMdlw = require("./../middlewares/authentificationMiddlewares");
//Contrôleurs.
const msgController = require("./../controllers/messageController");
//API
// GET /conversations/messages/get/:userIdA&:userIdB&:amount&:timestamp
router.get("/conversations/messages/get/:userIdA&:userIdB&:amount&:timestamp", authMdlw.checkTokenAccountValidity, msgController.getConvoMessagesWithTimestamp);
// GET /conversations/messages/get/:userIdA&:userIdB&:amount
router.get("/conversations/messages/get/:userIdA&:userIdB&:amount", authMdlw.checkTokenAccountValidity, msgController.getConvoMessages);
// GET /conversations/get/:userId&:amount&:timestamp
router.get("/conversations/get/:userId&:amount&:timestamp", authMdlw.checkTokenAccountValidity, msgController.getConvosWithTimestamp);
// GET /conversations/get/:userId&:amount
router.get("/conversations/get/:userId&:amount", authMdlw.checkTokenAccountValidity, msgController.getConvos);
// POST /conversations/messages/post
router.post("/conversations/messages/post", authMdlw.checkTokenAccountValidity, multer().array("medias"), msgController.postMessage);
// DELETE /conversations/messages/delete/:messageId
router.delete("/conversations/messages/delete/:messageId", authMdlw.checkTokenAccountValidity, msgController.deleteMessage);
// PUT /conversations/messages/update/:messageId
router.put("/conversations/messages/update/:messageId", authMdlw.checkTokenAccountValidity, msgController.updateMessage);
module.exports = router;
