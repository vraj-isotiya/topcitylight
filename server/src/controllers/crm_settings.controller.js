import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validator from "validator";
import { pool } from "../db/index.js";

const getCrmSettings = asyncHandler(async (req, res) => {
  let query;
  let values = [];

  query = `SELECT * FROM crm_settings ORDER BY updated_at DESC LIMIT 1;`;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new ApiError(404, "CRM settings not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.rows[0],
        "CRM settings retrieved successfully"
      )
    );
});

const updateCrmSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    crm_name,
    crm_logo_url,
    primary_color,
    secondary_color,
    font_family,
    font_size,
  } = req.body;

  // Validate ID
  if (!validator.isUUID(id)) {
    throw new ApiError(400, "Invalid CRM settings ID");
  }

  // Collect fields to update
  const fields = [];
  const values = [];
  let index = 1;

  if (crm_name?.trim()) {
    fields.push(`crm_name = $${index++}`);
    values.push(crm_name.trim());
  }
  if (crm_logo_url !== undefined) {
    fields.push(`crm_logo_url = $${index++}`);
    values.push(crm_logo_url || null);
  }
  if (primary_color?.trim()) {
    fields.push(`primary_color = $${index++}`);
    values.push(primary_color.trim());
  }
  if (secondary_color?.trim()) {
    fields.push(`secondary_color = $${index++}`);
    values.push(secondary_color.trim());
  }
  if (font_family?.trim()) {
    fields.push(`font_family = $${index++}`);
    values.push(font_family.trim());
  }
  if (font_size?.trim()) {
    fields.push(`font_size = $${index++}`);
    values.push(font_size.trim());
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No fields provided for update");
  }

  // Add updated_at field
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE crm_settings
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *;
  `;

  values.push(id);

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new ApiError(404, "CRM settings not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, result.rows[0], "CRM settings updated successfully")
    );
});

export { getCrmSettings, updateCrmSettings };
