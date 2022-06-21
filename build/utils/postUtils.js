"use strict";
/*
  Utilitaire pour ce qui concerne les posts.
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
const mediaUtils = require("./mediaUtils");
const userUtils = require("./userUtils");
const avisUtils = require("./avisUtils");
//Modèles.
const userModel = require("./../models/utilisateurModel");
const postModel = require("../models/postModel");
exports.createPost = function (authorUserId, postContent, targetPostId = null, mediaIds = null) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!objectUtils.isObjectString(postContent) ||
            !objectUtils.isObjectValidStringId(authorUserId) ||
            (targetPostId != null &&
                !objectUtils.isObjectValidStringId(targetPostId)) ||
            (mediaIds != null && !Array.isArray(mediaIds)) ||
            (targetPostId != null &&
                !(yield postModel.exists({ _id: targetPostId }))) ||
            !(yield userModel.model.exists({ _id: authorUserId })))
            throw "Argument(s) invalide(s).";
        let postData = {
            auteur: authorUserId,
            contenu: postContent,
        };
        if (targetPostId)
            postData.postCible = targetPostId;
        if (mediaIds)
            postData.medias = objectUtils.trimArray(mediaIds, (_a = process.env.MAX_MEDIAS_PER_POST) !== null && _a !== void 0 ? _a : 4);
        let newPost = yield postModel.create(postData);
        return newPost;
    });
};
exports.removePost = function (postId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!(postId instanceof String || typeof postId == "string"))
                throw "Argument invalide.";
            let post = yield postModel.findOne({ _id: postId });
            if (!post)
                throw "Le post n'existe pas.";
            let mediaIds = "medias" in post ? post.medias : [];
            if (mediaIds.length != 0)
                yield mediaUtils.removeMediasByIds(mediaIds);
            yield postModel.findOneAndRemove({ _id: postId });
        }
        catch (err) {
            console.log(err);
            return false;
        }
        return true;
    });
};
exports.removePostsFromUserId = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(userId instanceof String || typeof userId == "string"))
            throw "Argument invalide.";
        if (!(yield userModel.model.exists({ _id: userId })))
            throw "L'utilisateur n'existe pas.";
        let posts = yield postModel.find({ auteur: userId }).exec();
        for (let el of posts)
            this.removePost(el._id.toString());
    });
};
exports.getPostsFromUser = function (userId, amount, timestamp = null, customFilter = {}) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        if (!(userId instanceof String || typeof userId == "string") ||
            parseInt(amount) <= 0)
            throw "Arguments invalides.";
        if (timestamp == null)
            return yield postModel
                .find(Object.assign({ auteur: userId }, customFilter))
                .sort({ createdAt: -1 })
                .limit(Math.min(amount, parseInt((_a = process.env.POSTS_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _a !== void 0 ? _a : 20)))
                .exec();
        else
            return yield postModel
                .find(Object.assign({ auteur: userId, createdAt: { $lte: timestamp } }, customFilter))
                .sort({ createdAt: -1 })
                .limit(Math.min(amount, parseInt((_b = process.env.POSTS_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _b !== void 0 ? _b : 20)))
                .exec();
    });
};
exports.doesPostWithIdExist = (postId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(postId))
        throw "Argument invalide.";
    return yield postModel.exists({ _id: postId });
});
exports.getPostFromId = (postId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield postModel.findById(postId).lean();
});
/*Récupère les informations annexes d'un post, c'est à dire:
  - Le nombre de likes
  - Le nombre de dislikes
  - Le nombre de réponses
  - Les informations sommaires du profil de l'auteur
*/
exports.getPostSecondaryData = (postId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(postId))
        throw "Argument invalide.";
    if (!(yield postModel.exists({ _id: postId })))
        throw "Le post ciblé par l'identifiant donné n'existe pas.";
    let posterProfile = yield userUtils.getUserAndUserParamsFromUserId((yield this.getPostFromId(postId.toString())).auteur.toString());
    return Object.assign(Object.assign({}, (yield avisUtils.getPostAvis(postId))), { auteur: yield objectUtils.getUserSummaryProfileData(posterProfile.user, posterProfile.params), reponse: yield postModel.count({ postCible: postId }) });
});
/*
  Récupère l'utilisateur (et ses paramètres) du profil sur lequel le post se trouve.
  La règle qui régis la méthode est la suivante:
  - Si un post ne répond à aucun autre post, alors il se trouve sur le profil de son auteur.
  - Si un post répond à un autre post, alors il se trouve sur le profil de l'auteur du post hierarchiquement le plus en haut
    (c'est à dire celui qui n'est lui même la réponse à aucun post) sur la file de réponses.
*/
exports.getPostProfileDomain = (postId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(postId))
        throw "Argument invalide.";
    if (!(yield postModel.exists({ _id: postId })))
        throw "Le post ciblé par l'identifiant donné n'existe pas.";
    let post = yield this.getPostFromId(postId);
    let indexPost = post;
    while ("postCible" in indexPost &&
        indexPost.postCible &&
        (yield postModel.exists({ _id: indexPost.postCible })))
        indexPost = yield this.getPostFromId(indexPost.postCible.toString());
    let auteurDomaine = indexPost.auteur.toString();
    return yield userUtils.getUserAndUserParamsFromUserId(auteurDomaine);
});
exports.updatePost = (postId, contenu) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(postId))
        throw "Argument invalide.";
    if (!(yield postModel.exists({ _id: postId })))
        throw "Le post ciblé par l'identifiant donné n'existe pas.";
    let post = yield postModel.findByIdAndUpdate(postId, { contenu: contenu }, { new: true });
    console.log(post);
    return post;
});
/*
  Récupères une liste de réponses à un post.
    - postId: l'identifiant du post conçerné
    - amount: le nombre de réponses maximal à récuperer
    - timestamp: un instant précis. toute réponse datante de cet instant ou avant seront récupérées
*/
exports.getPostResponses = (postId, amount = 1, timestamp = null) => __awaiter(void 0, void 0, void 0, function* () {
    //Sanitation des variables.
    amount = parseInt(amount);
    if (!objectUtils.isObjectValidStringId(postId) ||
        isNaN(amount) ||
        amount <= 0 ||
        (timestamp != null && !objectUtils.isStringTimestamp(timestamp)))
        throw "Arguments invalides.";
    let optionalTimestampFilter = timestamp
        ? { createdAt: { $lte: timestamp } }
        : {};
    let result = yield postModel
        .find(Object.assign({ postCible: postId }, optionalTimestampFilter))
        .sort({ createdAt: -1 })
        .limit(amount)
        .exec();
    return result;
});
