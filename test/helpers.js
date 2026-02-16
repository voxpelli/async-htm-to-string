/**
 * Creates a stub function that records calls and returns a fixed value.
 *
 * @param {unknown} returnValue
 * @returns {{ (...args: unknown[]): unknown, calls: unknown[][] }}
 */
export function createStub (returnValue) {
  const calls = [];
  const stub = (...args) => {
    calls.push(args);
    return returnValue;
  };
  stub.calls = calls;
  return stub;
}

/**
 * Creates a stub that returns the argument at the given index.
 *
 * @param {number} index
 * @returns {{ (...args: unknown[]): unknown, calls: unknown[][] }}
 */
export function createStubReturningArg (index) {
  const calls = [];
  const stub = (...args) => {
    calls.push(args);
    return args[index];
  };
  stub.calls = calls;
  return stub;
}
