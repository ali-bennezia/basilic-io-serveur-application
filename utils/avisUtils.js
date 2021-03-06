/*
  Utilitaire pour ce qui concerne les avis.
*/

//Utilitaires.

const objectUtils = require("./objectUtils");
const mediaUtils = require("./mediaUtils");
const userUtils = require("./userUtils");
const postUtils = require("./postUtils");

//Modèles.

const userModel = require("./../models/utilisateurModel");
const avisModel = require("../models/avisModel");

//Implémentations.

exports.doesAvisExistWithUserIdAndPostId = async (
  authorUserId,
  targetPostId
) => {
  if (
    !(
      objectUtils.isObjectValidStringId(authorUserId) &&
      objectUtils.isObjectValidStringId(targetPostId)
    )
  )
    throw "Arguments invalides.";
  return await avisModel.exists({
    auteur: authorUserId,
    postCible: targetPostId,
  });
};

exports.removeAvisWithUserIdAndPostId = async (authorUserId, targetPostId) => {
  if (
    !(
      objectUtils.isObjectValidStringId(authorUserId) &&
      objectUtils.isObjectValidStringId(targetPostId)
    )
  )
    throw "Arguments invalides.";

  await avisModel.findOneAndRemove({
    auteur: authorUserId,
    postCible: targetPostId,
  });
};

exports.getSingleAvisFromAuthorUserIdAndTargetPostId = async (
  authorUserId,
  targetPostId
) => {
  if (
    !(
      objectUtils.isObjectValidStringId(authorUserId) &&
      objectUtils.isObjectValidStringId(targetPostId)
    )
  )
    throw "Arguments invalides.";

  if (!userUtils.doesUserIdExist(authorUserId))
    throw "L'identifiant de l'auteur n'appartient à aucun utilisateur connu.";
  if (!postUtils.doesPostWithIdExist(targetPostId))
    throw "L'identifiant du post ciblé n'appartient à aucun post connu.";

  return await avisModel.findOne({
    auteur: authorUserId,
    postCible: targetPostId,
  });
};

exports.createAvis = async (authorUserId, targetPostId, nature) => {
  if (
    !(
      objectUtils.isObjectValidStringId(authorUserId) &&
      objectUtils.isObjectValidStringId(targetPostId)
    ) ||
    !avisModel.schema.paths.nature.enumValues.includes(nature)
  )
    throw "Arguments invalides.";

  if (!userUtils.doesUserIdExist(authorUserId))
    throw "L'identifiant de l'auteur n'appartient à aucun utilisateur connu.";
  if (!postUtils.doesPostWithIdExist(targetPostId))
    throw "L'identifiant du post ciblé n'appartient à aucun post connu.";

  let doesAlreadyExist = await this.doesAvisExistWithUserIdAndPostId(
    authorUserId,
    targetPostId
  );

  if (doesAlreadyExist) {
    let avis = await this.getSingleAvisFromAuthorUserIdAndTargetPostId(
      authorUserId,
      targetPostId
    );
    if (avis != null && "nature" in avis && avis.nature != nature) {
      avis.nature = nature;
      await avis.save();
    }
    return avis;
  } else {
    return await avisModel.create({
      auteur: authorUserId,
      postCible: targetPostId,
      nature: nature,
    });
  }

  //if (doesAlreadyExist)
  //await this.removeAvisWithUserIdAndPostId(authorUserId, targetPostId);
};

//Envoie toutes les valeurs possibles de la propriété nature du modèle Avis.
exports.getAdmissibleNatureValues = () => [
  ...avisModel.schema.paths.nature.enumValues,
];

//Envoie le nombre de likes/dislikes d'un post.
exports.getPostAvis = async (postId) => {
  try {
    if (!objectUtils.isObjectValidStringId(postId))
      throw "Arguments invalides.";
    if (!postUtils.doesPostWithIdExist(postId))
      throw "L'identifiant du post ciblé n'appartient à aucun post connu.";

    let dataObject = {};
    for (let el of avisModel.schema.paths.nature.enumValues)
      dataObject[el] = await avisModel.count({ postCible: postId, nature: el });
    return dataObject;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.getAvisFromUserId = async function (
  userId,
  amount = 10,
  timestamp = null
) {
  if (
    !objectUtils.isObjectValidStringId(userId) ||
    parseInt(amount) <= 0 ||
    (timestamp && !objectUtils.isStringTimestamp(timestamp))
  )
    throw "Arguments invalides.";
  if (!userUtils.doesUserIdExist(userId))
    throw "L'identifiant du post ciblé n'appartient à aucun post connu.";
  let filter = { auteur: userId };
  if (timestamp) filter.createdAt = { $lte: timestamp };
  let avis = await avisModel
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(
      Math.min(
        parseInt(process.env.ACTIVITIES_MAX_LOAD_AMOUNT_PER_REQUEST ?? 20),
        parseInt(amount)
      )
    )
    .exec();
  let result = [];
  for (let el of avis) {
    let postData = await postUtils.getPostFromId(el.postCible.toString());
    result.push({
      ...el._doc,
      auteur: await objectUtils.getUserSummaryProfileData(
        await userUtils.getUserFromId(el.auteur.toString()),
        await userUtils.getUserParamsFromUserId(el.auteur.toString())
      ),
      postCible: {
        ...postData,
        ...(await postUtils.getPostSecondaryData(el.postCible.toString())),
        medias: await mediaUtils.getMediaLinkArrayFromMediaIdArray(
          postData.medias
        ),
      },
    });
  }
  return result;
};
