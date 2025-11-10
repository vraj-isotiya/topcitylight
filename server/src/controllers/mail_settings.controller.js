import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { pool } from "../db/index.js";
import validator from "validator";

const createEmailSetting = asyncHandler(async (req, res) => {
  const {
    provider_type,
    smtp_host,
    smtp_port,
    smtp_username,
    smtp_password,
    imap_host,
    imap_port,
    imap_username,
    imap_password,
    api_key,
    from_email,
    from_name,
    updated_by,
    is_active = true,
  } = req.body;

  // Validate required fields
  if (
    !provider_type?.trim() ||
    !smtp_host?.trim() ||
    !smtp_port ||
    !smtp_username?.trim() ||
    !smtp_password?.trim() ||
    !from_email?.trim()
  ) {
    throw new ApiError(
      400,
      "Required fields missing: provider_type, smtp_host, smtp_port, smtp_username, smtp_password, from_email"
    );
  }

  if (!validator.isEmail(from_email)) {
    throw new ApiError(400, "Invalid sender email address");
  }

  if (updated_by && !validator.isUUID(updated_by)) {
    throw new ApiError(400, "Invalid updated_by ID");
  }

  if (smtp_port && isNaN(Number(smtp_port))) {
    throw new ApiError(400, "SMTP port must be a number");
  }

  if (imap_port && isNaN(Number(imap_port))) {
    throw new ApiError(400, "IMAP port must be a number");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO email_provider_settings (
      provider_type, smtp_host, smtp_port, smtp_username, smtp_password,
      imap_host, imap_port, imap_username, imap_password, api_key,
      from_email, from_name, is_active, updated_by, created_at, updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, COALESCE($13, TRUE), $14, NOW(), NOW()
    )
    RETURNING *;
    `,
    [
      provider_type.trim(),
      smtp_host.trim(),
      smtp_port,
      smtp_username.trim(),
      smtp_password.trim(),
      imap_host || null,
      imap_port || null,
      imap_username || null,
      imap_password || null,
      api_key || null,
      from_email.trim(),
      from_name?.trim() || null,
      is_active,
      updated_by || null,
    ]
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        rows[0],
        "Email provider setting created successfully"
      )
    );
});

//  GET EMAIL SETTINGS

const getEmailSettings = asyncHandler(async (req, res) => {
  const { user_id } = req.query; // optional filter

  let query = `
    SELECT 
      eps.id,
      eps.provider_type,
      eps.smtp_host,
      eps.smtp_port,
      eps.smtp_username,
      eps.imap_host,
      eps.imap_port,
      eps.imap_username,
      eps.api_key,
      eps.from_email,
      eps.from_name,
      eps.is_active,
      eps.last_uid,
      eps.updated_by,
      u.full_name AS updated_by_name,
      eps.created_at,
      eps.updated_at
    FROM email_provider_settings eps
    LEFT JOIN users u ON eps.updated_by = u.id
  `;

  const params = [];
  if (user_id) {
    if (!validator.isUUID(user_id)) {
      throw new ApiError(400, "Invalid user ID format");
    }
    query += ` WHERE eps.updated_by = $1 `;
    params.push(user_id);
  }

  query += ` ORDER BY eps.created_at DESC;`;

  const { rows } = await pool.query(query, params);

  if (rows.length === 0) {
    throw new ApiError(404, "No email provider settings found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        rows,
        "Email provider settings retrieved successfully"
      )
    );
});

export { createEmailSetting, getEmailSettings };
