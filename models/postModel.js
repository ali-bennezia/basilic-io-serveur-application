const mongoose = require("mongoose");

/*
    Dans le schéma, postCible désigne un autre post auquel le poste est censé répondre. Il est facultatif, car un post n'est pas forcément une réponse.
*/
const schema = new mongoose.Schema(
  {
    auteur: {
      type: mongoose.Types.ObjectId,
      ref: "Utilisateur",
      required: true,
    },
    medias: { type: [{ type: mongoose.Types.ObjectId, ref: "Media" }] },
    contenu: { type: String, required: true },
    postCible: { type: mongoose.Types.ObjectId, ref: "Post", required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", schema);
