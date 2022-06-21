"use strict";
//Librairies.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const JWT = require("jsonwebtoken");
//Utilitaires.
const authUtils = require("./../utils/authUtils");
const userUtils = require("./../utils/userUtils");
const extractTokenAndPayload = (req) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.tokenPayload) {
        let token = req.headers.authorization.replace("Bearer ", "");
        req.tokenPayload = yield authUtils.authentifySessionToken(token);
    }
});
exports.noToken = function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        let token = "headers" in req
            ? req.headers
                ? "authorization" in req.headers
                    ? req.headers.authorization
                    : undefined
                : undefined
            : undefined;
        if (token)
            res.status(403).json("Forbidden");
        else
            next();
    });
};
exports.checkTokenAuthenticity = function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield extractTokenAndPayload(req);
            next();
        }
        catch (err) {
            res.status(401).json("Invalid Token");
        }
    });
};
exports.checkTokenAccountValidity = function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield extractTokenAndPayload(req);
            let user = yield userUtils.getUserFromId(req.tokenPayload.userId);
            if (user && "valide" in user && user.valide == true)
                next();
            else
                res.status(403).json("Invalid Token Account");
        }
        catch (err) {
            res.status(401).json("Invalid Token");
        }
    });
};
exports.checkTokenAccountInvalidity = function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield extractTokenAndPayload(req);
            let user = yield userUtils.getUserFromId(req.tokenPayload.userId);
            if ((user && "valide" in user && user.valide == true) || !user)
                res.status(403).json("Valid Token Account");
            else
                next();
        }
        catch (err) {
            res.status(401).json("Invalid Token");
        }
    });
};
