"use strict";
//Utilitaires
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const objectUtils = require("../utils/objectUtils");
const userUtils = require("../utils/userUtils");
const authUtils = require("../utils/authUtils");
const mediaUtils = require("../utils/mediaUtils");
const followUtils = require("../utils/followUtils");
const postUtils = require("../utils/postUtils");
const avisUtils = require("../utils/avisUtils");
//API
//GET /api/users/profiles/get/:id
/*
  Récupères les informations sommaires du profil d'un utilisateur.
  La photo de profil, le nom d'utilisateur/nom public, la photo de bannière, la description du profil, ainsi que
  sa visibilité.
*/
exports.getProfile = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let user = "id" in req.params
                ? req.params.id
                    ? yield userUtils.getUserFromId(req.params.id)
                    : null
                : null;
            let userParams = "id" in req.params
                ? req.params.id
                    ? yield userUtils.getUserParamsFromUserId(req.params.id)
                    : null
                : null;
            if (!"id" in req.params || !req.params.id || !user || !userParams)
                return res.status(400).json("Bad Request");
            let profileData = yield objectUtils.getUserSummaryProfileData(user, userParams);
            return res.status(200).json(profileData);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
//GET /api/profiles/posts/:userId&:nature&:amount
/*
  Récupères une liste de postes d'un utilisateur.
  Si le profil est privé, un token authentique doit être reçu qui appartient soit à ce même profil, soit à un administrateur, soit à une personne qui suit le profil.
  Si toutes ces conditions ne sont pas satisfaites, renvoi du code 403 Forbidden.

  La variable :nature doit correspondre à trois états:
  - 0 : Tout post.
  - 1 : Tout post contenant des médias.
  - 2 : Tout post qui est une réponse à un autre post.
*/
exports.getProfilePosts = function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let amnt = parseInt(req.params.amount);
            if (!["0", "1", "2"].includes(req.params.nature) ||
                isNaN(amnt) ||
                amnt > parseInt((_a = process.env.POSTS_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _a !== void 0 ? _a : 20) ||
                amnt <= 0)
                return res.status(400).json("Bad Request");
            let user = yield userUtils.getUserFromId(req.params.userId);
            let userParams = yield userUtils.getUserParamsFromUserId(req.params.userId);
            if (!user || !userParams)
                return res.status(404).json("Not Found");
            let public = "profilPublic" in userParams ? userParams.profilPublic : true;
            if (!public) {
                if (!"headers" in req ||
                    !req.headers ||
                    !"authorization" in req.headers ||
                    !req.headers.authorization)
                    return res.status(401).json("Unauthorized");
                let token = req.headers.authorization.replace("Bearer ", "");
                let payload = yield authUtils.authentifySessionToken(token);
                if (!payload || !"userId" in payload)
                    return res.status(401).json("Unauthorized");
                if (!(yield userUtils.isUserIdAdmin(payload.userId)) &&
                    payload.userId != user._id.toString() &&
                    !(yield followUtils.userIdFollows(payload.userId, user._id.toString())))
                    return res.status(403).json("Forbidden");
            }
            let posts = null;
            switch (req.params.nature) {
                case "0":
                    posts = yield postUtils.getPostsFromUser(user._id.toString(), parseInt(req.params.amount));
                    break;
                case "1":
                    posts = yield postUtils.getPostsFromUser(user._id.toString(), parseInt(req.params.amount), null, {
                        "medias.0": { $exists: true },
                    });
                    break;
                case "2":
                    posts = yield postUtils.getPostsFromUser(user._id.toString(), parseInt(req.params.amount), null, {
                        postCible: { $exists: true, $ne: null },
                    });
                    break;
            }
            posts = yield Promise.all(posts.map((post) => __awaiter(this, void 0, void 0, function* () {
                return Object.assign(Object.assign(Object.assign({}, post._doc), (yield postUtils.getPostSecondaryData(post._id.toString()))), { medias: yield Promise.all(post._doc.medias.map((mediaId) => __awaiter(this, void 0, void 0, function* () {
                        return (yield mediaUtils.getMedia(mediaId.toString())).lien;
                    }))) });
            })));
            return res.status(200).json(posts);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
//GET /api/profiles/posts/:userId&:nature&:timestamp&:amount
/*
  Récupères une liste de postes d'un utilisateur.
  Si le profil est public, un token authentique doit être reçu qui appartient soit à ce même profil, soit à un administrateur, soit à une personne qui suit le profil.
  Ici, le paramètre timestamp désigne un instant précis. Tout post créé à cet instant ou avant doit être envoyé dans la réponse.
*/
exports.getProfilePostsWithTimestamp = function (req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let amnt = parseInt(req.params.amount);
            if (!["0", "1", "2"].includes(req.params.nature) ||
                isNaN(amnt) ||
                amnt > parseInt((_a = process.env.POSTS_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _a !== void 0 ? _a : 20) ||
                amnt <= 0 ||
                !objectUtils.isStringTimestamp(req.params.timestamp))
                return res.status(400).json("Bad Request");
            let timestamp = req.params.timestamp;
            let user = yield userUtils.getUserFromId(req.params.userId);
            let userParams = yield userUtils.getUserParamsFromUserId(req.params.userId);
            if (!user || !userParams)
                return res.status(404).json("Not Found");
            let public = "profilPublic" in userParams ? userParams.profilPublic : true;
            if (!public) {
                if (!"headers" in req ||
                    !req.headers ||
                    !"authorization" in req.headers ||
                    !req.headers.authorization)
                    return res.status(401).json("Unauthorized");
                let token = req.headers.authorization.replace("Bearer ", "");
                let payload = yield authUtils.authentifySessionToken(token);
                if (!payload || !"userId" in payload)
                    return res.status(401).json("Unauthorized");
                if (!(yield userUtils.isUserIdAdmin(payload.userId)) &&
                    payload.userId != user._id.toString() &&
                    !(yield followUtils.userIdFollows(payload.userId, user._id.toString())))
                    return res.status(403).json("Forbidden");
            }
            let posts = null;
            switch (req.params.nature) {
                case "0":
                    posts = yield postUtils.getPostsFromUser(user._id.toString(), parseInt(req.params.amount), timestamp);
                    break;
                case "1":
                    posts = yield postUtils.getPostsFromUser(user._id.toString(), parseInt(req.params.amount), timestamp, {
                        "medias.0": { $exists: true },
                    });
                    break;
                case "2":
                    posts = yield postUtils.getPostsFromUser(user._id.toString(), parseInt(req.params.amount), timestamp, {
                        postCible: { $exists: true, $ne: null },
                    });
                    break;
            }
            posts = yield Promise.all(posts.map((post) => __awaiter(this, void 0, void 0, function* () {
                return Object.assign(Object.assign(Object.assign({}, post._doc), (yield postUtils.getPostSecondaryData(post._id.toString()))), { medias: yield Promise.all(post._doc.medias.map((mediaId) => __awaiter(this, void 0, void 0, function* () {
                        return (yield mediaUtils.getMedia(mediaId.toString())).lien;
                    }))) });
            })));
            return res.status(200).json(posts);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
//GET /api/profiles/posts/activities/:userId&:amount
/*
  Récupères une liste d'avis d'un utilisateur.
  Si le profil est privé, un token authentique doit être reçu qui appartient soit à ce même profil, soit à un administrateur, soit à une personne qui suit le profil.
  Si toutes ces conditions ne sont pas satisfaites, renvoi du code 403 Forbidden.
*/
exports.getProfileActivities = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let amount = parseInt(req.params.amount);
            let userId = req.params.userId;
            if (isNaN(amount) ||
                !objectUtils.isObjectValidStringId(userId) ||
                amount <= 0)
                return res.status(400).json("Bad Request");
            if (!userUtils.doesUserIdExist(userId))
                return res.status(404).json("Not Found");
            let user = yield userUtils.getUserFromId(userId);
            let userParams = yield userUtils.getUserParamsFromUserId(userId);
            if (!user || !userParams)
                return res.status(404).json("Not Found");
            let payload = "headers" in req && req.headers
                ? "authorization" in req.headers && req.headers.authorization
                    ? authUtils.authentifySessionToken(req.headers.authorization.replace("Bearer ", ""))
                    : null
                : null;
            let public = userParams.profilPublic;
            if (!public) {
                if (!"headers" in req ||
                    !req.headers ||
                    !"authorization" in req.headers ||
                    !req.headers.authorization ||
                    !payload)
                    return res.status(401).json("Unauthorized");
                if (payload &&
                    payload.userId != user._id.toString() &&
                    !(yield userUtils.isUserIdAdmin(payload.userId)) &&
                    !(yield followUtils.userIdFollows(payload.userId, user._id.toString())))
                    return res.status(403).json("Forbidden");
            }
            let activities = yield avisUtils.getAvisFromUserId(userId, amount);
            return res.status(200).json(activities);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
//GET /api/profiles/posts/activities/:userId&:amount&:timestamp
/*
  Récupères une liste d'avis d'un utilisateur.
  Si le profil est privé, un token authentique doit être reçu qui appartient soit à ce même profil, soit à un administrateur, soit à une personne qui suit le profil.
  Si toutes ces conditions ne sont pas satisfaites, renvoi du code 403 Forbidden.
*/
exports.getProfileActivitiesWithTimestamp = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let amount = parseInt(req.params.amount);
            let userId = req.params.userId;
            let timestamp = req.params.timestamp;
            if (isNaN(amount) ||
                !objectUtils.isObjectValidStringId(userId) ||
                amount <= 0 ||
                !objectUtils.isStringTimestamp(timestamp))
                return res.status(400).json("Bad Request");
            if (!userUtils.doesUserIdExist(userId))
                return res.status(404).json("Not Found");
            let user = yield userUtils.getUserFromId(userId);
            let userParams = yield userUtils.getUserParamsFromUserId(userId);
            if (!user || !userParams)
                return res.status(404).json("Not Found");
            let payload = "headers" in req && req.headers
                ? "authorization" in req.headers && req.headers.authorization
                    ? authUtils.authentifySessionToken(req.headers.authorization.replace("Bearer ", ""))
                    : null
                : null;
            let public = userParams.profilPublic;
            if (!public) {
                if (!"headers" in req ||
                    !req.headers ||
                    !"authorization" in req.headers ||
                    !req.headers.authorization ||
                    !payload)
                    return res.status(401).json("Unauthorized");
                if (payload &&
                    payload.userId != user._id.toString() &&
                    !(yield userUtils.isUserIdAdmin(payload.userId)) &&
                    !(yield followUtils.userIdFollows(payload.userId, user._id.toString())))
                    return res.status(403).json("Forbidden");
            }
            let activities = yield avisUtils.getAvisFromUserId(userId, amount, timestamp);
            return res.status(200).json(activities);
        }
        catch (err) {
            console.log(err);
            return res.status(500).json("Internal Server Error");
        }
    });
};
