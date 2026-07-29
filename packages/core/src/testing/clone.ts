/** Deep clone for test doubles without depending on DOM lib typings. */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
