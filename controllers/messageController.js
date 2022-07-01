//Utilitaires

const msgUtils = require("./../utils/messageUtils");
const objectUtils = require("./../utils/objectUtils");
const userUtils = require("./../utils/userUtils");
const mediaUtils = require("./../utils/mediaUtils");
const fileUtils = require("./../utils/fileUtils");
const { v1: uuidv1, v4: uuidv4 } = require("uuid");

const validation = require("../validation/validation");

//Librairies

const mimetypes = require("mime-types");

//API

// GET /conversations/messages/get/:userIdA&:userIdB&:amount&:timestamp
/*
    Récupère les messages d'une conversation, avec timestamp.
    Le client doit envoyer un token valide pour y avoir accès.
    L'utilisateur rattaché au token doit être l'un des deux interlocuteurs de la conversation.
*/
exports.getConvoMessagesWithTimestamp = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    let amnt = parseInt(req.params.amount);
    if (
      !objectUtils.isObjectValidStringId(req.params.userIdA) ||
      !objectUtils.isObjectValidStringId(req.params.userIdB) ||
      isNaN(amnt) ||
      amnt <= 0 ||
      amnt >
        parseInt(process.env.CHAT_MESSAGES_MAX_LOAD_AMOUNT_PER_REQUEST ?? 15) ||
      !objectUtils.isStringTimestamp(req.params.timestamp)
    )
      return res.status(400).json("Bad Request");
    //Validation des valeurs reçues.
    if (
      !(await userUtils.doesUserIdExist(req.params.userIdA)) ||
      !(await userUtils.doesUserIdExist(req.params.userIdB))
    )
      return res.status(404).json("Not Found");
    //Validation des droits d'accès.
    let clientUserId = req.tokenPayload.userId;
    if (
      !(await userUtils.doesUserIdExist(clientUserId)) ||
      (clientUserId != req.params.userIdA && clientUserId != req.params.userIdB)
    )
      return res.status(403).json("Forbidden");

    //Execution.
    let data = await msgUtils.getConversationMessages(
      req.params.userIdA,
      req.params.userIdB,
      amnt,
      req.params.timestamp
    );

    return res.status(200).json(data);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

// GET /conversations/messages/get/:userIdA&:userIdB&:amount
/*
    Récupère les messages d'une conversation.
    Le client doit envoyer un token valide pour y avoir accès.
    L'utilisateur rattaché au token doit être l'un des deux interlocuteurs de la conversation.
*/
exports.getConvoMessages = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    let amnt = parseInt(req.params.amount);
    if (
      !objectUtils.isObjectValidStringId(req.params.userIdA) ||
      !objectUtils.isObjectValidStringId(req.params.userIdB) ||
      isNaN(amnt) ||
      amnt <= 0 ||
      amnt >
        parseInt(process.env.CHAT_MESSAGES_MAX_LOAD_AMOUNT_PER_REQUEST ?? 15)
    )
      return res.status(400).json("Bad Request");
    //Validation des valeurs reçues.
    if (
      !(await userUtils.doesUserIdExist(req.params.userIdA)) ||
      !(await userUtils.doesUserIdExist(req.params.userIdB))
    )
      return res.status(404).json("Not Found");
    //Validation des droits d'accès.
    let clientUserId = req.tokenPayload.userId;
    if (
      !(await userUtils.doesUserIdExist(clientUserId)) ||
      (clientUserId != req.params.userIdA && clientUserId != req.params.userIdB)
    )
      return res.status(403).json("Forbidden");

    //Execution.
    let data = await msgUtils.getConversationMessages(
      req.params.userIdA,
      req.params.userIdB,
      amnt
    );

    return res.status(200).json(data);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

// GET /conversations/get/:userId&:amount&:timestamp
/*
  Récupère une liste de conversations liées à un utilisateur, avec timestamp.
*/
exports.getConvosWithTimestamp = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    let amnt = parseInt(req.params.amount);
    if (
      !objectUtils.isObjectValidStringId(req.params.userId) ||
      isNaN(amnt) ||
      !objectUtils.isStringTimestamp(req.params.timestamp) ||
      amnt <= 0 ||
      amnt >
        parseInt(process.env.CONVERSATIONS_MAX_LOAD_AMOUNT_PER_REQUEST ?? 15)
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    let clientUserId = req.tokenPayload.userId;
    if (
      clientUserId != req.params.userId ||
      !(await userUtils.doesUserIdExist(req.params.userId))
    )
      return res.status(404).json("Not Found");

    //Execution.
    let convos = await msgUtils.getUserConversations(
      req.params.userId,
      amnt,
      req.params.timestamp
    );
    return res.status(200).json(convos);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

// GET /conversations/get/:userId&:amount
/*
  Récupère une liste de conversations liées à un utilisateur.
*/
exports.getConvos = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    let amnt = parseInt(req.params.amount);
    if (
      !objectUtils.isObjectValidStringId(req.params.userId) ||
      isNaN(amnt) ||
      amnt <= 0 ||
      amnt >
        parseInt(process.env.CONVERSATIONS_MAX_LOAD_AMOUNT_PER_REQUEST ?? 15)
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    let clientUserId = req.tokenPayload.userId;
    if (
      clientUserId != req.params.userId ||
      !(await userUtils.doesUserIdExist(req.params.userId))
    )
      return res.status(404).json("Not Found");

    //Execution.
    let convos = await msgUtils.getUserConversations(req.params.userId, amnt);
    return res.status(200).json(convos);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
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
  - medias : <les medias, qui doivent ensuite être visible dans req.files>
*/
exports.postMessage = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.

    let data = null;
    if ("data" in req.body && req.body.data)
      try {
        data = JSON.parse(req.body.data);
      } catch (err) {
        data = null;
      }

    if (
      !data ||
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
      !objectUtils.isObjectString(data.contenu) ||
      !validation.useTest("ChatTests", "messageContent", data.contenu)
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    let clientUserId = req.tokenPayload.userId;

    if (
      !(await userUtils.doesUserIdExist(data.cibleUserId)) ||
      !(await userUtils.doesUserIdExist(clientUserId))
    )
      return res.status(404).json("Not Found");

    if ("files" in req && req.files)
      for (let f of req.files)
        if (!fileUtils.validateFile(f.size, f.mimetype))
          return res.status(400).json("Bad Request");

    //Validation des droits d'accès.
    if (
      !(await userUtils.doesUserIdHaveAccessToUserIdDomain(
        clientUserId,
        data.cibleUserId
      ))
    )
      return res.status(403).json("Forbidden");

    //Execution.
    let msgMedias = [];
    if ("files" in req && req.files)
      for (let f of req.files) {
        msgMedias.push(
          await mediaUtils.createMedia(
            `private/${uuidv4()}.${mimetypes.extension(f.mimetype)}`,
            f.buffer,
            clientUserId,
            false,
            [clientUserId, data.cibleUserId]
          )
        );
      }

    let mediaLinks = msgMedias.map((el) => el.lien);
    let mediaIds = msgMedias.map((el) => el._id);

    let newMsg = await msgUtils.createMessage(
      clientUserId,
      data.cibleUserId,
      data.contenu,
      mediaIds
    );

    let formattedMsg =
      await msgUtils.convertMessageDocumentToUserReadableFormat(
        newMsg._doc,
        mediaLinks
      );
    return res.status(201).json({ ...formattedMsg, contenu: data.contenu });
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

// DELETE /conversations/messages/delete/:messageId
/*
  Permet la supression d'un message.
  Le client doit justifier d'un token valide.
  Le client doit soit être administrateur, soit être le propriétaire du message.
*/
exports.deleteMessage = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    if (
      !"messageId" in req.params ||
      !req.params.messageId ||
      !(await objectUtils.isObjectValidStringId(req.params.messageId))
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    let clientUserId = req.tokenPayload.userId;
    let isClientAdmin = await userUtils.isUserIdAdmin(clientUserId);

    let msg = await msgUtils.getMessage(req.params.messageId);
    if (!msg) return res.status(404).json("Not Found");
    let messageOwnerUserId = msg.auteur.toString();

    if (!isClientAdmin && clientUserId != messageOwnerUserId)
      return res.status(403).json("Forbidden");

    //Execution.
    msgUtils.removeMessage(req.params.messageId);
    return res.status(204).json("No Content");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
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
exports.updateMessage = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    if (
      !"messageId" in req.params ||
      !req.params.messageId ||
      !objectUtils.isObjectValidStringId(req.params.messageId) ||
      !"newContent" in req.body ||
      !req.body.newContent ||
      !objectUtils.isObjectString(req.body.newContent) ||
      !validation.useTest("ChatTests", "messageContent", req.body.newContent) ||
      !objectUtils.containsOnlyGivenArrayElementsAsProperties(req.body, [
        "newContent",
      ])
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    if (!(await msgUtils.doesMessageWithIdExist(req.params.messageId)))
      return res.status(404).json("Not Found");

    //Validation des droits d'accès.
    let clientUserId = req.tokenPayload.userId;
    let msg = await msgUtils.getMessage(req.params.messageId);
    if (!msg) return res.status(404).json("Not Found");
    let messageOwnerUserId = msg.auteur.toString();
    if (clientUserId != messageOwnerUserId)
      return res.status(403).json("Forbidden");

    //Execution.
    return res
      .status(200)
      .json(
        await msgUtils.convertMessageDocumentToUserReadableFormat(
          (
            await msgUtils.updateMessage(
              req.params.messageId,
              req.body.newContent
            )
          )._doc
        )
      );
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};
