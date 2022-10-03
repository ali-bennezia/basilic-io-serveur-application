/*
  Utilitaire pour ce qui concerne les posts.
*/

//Librairies.
const mongoose = require("mongoose");

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
  - L'identifiant du profil de l'auteur du post ciblé si il y a
*/
exports.getPostSecondaryData = async (postId) => {
  if (!objectUtils.isObjectValidStringId(postId)) throw "Argument invalide.";
  if (!(await postModel.exists({ _id: postId })))
    throw "Le post ciblé par l'identifiant donné n'existe pas.";
  let posterProfile = await userUtils.getUserAndUserParamsFromUserId(
    (await this.getPostFromId(postId.toString())).auteur.toString()
  );

  let targetedPostData = {};
  const post = await this.getPostFromId(postId.toString());
  if (post != null && "postCible" in post) {
    let targetPost = await this.getPostFromId(post.postCible.toString());
    let tpAuthorIdentifier = (
      await userUtils.getUserFromId(targetPost.auteur.toString())
    ).nomUtilisateur;
    targetedPostData = { nomUtilisateurCible: tpAuthorIdentifier };
  }

  return {
    ...(await avisUtils.getPostAvis(postId)),
    auteur: await objectUtils.getUserSummaryProfileData(
      posterProfile.user,
      posterProfile.params
    ),
    reponse: await postModel.count({ postCible: postId }),
    ...targetedPostData,
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

/*
  Récupères un liste de posts publics recemment publiés.
    - amount: le nombre de réponses maximal à récuperer
    - userId: l'identifiant de l'utilisateur voulant récuperer le flux
    - isUserAdmin: booléenne, indiquant si l'utilisateur est admin et à donc accès a tous les domaines ou non
    - timestamp: un instant précis. toute réponse datante de cet instant ou avant seront récupérées
*/
exports.getPostFlux = async (
  amount = 1,
  userId = null,
  isUserAdmin = false,
  timestamp = null,
  onlyFollowedByUser = false
) => {
  //Sanitation des variables.
  amount = parseInt(amount);
  if (
    (userId && !objectUtils.isObjectValidStringId(userId)) ||
    isNaN(amount) ||
    amount <= 0 ||
    (timestamp != null && !objectUtils.isStringTimestamp(timestamp)) ||
    (onlyFollowedByUser === true && !userId)
  )
    throw "Arguments invalides.";

  let optionalTimestampFilter = timestamp
    ? { createdAt: { $lte: new Date(timestamp) } }
    : {};

  let result = [];

  const filtreSuivis =
    onlyFollowedByUser === true && userId != null
      ? {
          "doc_auteur.suivisPar": mongoose.Types.ObjectId(userId),
        }
      : {};

  if (!isUserAdmin) {
    //Execution d'une recherche en aggrégation pour tout post dont le domaine est accessible par l'utilisateur (userId).
    //Sinon, tout post public, si aucun utilisateur n'est fourni.

    const filtreDomaine = [
      //On prend, si le post est public.
      {
        $or: [
          { "params_auteur.profilPublic": { $exists: false } },
          { "params_auteur.profilPublic": true },
        ],
      },
      //Sinon, si l'utilisateur n'est pas anonyme, on prend le post si l'utilisateur a accès au domaine
      userId != null
        ? {
            "doc_auteur.suivisPar": mongoose.Types.ObjectId(userId),
          }
        : {},
    ];
    if (userId == null) filtreDomaine.pop();

    result = await postModel.aggregate([
      { $match: { ...optionalTimestampFilter } },
      //Jointure gauche avec les données et paramètres de l'auteur du post.
      {
        $lookup: {
          from: "utilisateurs",
          localField: "auteur",
          foreignField: "_id",
          as: "doc_auteur",
        },
      },
      {
        $lookup: {
          from: "paramsutilisateurs",
          localField: "auteur",
          foreignField: "utilisateur",
          as: "params_auteur",
        },
      },

      //Filtrage, selon le domaine du post et userId.
      {
        $match: {
          $or: filtreDomaine,
          ...filtreSuivis,
        },
      },

      //{ $match: { ...filtreSuivis } },

      //On supprime les champs params_auteur et doc_auteur.
      { $project: { params_auteur: 0, doc_auteur: 0 } },
      //On limite la quantité de posts, et on les organise du plus récent au plus ancien.
      { $limit: amount },
      { $sort: { createdAt: -1 } },
    ]);
  } else {
    //Execution d'une requête récupérant tout post, peu importe l'auteur et le domaine de son profil. Filtrage pour posts d'auteurs suivis uniquement optionnel.
    /*result = await postModel
      .find({ ...optionalTimestampFilter })
      .sort({ createdAt: -1 })
      .limit(amount)
      .exec();*/

    result = await postModel.aggregate([
      { $match: { ...optionalTimestampFilter } },
      {
        $lookup: {
          from: "utilisateurs",
          localField: "auteur",
          foreignField: "_id",
          as: "doc_auteur",
        },
      },
      //Filtrage posts suivis ou non.
      {
        $match: {
          ...filtreSuivis,
        },
      },
      //On supprime les champs params_auteur et doc_auteur.
      { $project: { doc_auteur: 0 } },
      //On limite la quantité de posts, et on les organise du plus récent au plus ancien.
      { $limit: amount },
      { $sort: { createdAt: -1 } },
    ]);
  }

  return result;
};

/*
  Prend deux paramètres:
    - postData: objet représentant les données du post
    - userId: identifiant de l'utilisateur dont on veut ajouter les données d'avis sur l'objet postData

  Ajoute deux informations sur l'objet représentant les données d'un post:
    - likePar: booléenne, vraie si l'auteur aime le post
    - dislikePar: booléenne, vraie si l'auteur n'aime pas le post
  Seulement si l'auteur a laissé un avis sur le poste concerné. Sinon, aucune donnée n'est ajoutée.
*/
exports.populatePostUserIdActivityData = async (postData, userId) => {
  //Sanitation des variables.
  if (!objectUtils.isObjectValidStringId(userId)) throw "Arguments invalides.";

  //Executions.

  const avis = await avisUtils.getSingleAvisFromAuthorUserIdAndTargetPostId(
    userId,
    postData._id.toString()
  );

  if (avis == null) return postData;
  else
    return {
      ...postData,
      likePar: avis.nature === "like",
      dislikePar: avis.nature === "dislike",
    };
};

/*
  Récupères un liste de posts publics contenant un mot-clé.
    - amount: le nombre de réponses maximal à récuperer
    - userId: l'identifiant de l'utilisateur voulant récuperer le flux
    - isUserAdmin: booléenne, indiquant si l'utilisateur est admin et à donc accès a tous les domaines ou non
    - timestamp: un instant précis. toute réponse datante de cet instant ou avant seront récupérées
    - keyword: le mot clé pour lequel on effectue un recherche
*/
exports.getPostsLikeKeyword = async (
  amount = 1,
  userId = null,
  isUserAdmin = false,
  timestamp = null,
  keyword = ""
) => {
  //Sanitation des variables.
  amount = parseInt(amount);
  if (
    (userId && !objectUtils.isObjectValidStringId(userId)) ||
    isNaN(amount) ||
    amount <= 0 ||
    (timestamp != null && !objectUtils.isStringTimestamp(timestamp))
  )
    throw "Arguments invalides.";

  let optionalTimestampFilter = timestamp
    ? { createdAt: { $lte: new Date(timestamp) } }
    : {};

  let result = [];

  if (!isUserAdmin) {
    //Execution d'une recherche en aggrégation pour tout post dont le domaine est accessible par l'utilisateur (userId).
    //Sinon, tout post public, si aucun utilisateur n'est fourni.

    const filtreDomaine = [
      //On prend, si le post est public.
      {
        $or: [
          { "params_auteur.profilPublic": { $exists: false } },
          { "params_auteur.profilPublic": true },
        ],
      },
      //Sinon, si l'utilisateur n'est pas anonyme, on prend le post si l'utilisateur a accès au domaine
      userId != null
        ? {
            "doc_auteur.suivisPar": mongoose.Types.ObjectId(userId),
          }
        : {},
    ];
    if (userId == null) filtreDomaine.pop();

    result = await postModel.aggregate([
      {
        $match: {
          contenu: { $regex: `.*${keyword}.*` },
          ...optionalTimestampFilter,
        },
      },
      //Jointure gauche avec les données et paramètres de l'auteur du post.
      {
        $lookup: {
          from: "utilisateurs",
          localField: "auteur",
          foreignField: "_id",
          as: "doc_auteur",
        },
      },
      {
        $lookup: {
          from: "paramsutilisateurs",
          localField: "auteur",
          foreignField: "utilisateur",
          as: "params_auteur",
        },
      },

      //Filtrage, selon le domaine du post et userId.
      {
        $match: {
          $or: filtreDomaine,
        },
      },

      //On supprime les champs params_auteur et doc_auteur.
      { $project: { params_auteur: 0, doc_auteur: 0 } },
      //On limite la quantité de posts, et on les organise du plus récent au plus ancien.
      { $limit: amount },
      { $sort: { createdAt: -1 } },
    ]);
  } else {
    //Execution d'une requête récupérant tout post, peu importe l'auteur et le domaine de son profil. Filtrage pour posts d'auteurs suivis uniquement optionnel.

    result = await postModel.aggregate([
      {
        $match: { ...optionalTimestampFilter },
        contenu: { $regex: `.*${keyword}.*` },
      },
      //On limite la quantité de posts, et on les organise du plus récent au plus ancien.
      { $limit: amount },
      { $sort: { createdAt: -1 } },
    ]);
  }

  return result;
};
