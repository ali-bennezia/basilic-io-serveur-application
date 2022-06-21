"use strict";
//Utilitaires
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const msgUtils = require("./../utils/messageUtils");
const objectUtils = require("./../utils/objectUtils");
const userUtils = require("./../utils/userUtils");
const mediaUtils = require("./../utils/mediaUtils");
const fileUtils = require("./../utils/fileUtils");
const { v1: uuidv1, v4: uuidv4 } = require("uuid");
//Librairies
const mimetypes = require("mime-types");
//API
// GET /conversations/messages/get/:userIdA&:userIdB&:amount&:timestamp
/*
    Récupère les messages d'une conversation, avec timestamp.
    Le client doit envoyer un token valide pour y avoir accès.
    L'utilisateur rattaché au token doit être l'un des deux interlocuteurs de la conversation.
*/
exports.getConvoMessagesWithTimestamp = function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des valeurs reçues.
            let amnt = parseInt(req.params.amount);
            if (!objectUtils.isObjectValidStringId(req.params.userIdA) ||
                !objectUtils.isObjectValidStringId(req.params.userIdB) ||
                isNaN(amnt) ||
                amnt <= 0 ||
                amnt >
                    parseInt((_a = process.env.CHAT_MESSAGES_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _a !== void 0 ? _a : 15) ||
                !objectUtils.isStringTimestamp(req.params.timestamp))
                return res.status(400).json("Bad Request");
            //Validation des valeurs reçues.
            if (!(yield userUtils.doesUserIdExist(req.params.userIdA)) ||
                !(yield userUtils.doesUserIdExist(req.params.userIdB)))
                return res.status(404).json("Not Found");
            //Validation des droits d'accès.
            let clientUserId = req.tokenPayload.userId;
            if (!(yield userUtils.doesUserIdExist(clientUserId)) ||
                (clientUserId != req.params.userIdA && clientUserId != req.params.userIdB))
                return res.status(403).json("Forbidden");
            //Execution.
            let data = yield msgUtils.getConversationMessages(req.params.userIdA, req.params.userIdB, amnt, req.params.timestamp);
            return res.status(200).json(data);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
// GET /conversations/messages/get/:userIdA&:userIdB&:amount
/*
    Récupère les messages d'une conversation.
    Le client doit envoyer un token valide pour y avoir accès.
    L'utilisateur rattaché au token doit être l'un des deux interlocuteurs de la conversation.
*/
exports.getConvoMessages = function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des valeurs reçues.
            let amnt = parseInt(req.params.amount);
            if (!objectUtils.isObjectValidStringId(req.params.userIdA) ||
                !objectUtils.isObjectValidStringId(req.params.userIdB) ||
                isNaN(amnt) ||
                amnt <= 0 ||
                amnt >
                    parseInt((_a = process.env.CHAT_MESSAGES_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _a !== void 0 ? _a : 15))
                return res.status(400).json("Bad Request");
            //Validation des valeurs reçues.
            if (!(yield userUtils.doesUserIdExist(req.params.userIdA)) ||
                !(yield userUtils.doesUserIdExist(req.params.userIdB)))
                return res.status(404).json("Not Found");
            //Validation des droits d'accès.
            let clientUserId = req.tokenPayload.userId;
            if (!(yield userUtils.doesUserIdExist(clientUserId)) ||
                (clientUserId != req.params.userIdA && clientUserId != req.params.userIdB))
                return res.status(403).json("Forbidden");
            //Execution.
            let data = yield msgUtils.getConversationMessages(req.params.userIdA, req.params.userIdB, amnt);
            return res.status(200).json(data);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
// GET /conversations/get/:userId&:amount&:timestamp
/*
  Récupère une liste de conversations liées à un utilisateur, avec timestamp.
*/
exports.getConvosWithTimestamp = function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des valeurs reçues.
            let amnt = parseInt(req.params.amount);
            if (!objectUtils.isObjectValidStringId(req.params.userId) ||
                isNaN(amnt) ||
                !objectUtils.isStringTimestamp(req.params.timestamp) ||
                amnt <= 0 ||
                amnt >
                    parseInt((_a = process.env.CONVERSATIONS_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _a !== void 0 ? _a : 15))
                return res.status(400).json("Bad Request");
            //Validation des valeurs reçues.
            let clientUserId = req.tokenPayload.userId;
            if (clientUserId != req.params.userId ||
                !(yield userUtils.doesUserIdExist(req.params.userId)))
                return res.status(404).json("Not Found");
            //Execution.
            let convos = yield msgUtils.getUserConversations(req.params.userId, amnt, req.params.timestamp);
            return res.status(200).json(convos);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
// GET /conversations/get/:userId&:amount
/*
  Récupère une liste de conversations liées à un utilisateur.
*/
exports.getConvos = function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des valeurs reçues.
            let amnt = parseInt(req.params.amount);
            if (!objectUtils.isObjectValidStringId(req.params.userId) ||
                isNaN(amnt) ||
                amnt <= 0 ||
                amnt >
                    parseInt((_a = process.env.CONVERSATIONS_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _a !== void 0 ? _a : 15))
                return res.status(400).json("Bad Request");
            //Validation des valeurs reçues.
            let clientUserId = req.tokenPayload.userId;
            if (clientUserId != req.params.userId ||
                !(yield userUtils.doesUserIdExist(req.params.userId)))
                return res.status(404).json("Not Found");
            //Execution.
            let convos = yield msgUtils.getUserConversations(req.params.userId, amnt);
            return res.status(200).json(convos);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
// POST /conversations/messages/post
/*
  Envoie un message.
  Le client doit justifier d'un token authentique et valide.
  L'auteur, qui est l'utilisateur lié au client, doit avoir accès au domaine du profil vers lequel il envoie le message.
  Il faut également prendre en charge les médias possiblement envoyés avec le contenu de message.

  Dans le corp de la requête doivent êtres reçues les informations dans le formData sous la forme:
  - data : {
    contenu : <Contenu du message>
    cibleUserId : <Id de l'utilisateur ciblé>
  }
  - medias : les medias, qui doivent ensuite être visible dans req.files
*/
exports.postMessage = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des valeurs reçues.
            let data = null;
            if ("data" in req.body && req.body.data)
                try {
                    data = JSON.parse(req.body.data);
                }
                catch (err) {
                    data = null;
                }
            if (!data ||
                !"contenu" in data ||
                !data.contenu ||
                !objectUtils.containsOnlyGivenArrayElementsAsProperties(req.body, [
                    "data",
                    "medias",
                ]) ||
                !objectUtils.containsOnlyGivenArrayElementsAsProperties(data, [
                    "contenu",
                    "cibleUserId",
                ]) ||
                !objectUtils.isObjectValidStringId(data.cibleUserId) ||
                !objectUtils.isObjectString(data.contenu))
                return res.status(400).json("Bad Request");
            //Validation des valeurs reçues.
            let clientUserId = req.tokenPayload.userId;
            if (!(yield userUtils.doesUserIdExist(data.cibleUserId)) ||
                !(yield userUtils.doesUserIdExist(clientUserId)))
                return res.status(404).json("Not Found");
            if ("files" in req && req.files)
                for (let f of req.files)
                    if (!fileUtils.validateFile(f.size, f.mimetype))
                        return res.status(400).json("Bad Request");
            //Validation des droits d'accès.
            if (!(yield userUtils.doesUserIdHaveAccessToUserIdDomain(clientUserId, data.cibleUserId)))
                return res.status(403).json("Forbidden");
            //Execution.
            let msgMedias = [];
            if ("files" in req && req.files)
                for (let f of req.files) {
                    msgMedias.push(yield mediaUtils.createMedia(`private/${uuidv4()}.${mimetypes.extension(f.mimetype)}`, f.buffer, clientUserId, false, [clientUserId, data.cibleUserId]));
                }
            let mediaLinks = msgMedias.map((el) => el.lien);
            let mediaIds = msgMedias.map((el) => el._id);
            let newMsg = yield msgUtils.createMessage(clientUserId, data.cibleUserId, data.contenu, mediaIds);
            let formattedMsg = yield msgUtils.convertMessageDocumentToUserReadableFormat(newMsg._doc, mediaLinks);
            return res.status(201).json(Object.assign(Object.assign({}, formattedMsg), { contenu: data.contenu }));
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
// DELETE /conversations/messages/delete/:messageId
/*
  Permet la supression d'un message.
  Le client doit justifier d'un token valide.
  Le client doit soit être administrateur, soit être le propriétaire du message.
*/
exports.deleteMessage = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des valeurs reçues.
            if (!"messageId" in req.params ||
                !req.params.messageId ||
                !(yield objectUtils.isObjectValidStringId(req.params.messageId)))
                return res.status(400).json("Bad Request");
            //Validation des valeurs reçues.
            let clientUserId = req.tokenPayload.userId;
            let isClientAdmin = yield userUtils.isUserIdAdmin(clientUserId);
            let msg = yield msgUtils.getMessage(req.params.messageId);
            if (!msg)
                return res.status(404).json("Not Found");
            let messageOwnerUserId = msg.auteur.toString();
            if (!isClientAdmin && clientUserId != messageOwnerUserId)
                return res.status(403).json("Forbidden");
            //Execution.
            msgUtils.removeMessage(req.params.messageId);
            return res.status(204).json("No Content");
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
// PUT /conversations/messages/update/:messageId
/*
  Modifie un message.
  Le client doit justifier d'un token valide.
  Le client doit être le propriétaire du message.

  La requête envoyée par le client doit contenir en son corps, un objet de la forme:
  {
    newContent: <Nouveau contenu>
  }
*/
exports.updateMessage = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des valeurs reçues.
            if (!"messageId" in req.params ||
                !req.params.messageId ||
                !objectUtils.isObjectValidStringId(req.params.messageId) ||
                !"newContent" in req.body ||
                !req.body.newContent ||
                !objectUtils.isObjectString(req.body.newContent) ||
                !objectUtils.containsOnlyGivenArrayElementsAsProperties(req.body, [
                    "newContent",
                ]))
                return res.status(400).json("Bad Request");
            //Validation des valeurs reçues.
            if (!(yield msgUtils.doesMessageWithIdExist(req.params.messageId)))
                return res.status(404).json("Not Found");
            //Validation des droits d'accès.
            let clientUserId = req.tokenPayload.userId;
            let msg = yield msgUtils.getMessage(req.params.messageId);
            if (!msg)
                return res.status(404).json("Not Found");
            let messageOwnerUserId = msg.auteur.toString();
            if (clientUserId != messageOwnerUserId)
                return res.status(403).json("Forbidden");
            //Execution.
            return res
                .status(200)
                .json(yield msgUtils.convertMessageDocumentToUserReadableFormat((yield msgUtils.updateMessage(req.params.messageId, req.body.newContent))._doc));
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
