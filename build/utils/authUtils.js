"use strict";
/*
  Utilitaire pour l'authentification.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//Librairies.
const JWT = require("jsonwebtoken");
//Utilitaires.
const objectUtils = require("./objectUtils");
//Modèles.
const userModel = require("../models/utilisateurModel");
exports.generateUserSession = (user, config, additionalPayloadData = {}) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!objectUtils.containsUniqueUserData(user) ||
        !(yield userModel.model.findOne(objectUtils.getUniqueUserData(user))))
        throw "L'objet envoyé ne représente pas un utilisateur.";
    let payload = Object.assign({ userId: user._id, valid: (_a = user.valide) !== null && _a !== void 0 ? _a : true, admin: user.administrateur }, additionalPayloadData);
    let defaultTime = (_b = process.env.DEFAULT_TOKEN_EXPIRATION_TIME) !== null && _b !== void 0 ? _b : "1d";
    let rememberTime = (_c = process.env.REMEMBER_ME_TOKEN_EXPIRATION_TIME) !== null && _c !== void 0 ? _c : "7d";
    let tokenGenerationConfig = {
        expiresIn: config
            ? config.rememberMe
                ? rememberTime
                : defaultTime
            : defaultTime,
    };
    let token = JWT.sign(payload, process.env.PRIVATE_KEY, tokenGenerationConfig);
    return { token: token, admin: user.administrateur, userId: user._id };
});
exports.generateUserIdSession = (id, config) => __awaiter(void 0, void 0, void 0, function* () {
    let user = yield userModel.model.findOne({ _id: id });
    if (!user)
        throw "L'identifiant envoyé est incorrect.";
    return yield this.generateUserSession(user, config);
});
exports.authentifySessionToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    let payload = JWT.verify(token, process.env.PRIVATE_KEY);
    payload = Object.assign({ token: token }, payload);
    return payload;
});
exports.isTokenAccountValid = (token) => __awaiter(void 0, void 0, void 0, function* () {
    let payload = yield this.authentifySessionToken(token);
    let user = yield userModel.model.findOne({ _id: payload.userId });
    return user && "valide" in user && user.valide == true;
});
