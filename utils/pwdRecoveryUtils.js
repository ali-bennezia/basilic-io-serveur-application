/*
  Utilitaire pour la réinitialisation de mot de passe par clée.
*/

//Utilitaires.

const stringUtils = require("./stringUtils");
const objectUtils = require("./objectUtils");

//Librairies.

const nodemailer = require("nodemailer");
const twilio = require("twilio");

//Configuration initiale.

const transport = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  secure: process.env.EMAIL_SMTP_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SSID,
  process.env.TWILIO_AUTH_TOKEN
);

//Exports.

exports.generatePwdReinitCode = () =>
  stringUtils.generateRandomString(
    parseInt(process.env.PASSWORD_REINIT_CODE_LENGTH) ?? 10
  );

exports.generateEmailKey = () =>
  stringUtils.generateRandomString(
    parseInt(process.env.PASSWORD_RECOVERY_KEY_LENGTH_EMAIL) ?? 15
  );
exports.generateSMSKey = () =>
  stringUtils.generateRandomString(
    parseInt(process.env.PASSWORD_RECOVERY_KEY_LENGTH_SMS) ?? 5
  );

exports.sendEmailKey = async (key, userId, recipientMail) => {
  if (!objectUtils.isObjectValidStringId(userId))
    throw "Identifiant d'utilisateur invalide";

  let info = await transport.sendMail({
    from: `"Basilic" ${process.env.EMAIL_USER}`,
    to: recipientMail,
    subject: "Basilic - Clée de réinitialisation",
    text: `Une demande de réinitialisation de mot de passe à été faite sur votre compte. Allez sur le lien ${process.env.WEB_URL_ROOT}cleeauth/${userId}&${key} afin de le réinitialiser. Si vous n'êtes pas propriétaire de ce compte, veuillez ignorer ce message.`,
    html: `<p>Une demande de réinitialisation de mot de passe à été faite sur votre compte. Allez sur </p><a href='${process.env.WEB_URL_ROOT}cleeauth/${userId}&${key}'>ce lien</a><p> afin de le réinitialiser. Si vous n'êtes pas propriétaire de ce compte, veuillez ignorer ce message.</p>`,
  });
};

exports.sendSMSKey = async (key, recipientPhoneNumber) => {
  twilioClient.messages.create({
    body: `Une demande de réinitialisation de mot de passe à été faite sur votre compte. Utilisez la clé ${key} afin de le réinitialiser. Si vous n'êtes pas propriétaire de ce compte, veuillez ignorer ce message.`,
    from: `+${process.env.TWILIO_PHONE_NUMBER}`,
    to: `+${recipientPhoneNumber}`,
  });
};
