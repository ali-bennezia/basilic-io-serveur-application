"use strict";
/*
  Utilitaire pour ce qui concerne les avis.
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
const postUtils = require("./postUtils");
//Modèles.
const userModel = require("./../models/utilisateurModel");
const avisModel = require("../models/avisModel");
//Implémentations.
exports.doesAvisExistWithUserIdAndPostId = (authorUserId, targetPostId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(objectUtils.isObjectValidStringId(authorUserId) &&
        objectUtils.isObjectValidStringId(targetPostId)))
        throw "Arguments invalides.";
    return yield avisModel.exists({
        auteur: authorUserId,
        postCible: targetPostId,
    });
});
exports.removeAvisWithUserIdAndPostId = (authorUserId, targetPostId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(objectUtils.isObjectValidStringId(authorUserId) &&
        objectUtils.isObjectValidStringId(targetPostId)))
        throw "Arguments invalides.";
    yield avisModel.findOneAndRemove({
        auteur: authorUserId,
        postCible: targetPostId,
    });
});
exports.getSingleAvisFromAuthorUserIdAndTargetPostId = (authorUserId, targetPostId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(objectUtils.isObjectValidStringId(authorUserId) &&
        objectUtils.isObjectValidStringId(targetPostId)))
        throw "Arguments invalides.";
    if (!userUtils.doesUserIdExist(authorUserId))
        throw "L'identifiant de l'auteur n'appartient à aucun utilisateur connu.";
    if (!postUtils.doesPostWithIdExist(targetPostId))
        throw "L'identifiant du post ciblé n'appartient à aucun post connu.";
    return yield avisModel.findOne({
        auteur: authorUserId,
        postCible: targetPostId,
    });
});
exports.createAvis = (authorUserId, targetPostId, nature) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(objectUtils.isObjectValidStringId(authorUserId) &&
        objectUtils.isObjectValidStringId(targetPostId)) ||
        !avisModel.schema.paths.nature.enumValues.includes(nature))
        throw "Arguments invalides.";
    if (!userUtils.doesUserIdExist(authorUserId))
        throw "L'identifiant de l'auteur n'appartient à aucun utilisateur connu.";
    if (!postUtils.doesPostWithIdExist(targetPostId))
        throw "L'identifiant du post ciblé n'appartient à aucun post connu.";
    let doesAlreadyExist = yield this.doesAvisExistWithUserIdAndPostId(authorUserId, targetPostId);
    if (doesAlreadyExist) {
        let avis = yield this.getSingleAvisFromAuthorUserIdAndTargetPostId(authorUserId, targetPostId);
        if (avis != null && "nature" in avis && avis.nature != nature) {
            avis.nature = nature;
            yield avis.save();
        }
        return avis;
    }
    else {
        return yield avisModel.create({
            auteur: authorUserId,
            postCible: targetPostId,
            nature: nature,
        });
    }
    //if (doesAlreadyExist)
    //await this.removeAvisWithUserIdAndPostId(authorUserId, targetPostId);
});
//Envoie toutes les valeurs possibles de la propriété nature du modèle Avis.
exports.getAdmissibleNatureValues = () => [
    ...avisModel.schema.paths.nature.enumValues,
];
//Envoie le nombre de likes/dislikes d'un post.
exports.getPostAvis = (postId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!objectUtils.isObjectValidStringId(postId))
            throw "Arguments invalides.";
        if (!postUtils.doesPostWithIdExist(postId))
            throw "L'identifiant du post ciblé n'appartient à aucun post connu.";
        let dataObject = {};
        for (let el of avisModel.schema.paths.nature.enumValues)
            dataObject[el] = yield avisModel.count({ postCible: postId, nature: el });
        return dataObject;
    }
    catch (err) {
        console.log(err);
        return null;
    }
});
exports.getAvisFromUserId = function (userId, amount = 10, timestamp = null) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!objectUtils.isObjectValidStringId(userId) ||
            parseInt(amount) <= 0 ||
            (timestamp && !objectUtils.isStringTimestamp(timestamp)))
            throw "Arguments invalides.";
        if (!userUtils.doesUserIdExist(userId))
            throw "L'identifiant du post ciblé n'appartient à aucun post connu.";
        let filter = { auteur: userId };
        if (timestamp)
            filter.createdAt = { $lte: timestamp };
        let avis = yield avisModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(Math.min(parseInt((_a = process.env.ACTIVITIES_MAX_LOAD_AMOUNT_PER_REQUEST) !== null && _a !== void 0 ? _a : 20), parseInt(amount)))
            .exec();
        let result = [];
        for (let el of avis) {
            let postData = yield postUtils.getPostFromId(el.postCible.toString());
            result.push(Object.assign(Object.assign({}, el._doc), { auteur: yield objectUtils.getUserSummaryProfileData(yield userUtils.getUserFromId(el.auteur.toString()), yield userUtils.getUserParamsFromUserId(el.auteur.toString())), postCible: Object.assign(Object.assign(Object.assign({}, postData), (yield postUtils.getPostSecondaryData(el.postCible.toString()))), { medias: yield mediaUtils.getMediaLinkArrayFromMediaIdArray(postData.medias) }) }));
        }
        return result;
    });
};
