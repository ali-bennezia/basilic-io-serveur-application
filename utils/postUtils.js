/*
  Utilitaire pour ce qui concerne les posts.
*/

//Utilitaires.

const objectUtils = require("./objectUtils");
const mediaUtils = require("./mediaUtils");
const userUtils = require("./userUtils");

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
    !(postContent instanceof String || typeof postContent == "string") ||
    !(authorUserId instanceof String || typeof authorUserId == "string") ||
    (targetPostId != null &&
      !(authorUserId instanceof String || typeof authorUserId == "string")) ||
    (mediaIds != null && !Array.isArray(mediaIds)) ||
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

exports.getPostsFromUser = async function (
  userId,
  amount,
  timestamp = null,
  customFilter = {}
) {
  if (!(userId instanceof String || typeof userId == "string"))
    throw "Argument invalide.";

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
