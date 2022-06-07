//Utilitaires

const objectUtils = require("../utils/objectUtils");
const userUtils = require("../utils/userUtils");

//Modèles.

const userModel = require("../models/utilisateurModel");
const userParamsModel = require("../models/paramsUtilisateurModel");
const paramsUtilisateurModel = require("../models/paramsUtilisateurModel");

const updatableParamProperties = [
  "nomPublic",
  "profilPublic",
  "photoProfil",
  "banniereProfil",
  "descriptionProfil",
];

// PATCH /api/users/params/patch/:id
exports.patchParams = async function (req, res) {
  try {
    let payload = req.tokenPayload;
    let tokenUser = await userUtils.getUserFromId(payload.userId);

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

    if (
      !"id" in req.params ||
      !req.params.id ||
      !user ||
      !tokenUser ||
      !userParams ||
      !"newParams" in req.body ||
      !req.body.newParams ||
      !objectUtils.containsOnlyGivenArrayElementsAsProperties(
        req.body.newParams,
        updatableParamProperties
      )
    )
      return res.status(400).json("Bad Request");
    if (user._id.toString() != tokenUser._id.toString())
      return res.status(403).json("Forbidden");

    userParams = objectUtils.overwriteAndAddObjectProperties(
      userParams._doc,
      req.body.newParams
    );

    userParams = await paramsUtilisateurModel.findByIdAndUpdate(
      { _id: userParams._id.toString() },
      userParams,
      { new: true }
    );

    return res.status(200).json(userParams);
  } catch (err) {
    res.status(500).json("Internal Server Error");
    console.log(err);
  }
};

// PUT /api/users/params/reset/:id
exports.resetParams = async function (req, res) {
  try {
    let payload = req.tokenPayload;
    let tokenUser = await userUtils.getUserFromId(payload.userId);

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

    if (
      !"id" in req.params ||
      !req.params.id ||
      !user ||
      !tokenUser ||
      !userParams
    )
      return res.status(400).json("Bad Request");
    if (user._id.toString() != tokenUser._id.toString())
      return res.status(403).json("Forbidden");

    userParams.nomPublic = undefined;
    userParams.profilPublic = true;
    userParams.photoProfil = undefined;
    userParams.banniereProfil = undefined;
    userParams.descriptionProfil = undefined;

    userParams = await paramsUtilisateurModel.findOneAndUpdate(
      { _id: userParams._id },
      userParams,
      { new: true }
    );

    return res.status(200).json(userParams);
  } catch (err) {
    res.status(500).json("Internal Server Error");
    console.log(err);
  }
};

// GET /api/users/params/get/:id
/*
  Récupère les paramètres d'un utilisateur.
  Seul l'utilisateur conçerné doit pouvoir récuperer ses paramètres.
  Un token authentique doit être reçu.
*/
exports.getParams = async function (req, res) {
  try {
    let payload = req.tokenPayload;
    let tokenUser = await userUtils.getUserFromId(payload.userId);

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

    if (
      !"id" in req.params ||
      !req.params.id ||
      !user ||
      !tokenUser ||
      !userParams
    )
      return res.status(400).json("Bad Request");
    if (user._id.toString() != tokenUser._id.toString())
      return res.status(403).json("Forbidden");

    return res.status(200).json(userParams);
  } catch (err) {
    res.status(500).json("Internal Server Error");
    console.log(err);
  }
};
