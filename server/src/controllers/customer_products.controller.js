import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validator from "validator";
import { pool } from "../db/index.js";
import { paginateQuery } from "../utils/pagination.js";

const addCustomerProduct = asyncHandler(async (req, res) => {
  const { customer_id, product_id } = req.body;

  if (!validator.isUUID(customer_id)) {
    throw new ApiError(400, "Invalid customer ID");
  }
  if (!validator.isUUID(product_id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const customerCheck = await pool.query(
    "SELECT id FROM customers WHERE id = $1 LIMIT 1;",
    [customer_id]
  );
  if (customerCheck.rows.length === 0) {
    throw new ApiError(404, "Customer not found");
  }

  const productCheck = await pool.query(
    "SELECT id FROM products WHERE id = $1 LIMIT 1;",
    [product_id]
  );
  if (productCheck.rows.length === 0) {
    throw new ApiError(404, "Product not found");
  }

  const existing = await pool.query(
    "SELECT id FROM customer_products WHERE customer_id = $1 AND product_id = $2;",
    [customer_id, product_id]
  );
  if (existing.rows.length > 0) {
    throw new ApiError(400, "Product already assigned to this customer");
  }

  const { rows } = await pool.query(
    `
      INSERT INTO customer_products (customer_id, product_id)
      VALUES ($1, $2)
      RETURNING *;
    `,
    [customer_id, product_id]
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, rows[0], "Product added to customer successfully")
    );
});

const getProductsByCustomerId = asyncHandler(async (req, res) => {
  const { customer_id } = req.params;
  const { page = 1, limit = 10, search = "" } = req.query;

  if (!validator.isUUID(customer_id)) {
    throw new ApiError(400, "Invalid customer ID");
  }

  const params = [customer_id];
  let baseQuery = `
    SELECT 
      cp.id,
      p.id AS product_id,
      p.name AS product_name,
      p.description AS product_description,
      p.is_active,
      p.created_at,
      p.updated_at
    FROM customer_products cp
    JOIN products p ON cp.product_id = p.id
    WHERE cp.customer_id = $1
  `;

  baseQuery += ` ORDER BY p.created_at DESC`;

  // Use pagination util
  const { data, pagination } = await paginateQuery(
    pool,
    baseQuery,
    params,
    page,
    limit
  );

  if (data.length === 0) {
    throw new ApiError(404, "No products found for this customer");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products: data,
        pagination,
      },
      "Customer products retrieved successfully"
    )
  );
});

const deleteCustomerProduct = asyncHandler(async (req, res) => {
  const { customer_id, product_id } = req.params;

  if (!validator.isUUID(customer_id)) {
    throw new ApiError(400, "Invalid customer ID");
  }
  if (!validator.isUUID(product_id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const { rows } = await pool.query(
    `
      DELETE FROM customer_products
      WHERE customer_id = $1 AND product_id = $2
      RETURNING id;
    `,
    [customer_id, product_id]
  );

  if (rows.length === 0) {
    throw new ApiError(404, "No such product found for this customer");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Customer product deleted successfully"));
});

export { addCustomerProduct, getProductsByCustomerId, deleteCustomerProduct };
