//Librairies.

const JWT = require("jsonwebtoken");

//Utilitaires.

const authUtils = require("./../utils/authUtils");
const userUtils = require("./../utils/userUtils");

const extractTokenAndPayload = async (req) => {
  if (!req.tokenPayload) {
    let token = req.headers.authorization.replace("Bearer ", "");
    req.tokenPayload = await authUtils.authentifySessionToken(token);
  }
};

exports.noToken = async function (req, res, next) {
  let token =
    "headers" in req
      ? req.headers
        ? "authorization" in req.headers
          ? req.headers.authorization
          : undefined
        : undefined
      : undefined;
  if (token) res.status(403).json("Forbidden");
  else next();
};

exports.checkTokenAuthenticity = async function (req, res, next) {
  try {
    await extractTokenAndPayload(req);
    next();
  } catch (err) {
    res.status(401).json("Invalid Token");
  }
};

exports.checkTokenAccountValidity = async function (req, res, next) {
  try {
    await extractTokenAndPayload(req);
    let user = await userUtils.getUserFromId(req.tokenPayload.userId);
    if (user && "valide" in user && user.valide == true) next();
    else res.status(403).json("Invalid Token Account");
  } catch (err) {
    res.status(401).json("Invalid Token");
  }
};

exports.checkTokenAccountInvalidity = async function (req, res, next) {
  try {
    await extractTokenAndPayload(req);
    let user = await userUtils.getUserFromId(req.tokenPayload.userId);

    if ((user && "valide" in user && user.valide == true) || !user)
      res.status(403).json("Valid Token Account");
    else next();
  } catch (err) {
    res.status(401).json("Invalid Token");
  }
};
