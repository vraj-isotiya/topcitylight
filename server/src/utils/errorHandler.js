import { ApiError } from "./ApiError.js";

const errorHandler = (err, req, res, next) => {
  // Handle custom ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      success: false,
      data: null,
      message: err.message,
      errors: err.errors,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Handle PostgreSQL errors (safe messages)
  if (err.code) {
    let friendlyMessage = "Database error occurred";
    let statusCode = 500;

    switch (err.code) {
      case "23505": // unique_violation
        friendlyMessage = "Duplicate entry — this record already exists.";
        statusCode = 409;
        break;

      case "23503": // foreign_key_violation
        friendlyMessage =
          "Operation failed due to related data (foreign key constraint).";
        statusCode = 400;
        break;

      case "22P02": // invalid_text_representation (bad UUID)
        friendlyMessage = "Invalid input format (possibly invalid ID).";
        statusCode = 400;
        break;

      case "23502": // not_null_violation
        friendlyMessage = "Required field missing.";
        statusCode = 400;
        break;

      case "42703": // undefined_column
        friendlyMessage = "Invalid field name or query error.";
        statusCode = 400;
        break;

      default:
        // generic SQL message (only show full details in dev)
        friendlyMessage =
          process.env.NODE_ENV === "development"
            ? err.message
            : "Unexpected database error.";
        statusCode = 500;
        break;
    }

    return res.status(statusCode).json({
      statusCode,
      success: false,
      message: friendlyMessage,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Handle any other unexpected errors
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong. Please try again later.",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorHandler;
