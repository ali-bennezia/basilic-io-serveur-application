const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

exports.schemaObject = {
  nomUtilisateur: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  numeroTelephone: { type: String, required: true, unique: true },
  valide: { type: Boolean, required: false },
  codeValidation: { type: String, required: false },
  iatValidation: { type: Date, required: false },
  administrateur: { type: Boolean, required: false },

  /*
    Ici, DMR est l'acronyme pour "Demande de Réinitialisation de Mot de passe".
    Ce sont des valeurs stoquées sur la base de donnée et qui permettent de gérer les demandes de réinitialisation de mots de passe, tout simplement.
  */
  derniereDateDMR: { type: Date, required: false },
  derniereCleeDMR: { type: String, required: false },
  derniereAdresseIPDMR: { type: String, required: false },
};

const schema = new mongoose.Schema(this.schemaObject, { timestamps: true });

schema.pre("save", async function () {
  if (this.isModified("motDePasse"))
    this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
  if (this.isModified("derniereCleeDMR"))
    this.derniereCleeDMR = await bcrypt.hash(this.derniereCleeDMR, 15);
});

exports.model = mongoose.model("Utilisateur", schema);

//Objet-patron pour tout objet contenant les informations pour la création d'un utilisateur.

exports.userInsertionDataForm = {
  ...this.schemaObject,
};

const ignoredSchemaPropertiesInsertion = [
  "valide",
  "administrateur",
  "codeValidation",
  "iatValidation",
  "derniereDateDMR",
  "derniereCleeDMR",
  "derniereAdresseIPDMR",
];

for (const property in this.userInsertionDataForm) {
  if (ignoredSchemaPropertiesInsertion.includes(property)) {
    delete this.userInsertionDataForm[property];
    continue;
  }
  this.userInsertionDataForm[property] = null;
}
