"use strict";
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    userIdA: {
        type: mongoose.Types.ObjectId,
        ref: "Utilisateur",
        required: true,
    },
    userIdB: {
        type: mongoose.Types.ObjectId,
        ref: "Utilisateur",
        required: true,
    },
    nbMessages: { type: Number, required: true, min: 0, default: 0 },
});
module.exports = mongoose.model("Conversation", schema);
