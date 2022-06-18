//Utilitaires

const authUtils = require("./../utils/authUtils");
const objectUtils = require("./../utils/objectUtils");
const userUtils = require("./../utils/userUtils");
const mediaUtils = require("./../utils/mediaUtils");
const pwdRecUtils = require("./../utils/pwdRecoveryUtils");

//Modèles.

const userModel = require("./../models/utilisateurModel");

//API

// POST /api/auth/token/authentify
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
        ? userUtils.getUserFromId(payload.userId)
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
  Demande d'envoi de code en vu de la réinitialisation du mot de passe d'un compte.
  L'utilisateur ne doit envoyer aucun token.
  Dans le corp de la requête doit se trouver un objet de la forme:
  {
    nomUtilisateur|numeroTelephone|email:<valeur>
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
      ]) ||
      Object.keys(req.body).length != 1 ||
      !"mode" in req.params ||
      isNaN(md) ||
      (md != 0 && md != 1)
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    let identifier = req.body;
    let usr = await userModel.model.findOne(identifier).exec();
    if (usr == null) return res.status(200).json("OK");
    if ((!"email" in usr && md == 0) || (!"numeroTelephone" in usr && md == 1))
      return res.status(200).json("OK");

    //Vérification en cas de requêtes trop fréquentes.
    let currentTime = new Date();
    if ("derniereDateDMR" in usr) {
      if (
        (currentTime - usr.derniereDateDMR) / 1000 >
        parseInt(process.env.PASSWORD_RESET_REQUEST_RETRY_TIME_SECONDS)
      )
        return res.status(429).json("Too Many Requests");
    }

    //Execution.
    usr.derniereDateDMR = currentTime;
    usr.derniereAdresseIPDMR = req.ip;
    if (md == 0) {
      let newKey = pwdRecUtils.generateEmailKey();
      usr.derniereCleeDMR = newKey;
      pwdRecUtils.sendEmailKey(newKey, usr.email);
    } else {
      let newKey = pwdRecUtils.generateSMSKey();
      usr.derniereCleeDMR = newKey;
      pwdRecUtils.sendSMSKey(newKey, usr.numeroTelephone);
    }

    await usr.save();

    return res.status(200).json("OK");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};

//POST /api/auth/recpwd/entry?:userId&:key
/*
  Demande d'authentification d'une clé de réinitialisation de mot de passe. Si la réponse est favorable, la couche interface doit l'afficher.
*/
exports.authentifyPasswordRecoveryKey = async function (req, res) {
  try {
    //Sanitation des valeurs reçues.
    if (
      !"key" in req.params ||
      !objectUtils.isObjectString(req.params.key) ||
      !"userId" in req.params ||
      !objectUtils.isObjectValidStringId(req.params.userId)
    )
      return res.status(400).json("Bad Request");

    //Validation des valeurs reçues.
    let usr = await userModel.model.findById(req.params.userId);
    if (!usr) return res.status(404).json("OK");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Internal Server Error");
  }
};
