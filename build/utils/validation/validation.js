"use strict";
/*
    Utilitaire pour tout ce qui conçerne la validation.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerValidationTestsBattery = exports.isValidationTestsBatteryRegistered = exports.getValidationTestsAmount = exports.ValidationTestsBattery = exports.ValidationTest = void 0;
/*
  La classe ValidationTest est la classe qui représente un test bien spécifique.
  Elle possède un identifiant, ainsi qu'une fonction, testProperty, qui contient la logique derrière le test de validation.
*/
class ValidationTest {
    constructor(identifier, testFunc) {
        this.testIdentifier = identifier;
        this.testProperty = testFunc;
    }
    /*
      testProprety est la fonction même qui doit se charger de tester la validité d'une propriété.
      Elle est au coeur de la validation: elle renvoie true si le test est une réussite, false autrement.
    */
    testProperty(value) {
        return false;
    }
    getIdentifier() {
        return this.testIdentifier;
    }
}
exports.ValidationTest = ValidationTest;
/*
  La classe AbstractValidationTestsBattery est la classe représente un ensemble de tests.
*/
class ValidationTestsBattery {
    constructor(identifier) {
        this.tests = [];
        this.identifier = identifier;
        registerValidationTestsBattery(this);
    }
    useTest(testIdentifier, value) {
        for (let test of this.tests) {
            if (test.getIdentifier() == testIdentifier)
                return test.testProperty(value);
        }
        return false;
    }
    isTestRegistered(testIdentifier) {
        for (let test of this.tests) {
            if (test.getIdentifier() == testIdentifier)
                return true;
        }
        return false;
    }
    registerTest(test) {
        if (!this.isTestRegistered(test.getIdentifier())) {
            this.tests.push(test);
            return true;
        }
        else
            return false;
    }
    unregisterTest(test) {
        if (this.isTestRegistered(test.getIdentifier())) {
            let idx = this.tests.indexOf(test);
            if (idx == -1)
                throw "Suppression d'un test impossible. Son identifiant est présent mais pas l'objet correspondant.";
            this.tests.splice(idx, 1);
            return true;
        }
        else
            return false;
    }
}
exports.ValidationTestsBattery = ValidationTestsBattery;
//Suivi de toutes les batteries de test de validation enregistrées.
var registeredTestsBatteries;
registeredTestsBatteries = [];
function getValidationTestsAmount() {
    return registeredTestsBatteries.length;
}
exports.getValidationTestsAmount = getValidationTestsAmount;
function isValidationTestsBatteryRegistered(identifier) {
    for (let tests of registeredTestsBatteries)
        if (tests.identifier == identifier)
            return true;
    return false;
}
exports.isValidationTestsBatteryRegistered = isValidationTestsBatteryRegistered;
function registerValidationTestsBattery(validationTestsBattery) {
    if (!isValidationTestsBatteryRegistered(validationTestsBattery.identifier))
        registeredTestsBatteries.push(validationTestsBattery);
}
exports.registerValidationTestsBattery = registerValidationTestsBattery;
exports.test = registerValidationTestsBattery;
