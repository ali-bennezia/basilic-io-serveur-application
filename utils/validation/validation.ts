/*
    Utilitaire pour tout ce qui conçerne la validation.
*/

type ValidationTest = { name: string; testFunc: () => boolean };

interface IValidationTests {
  tests: Array<ValidationTest>;
}
