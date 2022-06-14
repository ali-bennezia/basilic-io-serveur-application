//Utilitaires

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
    Le client doit envoyé un token valide pour y avoir accès.
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
    Le client doit envoyé un token valide pour y avoir accès.
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
  - Data : {
    contenu : <Contenu du message>
    cibleUserId : <Id de l'utilisateur ciblé>
  }
*/
exports.postMessage = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    if (
      !"data" in req.body ||
      !req.body.data ||
      !"contenu" in req.body.data ||
      !req.body.data.contenu ||
      !objectUtils.containsOnlyGivenArrayElementsAsProperties(req.body.data, [
        "contenu",
        "cibleUserId",
      ]) ||
      !objectUtils.isObjectValidStringId(req.body.data.cibleUserId) ||
      !objectUtils.isObjectString(req.body.data.contenu)
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    let clientUserId = req.tokenPayload.userId;

    if (
      !(await userUtils.doesUserIdExist(req.body.data.cibleUserId)) ||
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
        req.body.data.cibleUserId
      ))
    )
      return res.status(403).json("Forbidden");

    //Execution.
    let msgMedias = [];
    if ("files" in req && req.files)
      for (let f of req.files) {
        msgMedias.push(
          await mediaUtils.createMedia(
            `public/${uuidv4()}.${mimetype.extension(f.mimetype)}`,
            f.buffer,
            clientUserId,
            false,
            ["clientUserId", req.body.data.cibleUserId]
          )
        );
      }

    let mediaLinks = msgMedias.map((el) => el.lien);
    let mediaIds = msgMedias.map((el) => el._id);

    let newMsg = await msgUtils.createMessage(
      clientUserId,
      req.body.data.cibleUserId,
      req.body.data.contenu,
      mediaIds
    );

    let formattedMsg = msgUtils.convertMessageDocumentToUserReadableFormat(
      newMsg,
      mediaLinks
    );
    return formattedMsg; //TODO à tester
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};
