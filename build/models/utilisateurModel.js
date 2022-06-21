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
const bcrypt = require("bcrypt");
exports.schemaObject = {
    nomUtilisateur: { type: String, required: true, unique: true },
    motDePasse: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    numeroTelephone: { type: String, required: true, unique: true },
    valide: { type: Boolean, required: false },
    codeValidation: { type: String, required: false },
    iatValidation: { type: Date, required: false },
    administrateur: { type: Boolean, required: false },
    /*
      Ici, DRM est l'acronyme pour "Demande de Réinitialisation de Mot de passe".
      Ce sont des valeurs stoquées sur la base de donnée et qui permettent de gérer les demandes de réinitialisation de mots de passe, tout simplement.
    */
    derniereDateDRM: { type: Date, required: false },
    derniereCleeDRM: { type: String, required: false },
    derniereAdresseIPDRM: { type: String, required: false },
    /*
      Code de réinitialisation de mot de passe. Doit être hashé par bcrypt.
    */
    codeRM: { type: String, required: false },
    codeRMDate: { type: Date, required: false },
};
const schema = new mongoose.Schema(this.schemaObject, { timestamps: true });
schema.pre("save", function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified("motDePasse"))
            this.motDePasse = yield bcrypt.hash(this.motDePasse, 10);
        if (this.isModified("derniereCleeDRM"))
            this.derniereCleeDRM = yield bcrypt.hash(this.derniereCleeDRM, 15);
        if (this.isModified("codeRM"))
            this.codeRM = yield bcrypt.hash(this.codeRM, 18);
    });
});
exports.model = mongoose.model("Utilisateur", schema);
//Objet-patron pour tout objet contenant les informations pour la création d'un utilisateur.
exports.userInsertionDataForm = Object.assign({}, this.schemaObject);
const ignoredSchemaPropertiesInsertion = [
    "valide",
    "administrateur",
    "codeValidation",
    "iatValidation",
    "derniereDateDRM",
    "derniereCleeDRM",
    "derniereAdresseIPDRM",
    "codeRM",
    "codeRMDate",
];
for (const property in this.userInsertionDataForm) {
    if (ignoredSchemaPropertiesInsertion.includes(property)) {
        delete this.userInsertionDataForm[property];
        continue;
    }
    this.userInsertionDataForm[property] = null;
}
