const chai = require("chai");
const expect = chai.expect;

const validation = require("./../validation/validation");

describe("UserTests - code", function () {
  it("capitals format test: should return true, false, false", function () {
    expect(validation.useTest("UserTests", "code", "HELLO")).to.equal(true);

    expect(validation.useTest("UserTests", "code", "heLLO")).to.equal(false);
    expect(validation.useTest("UserTests", "code", "hello")).to.equal(false);
  });

  it("length format test: should return true, false, false, true", function () {
    expect(validation.useTest("UserTests", "code", "HELLO5")).to.equal(true);

    expect(validation.useTest("UserTests", "code", "")).to.equal(false);
    expect(
      validation.useTest(
        "UserTests",
        "code",
        "AZERTYUIOPQSDFGHJKLMWXCVBNAZERTYUIOPQSDFG"
      )
    ).to.equal(false);

    expect(validation.useTest("UserTests", "code", "1MYCODE56")).to.equal(true);
  });

  it("data type test: should return true, false, false, false", function () {
    expect(validation.useTest("UserTests", "code", "SALUT3")).to.equal(true);
    expect(validation.useTest("UserTests", "code", null)).to.equal(false);
    expect(validation.useTest("UserTests", "code", false)).to.equal(false);
    expect(
      validation.useTest("UserTests", "code", { myName: "John" })
    ).to.equal(false);
  });
});

describe("UserTests - numeroTelephone", function () {
  it("data type test: should return true, true, false, false", function () {
    expect(
      validation.useTest("UserTests", "numeroTelephone", "0185965632")
    ).to.equal(true);
    expect(
      validation.useTest("UserTests", "numeroTelephone", "01855632")
    ).to.equal(true);

    expect(
      validation.useTest("UserTests", "numeroTelephone", undefined)
    ).to.equal(false);

    expect(
      validation.useTest("UserTests", "numeroTelephone", { foo: "bar" })
    ).to.equal(false);
  });
});
