//Validation.

import {
  ValidationTestsBattery,
  getValidationTestsAmount,
  registerValidationTestsBattery,
} from "./validation";

/*
    Utilitaires pour la validation des informations liées aux utilisateurs.
*/

//.match("^[\\w-\\.]+@[\\w-\\.]+$");

var userTests: ValidationTestsBattery = new ValidationTestsBattery("UserTests");

console.info(getValidationTestsAmount());
