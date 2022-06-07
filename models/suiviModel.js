const mongoose = require("mongoose");

let schema = new mongoose.Schema({
  auteur: { type: mongoose.Types.ObjectId, ref: "Utilisateur", required: true },
  cible: { type: mongoose.Types.ObjectId, ref: "Utilisateur", required: true },
});

module.exports = mongoose.model("Suivi", schema);

//TODO gérer CRUD
