//Utilitaires

const authUtils = require("./../utils/authUtils");
const objectUtils = require("./../utils/objectUtils");
const userUtils = require("./../utils/userUtils");
const mediaUtils = require("./../utils/mediaUtils");

//API

// POST /api/auth/token/authentify
exports.authentifyToken = async function (req, res) {
  try {
    console.log("Demande d'authentification de token reçue.");
    if (!"token" in req.body || !req.body.token) {
      console.log("Mauvaise requête !");
      return res.status(400).json("Bad Request");
    }

    let payload = null;

    try {
      payload = await authUtils.authentifyToken(req.body.token);
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
      sanitizeMediaAuthorizationObject(req.body.mediaAuthorizations)
    ) {
      authData.mediaAuthorizations = [];
      let trimedMediaAuths = objectUtils.trimMediaAuthorizationObject(
        req.body.mediaAuthorizations
      );

      for (let mediaLink of trimedMediaAuths) {
        authData.mediaAuthorizations.push({
          mediaLink: mediaLink,
          authorization: mediaUtils.checkUserMediaAccessByUserId(
            payload.userId
          ),
        });
      }
    }

    return res.status(200).json(authData);
  } catch (err) {
    res.status(500).json("Internal Server Error");
    console.log(err);
  }
};
