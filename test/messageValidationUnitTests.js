//Librairies.

const chai = require("chai");
const expect = chai.expect;

//Utilitaires.

const validation = require("../validation/validation");

//Tests.

describe("message validation tests", function () {
  it("should be true, false, true, false", function () {
    expect(validation.useTest("ChatTests", "messageContent", "Salut")).to.equal(
      true
    );

    expect(validation.useTest("ChatTests", "messageContent", "Yo")).to.equal(
      false
    );

    expect(validation.useTest("ChatTests", "messageContent", "Hey")).to.equal(
      true
    );

    expect(
      validation.useTest(
        "ChatTests",
        "messageContent",
        "Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... "
      )
    ).to.equal(false);
  });
});
