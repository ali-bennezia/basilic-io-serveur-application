"use strict";
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Utilisateur",
        required: true,
        unique: true,
    },
    nomPublic: { type: String, required: false },
    profilPublic: { type: Boolean, required: false },
    photoProfil: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        required: false,
    },
    banniereProfil: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        required: false,
    },
    descriptionProfil: {
        type: String,
        required: false,
    },
});
module.exports = mongoose.model("ParamsUtilisateur", schema);
