const compulsoryEnvVariables = [
  "MONGO_URI",
  "PRIVATE_KEY",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
  "EMAIL_SMTP_HOST",
  "EMAIL_SMTP_PORT",
  "TWILIO_ACCOUNT_SSID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "MEDIA_SERVER_ADRESS",
  "ACCEPTED_MEDIA_MIMETYPES",
  "MAX_MEDIA_SIZE_BYTES",
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
