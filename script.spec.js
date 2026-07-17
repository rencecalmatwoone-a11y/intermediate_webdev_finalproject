const {
  calculateSimpleInterest,
  calculateCompoundInterest,
} = require("../script.js");

describe("Interest Rate Calculator", () => {
  it("calculates simple interest correctly for standard inputs", () => {
    // I = P * r/100 * t = 10000 * 0.05 * 3 = 1500
    const interest = calculateSimpleInterest(10000, 5, 3);
    expect(interest).toBe(1500);
  });

  it("calculates compound interest correctly for standard inputs", () => {
    // A = 10000 * (1 + 0.05/1)^1 = 10500, interest = 500
    const interest = calculateCompoundInterest(10000, 5, 1, 1);
    expect(interest).toBeCloseTo(500, 2);
  });
});
