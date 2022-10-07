/*
  Utilitaire pour l'authentification.
*/

//Librairies.

const JWT = require("jsonwebtoken");
const axios = require("axios");

//Utilitaires.

const objectUtils = require("./objectUtils");

//Modèles.

const userModel = require("../models/utilisateurModel");

exports.generateUserSession = async (
  user,
  config,
  additionalPayloadData = {}
) => {
  if (
    !objectUtils.containsUniqueUserData(user) ||
    !(await userModel.model.findOne(objectUtils.getUniqueUserData(user)))
  )
    throw "L'objet envoyé ne représente pas un utilisateur.";

  let payload = {
    userId: user._id,
    valid: user.valide ?? true,
    admin: user.administrateur,
    ...additionalPayloadData,
  };

  let defaultTime = process.env.DEFAULT_TOKEN_EXPIRATION_TIME ?? "1d";
  let rememberTime = process.env.REMEMBER_ME_TOKEN_EXPIRATION_TIME ?? "7d";

  let tokenGenerationConfig = {
    expiresIn: config
      ? config.rememberMe
        ? rememberTime
        : defaultTime
      : defaultTime,
  };

  let token = JWT.sign(payload, process.env.PRIVATE_KEY, tokenGenerationConfig);
  return { token: token, admin: user.administrateur, userId: user._id };
};

exports.generateUserIdSession = async (id, config) => {
  let user = await userModel.model.findOne({ _id: id });
  if (!user) throw "L'identifiant envoyé est incorrect.";

  return await this.generateUserSession(user, config);
};

exports.authentifySessionToken = async (token) => {
  let payload = JWT.verify(token, process.env.PRIVATE_KEY);
  payload = { token: token, ...payload };
  return payload;
};

exports.isTokenAccountValid = async (token) => {
  let payload = await this.authentifySessionToken(token);
  let user = await userModel.model.findOne({ _id: payload.userId });
  return user && "valide" in user && user.valide == true;
};

exports.checkCaptcha = async (captcha) => {
  try {
    let res = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      new URLSearchParams({
        secret: process.env.CAPTCHA_SECRET_KEY,
        response: captcha,
      })
    );
    return res.data.success;
  } catch (err) {
    return false;
  }
};
