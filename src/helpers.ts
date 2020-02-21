/** Assert things should be a particular way */
export function invariant(
  condition: any,
  message: string = '',
): asserts condition {
  if (!condition)
    throw new Error(`Invariant Violation: ${message}`);
}

