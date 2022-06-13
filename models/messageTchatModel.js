const mongoose = require("mongoose");

let schema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("MessageTchat", schema);

//TODO gérer CRUD
