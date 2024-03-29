//Utilitaires

const authUtils = require("./../utils/authUtils");
const objectUtils = require("./../utils/objectUtils");
const userUtils = require("./../utils/userUtils");
const mediaUtils = require("./../utils/mediaUtils");
const pwdRecUtils = require("./../utils/pwdRecoveryUtils");

//Modèles.

const userModel = require("./../models/utilisateurModel");

//Librairies.

const bcrypt = require("bcrypt");

//API

// POST /api/auth/token/refresh
/*
  Permet d'obtenir un nouveau token plus récent.
  Le corps doit contenir un objet de la forme:
  {
    token:<Token valide>
  }
  Le token donné doit être valide. Il est celui que le client souhaite remettre à jour.
*/
exports.refreshToken = async function (req, res) {
  try {
    if (!"token" in req.body || !objectUtils.isObjectString(req.body.token))
      return res.status(400).json("Bad Request");

    let payload = null;
    try {
      payload = await authUtils.authentifySessionToken(req.body.token);
    } catch (err) {}

    if (!payload) return res.status(401).json("Unauthorized");

    let newSession = await authUtils.generateUserIdSession(payload.userId);
    return res.status(200).json(newSession);
  } catch (err) {
    console.log(err);
    req.status(500).json("Internal Server Error");
  }
};

// POST /api/auth/token/authentify
/*
  Permet l'authentification d'un token ainsi que de ses droits d'accès à des médias.
*/
exports.authentifyToken = async function (req, res) {
  try {
    if (!"token" in req.body || !req.body.token) {
      return res.status(400).json("Bad Request");
    }

    let payload = null;

    try {
      payload = await authUtils.authentifySessionToken(req.body.token);
    } catch (tokenErr) {}

    let authData = { authentic: payload ? true : false };

    if (!payload) return res.status(200).json(authData);
    let user = payload
      ? payload.userId
        ? await userUtils.getUserFromId(payload.userId)
        : null
      : null;

    if (!user) return res.status(400).json("Bad Request");

    if (
      "mediaAuthorizations" in req.body &&
      req.body.mediaAuthorizations &&
      objectUtils.sanitizeMediaAuthorizationObject(req.body.mediaAuthorizations)
    ) {
      authData.mediaAuthorizations = [];
      let trimedMediaAuths = objectUtils.trimMediaAuthorizationObject(
        req.body.mediaAuthorizations
      );

      for (let mediaLink of trimedMediaAuths) {
        authData.mediaAuthorizations.push({
          mediaLink: mediaLink,
          authorization: await mediaUtils.checkUserMediaAccessByUserId(
            mediaLink,
            payload.userId
          ),
        });
      }
    }

    return res.status(200).json(authData);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//POST /api/auth/recpwd/send&:mode
/*
  Demande d'envoi de code en vue de la réinitialisation du mot de passe d'un compte.
  L'utilisateur ne doit envoyer aucun token.
  Dans le corp de la requête doit se trouver un objet de la forme:
  {
    nomUtilisateur|numeroTelephone|email|userId:<valeur>
  }
*/
exports.sendPasswordRecoveryKey = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    let md = "mode" in req.params ? parseInt(req.params.mode) : -1;
    if (
      !objectUtils.containsOnlyGivenArrayElementsAsProperties(req.body, [
        "nomUtilisateur",
        "numeroTelephone",
        "email",
        "id",
      ]) ||
      Object.keys(req.body).length != 1 ||
      !"mode" in req.params ||
      isNaN(md) ||
      (md != 0 && md != 1)
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    let identifier = req.body;
    let usr =
      "id" in identifier
        ? await userModel.model.findById(identifier.id)
        : await userModel.model.findOne(identifier).exec();
    if (usr == null) return res.status(200).json("OK");
    if ((!"email" in usr && md == 0) || (!"numeroTelephone" in usr && md == 1))
      return res.status(200).json("OK");

    //Vérification en cas de requêtes trop fréquentes.
    let currentTime = new Date();
    if ("derniereDateDRM" in usr) {
      if (
        (currentTime - usr.derniereDateDRM) / 1000 <
        parseInt(process.env.PASSWORD_RESET_REQUEST_RETRY_TIME_SECONDS)
      )
        return res.status(429).json("Too Many Requests");
    }

    //Execution.
    usr.derniereDateDRM = currentTime;
    usr.derniereAdresseIPDRM = req.ip;
    if (md == 0) {
      let newKey = pwdRecUtils.generateEmailKey();
      usr.derniereCleeDRM = newKey;
      pwdRecUtils.sendEmailKey(newKey, usr._id.toString(), usr.email);
    } else {
      let newKey = pwdRecUtils.generateSMSKey();
      usr.derniereCleeDRM = newKey;
      pwdRecUtils.sendSMSKey(newKey, usr.numeroTelephone);
    }

    await usr.save();

    return res.status(200).json("OK");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//POST /api/auth/recpwd/entry&:identifierType&:identifier&:key
/*
  Réinitialisation de mot de passe à l'aide d'une clé. Si la réponse est favorable, la couche interface doit l'afficher, et un code de réinitialisation de mot de
  passe doit être envoyé à l'utilisateur. Il doit être valable 10 minutes.
*/
exports.authentifyPasswordRecoveryKey = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    let identifierType = parseInt(req.params.identifierType);
    if (
      isNaN(identifierType) ||
      identifierType < 0 ||
      identifierType > 3 ||
      !"key" in req.params ||
      !objectUtils.isObjectString(req.params.key) ||
      !"identifier" in req.params ||
      !objectUtils.isObjectValidStringId(req.params.identifier)
    )
      return res.status(400).json("Bad Request");

    let currentTime = new Date();

    //Validation des valeurs reçues.
    let idObj = {};
    idObj[
      ["nomUtilisateur", "numeroTelephone", "email", "id"][identifierType]
    ] = req.params.identifier;
    let usr =
      identifierType === 3
        ? await userModel.model.findById(req.params.identifier)
        : await userModel.model.find(idObj);

    if (
      !usr ||
      !"derniereDateDRM" in usr ||
      (currentTime - usr.derniereDateDRM) / 1000 >
        parseInt(process.env.PASSWORD_RECOVERY_KEY_TIMEOUT_SECONDS) ||
      !"derniereAdresseIPDRM" in usr ||
      usr.derniereAdresseIPDRM != req.ip ||
      !"derniereCleeDRM" in usr ||
      !bcrypt.compareSync(req.params.key, usr.derniereCleeDRM)
    )
      return res.status(401).json("Unauthorized");

    //Execution.

    let code = pwdRecUtils.generatePwdReinitCode();

    delete usr.derniereDateDRM;
    delete usr.derniereAdresseIPDRM;
    delete usr.derniereCleeDRM;

    usr.codeRM = code;
    usr.codeRMDate = currentTime;
    await usr.save();

    return res.status(200).json(code);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//POST /api/auth/recpwd/reinit/:identifierType&:identifier&:code
/*
  Permet de réinitialiser le mot de passe d'un compte.
  Le corps doit contenir un objet de la forme:
  {
    newPassword:<mot de passe>
  }
*/
exports.reinitPassword = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    let identifierType = parseInt(req.params.identifierType);
    if (
      isNaN(identifierType) ||
      identifierType < 0 ||
      identifierType > 3 ||
      !"identifier" in req.params ||
      !"code" in req.params ||
      !"newPassword" in req.body ||
      !objectUtils.isObjectString(req.body.newPassword)
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    let idObj = {};
    idObj[
      ["nomUtilisateur", "numeroTelephone", "email", "id"][identifierType]
    ] = req.params.identifier;
    let usr =
      identifierType === 3
        ? await userModel.model.findById(req.params.identifier)
        : await userModel.model.find(idObj);
    let currentDate = new Date();
    if (
      !usr ||
      !"codeRM" in usr ||
      !bcrypt.compareSync(req.params.code, usr.codeRM) ||
      !"codeRMDate" in usr ||
      (currentDate - usr.codeRMDate) / 1000 >
        parseInt(process.env.PASSWORD_REINIT_CODE_TIMEOUT_SECONDS ?? 600)
    )
      return res.status(401).json("Unauthorized");

    //Execution.
    delete usr.codeRM;
    delete usr.codeRMDate;

    usr.motDePasse = req.body.newPassword;
    await usr.save();

    return res.status(200).json("OK");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};
