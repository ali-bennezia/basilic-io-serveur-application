"use strict";
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
//Modèles.
const followModel = require("./../models/followModel");
const userModel = require("./../models/utilisateurModel");
//Implémentations.
//TODO
//Est-ce que userA suit userB ?
exports.userIdFollows = (userIdA, userIdB) => __awaiter(void 0, void 0, void 0, function* () { return (yield followModel.exists({ auteur: userIdA, cible: userIdB })) != null; });
//Ajouter un suivi de userA à userB
exports.setUserIdAFollowUserIdB = function (userIdA, userIdB) {
    return __awaiter(this, void 0, void 0, function* () {
        //Sanitation des valeurs reçues.
        if (!objectUtils.isObjectValidStringId(userIdA) ||
            !objectUtils.isObjectValidStringId(userIdB))
            throw "Argument(s) invalide(s).";
        //Validation des valeurs reçues.
        if (!(yield userModel.model.exists({ _id: userIdA })) ||
            !(yield userModel.model.exists({ _id: userIdB })))
            throw "Au moins l'un des identifiants ne correspond pas à un utilisateur.";
        //Execution.
        if (yield this.userIdFollows(userIdA, userIdB))
            return;
        yield followModel.create({ auteur: userIdA, cible: userIdB });
    });
};
//Supprimer un suivi de userA à userB
exports.setUserIdAUnfollowUserIdB = function (userIdA, userIdB) {
    return __awaiter(this, void 0, void 0, function* () {
        //Sanitation des valeurs reçues.
        if (!objectUtils.isObjectValidStringId(userIdA) ||
            !objectUtils.isObjectValidStringId(userIdB))
            throw "Argument(s) invalide(s).";
        //Validation des valeurs reçues.
        if (!(yield userModel.model.exists({ _id: userIdA })) ||
            !(yield userModel.model.exists({ _id: userIdB })))
            throw "Au moins l'un des identifiants ne correspond pas à un utilisateur.";
        //Execution.
        if (yield this.userIdFollows(userIdA, userIdB))
            yield followModel.findOneAndDelete({ auteur: userIdA, cible: userIdB });
    });
};
