/*
    Pour la validation.
*/

//Utilitaires.

const objectUtils = require("../utils/objectUtils");

//Implémentation.

//Classe qui représente un test de validation.
class ValidationTest {
  testIdentifier = "";
  testFunction = (val) => false;
  constructor(testIdentifier, testFunction) {
    this.testIdentifier = testIdentifier;
    this.testFunction = testFunction;
  }
}

//Classe qui représente un ensemble de tests de validation.
class ValidationTestBattery {
  identifier = "";
  tests = [];
  constructor(identifier) {
    this.identifier = identifier;
  }
  isTestRegistered = function (testId) {
    for (let test of this.tests) {
      if (this.test.testIdentifier == testId) return true;
    }
    return false;
  };
  registerTest = function (testId, testFunc) {
    if (this.isTestRegistered(testId))
      throw "Impossible d'enregistrer le test. Un test de cet identifiant est déjà enregistré.";
    this.tests.push(new ValidationTest(testId, testFunc));
  };
}

//Liste de toutes les batteries de tests connues.
testBatteries = [];

exports.isTestRegistered = function (testBatteryId, testId) {
  //Sanitation.
  if (!objectUtils.isObjectString(testBatteryId))
    throw "Argument incorrect. L'argument donné n'est pas une chaîne de charactères.";

  //Execution.
  for (let testBattery of testBatteries) {
    if (testBattery.identifier == testBatteryId)
      return testBattery.isTestRegistered(testId);
  }
  return false;
};

exports.registerTest = function (testBatteryId, testId, testFunc) {
  //Sanitation.
  if (
    !objectUtils.isObjectString(testBatteryId) ||
    !objectUtils.isObjectString(testId) ||
    typeof testFunc != "function"
  )
    throw "Argument(s) incorrect(es).";

  //Execution.
  let knownTestBattery = null;
  for (let testBattery of testBatteries) {
    if (testBattery.identifier == testBatteryId) {
      knownTestBattery = testBattery;
      testBattery.registerTest(testId, testFunc);
    }
  }
  if (knownTestBattery == null) {
    knownTestBattery = new ValidationTestBattery(testBatteryId);
    knownTestBattery.registerTest(testId, testFunc);
    testBatteries.push(knownTestBattery);
  }
};

this.registerTest("maBatterieDeTest", "monTest", (val) => {
  return false;
});

console.log(testBatteries);
console.log(testBatteries[0].tests[0]);
