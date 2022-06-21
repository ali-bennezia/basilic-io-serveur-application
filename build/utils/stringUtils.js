"use strict";
/*
  Utilitaire pour des chaines de charactère.
*/
const rand = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
exports.generateRandomString = (length) => {
    let str = "";
    for (let i = 0; i < length; ++i)
        str += rand[parseInt(Math.random() * rand.length)];
    return str;
};
