"use strict";
/*
  Utilitaire pour ce qui concerne les messages de tchat.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//Librairies
const Cryptr = require("cryptr");
const cryptr = new Cryptr(process.env.ENCRYPTION_PRIVATE_KEY);
//Utilitaires.
const objectUtils = require("./objectUtils");
const mediaUtils = require("./mediaUtils");
const userUtils = require("./userUtils");
const avisUtils = require("./avisUtils");
//Modèles.
const messageModel = require("./../models/messageTchatModel");
const convoModel = require("./../models/conversationModel");
//Implémentations
/*
    Un objet qui représente une conversation doit être de la forme:
    {
        userA:<profilA>
        userB:<profilB>

        totalMessages: <nb. msgs>

        unseenMessagesUserA: <nb. msgs. non-vus userA>
        unseenMessagesUserB: <nb. msgs. non-vus userB>
    }
*/
//Convertir un document représentant un message en un format lisible par le client.
/*
    - Transformation de l'array d'identifiants de médias en array de leur liens.
*/
exports.convertMessageDocumentToUserReadableFormat = (msg, mediaLinks = null) => __awaiter(void 0, void 0, void 0, function* () {
    let medias = mediaLinks
        ? mediaLinks
        : msg.medias
            ? yield mediaUtils.getMediaLinkArrayFromMediaIdArray(msg.medias)
            : {};
    return Object.assign(Object.assign({}, msg), { medias: medias });
});
/*
  Enregistrer l'existence d'une nouvelle conversation.
*/
exports.registerConversation = (userIdA, userIdB, initialAmount = 1) => __awaiter(void 0, void 0, void 0, function* () {
    //Sanitation des valeurs reçues.
    let amnt = parseInt(initialAmount);
    if (!objectUtils.isObjectValidStringId(userIdA) ||
        !objectUtils.isObjectValidStringId(userIdB) ||
        isNaN(amnt) ||
        amnt <= 0)
        throw "Arguments invalides.";
    //Validation des valeurs reçues.
    if (!(yield userUtils.doesUserIdExist(userIdA)) ||
        !(yield userUtils.doesUserIdExist(userIdB)))
        throw "L'un ou les utilisateur(s) donné(s) n'existe(nt) pas.";
    return yield convoModel.create({
        userIdA: userIdA,
        userIdB: userIdB,
        nbMessages: amnt,
    });
});
/*
  Désenregistrer une conversation connue.
*/
exports.unregisterConversation = (userIdA, userIdB) => __awaiter(void 0, void 0, void 0, function* () {
    //Sanitation des valeurs reçues.
    if (!objectUtils.isObjectValidStringId(userIdA) ||
        !objectUtils.isObjectValidStringId(userIdB))
        throw "Arguments invalides.";
    //Validation des valeurs reçues.
    if (!(yield this.doesConversationExist(userIdA, userIdB)))
        throw "La conversation n'existe pas.";
    return yield convoModel.findOneAndDelete({
        $or: [
            {
                userIdA: userIdA,
                userIdB: userIdB,
            },
            { userIdA: userIdB, userIdB: userIdA },
        ],
    });
});
/*
  Obtenir la liste des conversations d'un utilisateur
*/
exports.getUserConversations = (userId, amount, timestamp = null) => __awaiter(void 0, void 0, void 0, function* () {
    //Sanitation des valeurs reçues.
    let amnt = parseInt(amount);
    if (!objectUtils.isObjectValidStringId(userId) ||
        isNaN(amnt) ||
        amnt <= 0 ||
        (timestamp != null && !objectUtils.isStringTimestamp(timestamp)))
        throw "Argument invalide.";
    //Validation des valeurs reçues.
    if (!(yield userUtils.doesUserIdExist(userId)))
        throw "L'utilisateur n'existe pas.";
    //Execution.
    let optionalTimestampFilter = timestamp != null ? { createdAt: { $lte: timestamp } } : {};
    let rawConvos = yield convoModel
        .find(Object.assign({ $or: [{ userIdA: userId }, { userIdB: userId }] }, optionalTimestampFilter))
        .sort({ createdAt: -1 })
        .limit(amnt)
        .exec();
    let convos = yield Promise.all(rawConvos.map((c) => __awaiter(void 0, void 0, void 0, function* () {
        let userAndParamsA = yield userUtils.getUserAndUserParamsFromUserId(c.userIdA.toString());
        let userAndParamsB = yield userUtils.getUserAndUserParamsFromUserId(c.userIdB.toString());
        console.log("A");
        return {
            userA: yield objectUtils.getUserSummaryProfileData(userAndParamsA.user, userAndParamsA.params),
            userB: yield objectUtils.getUserSummaryProfileData(userAndParamsB.user, userAndParamsB.params),
            totalMessages: c.nbMessages,
            unseenMessagesUserA: yield messageModel.count({
                auteur: c.userIdB,
                cible: c.userIdA,
                cibleVu: false,
            }),
            unseenMessagesUserB: yield messageModel.count({
                auteur: c.userIdA,
                cible: c.userIdB,
                cibleVu: false,
            }),
        };
    })));
    console.log("B");
    return convos;
});
exports.doesMessageWithIdExist = (msgId) => __awaiter(void 0, void 0, void 0, function* () { return (yield messageModel.exists({ _id: msgId })) != null; });
/*
  Supression d'un message.
*/
exports.removeMessage = (msgId) => __awaiter(void 0, void 0, void 0, function* () {
    //Sanitation.
    if (!objectUtils.isObjectString(msgId))
        throw "Argument invalide.";
    //Validation.
    if (!(yield this.doesMessageWithIdExist(msgId)))
        throw "Message inexistant.";
    //Execution.
    let msg = yield messageModel.findById(msgId);
    let userIdA = msg.auteur.toString();
    let userIdB = msg.cible.toString();
    let convoSearchFilter = {
        $or: [
            { userIdA: userIdA, userIdB: userIdB },
            { userIdA: userIdB, userIdB: userIdA },
        ],
    };
    if ("medias" in msg &&
        msg.medias &&
        Array.isArray(msg.medias) &&
        msg.medias.length > 0) {
        //Suppr. en cascade des médias.
        mediaUtils.removeMediasByIds(...msg.medias);
    }
    let delMsg = yield messageModel.findOneAndDelete({ _id: msgId });
    if ((yield convoModel.exists(convoSearchFilter)) != null) {
        let convo = yield convoModel.findOne(convoSearchFilter);
        console.log(convo);
        if (parseInt(convo.nbMessages) <= 1)
            yield convoModel.findByIdAndDelete(convo._id);
        else {
            convo.nbMessages = yield messageModel.count({
                $or: [
                    { auteur: userIdA, cible: userIdB },
                    { auteur: userIdB, cible: userIdA },
                ],
            });
            convo.save();
        }
    }
    return delMsg;
});
/*
  Création d'un message.
*/
exports.createMessage = (senderUserId, receiverUserId, content, mediaIds = null) => __awaiter(void 0, void 0, void 0, function* () {
    //Sanitation des valeurs reçues.
    if (!objectUtils.isObjectValidStringId(senderUserId) ||
        !objectUtils.isObjectValidStringId(receiverUserId) ||
        !objectUtils.isObjectString(content) ||
        senderUserId == receiverUserId ||
        (mediaIds != null && !Array.isArray(mediaIds)))
        throw "Arguments invalides.";
    //Validations des valeurs reçues.
    if (!(yield userUtils.doesUserIdExist(senderUserId)) ||
        !(yield userUtils.doesUserIdExist(receiverUserId)))
        throw "Identifiants invalides.";
    //Execution.
    let optionalData = mediaIds != null ? { medias: mediaIds } : {};
    let newMsg = yield messageModel.create(Object.assign({ auteur: senderUserId, cible: receiverUserId, contenu: content, cibleVu: false }, optionalData));
    if (!(yield this.doesConversationExist(senderUserId, receiverUserId))) {
        yield this.registerConversation(senderUserId, receiverUserId);
    }
    else {
        yield convoModel.findOneAndUpdate({
            $or: [
                { userIdA: senderUserId, userIdB: receiverUserId },
                { userIdA: receiverUserId, userIdB: senderUserId },
            ],
        }, {
            nbMessages: yield messageModel.count({
                $or: [
                    { auteur: senderUserId, cible: receiverUserId },
                    { auteur: receiverUserId, cible: senderUserId },
                ],
            }),
        });
    }
    return newMsg;
});
//Vérifie si une conversation existe.
exports.doesConversationExist = (userIdA, userIdB) => __awaiter(void 0, void 0, void 0, function* () {
    return ((yield convoModel.exists({
        userIdA: userIdA,
        userIdB: userIdB,
    })) != null ||
        (yield convoModel.exists({
            userIdA: userIdB,
            userIdB: userIdA,
        })) != null);
});
/*
    Récupère les messages d'une conversation spécifiée par l'identifiant de ses deux interlocuteurs.
*/
exports.getConversationMessages = (conversationUserIdA, conversationUserIdB, messageAmount = 1, timestamp = null) => __awaiter(void 0, void 0, void 0, function* () {
    //Sanitation des valeurs reçues.
    let amnt = parseInt(messageAmount);
    if (!objectUtils.isObjectValidStringId(conversationUserIdA) ||
        !objectUtils.isObjectValidStringId(conversationUserIdB) ||
        isNaN(amnt) ||
        amnt <= 0 ||
        (timestamp != null && !objectUtils.isStringTimestamp(timestamp)))
        throw "Arguments invalides.";
    //Validation des valeurs reçues.
    if (!(yield userUtils.doesUserIdExist(conversationUserIdA)) ||
        !(yield userUtils.doesUserIdExist(conversationUserIdB)))
        throw "L'un ou les utilisateur(s) donné(s) n'existe(nt) pas.";
    //Execution.
    let optionalTimestampFilter = timestamp != null ? { createdAt: { $lte: timestamp } } : {};
    let msgs = yield messageModel
        .find(Object.assign({ $or: [
            { auteur: conversationUserIdA, cible: conversationUserIdB },
            { auteur: conversationUserIdB, cible: conversationUserIdA },
        ] }, optionalTimestampFilter))
        .sort({ createdAt: -1 })
        .limit(amnt)
        .exec();
    msgs = yield Promise.all(msgs.map((el) => __awaiter(void 0, void 0, void 0, function* () { return yield this.convertMessageDocumentToUserReadableFormat(el._doc); })));
    msgs = msgs.map((msg) => {
        return Object.assign(Object.assign({}, msg), { contenu: cryptr.decrypt(msg.contenu) });
    });
    return msgs;
});
//Récupère une conversation.
exports.getConversation = (conversationUserIdA, conversationUserIdB) => __awaiter(void 0, void 0, void 0, function* () {
    //Sanitation des valeurs reçues.
    if (!objectUtils.isObjectValidStringId(conversationUserIdA) ||
        !objectUtils.isObjectValidStringId(conversationUserIdB))
        throw "Arguments invalides.";
    //Validation des valeurs reçues.
    if (!(yield userUtils.doesUserIdExist(conversationUserIdA)) ||
        !(yield userUtils.doesUserIdExist(conversationUserIdB)))
        throw "L'un ou les utilisateur(s) donné(s) n'existe(nt) pas.";
    let userAUserAndParams = yield userUtils.getUserAndUserParamsFromUserId(conversationUserIdA);
    let userBUserAndParams = yield userUtils.getUserAndUserParamsFromUserId(conversationUserIdB);
    let data = {
        userA: yield objectUtils.getUserSummaryProfileData(userAUserAndParams.user, userAUserAndParams.params),
        userB: yield objectUtils.getUserSummaryProfileData(userBUserAndParams.user, userBUserAndParams.params),
        totalMessages: yield messageModel.count({
            $or: [
                { auteur: conversationUserIdA, cible: conversationUserIdB },
                { auteur: conversationUserIdB, cible: conversationUserIdA },
            ],
        }),
        unseenMessagesUserA: yield messageModel.count({
            auteur: conversationUserIdB,
            cible: conversationUserIdA,
            cibleVu: false,
        }),
        unseenMessagesUserB: yield messageModel.count({
            auteur: conversationUserIdA,
            cible: conversationUserIdB,
            cibleVu: false,
        }),
    };
    return data;
});
exports.getMessage = (msgId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(msgId))
        throw "Argument invalide.";
    if (!(yield this.doesMessageWithIdExist(msgId)))
        return null;
    return yield messageModel.findById(msgId);
});
exports.updateMessage = (msgId, newContent) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(msgId) ||
        !objectUtils.isObjectString(newContent))
        throw "Argument invalide.";
    if (!(yield this.doesMessageWithIdExist(msgId)))
        throw "Le message n'existe pas.";
    return yield messageModel.findByIdAndUpdate(msgId, { contenu: newContent }, { new: true });
});
