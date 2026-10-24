import { z } from "zod";
import { AppError } from "../utils/AppError.js";

// Parses req.body / req.query / req.params against zod schemas. Parsed values
// (with unknown keys stripped and types coerced) land on req.valid, and the
// handlers only ever read from there.
export function validate(schemas) {
  return (req, _res, next) => {
    req.valid ??= {};
    for (const part of ["params", "query", "body"]) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        return next(
          AppError.badRequest("Some fields need attention.", {
            code: "VALIDATION_ERROR",
            details: formatIssues(result.error),
          }),
        );
      }
      req.valid[part] = result.data;
    }
    next();
  };
}

function formatIssues(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  return { fields };
}

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
