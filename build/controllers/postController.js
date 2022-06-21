"use strict";
//Librairies
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const mimetypes = require("mime-types");
// Utilitaires
const postUtils = require("./../utils/postUtils");
const avisUtils = require("./../utils/avisUtils");
const objectUtils = require("./../utils/objectUtils");
const mediaUtils = require("./../utils/mediaUtils");
const userUtils = require("./../utils/userUtils");
const fileUtils = require("./../utils/fileUtils");
const followUtils = require("./../utils/followUtils");
const { default: mongoose } = require("mongoose");
const { v1: uuidv1, v4: uuidv4 } = require("uuid");
//API
// GET /api/posts/get/:postId
/*
  Permet l'obtention d'un post. Refus si le profil du domaine auquel le post appartient est privé et que l'utilisateur n'y a pas accès.
*/
exports.getPost = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!"postId" in req.params ||
                !req.params.postId ||
                !objectUtils.isObjectValidStringId(req.params.postId))
                return res.status(400).json("Bad Request");
            if (!(yield postUtils.doesPostWithIdExist(req.params.postId)))
                return res.status(404).json("Not Found");
            let post = yield postUtils.getPostFromId(req.params.postId);
            let domain = yield postUtils.getPostProfileDomain(post._id.toString());
            if ("profilPublic" in domain.params && !domain.params.profilPublic) {
                let token = req.headers.authorization.replace("Bearer ", "");
                let payload = yield authUtils.authentifySessionToken(token);
                if (!payload || !"userId" in payload)
                    return res.status(401).json("Unauthorized");
                if (!(yield userUtils.isUserIdAdmin(payload.userId)) &&
                    payload.userId != domain.user._id.toString() &&
                    !(yield followUtils.userIdFollows(payload.userId, user._id.toString())))
                    return res.status(403).json("Forbidden");
            }
            return res.status(200).json(Object.assign(Object.assign(Object.assign({}, post), (yield postUtils.getPostSecondaryData(post._id.toString()))), { medias: yield mediaUtils.getMediaLinkArrayFromMediaIdArray(post.medias) }));
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
// POST /api/posts/create
/*
    Publie un post. Le client doit envoyer un token authentique, appartenant à un compte valide.
    La requête reçue doit contenir en son corps un objet de la forme:

    {
        contenu: <Le contenu>
        reponse: <Id du post auquel on répond> (facultatif)
    }

    C'est à dire que la requête form-data doit envoyer le champ contenu et facultativement le champ reponse (avec les champs 'medias')

    Si le post répond à un autre post, le domaine du post auquel le client répond doit lui être accessible, sinon refus.
    Aussi, la requête peut contenir des médias.
*/
exports.createPost = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!"contenu" in req.body || !req.body.contenu)
                return res.status(400).json("Bad Request");
            if ("files" in req)
                for (let f of req.files) {
                    if (!fileUtils.validateFile(f.size, f.mimetype))
                        return res.status(400).json("Bad Request");
                }
            let postCible = null;
            let tokenPayload = req.tokenPayload;
            if ("reponse" in req.body && req.body.reponse) {
                if (!objectUtils.isObjectValidStringId(req.body.reponse) ||
                    !(yield postUtils.doesPostWithIdExist(req.body.reponse)))
                    return res.status(404).json("Not Found");
                let domain = yield postUtils.getPostProfileDomain(req.body.reponse);
                if ("profilPublic" in domain.params &&
                    !domain.params.profilPublic &&
                    !(tokenPayload.userId == domain.user._id.toString() ||
                        !(yield userUtils.isUserIdAdmin(tokenPayload.userId)) ||
                        !followUtils.userIdFollows(tokenPayload.userId, domain.user._id.toString())))
                    return res.status(403).json("Forbidden");
            }
            let targetPostId = "reponse" in req.body
                ? req.body.reponse
                    ? req.body.reponse
                    : null
                : null;
            if (targetPostId && !objectUtils.isObjectValidStringId(targetPostId))
                return res.status(400).json("Bad Request");
            let resultMedias = [];
            if ("files" in req)
                for (let f of req.files) {
                    let newMedia = yield mediaUtils.createMedia(`public/${uuidv1()}.${mimetypes.extension(f.mimetype)}`, f.buffer, tokenPayload.userId);
                    if (newMedia != null)
                        resultMedias.push(newMedia);
                }
            let post = yield postUtils.createPost(tokenPayload.userId, req.body.contenu, targetPostId, resultMedias);
            resultMedias = resultMedias.map((el) => el.lien);
            let secondaryPostData = yield postUtils.getPostSecondaryData(post._id.toString());
            return res
                .status(201)
                .json(Object.assign(Object.assign(Object.assign({}, post._doc), secondaryPostData), { medias: resultMedias }));
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
//PATCH /api/posts/update/:postId
/*
  Met à jour un post. C'est à dire, son contenu.
  Un token authentique appartenant à un compte valide doit être envoyé par le client.
*/
exports.editPost = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!"postId" in req.params ||
                !req.params.postId ||
                !objectUtils.isObjectValidStringId(req.params.postId) ||
                !objectUtils.containsOnlyGivenArrayElementsAsProperties(req.body, [
                    "contenu",
                ]) ||
                !"contenu" in req.body ||
                !objectUtils.isObjectString(req.body.contenu))
                return res.status(400).json("Bad Request");
            if (!(yield postUtils.doesPostWithIdExist(req.params.postId)))
                return res.status(404).json("Not Found");
            let post = yield postUtils.getPostFromId(req.params.postId);
            let userId = req.tokenPayload.userId;
            if (post.auteur.toString() != userId)
                return res.status(403).json("Forbidden");
            let newPost = yield postUtils.updatePost(req.params.postId, req.body.contenu);
            return res.status(200).json(Object.assign(Object.assign(Object.assign({}, newPost._doc), (yield postUtils.getPostSecondaryData(req.params.postId))), { medias: yield mediaUtils.getMediaLinkArrayFromMediaIdArray(newPost.medias) }));
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
//DELETE /api/posts/delete/:postId
/*
  Supprime un post. Seul l'auteur ou un administrateur doit pouvoir le faire.
*/
exports.deletePost = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!"postId" in req.params ||
                !req.params.postId ||
                !objectUtils.isObjectValidStringId(req.params.postId))
                return res.status(400).json("Bad Request");
            if (!(yield postUtils.doesPostWithIdExist(req.params.postId)))
                return res.status(404).json("Not Found");
            let post = yield postUtils.getPostFromId(req.params.postId);
            let userId = req.tokenPayload.userId;
            if (post.auteur.toString() != userId &&
                !(yield userUtils.isUserIdAdmin(userId)))
                return res.status(403).json("Forbidden");
            postUtils.removePost(req.params.postId);
            return res.status(204).json("No Content");
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
//GET /api/posts/responses/:postId&:amount
exports.getPostResponses = function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des informations reçues.
            let amnt = parseInt(req.params.amount);
            if (!objectUtils.isObjectValidStringId(req.params.postId) ||
                isNaN(amnt) ||
                amnt <= 0 ||
                amnt >
                    parseInt((_a = process.env.POST_RESPONSES_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _a !== void 0 ? _a : 10))
                return res.status(400).json("Bad Request");
            //Vérification de la validité des informations reçues.
            if (!(yield postUtils.doesPostWithIdExist(req.params.postId)))
                return res.status(404).json("Not Found");
            //Vérification des droits d'accès.
            let post = yield postUtils.getPostFromId(req.params.postId);
            let domain = yield postUtils.getPostProfileDomain(req.params.postId);
            let tokenPayload = req.tokenPayload;
            if (!userUtils.doesUserIdHaveAccessToUserIdDomain(tokenPayload.userId, domain.user._id.toString()))
                return res.status(403).json("Forbidden");
            //Execution.
            let resps = yield postUtils.getPostResponses(req.params.postId, amnt);
            let results = [];
            for (let el of resps) {
                results.push(Object.assign(Object.assign(Object.assign({}, el._doc), (yield postUtils.getPostSecondaryData(el._id.toString()))), { medias: yield mediaUtils.getMediaLinkArrayFromMediaIdArray(el.medias) }));
            }
            return res.status(200).json(results);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
//GET /api/posts/responses/:postId&:amount&:timestamp
exports.getPostResponsesWithTimestamp = function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des informations reçues.
            let amnt = parseInt(req.params.amount);
            if (!objectUtils.isObjectValidStringId(req.params.postId) ||
                isNaN(amnt) ||
                amnt <= 0 ||
                amnt >
                    parseInt((_a = process.env.POST_RESPONSES_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _a !== void 0 ? _a : 10) ||
                !objectUtils.isStringTimestamp(req.params.timestamp))
                return res.status(400).json("Bad Request");
            //Vérification de la validité des informations reçues.
            if (!(yield postUtils.doesPostWithIdExist(req.params.postId)))
                return res.status(404).json("Not Found");
            //Vérification des droits d'accès.
            let post = yield postUtils.getPostFromId(req.params.postId);
            let domain = yield postUtils.getPostProfileDomain(req.params.postId);
            let tokenPayload = req.tokenPayload;
            if (!userUtils.doesUserIdHaveAccessToUserIdDomain(tokenPayload.userId, domain.user._id.toString()))
                return res.status(403).json("Forbidden");
            //Execution.
            let resps = yield postUtils.getPostResponses(req.params.postId, amnt, req.params.timestamp);
            let results = [];
            for (let el of resps) {
                results.push(Object.assign(Object.assign(Object.assign({}, el._doc), (yield postUtils.getPostSecondaryData(el._id.toString()))), { medias: yield mediaUtils.getMediaLinkArrayFromMediaIdArray(el.medias) }));
            }
            return res.status(200).json(results);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
// POST /api/posts/activities/create/:postId&:nature
/*
  Crée une nouvelle activité.
  Un token authentique et valide doit être envoyé par le client.
  :postId est l'identifiant du post ciblé.
  :nature doit correspondre aux valeurs admissibles de la propriété correspondante sur la table.
*/
exports.postActivity = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des valeurs reçues.
            if (!req.params.postId ||
                !objectUtils.isObjectValidStringId(req.params.postId) ||
                !req.params.nature ||
                !avisUtils.getAdmissibleNatureValues().includes(req.params.nature))
                return res.status(400).json("Bad Request");
            //Récupérations des informations sur le client.
            let tokenPayload = req.tokenPayload;
            let clientUserId = tokenPayload.userId;
            //Validation des valeurs reçues.
            if (!(yield postUtils.doesPostWithIdExist(req.params.postId)) ||
                !(yield userUtils.doesUserIdExist(clientUserId)))
                return res.status(404).json("Not Found");
            //Validation des droits d'accès.
            let postAuthorUserId = (yield postUtils.getPostFromId(req.params.postId)).auteur.toString();
            if (!(yield userUtils.doesUserIdHaveAccessToUserIdDomain(clientUserId, postAuthorUserId)))
                return res.status(403).json("Forbidden");
            //Execution.
            avisUtils.createAvis(clientUserId, req.params.postId, req.params.nature);
            return res.status(201).json("Created");
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
// DELETE /api/posts/activities/delete/:postId
exports.deleteActivity = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Sanitation des valeurs reçues.
            if (!req.params.postId ||
                !objectUtils.isObjectValidStringId(req.params.postId))
                return res.status(400).json("Bad Request");
            //Récupérations des informations sur le client.
            let tokenPayload = req.tokenPayload;
            let clientUserId = tokenPayload.userId;
            //Validation des valeurs reçues.
            if (!(yield postUtils.doesPostWithIdExist(req.params.postId)) ||
                !(yield userUtils.doesUserIdExist(clientUserId)))
                return res.status(404).json("Not Found");
            //Validation des droits d'accès.
            let postAuthorUserId = (yield postUtils.getPostFromId(req.params.postId)).auteur.toString();
            if (!(yield userUtils.doesUserIdHaveAccessToUserIdDomain(clientUserId, postAuthorUserId)))
                return res.status(403).json("Forbidden");
            //Execution.
            //avisUtils.createAvis(clientUserId, req.params.postId, req.params.nature);
            avisUtils.removeAvisWithUserIdAndPostId(clientUserId, req.params.postId);
            return res.status(204).json("No Content");
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
