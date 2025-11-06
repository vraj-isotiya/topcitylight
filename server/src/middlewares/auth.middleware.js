import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { pool } from "../db/index.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.auth_access_token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request - missing token");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const query = `
      SELECT id, full_name, email,role
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [decodedToken.id]);

    if (result.rows.length === 0) {
      throw new ApiError(401, "Invalid access token — user not found");
    }

    req.user = result.rows[0];

    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid or expired access token"
    );
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  try {
    const userEmail = req.user?.email;

    if (!userEmail) {
      throw new ApiError(401, "Unauthorized request - missing user email");
    }

    const { rows } = await pool.query(
      "SELECT role FROM users WHERE email = $1 LIMIT 1;",
      [userEmail]
    );

    if (rows.length === 0) {
      throw new ApiError(404, "User not found");
    }

    const user = rows[0];

    if (user.role.toLowerCase() !== "admin") {
      throw new ApiError(403, "Access denied: Admin privileges required");
    }

    next();
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

export { verifyJWT, isAdmin };
