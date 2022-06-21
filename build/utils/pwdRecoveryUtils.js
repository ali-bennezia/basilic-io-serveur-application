"use strict";
/*
  Utilitaire pour la réinitialisation de mot de passe par clée.
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
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SSID, process.env.TWILIO_AUTH_TOKEN);
//Exports.
exports.generatePwdReinitCode = () => {
    var _a;
    return stringUtils.generateRandomString((_a = parseInt(process.env.PASSWORD_REINIT_CODE_LENGTH)) !== null && _a !== void 0 ? _a : 10);
};
exports.generateEmailKey = () => {
    var _a;
    return stringUtils.generateRandomString((_a = parseInt(process.env.PASSWORD_RECOVERY_KEY_LENGTH_EMAIL)) !== null && _a !== void 0 ? _a : 15);
};
exports.generateSMSKey = () => {
    var _a;
    return stringUtils.generateRandomString((_a = parseInt(process.env.PASSWORD_RECOVERY_KEY_LENGTH_SMS)) !== null && _a !== void 0 ? _a : 5);
};
exports.sendEmailKey = (key, userId, recipientMail) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectUtils.isObjectValidStringId(userId))
        throw "Identifiant d'utilisateur invalide";
    let info = yield transport.sendMail({
        from: `"Basilic" ${process.env.EMAIL_USER}`,
        to: recipientMail,
        subject: "Basilic - Clée de réinitialisation",
        text: `Une demande de réinitialisation de mot de passe à été faite sur votre compte. Allez sur le lien ${process.env.WEB_URL_ROOT}api/auth/recpwd/entry&${userId}&${key} afin de le réinitialiser. Si vous n'êtes pas propriétaire de ce compte, veuillez ignorer ce message.`,
        html: `<p>Une demande de réinitialisation de mot de passe à été faite sur votre compte. Allez sur </p><a href='${process.env.WEB_URL_ROOT}api/auth/recpwd/entry&${userId}&${key}'>ce lien</a><p> afin de le réinitialiser. Si vous n'êtes pas propriétaire de ce compte, veuillez ignorer ce message.</p>`,
    });
});
exports.sendSMSKey = (key, recipientPhoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    twilioClient.messages.create({
        body: `Une demande de réinitialisation de mot de passe à été faite sur votre compte. Utilisez la clé ${key} afin de le réinitialiser. Si vous n'êtes pas propriétaire de ce compte, veuillez ignorer ce message.`,
        from: `+${process.env.TWILIO_PHONE_NUMBER}`,
        to: `+${recipientPhoneNumber}`,
    });
});
