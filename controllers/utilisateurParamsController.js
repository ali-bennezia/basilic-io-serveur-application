//Librairies

const { v1: uuidv1, v4: uuidv4 } = require("uuid");
const mimetypes = require("mime-types");

//Utilitaires

const objectUtils = require("../utils/objectUtils");
const userUtils = require("../utils/userUtils");
const fileUtils = require("../utils/fileUtils");
const mediaUtils = require("../utils/mediaUtils");

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
    newData : {
      <Propriétés à mettre à jour et leurs nouvelles valeurs>
    }
  }
  Dans req.files doivent se trouver les fichiers liés aux paramètres-médias devant êtres mis à jour.
*/
//TODO: Ajouter l'envoi de médias pour les paramètres (photo de profil, bannière, etc ...)
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

    let newParams = null;
    try {
      newParams =
        "newParams" in req.body ? JSON.parse(req.body.newParams) : null;
    } catch (err) {
      newParams = null;
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
      )
    )
      return res.status(400).json("Bad Request");
    if (user._id.toString() != tokenUser._id.toString())
      return res.status(403).json("Forbidden");

    //On vérifie les fichiers puis on enregistre leur médias séparément.
    let allFieldNames = req.files.map((e) => e.fieldname);
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

    for (let fn of allFieldNames)
      if (fn in newParams) return res.status(400).json("Bad Request");

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

    //Envoi des nouveaux paramètres.

    userParams = {
      ...objectUtils.overwriteAndAddObjectProperties(
        userParams._doc,
        newParams
      ),
      ...newMedias,
    };

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
