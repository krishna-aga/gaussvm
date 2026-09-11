# Pre-optimization math reference

These two Solidity files are frozen copies of `contracts/math/` at commit
`4e8cd92`, before the gas optimization. Do not update them to follow the current
implementation: they are the differential-test reference, not deployed code.

`node scripts/compile-gas-baseline.mjs` substitutes them at their original import
paths in the normal build input and compiles the same router and math harness
with solc 0.8.30, optimizer 200, viaIR, Cancun. This keeps settlement, calldata,
and compiler settings identical when comparing old and optimized math.
