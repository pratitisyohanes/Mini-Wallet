/**
 * An expected, client-facing error. The global error handler turns it into
 * a JSON response with the given status code.
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode HTTP status code
   * @param {string} message Human-readable message shown to the user
   * @param {{ field: string, message: string }[]} [errors] Field-level details
   */
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const VALIDATION_FAILED_MESSAGE = 'Validasi gagal.';

export function validationError(errors) {
  return new AppError(422, VALIDATION_FAILED_MESSAGE, errors);
}
