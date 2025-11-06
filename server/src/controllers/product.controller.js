import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validator from "validator";
import { pool } from "../db/index.js";
import { paginateQuery } from "../utils/pagination.js";

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, is_active } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Product name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO products (name, description, is_active)
    VALUES ($1, $2, COALESCE($3, TRUE))
    RETURNING *;
    `,
    [name, description || null, is_active]
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result.rows[0], "Product created successfully"));
});

const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const params = [];
  let baseQuery = `
    SELECT 
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
    FROM products
  `;

  // Add search filter if provided
  if (search.trim() !== "") {
    params.push(`%${search.trim().toLowerCase()}%`);
    baseQuery += ` WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1`;
  }

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
    throw new ApiError(404, "No products found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products: data,
        pagination,
      },
      "Product list retrieved successfully"
    )
  );
});
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.trim()) {
    throw new ApiError(400, "Product ID is required");
  }

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid ID format. Expected UUID.");
  }

  const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, result.rows[0], "Product retrieved successfully")
    );
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;

  if (!id?.trim()) {
    throw new ApiError(400, "Product ID is required");
  }

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid ID format. Expected UUID.");
  }

  const fields = [];
  const values = [];
  let index = 1;

  if (name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(name);
  }
  if (description !== undefined) {
    fields.push(`description = $${index++}`);
    values.push(description);
  }
  if (is_active !== undefined) {
    fields.push(`is_active = $${index++}`);
    values.push(is_active);
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  const query = `
    UPDATE products
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *;
  `;
  values.push(id);

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result.rows[0], "Product updated successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.trim()) {
    throw new ApiError(400, "Product ID is required");
  }

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid ID format. Expected UUID.");
  }

  const result = await pool.query(
    "DELETE FROM products WHERE id = $1 RETURNING *",
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Product deleted successfully"));
});

export {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
