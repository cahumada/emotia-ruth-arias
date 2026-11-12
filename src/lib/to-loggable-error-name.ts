const errorNamePattern = /^[A-Za-z][A-Za-z0-9]{0,63}$/;

export function toLoggableErrorName(value: string): string {
  if (errorNamePattern.test(value)) {
    return value;
  }

  return "UnknownError";
}
