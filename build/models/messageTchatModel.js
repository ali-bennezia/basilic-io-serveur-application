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
const mongoose = require("mongoose");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(process.env.ENCRYPTION_PRIVATE_KEY);
let schema = new mongoose.Schema({
    auteur: {
        type: mongoose.Types.ObjectId,
        ref: "Utilisateur",
        required: true,
    },
    cible: {
        type: mongoose.Types.ObjectId,
        ref: "Utilisateur",
        required: true,
    },
    contenu: { type: String, required: true },
    medias: { type: [{ type: mongoose.Types.ObjectId, ref: "Media" }] },
    cibleVu: { type: Boolean, required: false }, //Si la valeur n'est pas présente sur le document, on présume que cela vaut à true.
}, { timestamps: true });
schema.pre("save", function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified("contenu"))
            this.contenu = cryptr.encrypt(this.contenu);
    });
});
module.exports = mongoose.model("MessageTchat", schema);
//TODO gérer CRUD
