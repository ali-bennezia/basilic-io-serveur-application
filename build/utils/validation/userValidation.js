"use strict";
//Validation.
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = require("./validation");
/*
    Utilitaires pour la validation des informations liées aux utilisateurs.
*/
//.match("^[\\w-\\.]+@[\\w-\\.]+$");
var userTests = new validation_1.ValidationTestsBattery("UserTests");
console.info((0, validation_1.getValidationTestsAmount)());
