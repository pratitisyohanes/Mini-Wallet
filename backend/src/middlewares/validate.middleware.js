import { validationError } from '../utils/AppError.js';

/**
 * Validates req[source] against a Zod schema. Parsed values are stored in
 * req.validated so controllers never read raw, unvalidated input.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw validationError(errors);
    }

    req.validated = result.data;
    next();
  };
}
