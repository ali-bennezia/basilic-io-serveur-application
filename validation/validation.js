/*
    Pour la validation.
*/

//Utilitaires.

const objectUtils = require("../utils/objectUtils");
const fileUtils = require("../utils/fileUtils");

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
      if (test.testIdentifier == testId) return true;
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

//Implémentations.

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

//Initialization.
/*
  L'initialisation ici vérifie si il y a présence de fichiers dans le dossier autoinit.
  Elle s'assure de la présence d'une fonction exportée, initValidation, vérifie que le fichier soit bien valide.
  Exemple: Qu'il est bien en extension .js.
  Elle execute ensuite la fonction pour chacun des modules chargés issus de ces fichiers.
*/
let initFileModules = [];
let initFiles = fileUtils.getFilesInDirectory("./validation/autoinit");

initFiles = initFiles.filter((f) => {
  let regexMatch = f.match("^.*\\.js$") != null;
  const fileModule = require(`./autoinit/${f}`);
  let viability =
    regexMatch &&
    "initValidation" in fileModule &&
    typeof fileModule.initValidation == "function";
  if (viability) initFileModules.push(fileModule);
  return viability;
});

let plur = initFileModules.length != 1;
let plurStr = plur ? "s" : "";
console.log(
  `${initFileModules.length} module${plurStr} de validation détecté${plurStr}.`
);

initFileModules.forEach((m) => m.initValidation());
