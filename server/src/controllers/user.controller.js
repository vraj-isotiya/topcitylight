import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import { pool } from "../db/index.js";
import jwt from "jsonwebtoken";
import validator from "validator";

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
};

const registerUser = asyncHandler(async (req, res) => {
  const { full_name, email, role, password } = req.body;

  if (
    !full_name?.trim() ||
    !email?.trim() ||
    !role?.trim() ||
    !password?.trim()
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (!validator.isEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const existingUserQuery = `
      SELECT 1 FROM users WHERE email = $1 ;
    `;
  const { rowCount } = await pool.query(existingUserQuery, [email]);
  if (rowCount > 0) {
    throw new ApiError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const insertQuery = `
      INSERT INTO users (full_name,  email,role ,password)
      VALUES ($1, $2, $3,$4)
      RETURNING id, full_name,  email;
    `;
  const values = [full_name, email, role, hashedPassword];
  const { rows } = await pool.query(insertQuery, values);
  const user = rows[0];

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await pool.query(`UPDATE users SET refresh_token = $1 WHERE id = $2`, [
    refreshToken,
    user.id,
  ]);

  return res
    .status(201)
    .cookie("auth_access_token", accessToken, cookieOptions)
    .cookie("auth_refresh_token", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        {
          user,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
        "User registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    throw new ApiError(400, "All fields are required");
  }

  if (!validator.isEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const query = `
      SELECT id, full_name, email, password,role ,refresh_token,is_active
      FROM users
      WHERE email = $1
      LIMIT 1;
    `;

  const result = await pool.query(query, [email]);
  if (result.rows.length === 0) {
    throw new ApiError(401, "Invalid email or password");
  }

  const loginuser = result.rows[0];

  if (!loginuser.is_active) {
    throw new ApiError(403, "Your account is inactive.");
  }
  const isPasswordValid = await bcrypt.compare(password, loginuser.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken(loginuser);
  const refreshToken = generateRefreshToken(loginuser);

  await pool.query(`UPDATE users SET refresh_token = $1 WHERE id = $2`, [
    refreshToken,
    loginuser.id,
  ]);

  const user = {
    id: loginuser.id,
    email: loginuser.email,
    role: loginuser.role,
  };

  return res
    .status(200)
    .cookie("auth_access_token", accessToken, cookieOptions)
    .cookie("auth_refresh_token", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
        "User login successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  const { rows } = await pool.query("SELECT id FROM users WHERE id = $1", [
    userId,
  ]);
  if (rows.length === 0) {
    throw new ApiError(404, "User not found");
  }

  await pool.query(
    `UPDATE users 
     SET refresh_token = NULL
     WHERE id = $1`,
    [userId]
  );

  return res
    .status(200)
    .clearCookie("auth_access_token")
    .clearCookie("auth_refresh_token")
    .json(new ApiResponse(200, {}, "User logout"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.auth_refresh_token || req.body?.auth_refresh_token;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const userId = decoded?.id;
    if (!userId) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const userQuery = `SELECT id, email,role, refresh_token 
      FROM users 
      WHERE id = $1
      LIMIT 1;`;
    const { rows } = await pool.query(userQuery, [userId]);
    const user = rows[0];

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refresh_token) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const updateQuery = `UPDATE users SET refresh_token = $1 WHERE id = $2`;
    await pool.query(updateQuery, [newRefreshToken, user.id]);

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    return res
      .cookie("auth_access_token", accessToken, cookieOptions)
      .cookie("auth_refresh_token", newRefreshToken, cookieOptions)
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (err) {
    throw new ApiError(401, err.message || "Invalid refresh token");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: req.user }, "User fetched successfully")
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!oldPassword?.trim() || !newPassword?.trim()) {
    throw new ApiError(400, "Old and new passwords are required");
  }

  const { rows } = await pool.query(
    "SELECT id, password FROM users WHERE id = $1",
    [userId]
  );

  if (rows.length === 0) {
    throw new ApiError(404, "User not found");
  }

  const user = rows[0];

  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await pool.query(
    `
    UPDATE users
    SET password = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    `,
    [hashedPassword, userId]
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
};
