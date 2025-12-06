import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validator from "validator";
import { pool } from "../db/index.js";
import { paginateQuery } from "../utils/pagination.js";

// Create Customer
const createCustomer = asyncHandler(async (req, res) => {
  let {
    name,
    email,
    phone,
    company,
    address,
    country,
    province,
    city,
    postal_code,
    fax,
    bank_name,
    bank_account,
    website,
    contact_person_name,
    contact_person_email,
    contact_person_phone,
    notes,
    status,
    customer_source_id,
    business_type_id,
  } = req.body;

  //  Trim all string inputs safely
  const trimField = (value) =>
    typeof value === "string" ? value.trim() || null : value;

  name = trimField(name);
  email = trimField(email);
  phone = trimField(phone);
  company = trimField(company);
  address = trimField(address);
  country = trimField(country);
  province = trimField(province);
  city = trimField(city);
  postal_code = trimField(postal_code);
  fax = trimField(fax);
  bank_name = trimField(bank_name);
  bank_account = trimField(bank_account);
  website = trimField(website);
  contact_person_name = trimField(contact_person_name);
  contact_person_email = trimField(contact_person_email);
  contact_person_phone = trimField(contact_person_phone);
  notes = trimField(notes);
  status = trimField(status);

  if (
    !name ||
    !email ||
    !status ||
    !phone ||
    !company ||
    !address ||
    !country ||
    !province ||
    !city ||
    !postal_code ||
    !bank_name ||
    !bank_account ||
    !contact_person_name ||
    !contact_person_phone
  ) {
    throw new ApiError(400, "All feild are required");
  }

  if (!validator.isEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (contact_person_email && !validator.isEmail(contact_person_email)) {
    throw new ApiError(400, "Invalid contact person email");
  }

  if (customer_source_id && !validator.isUUID(customer_source_id)) {
    throw new ApiError(400, "Invalid customer source ID");
  }

  if (business_type_id && !validator.isUUID(business_type_id)) {
    throw new ApiError(400, "Invalid business type ID");
  }

  const existingCustomerQuery = `
      SELECT 1 FROM customers WHERE email = $1 ;
    `;
  const { rowCount } = await pool.query(existingCustomerQuery, [email]);

  if (rowCount > 0) {
    throw new ApiError(409, "customers with this email already exists");
  }

  const result = await pool.query(
    `
    INSERT INTO customers (
      name, email, phone, company, address, country, province, city,
      postal_code, fax, bank_name, bank_account, website,
      contact_person_name, contact_person_email,contact_person_phone ,notes, status,
      created_by, customer_source_id, business_type_id
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13,
      $14, $15, $16, $17,
      $18, $19, $20,$21
    )
    RETURNING *;
    `,
    [
      name,
      email,
      phone,
      company,
      address,
      country,
      province,
      city,
      postal_code,
      fax,
      bank_name,
      bank_account,
      website,
      contact_person_name,
      contact_person_email,
      contact_person_phone,
      notes,
      status,
      req.user?.id || null,
      customer_source_id || null,
      business_type_id || null,
    ]
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, result.rows[0], "Customer created successfully")
    );
});

// Get All Customers
const getAllCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const baseQuery = `
    SELECT 
      c.id,
      c.name,
      c.email,
      c.phone,
      c.company,
      c.address,
      c.country,
      c.province,
      c.city,
      c.postal_code,
      c.fax,
      c.bank_name,
      c.bank_account,
      c.website,
      c.contact_person_name,
      c.contact_person_email,
      c.contact_person_phone,
      c.notes,
      c.status,
      COALESCE(u.full_name, '') AS created_by_name,
      COALESCE(cs.name, '') AS customer_source_name,
      COALESCE(bt.name, '') AS business_type_name,
      c.created_at,
      c.updated_at,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'product_id', p.id,
            'product_name', p.name,
            'description', p.description,
            'is_active', p.is_active
          )
        ) FILTER (WHERE p.id IS NOT NULL), 
        '[]'
      ) AS products
    FROM customers c
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN customer_sources cs ON c.customer_source_id = cs.id
    LEFT JOIN business_types bt ON c.business_type_id = bt.id
    LEFT JOIN customer_products cp ON c.id = cp.customer_id
    LEFT JOIN products p ON cp.product_id = p.id
    GROUP BY c.id, u.full_name, cs.name, bt.name
    ORDER BY c.created_at DESC
  `;

  // Use pagination util
  const { data, pagination } = await paginateQuery(
    pool,
    baseQuery,
    [],
    page,
    limit
  );

  if (data.length === 0) {
    throw new ApiError(404, "No customers found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { customers: data, pagination },
        "Customer list retrieved successfully"
      )
    );
});

// Get Customer By ID
const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid customer ID");
  }

  const query = `
    SELECT 
      c.id,
      c.name,
      c.email,
      c.phone,
      c.company,
      c.address,
      c.country,
      c.province,
      c.city,
      c.postal_code,
      c.fax,
      c.bank_name,
      c.bank_account,
      c.website,
      c.contact_person_name,
      c.contact_person_email,
      c.contact_person_phone,
      c.notes,
      c.status,
      COALESCE(u.full_name, '') AS created_by_name,
      COALESCE(cs.name, '') AS customer_source_name,
      COALESCE(bt.name, '') AS business_type_name,
      c.created_at,
      c.updated_at,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'product_id', p.id,
            'product_name', p.name,
            'description', p.description,
            'is_active', p.is_active
          )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS products
    FROM customers c
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN customer_sources cs ON c.customer_source_id = cs.id
    LEFT JOIN business_types bt ON c.business_type_id = bt.id
    LEFT JOIN customer_products cp ON c.id = cp.customer_id
    LEFT JOIN products p ON cp.product_id = p.id
    WHERE c.id = $1
    GROUP BY 
      c.id, u.full_name, cs.name, bt.name;
  `;

  const { rows } = await pool.query(query, [id]);

  if (rows.length === 0) {
    throw new ApiError(404, "Customer not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, rows[0], "Customer retrieved successfully"));
});

//  Update Customer By ID
const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid customer ID");
  }

  const trimField = (value) =>
    typeof value === "string" ? value.trim() || null : value;

  const body = {};
  for (const [key, value] of Object.entries(req.body)) {
    body[key] = trimField(value);
  }

  const allowedFields = [
    "name",
    "email",
    "phone",
    "company",
    "address",
    "country",
    "province",
    "city",
    "postal_code",
    "fax",
    "bank_name",
    "bank_account",
    "website",
    "contact_person_name",
    "contact_person_email",
    "contact_person_phone",
    "notes",
    "status",
    "customer_source_id",
    "business_type_id",
  ];

  const fields = [];
  const values = [];
  let index = 1;

  for (const field of allowedFields) {
    const value = body[field];
    if (value !== undefined && value !== "") {
      if (field === "email" && !validator.isEmail(value))
        throw new ApiError(400, "Invalid email format");
      if (
        field === "contact_person_email" &&
        value &&
        !validator.isEmail(value)
      )
        throw new ApiError(400, "Invalid contact person email");
      if (
        (field === "customer_source_id" || field === "business_type_id") &&
        value &&
        !validator.isUUID(value)
      )
        throw new ApiError(400, `Invalid ${field} ID`);

      fields.push(`${field} = $${index++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  const query = `
    UPDATE customers
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *;
  `;

  values.push(id);

  const { rows } = await pool.query(query, values);

  if (rows.length === 0) {
    throw new ApiError(404, "Customer not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, rows[0], "Customer updated successfully"));
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid customer ID");
  }

  const { rows } = await pool.query(
    "DELETE FROM customers WHERE id = $1 RETURNING id, name, email;",
    [id]
  );

  if (rows.length === 0) {
    throw new ApiError(404, "Customer not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Customer deleted successfully"));
});

const getCustomerStats = asyncHandler(async (req, res) => {
  const query = `
    SELECT
      COUNT(*)::int AS total_customers,
      COUNT(*) FILTER (WHERE status = 'Lead')::int AS leads,
      COUNT(*) FILTER (WHERE status = 'Prospect')::int AS prospects
    FROM customers;
  `;

  const { rows } = await pool.query(query);

  const stats = rows[0] || {
    total_customers: 0,
    leads: 0,
    prospects: 0,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCustomers: stats.total_customers ?? 0,
        leads: stats.leads ?? 0,
        prospects: stats.prospects ?? 0,
      },
      "Customer stats retrieved successfully"
    )
  );
});

export {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
};
