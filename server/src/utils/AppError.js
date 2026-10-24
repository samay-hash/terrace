// An error that is safe to show to the client. Anything thrown that is not an
// AppError is treated as unexpected and reported as a generic 500.
export class AppError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, options) {
    return new AppError(400, message, { code: "BAD_REQUEST", ...options });
  }

  static unauthorized(message = "Please sign in to continue.") {
    return new AppError(401, message, { code: "UNAUTHORIZED" });
  }

  static forbidden(message = "You do not have access to this resource.") {
    return new AppError(403, message, { code: "FORBIDDEN" });
  }

  static notFound(message = "Not found.") {
    return new AppError(404, message, { code: "NOT_FOUND" });
  }

  static conflict(message, options) {
    return new AppError(409, message, { code: "CONFLICT", ...options });
  }
}
