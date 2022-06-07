//Utilitaires

const objectUtils = require("../utils/objectUtils");
const userUtils = require("../utils/userUtils");
const authUtils = require("../utils/authUtils");
const mediaUtils = require("../utils/mediaUtils");
const followUtils = require("../utils/followUtils");
const postUtils = require("../utils/postUtils");

//API

//GET /api/users/profiles/get/:id
/*
  Récupères les informations sommaires du profil d'un utilisateur.
  La photo de profil, le nom d'utilisateur/nom public, la photo de bannière, la description du profil, ainsi que
  sa visibilité.
*/
exports.getProfile = async function (req, res) {
  try {
    let user =
      "id" in req.params
        ? req.params.id
          ? await userUtils.getUserFromId(req.params.id)
          : null
        : null;

    let userParams =
      "id" in req.params
        ? req.params.id
          ? await userUtils.getUserParamsFromUserId(req.params.id)
          : null
        : null;

    if (!"id" in req.params || !req.params.id || !user || !userParams)
      return res.status(400).json("Bad Request");

    let profileData = { id: user._id, nomUtilisateur: user.nomUtilisateur };
    if ("nomPublic" in userParams && userParams.nomPublic)
      profileData.nomPublic = userParams.nomPublic;
    if ("profilPublic" in userParams && userParams.profilPublic)
      profileData.profilPublic = userParams.profilPublic;
    if ("photoProfil" in userParams && userParams.photoProfil)
      profileData.photoProfil = userParams.photoProfil;
    if ("banniereProfil" in userParams && userParams.banniereProfil)
      profileData.banniereProfil = userParams.banniereProfil;
    if ("descriptionProfil" in userParams && userParams.descriptionProfil)
      profileData.descriptionProfil = userParams.descriptionProfil;

    return res.status(200).json(profileData);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//GET /api/profiles/posts/:userId&:nature&:amount
/*
  Récupères une liste de postes d'un utilisateur.
  Si le profil est privé, un token authentique doit être reçu qui appartient soit à ce même profil, soit à un administrateur, soit à une personne qui suit le profil.
  Si toutes ces conditions ne sont pas satisfaites, renvoi du code 403 Forbidden.

  La variable :nature doit correspondre à trois états:
  - 0 : Tout post.
  - 1 : Tout post contenant des médias.
  - 2 : Tout post qui est une réponse à un autre post.
*/
exports.getProfilePosts = async function (req, res) {
  try {
    if (
      !["0", "1", "2"].includes(req.params.nature) ||
      parseInt(req.params.amount) >
        parseInt(process.env.POSTS_MAX_LOAD_AMOUNT_PER_REQUEST ?? 20)
    )
      return res.status(400).json("Bad Request");
    console.log(req.params);

    let user = await userUtils.getUserFromId(req.params.userId);
    let userParams = await userUtils.getUserParamsFromUserId(req.params.userId);

    if (!user || !userParams) return res.status(404).json("Not Found");

    let public = "profilPublic" in userParams ? userParams.profilPublic : true;
    console.log(public);
    if (!public) {
      if (
        !"headers" in req ||
        !req.headers ||
        !"authorization" in req.headers ||
        !req.headers.authorization
      )
        return res.status(401).json("Unauthorized");
      let token = req.headers.authorization.replace("Bearer ", "");
      let payload = await authUtils.authentifySessionToken(token);
      if (!payload || !"userId" in payload)
        return res.status(401).json("Unauthorized");
      if (
        !(await userUtils.isUserIdAdmin(payload.userId)) &&
        payload.userId != user._id &&
        !(await followUtils.userIdFollows(payload.userId, user._id))
      )
        return res.status(403).json("Forbidden");
    }
    let posts = null;
    switch (req.params.nature) {
      case "0":
        posts = await postUtils.getPostsFromUser(user._id.toString(), 10);
        break;
      case "1":
        posts = await postUtils.getPostsFromUser(
          user._id.toString(),
          10,
          null,
          {
            "medias.0": { $exists: true },
          }
        );
        break;
      case "2":
        posts = await postUtils.getPostsFromUser(
          user._id.toString(),
          10,
          null,
          {
            postCible: { $exists: true, $ne: null },
          }
        );
        break;
    }
    posts = await Promise.all(
      posts.map(async (post) => {
        return {
          ...post._doc,
          medias: await Promise.all(
            post._doc.medias.map(async (mediaId) => {
              return (await mediaUtils.getMedia(mediaId.toString())).lien;
            })
          ),
        };
      })
    );
    return res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//GET /api/profiles/:userId&:nature&:timestamp&:amount
/*
  Récupères une liste de postes d'un utilisateur.
  Si le profil est public, un token authentique doit être reçu qui appartient soit à ce même profil, soit à un administrateur, soit à une personne qui suit le profil.
*/
