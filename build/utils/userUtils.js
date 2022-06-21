"use strict";
/*
  Utilitaire pour les utilisateurs.
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
//Utilitaires.
const objectUtils = require("./objectUtils");
const postUtils = require("./postUtils");
const followUtils = require("./followUtils");
const mediaUtils = require("./mediaUtils");
//Modèles.
const userModel = require("./../models/utilisateurModel");
const userParamsModel = require("./../models/paramsUtilisateurModel");
const { default: mongoose } = require("mongoose");
exports.addUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (user == undefined ||
        !objectUtils.sanitizeObject(userModel.userInsertionDataForm, user))
        throw "L'objet envoyé ne représente pas un utilisateur.";
    //TODO: Sanitation/Validation des informations envoyées.
    let newUser = yield userModel.model.create(Object.assign({ valide: false, administrateur: false }, user));
    let newUserParams = userParamsModel.create({
        utilisateur: newUser._id,
        profilPublic: true,
    });
    return { user: newUser, params: newUserParams };
});
exports.getUserFromId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(id))
        throw "L'identifiant envoyé est incorrect.";
    if (!(yield userModel.model.exists({ _id: id })))
        throw "L'utilisateur n'existe pas.";
    let user = yield userModel.model.findOne({ _id: id });
    return user;
});
exports.getUserParamsFromUserId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(id))
        throw "L'identifiant envoyé est incorrect.";
    if (!(yield userParamsModel.exists({ utilisateur: id })))
        throw "Les paramètres n'existent pas.";
    let params = yield userParamsModel.findOne({ utilisateur: id });
    return params;
});
exports.getUserAndUserParamsFromUserId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        user: yield this.getUserFromId(id),
        params: yield this.getUserParamsFromUserId(id),
    };
});
exports.isUserIdAdmin = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield userModel.model.exists({ _id: id })))
        throw "L'utilisateur n'existe pas.";
    let user = yield userModel.model.findById(id);
    return "administrateur" in user ? user.administrateur : false;
});
//TODO: Supprimer toutes les informations annexes en cascade.
exports.doesUserIdExist = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(id))
        throw "L'identifiant envoyé est incorrect.";
    return yield userModel.model.exists({ _id: id });
});
exports.deleteUserFromId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!id ||
        !(typeof id == "string" || id instanceof String) ||
        !(yield userModel.model.exists({ _id: id })))
        throw "L'identifiant envoyé est incorrect.";
    //Suppression de tous les posts en asynchrone.
    postUtils.removePostsFromUserId(id);
    //Supression des médias liés aux paramètres.
    let params = yield this.getUserParamsFromUserId(id);
    let paramMedias = [];
    if ("photoProfil" in params)
        paramMedias.push(params.photoProfil);
    if ("banniereProfil" in params)
        paramMedias.push(params.banniereProfil);
    yield mediaUtils.removeMediasByIds(...paramMedias);
    //Suppresion des paramètres.
    yield userParamsModel.findByIdAndDelete(params._id);
    //Suppresion de l'utilisateur.
    yield userModel.model.deleteOne({ _id: id });
});
exports.deleteUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.containsUniqueUserData(user))
        throw "L'objet envoyé ne représente pas un utilisateur.";
    if (!"_id" in user)
        throw "L'objet envoyé ne contient pas d'identifiant.";
    yield this.deleteUserFromId(user._id.toString());
});
exports.doesUserIdHaveAccessToUserIdDomain = (userId, domainUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(userId) ||
        !objectUtils.isObjectValidStringId(domainUserId))
        throw "Arguments invalides.";
    let userIsAdmin = yield this.isUserIdAdmin(userId);
    let domainUser = yield this.getUserParamsFromUserId(domainUserId);
    let publicDomain = "profilPublic" in domainUser ? domainUser.profilPublic : true;
    if (!publicDomain) {
        if (!userIsAdmin &&
            !(yield followUtils.userIdFollows(userId, domainUserId)) &&
            userId != domainUserId)
            return false;
    }
    return true;
});
