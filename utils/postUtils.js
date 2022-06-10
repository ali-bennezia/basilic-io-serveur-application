/*
  Utilitaire pour ce qui concerne les posts.
*/

//Utilitaires.

const objectUtils = require("./objectUtils");
const mediaUtils = require("./mediaUtils");
const userUtils = require("./userUtils");
const avisUtils = require("./avisUtils");

//Modèles.

const userModel = require("./../models/utilisateurModel");
const postModel = require("../models/postModel");

exports.createPost = async function (
  authorUserId,
  postContent,
  targetPostId = null,
  mediaIds = null
) {
  if (
    !objectUtils.isObjectString(postContent) ||
    !objectUtils.isObjectValidStringId(authorUserId) ||
    (targetPostId != null &&
      !objectUtils.isObjectValidStringId(targetPostId)) ||
    (mediaIds != null && !Array.isArray(mediaIds)) ||
    (targetPostId != null &&
      !(await postModel.exists({ _id: targetPostId }))) ||
    !(await userModel.model.exists({ _id: authorUserId }))
  )
    throw "Argument(s) invalide(s).";

  let postData = {
    auteur: authorUserId,
    contenu: postContent,
  };

  if (targetPostId) postData.postCible = targetPostId;

  if (mediaIds)
    postData.medias = objectUtils.trimArray(
      mediaIds,
      process.env.MAX_MEDIAS_PER_POST ?? 4
    );

  let newPost = await postModel.create(postData);
  return newPost;
};

exports.removePost = async function (postId) {
  try {
    if (!(postId instanceof String || typeof postId == "string"))
      throw "Argument invalide.";

    let post = await postModel.findOne({ _id: postId });
    if (!post) throw "Le post n'existe pas.";
    let mediaIds = "medias" in post ? post.medias : [];
    if (mediaIds.length != 0) await mediaUtils.removeMediasByIds(mediaIds);
    await postModel.findOneAndRemove({ _id: postId });
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
};

exports.removePostsFromUserId = async function (userId) {
  if (!(userId instanceof String || typeof userId == "string"))
    throw "Argument invalide.";
  if (!(await userModel.model.exists({ _id: userId })))
    throw "L'utilisateur n'existe pas.";

  let posts = await postModel.find({ auteur: userId }).exec();
  for (let el of posts) this.removePost(el._id.toString());
};

exports.getPostsFromUser = async function (
  userId,
  amount,
  timestamp = null,
  customFilter = {}
) {
  if (
    !(userId instanceof String || typeof userId == "string") ||
    parseInt(amount) <= 0
  )
    throw "Arguments invalides.";

  if (timestamp == null)
    return await postModel
      .find({ auteur: userId, ...customFilter })
      .sort({ createdAt: -1 })
      .limit(
        Math.min(
          amount,
          parseInt(process.env.POSTS_MAX_LOAD_AMOUNT_PER_REQUEST ?? 20)
        )
      )
      .exec();
  else
    return await postModel
      .find({ auteur: userId, createdAt: { $lte: timestamp }, ...customFilter })
      .sort({ createdAt: -1 })
      .limit(
        Math.min(
          amount,
          parseInt(process.env.POSTS_MAX_LOAD_AMOUNT_PER_REQUEST ?? 20)
        )
      )
      .exec();
};

exports.doesPostWithIdExist = async (postId) => {
  if (!objectUtils.isObjectValidStringId(postId)) throw "Argument invalide.";
  return await postModel.exists({ _id: postId });
};

exports.getPostFromId = async (postId) => {
  return await postModel.findById(postId).lean();
};

/*Récupère les informations annexes d'un post, c'est à dire:
  - Le nombre de likes
  - Le nombre de dislikes
  - Le nombre de réponses
  - Les informations sommaires du profil de l'auteur
*/
exports.getPostSecondaryData = async (postId) => {
  if (!objectUtils.isObjectValidStringId(postId)) throw "Argument invalide.";
  if (!(await postModel.exists({ _id: postId })))
    throw "Le post ciblé par l'identifiant donné n'existe pas.";
  let posterProfile = await userUtils.getUserAndUserParamsFromUserId(
    (await this.getPostFromId(postId.toString())).auteur.toString()
  );
  return {
    ...(await avisUtils.getPostAvis(postId)),
    auteur: await objectUtils.getUserSummaryProfileData(
      posterProfile.user,
      posterProfile.params
    ),
    reponse: await postModel.count({ postCible: postId }),
  };
};

/*
  Récupère l'utilisateur (et ses paramètres) du profil sur lequel le post se trouve.
  La règle qui régis la méthode est la suivante:
  - Si un post ne répond à aucun autre post, alors il se trouve sur le profil de son auteur.
  - Si un post répond à un autre post, alors il se trouve sur le profil de l'auteur du post hierarchiquement le plus en haut 
    (c'est à dire celui qui n'est lui même la réponse à aucun post) sur la file de réponses.
*/
exports.getPostProfileDomain = async (postId) => {
  if (!objectUtils.isObjectValidStringId(postId)) throw "Argument invalide.";
  if (!(await postModel.exists({ _id: postId })))
    throw "Le post ciblé par l'identifiant donné n'existe pas.";
  let post = await this.getPostFromId(postId);

  let indexPost = post;
  while (
    "postCible" in indexPost &&
    indexPost.postCible &&
    (await postModel.exists({ _id: indexPost.postCible }))
  )
    indexPost = await this.getPostFromId(indexPost.postCible.toString());

  let auteurDomaine = indexPost.auteur.toString();

  return await userUtils.getUserAndUserParamsFromUserId(auteurDomaine);
};

exports.updatePost = async (postId, contenu) => {
  if (!objectUtils.isObjectValidStringId(postId)) throw "Argument invalide.";
  if (!(await postModel.exists({ _id: postId })))
    throw "Le post ciblé par l'identifiant donné n'existe pas.";
  let post = await postModel.findByIdAndUpdate(
    postId,
    { contenu: contenu },
    { new: true }
  );
  console.log(post);
  return post;
};

/*
  Récupères une liste de réponses à un post.
    - postId: l'identifiant du post conçerné
    - amount: le nombre de réponses maximal à récuperer
    - timestamp: un instant précis. toute réponse datante de cet instant ou avant seront récupérées
*/
exports.getPostResponses = async (postId, amount = 1, timestamp = null) => {
  //Sanitation des variables.
  amount = parseInt(amount);
  if (
    !objectUtils.isObjectValidStringId(postId) ||
    isNaN(amount) ||
    amount <= 0 ||
    (timestamp != null && !objectUtils.isStringTimestamp(timestamp))
  )
    throw "Arguments invalides.";

  let optionalTimestampFilter = timestamp
    ? { createdAt: { $lte: timestamp } }
    : {};

  let result = await postModel
    .find({ postCible: postId, ...optionalTimestampFilter })
    .sort({ createdAt: -1 })
    .limit(amount)
    .exec();

  return result;
};
