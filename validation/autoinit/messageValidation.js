//Utilitaires.

const objectUtils = require("./../../utils/objectUtils");

//Librairies.

const config = require("config");

//Validation.

const validation = require("../validation");

//Configuration.

const MESSAGE_MIN_LENGTH = config.get("validation.message.length.min");
const MESSAGE_MAX_LENGTH = config.get("validation.message.length.max");

//Implémentation.

exports.initValidation = function () {
  validation.registerTest(
    "ChatTests",
    "messageContent",
    (content) =>
      objectUtils.isObjectString(content) &&
      objectUtils.isStringLengthInRange(
        content,
        MESSAGE_MIN_LENGTH,
        MESSAGE_MAX_LENGTH
      )
  );
};
