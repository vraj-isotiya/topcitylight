import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validator from "validator";
import { pool } from "../db/index.js";
import { paginateQuery } from "../utils/pagination.js";

const createBusinessType = asyncHandler(async (req, res) => {
  const { name, is_active } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Business type name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO business_types (name, is_active)
    VALUES ($1, COALESCE($2, TRUE))
    RETURNING *;
    `,
    [name.trim(), is_active]
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, result.rows[0], "Business type created successfully")
    );
});

const getAllBusinessTypes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const params = [];
  let baseQuery = `
    SELECT 
      id,
      name,
      is_active,
      created_at,
      updated_at
    FROM business_types
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
    throw new ApiError(404, "No business types found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        business_types: data,
        pagination,
      },
      "Business types retrieved successfully"
    )
  );
});

const getBusinessTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid business type ID");
  }

  const result = await pool.query(
    "SELECT * FROM business_types WHERE id = $1 LIMIT 1;",
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Business type not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.rows[0],
        "Business type retrieved successfully"
      )
    );
});

const updateBusinessType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid business type ID");
  }

  const fields = [];
  const values = [];
  let index = 1;

  if (!name?.trim()) {
    throw new ApiError(400, "Business type name is required");
  }

  if (name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(name);
  }

  if (typeof is_active === "boolean") {
    fields.push(`is_active = $${index++}`);
    values.push(is_active);
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  const query = `
    UPDATE business_types
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *;
  `;
  values.push(id);

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Business type not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, result.rows[0], "Business type updated successfully")
    );
});

const deleteBusinessType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid business type ID");
  }

  const result = await pool.query(
    "DELETE FROM business_types WHERE id = $1 RETURNING *;",
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Business type not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Business type deleted successfully"));
});

export {
  createBusinessType,
  getAllBusinessTypes,
  getBusinessTypeById,
  updateBusinessType,
  deleteBusinessType,
};
