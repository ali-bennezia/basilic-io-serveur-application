/*
  Utilitaire pour la vérification par code.
*/

//Utilitaires.

const stringUtils = require("./stringUtils");

//Librairies.

const nodemailer = require("nodemailer");
const twilio = require("twilio");

//Configuration initiale.

const transport = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 25,
  secure: false,
  dkim: {
    domainName: "basilic-io.fr",
    keySelector: "default",
    privateKey: process.env.DKIM_EMAIL_PRIVATE_KEY,
  },

  tls: { rejectUnauthorized: false },
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SSID,
  process.env.TWILIO_AUTH_TOKEN
);

//Exports.

exports.generateCode = () =>
  stringUtils.generateRandomString(
    parseInt(process.env.VALIDATION_CODE_LENGTH) ?? 6
  );

exports.sendEmailCode = async (code, recipientMail) => {
  let info = await transport.sendMail({
    from: `nepasrepondre@basilic-io.fr`,
    to: recipientMail,
    subject: "Basilic - Code de validation",
    text: `Un compte lié à votre adresse email sur notre réseau social Basilic.io est sur le point d'être validé. Utilisez le code ${code} afin de le valider. Si vous n'êtes pas propriétaire de ce compte, veuillez ignorer ce message.`,
    html: `<p>Un compte lié à votre adresse email sur notre réseau social Basilic.io est sur le point d'être validé.
     Utilisez le code</p> <h1>${code}</h1><p> afin de le valider. Si vous n'êtres pas propriétaire de ce compte, veuillez ignorer ce message.</p>`,
  });
};

exports.sendSMSCode = async (code, recipientPhoneNumber) => {
  twilioClient.messages.create({
    body: `Un compte lié à votre adresse email sur notre réseau social Basilic.io est sur le point d'être validé. Utilisez le code ${code} afin de le valider. Si vous n'êtes pas propriétaire de ce compte, veuillez ignorer ce message.`,
    from: `+${process.env.TWILIO_PHONE_NUMBER}`,
    to: `+${recipientPhoneNumber}`,
  });
};
