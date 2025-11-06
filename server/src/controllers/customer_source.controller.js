import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validator from "validator";
import { pool } from "../db/index.js";
import { paginateQuery } from "../utils/pagination.js";

const createCustomerSource = asyncHandler(async (req, res) => {
  const { name, is_active } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Customer source name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO customer_sources (name, is_active)
    VALUES ($1, COALESCE($2, TRUE))
    RETURNING *;
    `,
    [name.trim(), is_active]
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        result.rows[0],
        "Customer source created successfully"
      )
    );
});

const getAllCustomerSources = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const params = [];
  let baseQuery = `
    SELECT 
      id,
      name,
      is_active,
      created_at,
      updated_at
    FROM customer_sources
  `;

  baseQuery += ` ORDER BY created_at DESC`;

  // Use pagination utility
  const { data, pagination } = await paginateQuery(
    pool,
    baseQuery,
    params,
    page,
    limit
  );

  if (data.length === 0) {
    throw new ApiError(404, "No customer sources found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        customer_sources: data,
        pagination,
      },
      "Customer sources retrieved successfully"
    )
  );
});

const getCustomerSourceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid customer source ID");
  }

  const result = await pool.query(
    "SELECT * FROM customer_sources WHERE id = $1 LIMIT 1;",
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Customer source not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.rows[0],
        "Customer source retrieved successfully"
      )
    );
});

const updateCustomerSource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid customer source ID");
  }

  if (!name?.trim()) {
    throw new ApiError(400, "Customer source name is required");
  }

  const fields = [];
  const values = [];
  let index = 1;

  if (name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(name);
  }

  if (is_active !== undefined) {
    fields.push(`is_active = $${index++}`);
    values.push(is_active);
  }

  const query = `
    UPDATE customer_sources
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *;
  `;
  values.push(id);

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Customer source not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.rows[0],
        "Customer source updated successfully"
      )
    );
});

const deleteCustomerSource = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid customer source ID");
  }

  const result = await pool.query(
    "DELETE FROM customer_sources WHERE id = $1 RETURNING *;",
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Customer source not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Customer source deleted successfully"));
});

export {
  createCustomerSource,
  getAllCustomerSources,
  getCustomerSourceById,
  updateCustomerSource,
  deleteCustomerSource,
};
