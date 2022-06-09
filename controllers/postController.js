//Librairies

const mimetypes = require("mime-types");

// Utilitaires

const postUtils = require("./../utils/postUtils");
const objectUtils = require("./../utils/objectUtils");
const mediaUtils = require("./../utils/mediaUtils");
const fileUtils = require("./../utils/fileUtils");
const followUtils = require("./../utils/followUtils");
const { default: mongoose } = require("mongoose");
const { v1: uuidv1, v4: uuidv4 } = require("uuid");

//API

// GET /api/posts/get/:postId
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
    console.log(tokenPayload.userId);
    console.log(req.body.contenu);
    console.log(targetPostId);
    console.log(resultMedias);

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
