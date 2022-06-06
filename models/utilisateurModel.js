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
};

const schema = new mongoose.Schema(this.schemaObject, { timestamps: true });

schema.pre("save", async function () {
  if (this.isModified("motDePasse"))
    this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
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
];

for (const property in this.userInsertionDataForm) {
  if (ignoredSchemaPropertiesInsertion.includes(property)) {
    delete this.userInsertionDataForm[property];
    continue;
  }
  this.userInsertionDataForm[property] = null;
}
