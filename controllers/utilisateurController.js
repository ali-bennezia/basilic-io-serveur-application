//Packages.

const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");

//Utilitaires

const objectUtils = require("../utils/objectUtils");
const userUtils = require("../utils/userUtils");
const authUtils = require("../utils/authUtils");
const stringUtils = require("../utils/stringUtils");
const codeUtils = require("../utils/codeVerificationUtils");

const validation = require("../validation/validation");

//Modèles.

const userModel = require("../models/utilisateurModel");

//API.

// POST /api/users/register
/*
    Création d'un compte.
    Le compte doit être invalide, et donc être vérifié par validation par le biais d'email ou tel.
    Tant que le compte est invalide, l'utilisateur ne doit pas pouvoir jouir de ses droits de membre.
    A chaque tentative d'utilisation du réseau, il doit être redirigé vers une page l'invitant à valider son compte.
    Toute requête généralement réservée aux membres à part entière doit être refusée aux membres invalides (.ie envoyer un message de tchat par exemple)
*/
exports.registerUser = async function (req, res) {
  try {
    if (
      !"email" in req.body ||
      !validation.useTest("UserTests", "email", req.body.email) ||
      !"nomUtilisateur" in req.body ||
      !validation.useTest(
        "UserTests",
        "nomUtilisateur",
        req.body.nomUtilisateur
      ) ||
      !"motDePasse" in req.body ||
      !validation.useTest("UserTests", "motDePasse", req.body.motDePasse) ||
      !"numeroTelephone" in req.body ||
      !validation.useTest(
        "UserTests",
        "numeroTelephone",
        req.body.numeroTelephone
      )
    )
      return res.status(400).json("Bad Request");
    await userUtils.addUser(req.body);
    res.status(201).json("Created");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

// POST /api/users/signin
/*
    Connexion à un compte.
    Vérification au niveau des informations de connection envoyées.
    Si tout est correct, création d'un token et envoi des informations de la session de connection.
*/
exports.signinUser = async function (req, res) {
  try {
    let identifier = objectUtils.getUniqueUserData(req.body);
    if (!objectUtils.containsAllNecessarySigninData(req.body)) {
      res.status(400).json("Bad Request");
      return;
    }

    if (
      ("nomUtilisateur" in identifier &&
        !validation.useTest(
          "UserTests",
          "nomUtilisateur",
          identifier.nomUtilisateur
        )) ||
      ("email" in identifier &&
        !validation.useTest("UserTests", "email", identifier.email)) ||
      !"motDePasse" in req.body ||
      !validation.useTest("UserTests", "motDePasse", req.body.motDePasse)
    )
      return res.status(400).json("Bad Request");
    let user = await userModel.model.findOne(identifier);

    if (!user) {
      res.status(404).json("Not Found");
      return;
    }

    if (!bcrypt.compareSync(req.body.motDePasse, user.motDePasse)) {
      res.status(403).json("Incorrect Password");
      return;
    }

    let sessionData = await authUtils.generateUserSession(user);
    res.status(200).json(sessionData);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

// GET /api/users/validation/send
/*
  Demande d'envoi d'un code de confirmation, soit par mail, soit par SMS, selon le mode demandé dans l'argument sur l'URL, :mode, récupéré dans l'objet req.params.
*/
exports.sendValidation = async function (req, res) {
  try {
    let payload = req.tokenPayload;
    let user = await userUtils.getUserFromId(payload.userId);

    if (
      !"mode" in req.params ||
      (req.params.mode != 0 && req.params.mode != 1) ||
      !user
    )
      return res.status(400).json("Bad Request");

    let mode = req.params.mode;

    let currentDate = new Date();

    if (
      "iatValidation" in user &&
      (currentDate - user.iatValidation) / 1000 <=
        (parseInt(process.env.VALIDATION_CODE_RETRY_TIME_SECONDS) ?? 30)
    )
      return res.status(429).json("Too Many Requests");

    let validationCode = stringUtils.generateRandomString(6);
    let userDataUpdate = {
      iatValidation: currentDate,
      codeValidation: validationCode,
    };

    if (mode == 0) {
      codeUtils.sendEmailCode(validationCode, user.email);
    } else {
      codeUtils.sendSMSCode(validationCode, user.numeroTelephone);
    }

    await userModel.model.updateOne({ _id: user._id }, userDataUpdate);

    res.status(200).json("Sent");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//POST /api/users/validation/confirm
/*
  Tentative de validation d'un compte à l'aide d'un code reçu.
*/
exports.confirmValidation = async function (req, res) {
  try {
    let payload = req.tokenPayload;
    let user = await userUtils.getUserFromId(payload.userId);

    if (!"code" in req.body || !req.body.code || !user)
      return res.status(400).json("Bad Request");

    let code = req.body.code;

    if (
      !"codeValidation" in user ||
      !user.codeValidation ||
      user.codeValidation != code
    )
      return res.status(403).json("Unauthorized");

    user["codeValidation"] = undefined;
    user["iatValidation"] = undefined;
    user.valide = true;

    await user.save(); //userModel.model.updateOne(newUser);

    return res.status(200).json("OK");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//GET /api/users/get/:id
/*
  Obtient les données d'un utilisateur, excepté celles très sensibles tel que le mot de passe.
  Seul l'utilisateur concerné doit pouvoir avoir accès à ses informations.
*/
exports.getUserData = async function (req, res) {
  try {
    let payload = req.tokenPayload;
    let tokenUser = await userUtils.getUserFromId(payload.userId);

    let user =
      "id" in req.params
        ? req.params.id
          ? await userUtils.getUserFromId(req.params.id)
          : null
        : null;

    if (!"id" in req.params || !req.params.id || !user || !tokenUser)
      return res.status(400).json("Bad Request");
    if (user._id.toString() != tokenUser._id.toString())
      return res.status(403).json("Forbidden");

    return res.status(200).json({
      id: user._id,
      nomUtilisateur: user.nomUtilisateur,
      email: user.email,
      numeroTelephone: user.numeroTelephone,
      valide: user.valide,
      administrateur: user.administrateur,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//PATCH /api/users/patch/:id
/*
  Met à jour les données d'un utilisateur.
  Seul l'utilisateur concerné doit pouvoir avoir accès à ses informations.
  Le mot de passe actuel de l'utilisateur doit être envoyé afin de confirmer l'identité du client dans req.body.motDePasse.
  Les informations à mettre à jour doivent êtres envoyées dans req.body.newData.
  Un token authentique doit être envoyé.
*/
exports.patchUserData = async function (req, res) {
  try {
    let payload = req.tokenPayload;
    let tokenUser = await userUtils.getUserFromId(payload.userId);

    let user =
      "id" in req.params
        ? req.params.id
          ? await userUtils.getUserFromId(req.params.id)
          : null
        : null;

    if (
      !"id" in req.params ||
      !req.params.id ||
      !user ||
      !tokenUser ||
      !"motDePasse" in req.body ||
      !req.body.motDePasse ||
      !"newData" in req.body ||
      !req.body.newData ||
      !objectUtils.containsOnlyUpdatableUserData(req.body.newData)
    )
      return res.status(400).json("Bad Request");
    if (
      user._id.toString() != tokenUser._id.toString() ||
      !bcrypt.compareSync(req.body.motDePasse, user.motDePasse)
    )
      return res.status(403).json("Incorrect Password");

    //TODO: Sanitation/Validation des informations envoyées.

    user = await userModel.model.findByIdAndUpdate(
      { _id: user._id },
      req.body.newData,
      { new: true }
    );

    return res.status(200).json({
      id: user._id,
      nomUtilisateur: user.nomUtilisateur,
      email: user.email,
      numeroTelephone: user.numeroTelephone,
      valide: user.valide,
      administrateur: user.administrateur,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//DELETE /api/users/delete/:id
/*
  Supprime un utilisateur.
  Seul l'utilisateur concerné ou un administrateur doivent pouvoir avoir accès à la suppression d'un compte.
  Le mot de passe actuel de l'utilisateur doit être envoyé afin de confirmer l'identité du client dans req.body.motDePasse.
  Un token authentique doit être envoyé.
*/
exports.deleteUser = async function (req, res) {
  try {
    let payload = req.tokenPayload;
    let tokenUser = await userUtils.getUserFromId(payload.userId);

    let user =
      "id" in req.params
        ? req.params.id
          ? await userUtils.getUserFromId(req.params.id)
          : null
        : null;

    if (!user) return res.status(404).json("Not Found");

    if (
      !"id" in req.params ||
      !req.params.id ||
      !tokenUser ||
      !"motDePasse" in req.body ||
      !req.body.motDePasse
    )
      return res.status(400).json("Bad Request");
    if (
      (user._id.toString() != tokenUser._id.toString() &&
        !tokenUser.administrateur) ||
      !bcrypt.compareSync(req.body.motDePasse, tokenUser.motDePasse)
    )
      return res.status(403).json("Incorrect Password");

    await userUtils.deleteUser(user);

    return res.status(204).json("No Content");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};
