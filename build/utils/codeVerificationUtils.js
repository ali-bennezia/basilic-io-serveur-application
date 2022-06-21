"use strict";
/*
  Utilitaire pour la vérification par code.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//Utilitaires.
const stringUtils = require("./stringUtils");
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
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SSID, process.env.TWILIO_AUTH_TOKEN);
//Exports.
exports.generateCode = () => {
    var _a;
    return stringUtils.generateRandomString((_a = parseInt(process.env.VALIDATION_CODE_LENGTH)) !== null && _a !== void 0 ? _a : 6);
};
exports.sendEmailCode = (code, recipientMail) => __awaiter(void 0, void 0, void 0, function* () {
    let info = yield transport.sendMail({
        from: `"Basilic" ${process.env.EMAIL_USER}`,
        to: recipientMail,
        subject: "Basilic - Code de validation",
        text: `Un compte lié à votre adresse email sur notre réseau social Basilic.io est sur le point d'être validé. Utilisez le code ${code} afin de le valider. Si vous n'êtes pas propriétaire de ce compte, veuillez ignorer ce message.`,
        html: `<p>Un compte lié à votre adresse email sur notre réseau social Basilic.io est sur le point d'être validé.
     Utilisez le code</p> <h1>${code}</h1><p> afin de le valider. Si vous n'êtres pas propriétaire de ce compte, veuillez ignorer ce message.</p>`,
    });
});
exports.sendSMSCode = (code, recipientPhoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    twilioClient.messages.create({
        body: `Un compte lié à votre adresse email sur notre réseau social Basilic.io est sur le point d'être validé. Utilisez le code ${code} afin de le valider. Si vous n'êtes pas propriétaire de ce compte, veuillez ignorer ce message.`,
        from: `+${process.env.TWILIO_PHONE_NUMBER}`,
        to: `+${recipientPhoneNumber}`,
    });
});
