const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Utilisateur",
    required: true,
    unique: true,
  },
  nomPublic: { type: String, required: false },
  profilPublic: { type: Boolean, required: false }, //Si cette variable n'est pas présente sur un document, l'on présume que le profil est public.
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
