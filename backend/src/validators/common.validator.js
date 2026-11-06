import { z } from 'zod';

/** A string field with Indonesian messages for a missing value or a non-string value. */
export const requiredString = (fieldLabel) =>
  z.string({
    error: (issue) =>
      issue.input === undefined
        ? `${fieldLabel} wajib diisi.`
        : `${fieldLabel} harus berupa teks.`,
  });
