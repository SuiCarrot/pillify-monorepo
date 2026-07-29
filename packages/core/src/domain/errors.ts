export type DomainErrorCode =
  | 'CYCLE_START_IN_FUTURE'
  | 'INVALID_CYCLE_CONFIG'
  | 'INVALID_TIME_OF_DAY'
  | 'INVALID_CYCLE_START_DATE'
  | 'DOSE_ON_BREAK_DAY'
  | 'MEDICATION_NOT_FOUND'
  | 'MEDICATION_INACTIVE';

export interface DomainError {
  code: DomainErrorCode;
  message: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: DomainError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T = never>(code: DomainErrorCode, message: string): Result<T> {
  return { ok: false, error: { code, message } };
}
