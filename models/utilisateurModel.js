const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//Configuration.
const config = require("config");

const USER_USERNAME_MIN_LENGTH = config.get(
  "validation.user.nomUtilisateur.length.min"
);
const USER_USERNAME_MAX_LENGTH = config.get(
  "validation.user.nomUtilisateur.length.max"
);

const USER_PWD_MIN_LENGTH = config.get("validation.user.pwd.length.min");
const USER_PWD_MAX_LENGTH = config.get("validation.user.pwd.length.max");

const USER_PHONENBR_MIN_LENGTH = config.get(
  "validation.user.phoneNumber.length.min"
);
const USER_PHONENBR_MAX_LENGTH = config.get(
  "validation.user.phoneNumber.length.max"
);

const USER_EMAIL_MIN_LENGTH = config.get("validation.user.email.length.min");
const USER_EMAIL_MAX_LENGTH = config.get("validation.user.email.length.max");

//Implémentation.

exports.schemaObject = {
  nomUtilisateur: {
    type: String,
    required: true,
    unique: true,
    minlength: USER_USERNAME_MIN_LENGTH,
    maxlength: USER_USERNAME_MAX_LENGTH,
  },
  motDePasse: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: USER_EMAIL_MIN_LENGTH,
    maxlength: USER_EMAIL_MAX_LENGTH,
  },
  numeroTelephone: {
    type: String,
    required: true,
    unique: true,
    minlength: USER_PHONENBR_MIN_LENGTH,
    maxlength: USER_PHONENBR_MAX_LENGTH,
  },
  valide: { type: Boolean, required: false },
  codeValidation: { type: String, required: false },
  iatValidation: { type: Date, required: false },
  administrateur: { type: Boolean, required: false },

  /*
    Ici, DRM est l'acronyme pour "Demande de Réinitialisation de Mot de passe".
    Ce sont des valeurs stoquées sur la base de donnée et qui permettent de gérer les demandes de réinitialisation de mots de passe, tout simplement.
  */
  derniereDateDRM: { type: Date, required: false },
  derniereCleeDRM: { type: String, required: false },
  derniereAdresseIPDRM: { type: String, required: false },

  /*
    Code de réinitialisation de mot de passe. Doit être hashé par bcrypt.
  */
  codeRM: { type: String, required: false },
  codeRMDate: { type: Date, required: false },
};

const schema = new mongoose.Schema(this.schemaObject, { timestamps: true });

schema.pre("save", async function () {
  if (this.isModified("motDePasse"))
    this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
  if (this.isModified("derniereCleeDRM"))
    this.derniereCleeDRM = await bcrypt.hash(this.derniereCleeDRM, 15);
  if (this.isModified("codeRM"))
    this.codeRM = await bcrypt.hash(this.codeRM, 18);
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
  "derniereDateDRM",
  "derniereCleeDRM",
  "derniereAdresseIPDRM",
  "codeRM",
  "codeRMDate",
];

for (const property in this.userInsertionDataForm) {
  if (ignoredSchemaPropertiesInsertion.includes(property)) {
    delete this.userInsertionDataForm[property];
    continue;
  }
  this.userInsertionDataForm[property] = null;
}
