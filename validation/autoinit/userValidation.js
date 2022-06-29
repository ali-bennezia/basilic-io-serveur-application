//Utilitaires.

const objectUtils = require("./../../utils/objectUtils");

//Librairies.

const config = require("config");

//Validation.
const validation = require("./../validation");

//Configuration.

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

const specialCharactersFormat = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~\s]/;
const onlyDigitsFormat = /^[0-9]+$/;

//Implémentation.

exports.initValidation = function () {
  //Test numeroTelephone
  validation.registerTest("UserTests", "numeroTelephone", (val) => {
    return (
      objectUtils.isObjectString(val) &&
      val.test(onlyDigitsFormat) &&
      objectUtils.isStringLengthInRange(
        val,
        USER_PHONENBR_MIN_LENGTH,
        USER_PHONENBR_MAX_LENGTH
      )
    );
  });

  //Test motDePasse
  validation.registerTest("UserTests", "motDePasse", (val) => {
    return (
      objectUtils.isObjectString(val) &&
      !val.test(specialCharactersFormat) &&
      objectUtils.isStringLengthInRange(
        val,
        USER_PWD_MIN_LENGTH,
        USER_PWD_MAX_LENGTH
      )
    );
  });

  //Test nomUtilisateur
  validation.registerTest("UserTests", "nomUtilisateur", (val) => {
    return (
      objectUtils.isObjectString(val) &&
      !val.test(specialCharactersFormat) &&
      objectUtils.isStringLengthInRange(
        val,
        USER_USERNAME_MIN_LENGTH,
        USER_USERNAME_MAX_LENGTH
      )
    );
  });

  //Test email
  validation.registerTest("UserTests", "email", (val) => {
    return (
      objectUtils.isObjectString(val) &&
      val.match("^[\\w-\\.]+@[\\w-\\.]+$") != null &&
      objectUtils.isStringLengthInRange(
        val,
        USER_EMAIL_MIN_LENGTH,
        USER_EMAIL_MAX_LENGTH
      )
    );
  });
};
