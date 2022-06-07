const mongoose = require("mongoose");

let schema = new mongoose.Schema({
  auteur: { type: mongoose.Types.ObjectId, ref: "Utilisateur", required: true },
  cible: { type: mongoose.Types.ObjectId, ref: "Utilisateur", required: true },
  contenu: { type: String, required: true },
  medias: { type: [{ type: mongoose.Types.ObjectId, ref: "Media" }] },
});

module.exports = mongoose.model("MessageTchat", schema);

//TODO gérer CRUD
