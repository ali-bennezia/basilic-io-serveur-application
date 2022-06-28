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

const USER_EMAIL_MIN_LENGTH = config.get("validation.user.email.length.min");
const USER_EMAIL_MAX_LENGTH = config.get("validation.user.email.length.max");

//Implémentation.

exports.initValidation = function () {
  //Test nomUtilisateur
  var usernameFormat = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~\s]/;

  validation.registerTest("UserTests", "nomUtilisateur", (val) => {
    return (
      objectUtils.isObjectString(val) &&
      !val.test(usernameFormat) &&
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
