const compulsoryEnvVariables = [
  "MONGO_URI",
  "HTTPS_PRIVATE_KEY_FILE",
  "HTTPS_CERTIFICATE_FILE",
  "PRIVATE_KEY",
  "DKIM_EMAIL_PRIVATE_KEY",
  "TWILIO_ACCOUNT_SSID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "MEDIA_SERVER_ADRESS",
  "ACCEPTED_MEDIA_MIMETYPES",
  "MAX_MEDIA_SIZE_BYTES",
  "ENCRYPTION_PRIVATE_KEY",
  "WEB_URL_ROOT",
  "PASSWORD_RECOVERY_KEY_TIMEOUT_SECONDS",
  "PASSWORD_REINIT_CODE_LENGTH",
  "PASSWORD_REINIT_CODE_TIMEOUT_SECONDS",
];

exports.checkEnvVariables = () => {
  let missing = [];
  for (let eVar of compulsoryEnvVariables) {
    if (!process.env[eVar]) missing.push(eVar);
  }

  if (missing.length != 0) {
    let plural = missing.length != 1;
    throw `${!plural ? "La" : "Les"} variable${
      plural ? "s" : ""
    } d'environnement obligatoire${plural ? "s" : ""} ${missing} ${
      plural ? "sont" : "est"
    } manquante${plural ? "s" : ""}.`;
  }
};
