const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  auteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Utilisateur",
    required: true,
  },
  lien: { type: String, required: true, unique: true },
  mediaPublic: { type: Boolean, required: false }, //Si cette variable n'est pas présente sur un document, l'on présume que le média est public.
  droitsVisible: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur" }],
    required: false,
  },
});

module.exports = mongoose.model("Media", schema);
