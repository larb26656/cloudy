// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripUndefined(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}
