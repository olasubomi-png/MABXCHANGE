/** Pure rate/amount conservation checks for DEMO trades. */

export function isValueConserved(params: {
  fromAmount: number;
  toAmount: number;
  rate: number;
  kind: "buy" | "sell" | "swap";
  tolerance?: number;
}): boolean {
  const tol = params.tolerance ?? 1e-6;
  if (
    !Number.isFinite(params.fromAmount) ||
    !Number.isFinite(params.toAmount) ||
    !Number.isFinite(params.rate) ||
    params.fromAmount <= 0 ||
    params.toAmount <= 0 ||
    params.rate <= 0
  ) {
    return false;
  }
  if (params.kind === "buy") {
    const expectedBase = params.fromAmount / params.rate;
    return (
      Math.abs(expectedBase - params.toAmount) <=
      tol * Math.max(1, expectedBase)
    );
  }
  const expectedTo = params.fromAmount * params.rate;
  return (
    Math.abs(expectedTo - params.toAmount) <= tol * Math.max(1, expectedTo)
  );
}
