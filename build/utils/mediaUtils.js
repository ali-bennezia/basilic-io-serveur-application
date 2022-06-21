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
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
//Utilitaires.
const userUtils = require("./../utils/userUtils");
const objectUtils = require("./../utils/objectUtils");
//Modèles.
const userModel = require("./../models/utilisateurModel");
const mediaModel = require("./../models/mediaModel");
const authUtils = require("./authUtils");
//Implémentations.
exports.getMediaByLink = function (mediaLink) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof mediaLink != "string" && !mediaLink instanceof String)
            throw "Argument invalide.";
        let media = yield mediaModel.findOne({ lien: mediaLink }).exec();
        return media;
    });
};
exports.getMediaLinkFromId = (mediaId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(mediaId))
        throw "Argument invalide.";
    let media = yield mediaModel.findById(mediaId);
    return media ? ("lien" in media ? media.lien : "") : "";
});
exports.getMedia = function (id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield mediaModel.findById(id);
    });
};
exports.checkUserMediaAccessByUserId = function (mediaLink, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        let media = yield this.getMediaByLink(mediaLink);
        let strDroitsVisible = media.droitsVisible.map((id) => id.toString());
        return (media &&
            (!"mediaPublic" in media ||
                media.mediaPublic == true ||
                ("droitsVisible" in media && strDroitsVisible.includes(userId))));
    });
};
exports.createMedia = function (mediaLink, mediaBuffer, userId, isPublic = true, accessRightsList = []) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!mediaLink || !mediaBuffer || !userId)
            throw "Arguments manquants.";
        if ((!(mediaLink instanceof String || typeof mediaLink == "string") &&
            !(userId instanceof String || typeof userId == "string")) ||
            !(yield userModel.model.exists({ _id: userId })))
            throw "Arguments invalides.";
        let dbCreated = false;
        let mediaCreated = false;
        let media = null;
        try {
            let dataObject = {
                auteur: userId,
                lien: mediaLink,
                mediaPublic: isPublic,
            };
            if (!isPublic)
                dataObject.droitsVisible = accessRightsList;
            media = yield mediaModel.create(dataObject);
            dbCreated = true;
            let formData = new FormData();
            formData.append("media", mediaBuffer, path.basename(mediaLink));
            let res = yield axios({
                method: "post",
                url: `http://${process.env.MEDIA_SERVER_ADRESS}/api/medias/post/${encodeURIComponent(mediaLink)}`,
                data: formData,
                headers: { "Content-Type": "multipart/form-data" },
            });
            mediaCreated = true;
            if (res.status != 201) {
                if (dbCreated && media) {
                    yield mediaModel.findOneAndDelete({ _id: media._id });
                    dbCreated = false;
                }
                return null;
            }
            return media;
        }
        catch (err) {
            if (dbCreated && media) {
                yield mediaModel.findOneAndDelete({ _id: media._id });
                dbCreated = false;
            }
            if (mediaCreated) {
                yield axios({
                    method: "delete",
                    url: `http://${process.env.MEDIA_SERVER_ADRESS}/api/medias/delete/${encodeURIComponent(mediaLink)}`,
                });
                mediaCreated = false;
            }
            console.log(err);
        }
        return null;
    });
};
exports.removeMediaByLink = (mediaLink) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mediaModel.findOneAndDelete({ lien: mediaLink });
        yield axios({
            method: "delete",
            url: `http://${process.env.MEDIA_SERVER_ADRESS}/api/medias/delete/${encodeURIComponent(mediaLink)}`,
        });
    }
    catch (err) {
        console.log(err);
        return false;
    }
    return true;
});
exports.removeMediasByLinks = function (...mediaLinks) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let mediaIds = (yield mediaModel.find({ lien: { $in: mediaLinks } })).map((el) => el._id);
            yield mediaModel.deleteMany({ _id: { $in: mediaIds } });
            yield axios({
                method: "post",
                url: `http://${process.env.MEDIA_SERVER_ADRESS}/api/medias/deletemany/`,
                data: { list: mediaLinks },
            });
        }
        catch (err) {
            console.log(err);
            return false;
        }
        return true;
    });
};
exports.removeMediasByIds = function (...mediaIds) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let mediaLinks = (yield mediaModel.find({ _id: { $in: mediaIds } })).map((el) => el.lien);
            yield mediaModel.deleteMany({ _id: { $in: mediaIds } });
            yield axios({
                method: "post",
                url: `http://${process.env.MEDIA_SERVER_ADRESS}/api/medias/deletemany/`,
                data: { list: mediaLinks },
            });
        }
        catch (err) {
            console.log(err);
            return false;
        }
        return true;
    });
};
exports.getMediaLinkArrayFromMediaIdArray = function (mediaIds) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!Array.isArray(mediaIds))
            throw "Argument invalide.";
        console.log(mediaIds);
        let result = [];
        for (let el of mediaIds) {
            if (!objectUtils.isObjectValidStringId(el.toString()) ||
                !(yield mediaModel.exists({ _id: el })))
                continue;
            let media = yield mediaModel.findById(el);
            if (media && "lien" in media && media.lien)
                result.push(media.lien);
        }
        console.log(result);
        return result;
    });
};
