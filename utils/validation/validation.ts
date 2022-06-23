/*
    Utilitaire pour tout ce qui conçerne la validation.
*/

//Types & classes.

type AdmissiblePropertyType = string | Number | Array<string | Number>;

/*
  La classe ValidationTest est la classe qui représente un test bien spécifique.
  Elle possède un identifiant, ainsi qu'une fonction, testProperty, qui contient la logique derrière le test de validation.
*/
export class ValidationTest {
  public constructor(
    identifier: string,
    testFunc: (value: AdmissiblePropertyType) => boolean
  ) {
    this.testIdentifier = identifier;
    this.testProperty = testFunc;
  }

  /*
    testProprety est la fonction même qui doit se charger de tester la validité d'une propriété.
    Elle est au coeur de la validation: elle renvoie true si le test est une réussite, false autrement.
  */
  public testProperty(value: AdmissiblePropertyType): boolean {
    return false;
  }
  public getIdentifier(): string {
    return this.testIdentifier;
  }

  private testIdentifier: string;
}

/*
  L'interface IValidationTestsBattery décrit la structure de la classe AbstractValidationTestsBattery.
*/
export interface IValidationTestsBattery {
  identifier: string;
  tests: Array<ValidationTest>;

  useTest(testIdentifier: string, value: AdmissiblePropertyType): boolean;
  isTestRegistered(testIdentifier: string): boolean;
  registerTest(test: ValidationTest): boolean;
  unregisterTest(test: ValidationTest): boolean;
}

/*
  La classe AbstractValidationTestsBattery est la classe représente un ensemble de tests.
*/
export class ValidationTestsBattery implements IValidationTestsBattery {
  readonly identifier: string;
  tests: Array<ValidationTest> = [];

  public constructor(identifier: string) {
    this.identifier = identifier;
    registerValidationTestsBattery(this);
  }

  public useTest(
    testIdentifier: string,
    value: AdmissiblePropertyType
  ): boolean {
    for (let test of this.tests) {
      if (test.getIdentifier() == testIdentifier)
        return test.testProperty(value);
    }
    return false;
  }

  isTestRegistered(testIdentifier: string): boolean {
    for (let test of this.tests) {
      if (test.getIdentifier() == testIdentifier) return true;
    }
    return false;
  }

  registerTest(test: ValidationTest): boolean {
    if (!this.isTestRegistered(test.getIdentifier())) {
      this.tests.push(test);
      return true;
    } else return false;
  }

  unregisterTest(test: ValidationTest): boolean {
    if (this.isTestRegistered(test.getIdentifier())) {
      let idx: number = this.tests.indexOf(test);
      if (idx == -1)
        throw "Suppression d'un test impossible. Son identifiant est présent mais pas l'objet correspondant.";
      this.tests.splice(idx, 1);
      return true;
    } else return false;
  }
}

//Suivi de toutes les batteries de test de validation enregistrées.

var registeredTestsBatteries: ValidationTestsBattery[];
registeredTestsBatteries = [];

export function getValidationTestsAmount(): Number {
  return registeredTestsBatteries.length;
}

export function isValidationTestsBatteryRegistered(
  identifier: string
): boolean {
  for (let tests of registeredTestsBatteries)
    if (tests.identifier == identifier) return true;
  return false;
}

export function registerValidationTestsBattery(
  validationTestsBattery: ValidationTestsBattery
) {
  if (!isValidationTestsBatteryRegistered(validationTestsBattery.identifier))
    registeredTestsBatteries.push(validationTestsBattery);
}

exports.test = registerValidationTestsBattery;
