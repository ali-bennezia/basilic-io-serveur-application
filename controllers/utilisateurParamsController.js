//Librairies

const { v1: uuidv1, v4: uuidv4 } = require("uuid");
const mimetypes = require("mime-types");

//Utilitaires

const objectUtils = require("../utils/objectUtils");
const userUtils = require("../utils/userUtils");
const fileUtils = require("../utils/fileUtils");
const mediaUtils = require("../utils/mediaUtils");

const validation = require("../validation/validation");

//Modèles.

const userModel = require("../models/utilisateurModel");
const userParamsModel = require("../models/paramsUtilisateurModel");
const paramsUtilisateurModel = require("../models/paramsUtilisateurModel");

//Configuration.

const updatableParamProperties = [
  "nomPublic",
  "profilPublic",
  "photoProfil",
  "banniereProfil",
  "descriptionProfil",
];

const updatableParamMediaProperties = ["photoProfil", "banniereProfil"];

// PATCH /api/users/params/patch/:id (Identifiant de l'utilisateur)
/*
  Met à jour les données annexes d'un utilisateur.
  Le client doit justifier d'un token authentique.
  Dans le corp de la requête doit se trouver un objet extrait du form-data qui doit être la forme:
  {
    newParams : {
      <Propriétés à mettre à jour et leurs nouvelles valeurs>
    }
  }
  Dans req.files doivent se trouver les fichiers liés aux paramètres-médias devant êtres mis à jour.
*/
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

    let newParams = "newParams" in req.body ? req.body.newParams : null;

    if (objectUtils.isObjectString(newParams))
      try {
        newParams = JSON.parse(newParams);
      } catch (e) {
        console.log(e);
        return res.status(500).json("Internal Server Error");
      }

    if (
      !"id" in req.params ||
      !req.params.id ||
      !user ||
      !tokenUser ||
      !userParams ||
      !newParams ||
      !objectUtils.containsOnlyGivenArrayElementsAsProperties(
        newParams,
        updatableParamProperties
      ) ||
      ("profilPublic" in newParams &&
        !validation.useTest(
          "UserTests",
          "profilPublic",
          newParams.profilPublic
        )) ||
      ("nomPublic" in newParams &&
        !validation.useTest("UserTests", "nomPublic", newParams.nomPublic)) ||
      ("descriptionProfil" in newParams &&
        !validation.useTest(
          "UserTests",
          "descriptionProfil",
          newParams.descriptionProfil
        ))
    )
      return res.status(400).json("Bad Request");
    if (user._id.toString() != tokenUser._id.toString())
      return res.status(403).json("Forbidden");

    //Validation des paramètres.

    //On vérifie les fichiers.
    let allFieldNames = "files" in req ? req.files.map((e) => e.fieldname) : [];
    if ("files" in req && Array.isArray(req.files) && req.files.length != 0) {
      if (
        !objectUtils.arrayContainsOnlyGivenArrayElementsAsProperties(
          allFieldNames,
          updatableParamMediaProperties
        )
      )
        return res.status(400).json("Bad Request");
      for (let f of req.files)
        if (!fileUtils.validateFile(f.size, f.mimetype))
          return res.status(400).json("Bad Request");
    }

    //On vérifie qu'on ne nous envoie pas à la fois un fichier pour un paramètre et à la fois un paramètre dans l'objet newParams.
    for (let fn of allFieldNames)
      if (fn in newParams) return res.status(400).json("Bad Request");
    //On vérifie qu'il n'y a pas de dupliqués.
    if (allFieldNames.length != new Set(allFieldNames).size)
      return res.status(400).json("Bad Request");

    //On vérifie que toute propriété présente dans l'objet newParams et qui correspond à un média est bien égale à null.
    for (let p in newParams) {
      if (updatableParamMediaProperties.includes(p) && newParams[p] != null)
        return res.status(400).json("Bad Request");
    }

    //Execution.

    //On supprime les médias précédents si ils existent.
    let previousMedias = [
      "photoProfil" in userParams && allFieldNames.includes("photoProfil")
        ? userParams.photoProfil
        : null,
      "banniereProfil" in userParams && allFieldNames.includes("banniereProfil")
        ? userParams.banniereProfil
        : null,
    ];
    previousMedias = previousMedias.filter((e) => e != null);

    if (previousMedias.length != 0)
      await mediaUtils.removeMediasByIds(...previousMedias);

    //On enregistre les nouveaux médias.
    let newMedias = {};
    if ("files" in req && Array.isArray(req.files) && req.files.length != 0) {
      for (let f of req.files) {
        if (f.fieldname in newParams) continue;
        else
          newMedias[f.fieldname] = await mediaUtils.createMedia(
            `public/${uuidv1()}.${mimetypes.extension(f.mimetype)}`,
            f.buffer,
            user._id.toString(),
            true
          );
      }
    }

    for (const prop in newMedias) {
      newMedias[prop] = newMedias[prop]._id.toString();
    }

    //Suppression des paramètres-médias tel que demandé par le client.
    let awaitingSuppressionMediaParamFields = Object.keys(newParams)
      .filter((k) => updatableParamMediaProperties.includes(k))
      .filter((k) => k in userParams);
    let awaitingSuppressionMediaIds = awaitingSuppressionMediaParamFields.map(
      (rmMediaField) => userParams[rmMediaField].toString()
    );
    if (awaitingSuppressionMediaIds.length > 0)
      mediaUtils.removeMediasByIds(...awaitingSuppressionMediaIds);

    for (let f of awaitingSuppressionMediaParamFields) delete newParams[f];

    //Envoi des nouveaux paramètres.
    userParams = {
      ...objectUtils.overwriteAndAddObjectProperties(
        userParams._doc,
        newParams
      ),
      ...newMedias,
    };

    userParams = await paramsUtilisateurModel
      .findByIdAndUpdate({ _id: userParams._id.toString() }, userParams, {
        new: true,
      })
      .lean();

    //Envoi des liens.
    for (let p in userParams)
      if (updatableParamMediaProperties.includes(p)) {
        console.log(p);
        userParams[p] = await mediaUtils.getMediaLinkFromId(
          userParams[p].toString()
        );
      }

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
