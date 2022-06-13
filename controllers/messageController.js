//Utilitaires

const msgUtils = require("./../utils/messageUtils");
const objectUtils = require("./../utils/objectUtils");
const userUtils = require("./../utils/userUtils");

//API

// GET /conversations/get/:userIdA&:userIdB&:amount&:timestamp
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

// GET /conversations/get/:userIdA&:userIdB&:amount
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
