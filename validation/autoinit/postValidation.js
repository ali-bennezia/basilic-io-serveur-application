//Utilitaires.

const objectUtils = require("../../utils/objectUtils");

//Librairies.

const config = require("config");

//Validation.

const validation = require("../validation");

//Configuration.

const POST_MIN_LENGTH = config.get("validation.post.length.min");
const POST_MAX_LENGTH = config.get("validation.post.length.max");

//Implémentation.

exports.initValidation = function () {
  validation.registerTest(
    "PostTests",
    "postContent",
    (content) =>
      objectUtils.isObjectString(content) &&
      objectUtils.isStringLengthInRange(
        content,
        POST_MIN_LENGTH,
        POST_MAX_LENGTH
      )
  );
};
