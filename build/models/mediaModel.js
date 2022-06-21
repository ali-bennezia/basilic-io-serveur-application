"use strict";
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    auteur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Utilisateur",
        required: true,
    },
    lien: { type: String, required: true, unique: true },
    mediaPublic: { type: Boolean, required: false },
    droitsVisible: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur" }],
        required: false,
    },
});
module.exports = mongoose.model("Media", schema);
