"use strict";
const mongoose = require("mongoose");
let schema = new mongoose.Schema({
    auteur: {
        type: mongoose.Types.ObjectId,
        ref: "Utilisateur",
        required: true,
    },
    postCible: { type: mongoose.Types.ObjectId, ref: "Post", required: true },
    nature: { type: String, required: true, enum: ["like", "dislike"] },
}, { timestamps: true });
module.exports = mongoose.model("Avis", schema);
