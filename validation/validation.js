/*
    Pour la validation.
*/

//Utilitaires.

const objectUtils = require("../utils/objectUtils");

//Implémentation.

//Classe qui représente un ensemble de tests de validation.
class ValidationTestBattery {
  identifier = "";
  tests = [];
  constructor(identifier) {
    this.identifier = identifier;
  }
}

//Liste de toutes les batteries de tests connues.
testBatteries = [];

exports.isTestBatteryRegistered = function (testBatteryId) {
  //Sanitation.
};

exports.registerTestBattery = function (testBattery) {
  //Sanitation.
  if (!testBattery instanceof ValidationTestBattery)
    throw "Argument incorrect. L'objet n'est pas une batterie de tests de validation.";
  //Validation.
};
