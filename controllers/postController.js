//Librairies

const mimetypes = require("mime-types");

// Utilitaires

const postUtils = require("./../utils/postUtils");
const avisUtils = require("./../utils/avisUtils");
const objectUtils = require("./../utils/objectUtils");
const mediaUtils = require("./../utils/mediaUtils");
const userUtils = require("./../utils/userUtils");
const fileUtils = require("./../utils/fileUtils");
const followUtils = require("./../utils/followUtils");
const { default: mongoose } = require("mongoose");
const { v1: uuidv1, v4: uuidv4 } = require("uuid");

//API

// GET /api/posts/get/:postId
/*
  Permet l'obtention d'un post. Refus si le profil du domaine auquel le post appartient est privé et que l'utilisateur n'y a pas accès.
*/
exports.getPost = async function (req, res) {
  try {
    if (
      !"postId" in req.params ||
      !req.params.postId ||
      !objectUtils.isObjectValidStringId(req.params.postId)
    )
      return res.status(400).json("Bad Request");
    if (!(await postUtils.doesPostWithIdExist(req.params.postId)))
      return res.status(404).json("Not Found");

    let post = await postUtils.getPostFromId(req.params.postId);
    let domain = await postUtils.getPostProfileDomain(post._id.toString());

    if ("profilPublic" in domain.params && !domain.params.profilPublic) {
      let token = req.headers.authorization.replace("Bearer ", "");
      let payload = await authUtils.authentifySessionToken(token);
      if (!payload || !"userId" in payload)
        return res.status(401).json("Unauthorized");
      if (
        !(await userUtils.isUserIdAdmin(payload.userId)) &&
        payload.userId != domain.user._id.toString() &&
        !(await followUtils.userIdFollows(payload.userId, user._id.toString()))
      )
        return res.status(403).json("Forbidden");
    }

    return res.status(200).json({
      ...post,
      ...(await postUtils.getPostSecondaryData(post._id.toString())),
      medias: await mediaUtils.getMediaLinkArrayFromMediaIdArray(post.medias),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

// POST /api/posts/create
/*
    Publie un post. Le client doit envoyer un token authentique, appartenant à un compte valide.
    La requête reçue doit contenir en son corps un objet de la forme:

    {
        contenu: <Le contenu>
        reponse: <Id du post auquel on répond> (facultatif)
    }

    C'est à dire que la requête form-data doit envoyer le champ contenu et facultativement le champ reponse (avec les champs 'medias')

    Si le post répond à un autre post, le domaine du post auquel le client répond doit lui être accessible, sinon refus.
    Aussi, la requête peut contenir des médias.
*/
exports.createPost = async function (req, res) {
  try {
    if (!"contenu" in req.body || !req.body.contenu)
      return res.status(400).json("Bad Request");

    for (let f of req.files) {
      if (!fileUtils.validateFile(f.size, f.mimetype))
        return res.status(400).json("Bad Request");
      console.log(mimetypes.extension(f.mimetype));
    }

    let postCible = null;
    let tokenPayload = req.tokenPayload;

    if ("reponse" in req.body && req.body.reponse) {
      if (
        !objectUtils.isObjectValidStringId(req.body.reponse) ||
        !(await postUtils.doesPostWithIdExist(req.body.reponse))
      )
        return res.status(404).json("Not Found");
      let domain = await postUtils.getPostProfileDomain(req.body.reponse);

      if (
        "profilPublic" in domain.params &&
        !domain.params.profilPublic &&
        !(
          tokenPayload.userId == domain.user._id.toString() ||
          !(await userUtils.isUserIdAdmin(tokenPayload.userId)) ||
          !followUtils.userIdFollows(
            tokenPayload.userId,
            domain.user._id.toString()
          )
        )
      )
        return res.status(403).json("Forbidden");
    }

    let targetPostId =
      "reponse" in req.body
        ? req.body.reponse
          ? req.body.reponse
          : null
        : null;
    if (targetPostId && !objectUtils.isObjectValidStringId(targetPostId))
      return res.status(400).json("Bad Request");
    let resultMedias = [];

    for (let f of req.files) {
      let newMedia = await mediaUtils.createMedia(
        `public/${uuidv1()}.${mimetypes.extension(f.mimetype)}`,
        f.buffer,
        tokenPayload.userId
      );
      if (newMedia != null) resultMedias.push(newMedia);
    }

    let post = await postUtils.createPost(
      tokenPayload.userId,
      req.body.contenu,
      targetPostId,
      resultMedias
    );
    resultMedias = resultMedias.map((el) => el.lien);
    let secondaryPostData = await postUtils.getPostSecondaryData(
      post._id.toString()
    );

    return res
      .status(201)
      .json({ ...post._doc, ...secondaryPostData, medias: resultMedias });
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//PATCH /api/posts/update/:postId
/*
  Met à jour un post. C'est à dire, son contenu ou ses médias.
  Un token authentique appartenant à un compte valide doit être envoyé par le client.
*/
exports.editPost = async function (req, res) {
  try {
    if (
      !"postId" in req.params ||
      !req.params.postId ||
      !objectUtils.isObjectValidStringId(req.params.postId) ||
      !objectUtils.containsOnlyGivenArrayElementsAsProperties(req.body, [
        "contenu",
      ]) ||
      !"contenu" in req.body ||
      !objectUtils.isObjectString(req.body.contenu)
    )
      return res.status(400).json("Bad Request");

    if (!(await postUtils.doesPostWithIdExist(req.params.postId)))
      return res.status(404).json("Not Found");

    let post = await postUtils.getPostFromId(req.params.postId);
    let userId = req.tokenPayload.userId;

    if (post.auteur.toString() != userId)
      return res.status(403).json("Forbidden");

    let newPost = await postUtils.updatePost(
      req.params.postId,
      req.body.contenu
    );
    return res.status(200).json({
      ...newPost._doc,
      ...(await postUtils.getPostSecondaryData(req.params.postId)),
      medias: await mediaUtils.getMediaLinkArrayFromMediaIdArray(
        newPost.medias
      ),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//DELETE /api/posts/delete/:postId
/*
  Supprime un post. Seul l'auteur ou un administrateur doit pouvoir le faire.
*/
exports.deletePost = async function (req, res) {
  try {
    if (
      !"postId" in req.params ||
      !req.params.postId ||
      !objectUtils.isObjectValidStringId(req.params.postId)
    )
      return res.status(400).json("Bad Request");

    if (!(await postUtils.doesPostWithIdExist(req.params.postId)))
      return res.status(404).json("Not Found");

    let post = await postUtils.getPostFromId(req.params.postId);
    let userId = req.tokenPayload.userId;

    if (
      post.auteur.toString() != userId &&
      !(await userUtils.isUserIdAdmin(userId))
    )
      return res.status(403).json("Forbidden");

    postUtils.removePost(req.params.postId);
    return res.status(204).json("No Content");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//GET /api/posts/responses/:postId&:amount
exports.getPostResponses = async function (req, res) {
  try {
    //Sanitation des informations reçues.
    let amnt = parseInt(req.params.amount);
    if (
      !objectUtils.isObjectValidStringId(req.params.postId) ||
      isNaN(amnt) ||
      amnt <= 0 ||
      amnt >
        parseInt(process.env.POST_RESPONSES_MAX_LOAD_AMOUNT_PER_REQUEST ?? 10)
    )
      return res.status(400).json("Bad Request");

    //Vérification de la validité des informations reçues.
    if (!(await postUtils.doesPostWithIdExist(req.params.postId)))
      return res.status(404).json("Not Found");

    //Vérification des droits d'accès.
    let post = await postUtils.getPostFromId(req.params.postId);
    let domain = await postUtils.getPostProfileDomain(req.params.postId);
    let tokenPayload = req.tokenPayload;

    if (
      !userUtils.doesUserIdHaveAccessToUserIdDomain(
        tokenPayload.userId,
        domain.user._id.toString()
      )
    )
      return res.status(403).json("Forbidden");

    //Execution.

    let resps = await postUtils.getPostResponses(req.params.postId, amnt);
    let results = [];

    for (let el of resps) {
      results.push({
        ...el._doc,
        ...(await postUtils.getPostSecondaryData(el._id.toString())),
        medias: await mediaUtils.getMediaLinkArrayFromMediaIdArray(el.medias),
      });
    }

    return res.status(200).json(results);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//GET /api/posts/responses/:postId&:amount&:timestamp
exports.getPostResponsesWithTimestamp = async function (req, res) {
  try {
    //Sanitation des informations reçues.
    let amnt = parseInt(req.params.amount);
    if (
      !objectUtils.isObjectValidStringId(req.params.postId) ||
      isNaN(amnt) ||
      amnt <= 0 ||
      amnt >
        parseInt(
          process.env.POST_RESPONSES_MAX_LOAD_AMOUNT_PER_REQUEST ?? 10
        ) ||
      !objectUtils.isStringTimestamp(req.params.timestamp)
    )
      return res.status(400).json("Bad Request");

    //Vérification de la validité des informations reçues.
    if (!(await postUtils.doesPostWithIdExist(req.params.postId)))
      return res.status(404).json("Not Found");

    //Vérification des droits d'accès.
    let post = await postUtils.getPostFromId(req.params.postId);
    let domain = await postUtils.getPostProfileDomain(req.params.postId);
    let tokenPayload = req.tokenPayload;

    if (
      !userUtils.doesUserIdHaveAccessToUserIdDomain(
        tokenPayload.userId,
        domain.user._id.toString()
      )
    )
      return res.status(403).json("Forbidden");

    //Execution.

    let resps = await postUtils.getPostResponses(
      req.params.postId,
      amnt,
      req.params.timestamp
    );
    let results = [];

    for (let el of resps) {
      results.push({
        ...el._doc,
        ...(await postUtils.getPostSecondaryData(el._id.toString())),
        medias: await mediaUtils.getMediaLinkArrayFromMediaIdArray(el.medias),
      });
    }

    return res.status(200).json(results);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

// POST /api/posts/activities/create/:postId&:nature
/*
  Crée une nouvelle activité.
  Un token authentique et valide doit être envoyé par le client.
  :postId est l'identifiant du post ciblé.
  :nature doit correspondre aux valeurs admissibles de la propriété correspondante sur la table.
*/
exports.postActivity = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    if (
      !req.params.postId ||
      !objectUtils.isObjectValidStringId(req.params.postId) ||
      !req.params.nature ||
      !avisUtils.getAdmissibleNatureValues().includes(req.params.nature)
    )
      return res.status(400).json("Bad Request");

    //Récupérations des informations sur le client.
    let tokenPayload = req.tokenPayload;
    let clientUserId = tokenPayload.userId;

    //Validation des valeurs reçues.
    if (
      !(await postUtils.doesPostWithIdExist(req.params.postId)) ||
      !(await userUtils.doesUserIdExist(clientUserId))
    )
      return res.status(404).json("Not Found");

    //Validation des droits d'accès.
    let postAuthorUserId = (
      await postUtils.getPostFromId(req.params.postId)
    ).auteur.toString();
    if (
      !(await userUtils.doesUserIdHaveAccessToUserIdDomain(
        clientUserId,
        postAuthorUserId
      ))
    )
      return res.status(403).json("Forbidden");

    //Execution.
    avisUtils.createAvis(clientUserId, req.params.postId, req.params.nature);
    return res.status(201).json("Created");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

// DELETE /api/posts/activities/delete/:postId
exports.deleteActivity = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    if (
      !req.params.postId ||
      !objectUtils.isObjectValidStringId(req.params.postId)
    )
      return res.status(400).json("Bad Request");

    //Récupérations des informations sur le client.
    let tokenPayload = req.tokenPayload;
    let clientUserId = tokenPayload.userId;

    //Validation des valeurs reçues.
    if (
      !(await postUtils.doesPostWithIdExist(req.params.postId)) ||
      !(await userUtils.doesUserIdExist(clientUserId))
    )
      return res.status(404).json("Not Found");

    //Validation des droits d'accès.
    let postAuthorUserId = (
      await postUtils.getPostFromId(req.params.postId)
    ).auteur.toString();
    if (
      !(await userUtils.doesUserIdHaveAccessToUserIdDomain(
        clientUserId,
        postAuthorUserId
      ))
    )
      return res.status(403).json("Forbidden");

    //Execution.
    //avisUtils.createAvis(clientUserId, req.params.postId, req.params.nature);
    avisUtils.removeAvisWithUserIdAndPostId(clientUserId, req.params.postId);
    return res.status(204).json("No Content");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};
