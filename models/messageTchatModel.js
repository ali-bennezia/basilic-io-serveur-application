const mongoose = require("mongoose");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(process.env.ENCRYPTION_PRIVATE_KEY);

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

schema.pre("save", async function () {
  if (this.isModified("contenu")) this.contenu = cryptr.encrypt(this.contenu);
});

module.exports = mongoose.model("MessageTchat", schema);

