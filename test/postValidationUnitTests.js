//Librairies.

const chai = require("chai");
const expect = chai.expect;

//Utilitaires.

const validation = require("../validation/validation");

//Tests.

describe("post validation tests", function () {
  it("should be true, false, true, false", function () {
    expect(validation.useTest("PostTests", "postContent", "Salut")).to.equal(
      true
    );

    expect(validation.useTest("PostTests", "postContent", "Yo")).to.equal(
      false
    );

    expect(validation.useTest("PostTests", "postContent", "Hey")).to.equal(
      true
    );

    expect(
      validation.useTest(
        "PostTests",
        "postContent",
        "Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... Very long string.... "
      )
    ).to.equal(false);
  });
});
