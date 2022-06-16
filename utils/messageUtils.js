/*
  Utilitaire pour ce qui concerne les messages de tchat.
*/

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
exports.convertMessageDocumentToUserReadableFormat = async (
  msg,
  mediaLinks = null
) => {
  let medias = mediaLinks
    ? mediaLinks
    : msg.medias
    ? await mediaUtils.getMediaLinkArrayFromMediaIdArray(msg.medias)
    : {};

  return {
    ...msg,
    medias: medias,
  };
};

/*
  Enregistrer l'existence d'une nouvelle conversation.
*/
exports.registerConversation = async (userIdA, userIdB, initialAmount = 1) => {
  //Sanitation des valeurs reçues.
  let amnt = parseInt(initialAmount);
  if (
    !objectUtils.isObjectValidStringId(userIdA) ||
    !objectUtils.isObjectValidStringId(userIdB) ||
    isNaN(amnt) ||
    amnt <= 0
  )
    throw "Arguments invalides.";

  //Validation des valeurs reçues.
  if (
    !(await userUtils.doesUserIdExist(userIdA)) ||
    !(await userUtils.doesUserIdExist(userIdB))
  )
    throw "L'un ou les utilisateur(s) donné(s) n'existe(nt) pas.";

  return await convoModel.create({
    userIdA: userIdA,
    userIdB: userIdB,
    nbMessages: amnt,
  });
};

/*
  Désenregistrer une conversation connue.
*/
exports.unregisterConversation = async (userIdA, userIdB) => {
  //Sanitation des valeurs reçues.
  if (
    !objectUtils.isObjectValidStringId(userIdA) ||
    !objectUtils.isObjectValidStringId(userIdB)
  )
    throw "Arguments invalides.";

  //Validation des valeurs reçues.
  if (!(await this.doesConversationExist(userIdA, userIdB)))
    throw "La conversation n'existe pas.";

  return await convoModel.findOneAndDelete({
    $or: [
      {
        userIdA: userIdA,
        userIdB: userIdB,
      },
      { userIdA: userIdB, userIdB: userIdA },
    ],
  });
};

/*
  Obtenir la liste des conversations d'un utilisateur
*/
exports.getUserConversations = async (userId, amount, timestamp = null) => {
  //Sanitation des valeurs reçues.
  let amnt = parseInt(amount);
  if (
    !objectUtils.isObjectValidStringId(userId) ||
    isNaN(amnt) ||
    amnt <= 0 ||
    (timestamp != null && !objectUtils.isStringTimestamp(timestamp))
  )
    throw "Argument invalide.";

  //Validation des valeurs reçues.
  if (!(await userUtils.doesUserIdExist(userId)))
    throw "L'utilisateur n'existe pas.";

  //Execution.
  let optionalTimestampFilter =
    timestamp != null ? { createdAt: { $lte: timestamp } } : {};

  let rawConvos = await convoModel
    .find({
      $or: [{ userIdA: userId }, { userIdB: userId }],
      ...optionalTimestampFilter,
    })
    .sort({ createdAt: -1 })
    .limit(amnt)
    .exec();
  let convos = await Promise.all(
    rawConvos.map(async (c) => {
      let userAndParamsA = await userUtils.getUserAndUserParamsFromUserId(
        c.userIdA.toString()
      );
      let userAndParamsB = await userUtils.getUserAndUserParamsFromUserId(
        c.userIdB.toString()
      );
      console.log("A");
      return {
        userA: await objectUtils.getUserSummaryProfileData(
          userAndParamsA.user,
          userAndParamsA.params
        ),
        userB: await objectUtils.getUserSummaryProfileData(
          userAndParamsB.user,
          userAndParamsB.params
        ),

        totalMessages: c.nbMessages,

        unseenMessagesUserA: await messageModel.count({
          auteur: c.userIdB,
          cible: c.userIdA,
          cibleVu: false,
        }),
        unseenMessagesUserB: await messageModel.count({
          auteur: c.userIdA,
          cible: c.userIdB,
          cibleVu: false,
        }),
      };
    })
  );
  console.log("B");
  return convos;
};

exports.doesMessageWithIdExist = async (msgId) =>
  (await messageModel.exists({ _id: msgId })) != null;

/*
  Supression d'un message.
*/
exports.removeMessage = async (msgId) => {
  //Sanitation.
  if (!objectUtils.isObjectString(msgId)) throw "Argument invalide.";

  //Validation.
  if (!(await this.doesMessageWithIdExist(msgId))) throw "Message inexistant.";

  //Execution.
  let msg = await messageModel.findById(msgId);
  let userIdA = msg.auteur.toString();
  let userIdB = msg.cible.toString();

  let convoSearchFilter = {
    $or: [
      { userIdA: userIdA, userIdB: userIdB },
      { userIdA: userIdB, userIdB: userIdA },
    ],
  };

  if (
    "medias" in msg &&
    msg.medias &&
    Array.isArray(msg.medias) &&
    msg.medias.length > 0
  ) {
    //Suppr. en cascade des médias.
    mediaUtils.removeMediasByIds(...msg.medias);
  }

  let delMsg = await messageModel.findOneAndDelete({ _id: msgId });

  if ((await convoModel.exists(convoSearchFilter)) != null) {
    let convo = await convoModel.findOne(convoSearchFilter);
    console.log(convo);
    if (parseInt(convo.nbMessages) <= 1)
      await convoModel.findByIdAndDelete(convo._id);
    else {
      convo.nbMessages = await messageModel.count({
        $or: [
          { auteur: userIdA, cible: userIdB },
          { auteur: userIdB, cible: userIdA },
        ],
      });
      convo.save();
    }
  }

  return delMsg;
};

/*
  Création d'un message.
*/
exports.createMessage = async (
  senderUserId,
  receiverUserId,
  content,
  mediaIds = null
) => {
  //Sanitation des valeurs reçues.
  if (
    !objectUtils.isObjectValidStringId(senderUserId) ||
    !objectUtils.isObjectValidStringId(receiverUserId) ||
    !objectUtils.isObjectString(content) ||
    senderUserId == receiverUserId ||
    (mediaIds != null && !Array.isArray(mediaIds))
  )
    throw "Arguments invalides.";

  //Validations des valeurs reçues.
  if (
    !(await userUtils.doesUserIdExist(senderUserId)) ||
    !(await userUtils.doesUserIdExist(receiverUserId))
  )
    throw "Identifiants invalides.";

  //Execution.

  let optionalData = mediaIds != null ? { medias: mediaIds } : {};

  let newMsg = await messageModel.create({
    auteur: senderUserId,
    cible: receiverUserId,
    contenu: content,
    cibleVu: false,
    ...optionalData,
  });

  if (!(await this.doesConversationExist(senderUserId, receiverUserId))) {
    await this.registerConversation(senderUserId, receiverUserId);
  } else {
    await convoModel.findOneAndUpdate(
      {
        $or: [
          { userIdA: senderUserId, userIdB: receiverUserId },
          { userIdA: receiverUserId, userIdB: senderUserId },
        ],
      },
      {
        nbMessages: await messageModel.count({
          $or: [
            { auteur: senderUserId, cible: receiverUserId },
            { auteur: receiverUserId, cible: senderUserId },
          ],
        }),
      }
    );
  }

  return newMsg;
};

//Vérifie si une conversation existe.
exports.doesConversationExist = async (userIdA, userIdB) => {
  return (
    (await convoModel.exists({
      userIdA: userIdA,
      userIdB: userIdB,
    })) != null ||
    (await convoModel.exists({
      userIdA: userIdB,
      userIdB: userIdA,
    })) != null
  );
};

/*
    Récupère les messages d'une conversation spécifiée par l'identifiant de ses deux interlocuteurs.
*/
exports.getConversationMessages = async (
  conversationUserIdA,
  conversationUserIdB,
  messageAmount = 1,
  timestamp = null
) => {
  //Sanitation des valeurs reçues.
  let amnt = parseInt(messageAmount);
  if (
    !objectUtils.isObjectValidStringId(conversationUserIdA) ||
    !objectUtils.isObjectValidStringId(conversationUserIdB) ||
    isNaN(amnt) ||
    amnt <= 0 ||
    (timestamp != null && !objectUtils.isStringTimestamp(timestamp))
  )
    throw "Arguments invalides.";

  //Validation des valeurs reçues.
  if (
    !(await userUtils.doesUserIdExist(conversationUserIdA)) ||
    !(await userUtils.doesUserIdExist(conversationUserIdB))
  )
    throw "L'un ou les utilisateur(s) donné(s) n'existe(nt) pas.";

  //Execution.
  let optionalTimestampFilter =
    timestamp != null ? { createdAt: { $lte: timestamp } } : {};

  let msgs = await messageModel
    .find({
      $or: [
        { auteur: conversationUserIdA, cible: conversationUserIdB },
        { auteur: conversationUserIdB, cible: conversationUserIdA },
      ],
      ...optionalTimestampFilter,
    })
    .sort({ createdAt: -1 })
    .limit(amnt)
    .exec();

  msgs = await Promise.all(
    msgs.map(
      async (el) =>
        await this.convertMessageDocumentToUserReadableFormat(el._doc)
    )
  );

  return msgs;
};

//Récupère une conversation.
exports.getConversation = async (conversationUserIdA, conversationUserIdB) => {
  //Sanitation des valeurs reçues.
  if (
    !objectUtils.isObjectValidStringId(conversationUserIdA) ||
    !objectUtils.isObjectValidStringId(conversationUserIdB)
  )
    throw "Arguments invalides.";

  //Validation des valeurs reçues.
  if (
    !(await userUtils.doesUserIdExist(conversationUserIdA)) ||
    !(await userUtils.doesUserIdExist(conversationUserIdB))
  )
    throw "L'un ou les utilisateur(s) donné(s) n'existe(nt) pas.";

  let userAUserAndParams = await userUtils.getUserAndUserParamsFromUserId(
    conversationUserIdA
  );
  let userBUserAndParams = await userUtils.getUserAndUserParamsFromUserId(
    conversationUserIdB
  );

  let data = {
    userA: await objectUtils.getUserSummaryProfileData(
      userAUserAndParams.user,
      userAUserAndParams.params
    ),
    userB: await objectUtils.getUserSummaryProfileData(
      userBUserAndParams.user,
      userBUserAndParams.params
    ),

    totalMessages: await messageModel.count({
      $or: [
        { auteur: conversationUserIdA, cible: conversationUserIdB },
        { auteur: conversationUserIdB, cible: conversationUserIdA },
      ],
    }),

    unseenMessagesUserA: await messageModel.count({
      auteur: conversationUserIdB,
      cible: conversationUserIdA,
      cibleVu: false,
    }),

    unseenMessagesUserB: await messageModel.count({
      auteur: conversationUserIdA,
      cible: conversationUserIdB,
      cibleVu: false,
    }),
  };

  return data;
};

exports.getMessage = async (msgId) => {
  if (!objectUtils.isObjectValidStringId(msgId)) throw "Argument invalide.";
  if (!(await this.doesMessageWithIdExist(msgId))) return null;
  return await messageModel.findById(msgId);
};

exports.updateMessage = async (msgId, newContent) => {
  if (
    !objectUtils.isObjectValidStringId(msgId) ||
    !objectUtils.isObjectString(newContent)
  )
    throw "Argument invalide.";
  if (!(await this.doesMessageWithIdExist(msgId)))
    throw "Le message n'existe pas.";
  return await messageModel.findByIdAndUpdate(
    msgId,
    { contenu: newContent },
    { new: true }
  );
};
