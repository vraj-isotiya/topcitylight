import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import { pool } from "../db/index.js";
import validator from "validator";
import { paginateQuery } from "../utils/pagination.js";

const createUser = asyncHandler(async (req, res) => {
  const { full_name, email, password, role, is_active } = req.body;

  if (
    !full_name?.trim() ||
    !email?.trim() ||
    !password?.trim() ||
    !role?.trim()
  ) {
    throw new ApiError(400, "All fields  are required");
  }

  if (!validator.isEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const existingUser = await pool.query(
    "SELECT 1 FROM users WHERE email = $1",
    [email]
  );
  if (existingUser.rowCount > 0) {
    throw new ApiError(409, "User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const insertQuery = `
    INSERT INTO users (full_name, email, password, role, is_active)
    VALUES ($1, $2, $3, $4, COALESCE($5, TRUE))
    RETURNING id, full_name, email, role, is_active;
  `;

  const { rows } = await pool.query(insertQuery, [
    full_name,
    email,
    hashedPassword,
    role.toLowerCase(),
    is_active,
  ]);

  return res
    .status(201)
    .json(new ApiResponse(201, rows[0], "User created successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const params = [];
  let baseQuery = `
    SELECT 
      id,
      full_name,
      email,
      role,
      is_active,
      created_at
    FROM users
    WHERE role != 'admin'
  `;

  baseQuery += ` ORDER BY created_at DESC`;

  // Use pagination util
  const { data, pagination } = await paginateQuery(
    pool,
    baseQuery,
    params,
    page,
    limit
  );

  if (data.length === 0) {
    throw new ApiError(404, "No non-admin users found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users: data,
        pagination,
      },
      "User list retrieved successfully"
    )
  );
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const { rows } = await pool.query(
    "SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id = $1",
    [id]
  );

  if (rows.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, rows[0], "User retrieved successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, email, password, role, is_active } = req.body;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const fields = [];
  const values = [];
  let index = 1;

  if (full_name?.trim()) {
    fields.push(`full_name = $${index++}`);
    values.push(full_name);
  }

  if (email?.trim()) {
    if (!validator.isEmail(email)) {
      throw new ApiError(400, "Invalid email format");
    }
    fields.push(`email = $${index++}`);
    values.push(email);
  }

  if (password?.trim()) {
    const hashedPassword = await bcrypt.hash(password, 10);
    fields.push(`password = $${index++}`);
    values.push(hashedPassword);
  }

  if (role?.trim()) {
    fields.push(`role = $${index++}`);
    values.push(role);
  }

  if (typeof is_active !== "undefined") {
    fields.push(`is_active = $${index++}`);
    values.push(is_active);
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  const query = `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING id, full_name, email, role, is_active, updated_at;
  `;
  values.push(id);

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result.rows[0], "User updated successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const userCheck = await pool.query("SELECT role FROM users WHERE id = $1;", [
    id,
  ]);

  if (userCheck.rows.length === 0) {
    throw new ApiError(404, "User not found");
  }

  if (userCheck.rows[0].role === "admin") {
    throw new ApiError(403, "Admin users cannot be deleted");
  }

  const { rows } = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING id, full_name, email, role;",
    [id]
  );

  return res
    .status(200)
    .json(new ApiResponse(200, rows[0], "User deleted successfully"));
});

export { createUser, getAllUsers, getUserById, updateUser, deleteUser };
