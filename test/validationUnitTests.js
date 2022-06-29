const chai = require("chai");
const expect = chai.expect;

const validation = require("../validation/validation");

describe("registre des tests", function () {
  it("isTestRegistered: devrait valoir false", function () {
    expect(validation.isTestRegistered("none", "none")).to.equal(false);
  });

  it("isTestRegistered: devrait valoir false", function () {
    expect(validation.isTestRegistered("UnitTests", "test1")).to.equal(false);
    expect(validation.isTestRegistered("UnitTests", "test2")).to.equal(false);
  });

  it("registerTest, isTestRegistered: devrait valoir true", function () {
    validation.registerTest("UnitTests", "test1", (val) => true);
    validation.registerTest("UnitTests", "test2", (val) => false);

    expect(validation.isTestRegistered("UnitTests", "test1")).to.equal(true);
    expect(validation.isTestRegistered("UnitTests", "test2")).to.equal(true);
  });

  it("useTest: devrait valoir true, false", function () {
    expect(validation.useTest("UnitTests", "test1", "~")).to.equal(true);
    expect(validation.useTest("UnitTests", "test2", "~")).to.equal(false);
  });

  it("registerTest, useTest: devrait valoir true, false, true, null", function () {
    validation.registerTest(
      "UnitTests",
      "test3",
      (val) => val == "hello world" || val == "hello everyone"
    );

    expect(validation.useTest("UnitTests", "test3", "hello world")).to.equal(
      true
    );
    expect(validation.useTest("UnitTests", "test3", "hello you")).to.equal(
      false
    );
    expect(validation.useTest("UnitTests", "test3", "hello everyone")).to.equal(
      true
    );

    expect(validation.useTest("none", "test3", "hello everyone")).to.equal(
      null
    );
  });
});
