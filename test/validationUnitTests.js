const chai = require("chai");
const expect = chai.expect;

const validation = require("../validation/validation");

describe("registre des tests", function () {
  it("devrait valoir false", function () {
    expect(validation.isTestRegistered("none", "none")).to.equal(false);
  });

  it("devrait valoir false", function () {
    expect(validation.isTestRegistered("UnitTests", "test1")).to.equal(false);
    expect(validation.isTestRegistered("UnitTests", "test2")).to.equal(false);
  });

  it("devrait valoir true", function () {
    validation.registerTest("UnitTests", "test1", (val) => true);
    validation.registerTest("UnitTests", "test2", (val) => true);

    expect(validation.isTestRegistered("UnitTests", "test1")).to.equal(true);
    expect(validation.isTestRegistered("UnitTests", "test2")).to.equal(true);
  });
});
