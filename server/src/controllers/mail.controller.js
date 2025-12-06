import { pool } from "../db/index.js";
import nodemailer from "nodemailer";
import validator from "validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { paginateQuery } from "../utils/pagination.js";
import { fetchIncomingEmails } from "../utils/imapFetcher.js";

// SEND EMAIL (Creates new thread)
const sendEmail = asyncHandler(async (req, res) => {
  const { user_id, customer_id, subject, body } = req.body;

  if (!user_id || !customer_id || !subject?.trim() || !body?.trim()) {
    throw new ApiError(
      400,
      "All fields (user_id, customer_id, subject, body) are required"
    );
  }

  if (!validator.isUUID(user_id)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  if (!validator.isUUID(customer_id)) {
    throw new ApiError(400, "Invalid customer ID format");
  }

  //  Get customer email
  const { rows: custRows } = await pool.query(
    "SELECT email FROM customers WHERE id = $1",
    [customer_id]
  );
  if (custRows.length === 0) {
    throw new ApiError(404, "Customer not found");
  }
  const recipient = custRows[0].email;

  if (!validator.isEmail(recipient)) {
    throw new ApiError(400, "Invalid customer email");
  }

  //   Replace with user’s saved SMTP settings
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "developer.vraj@gmail.com",
      pass: "scjz gsed ptly znhc",
    },
  });

  //  Send email
  const info = await transporter.sendMail({
    from: "developer.vraj@gmail.com",
    to: recipient,
    subject: subject.trim(),
    html: body.trim(),
  });

  //  Insert new email thread
  const { rows } = await pool.query(
    `INSERT INTO email_threads (customer_id, subject, body, sent_by, message_id, status, sent_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'sent', NOW(), NOW(), NOW())
     RETURNING *`,
    [customer_id, subject.trim(), body.trim(), user_id, info.messageId]
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        rows[0],
        "Email sent and thread created successfully"
      )
    );
});

// REPLY EMAIL (Existing thread)
const replyToEmail = asyncHandler(async (req, res) => {
  const { thread_id, reply_body } = req.body;

  //  Input validation
  if (!thread_id || !reply_body?.trim()) {
    throw new ApiError(400, "thread_id, user_id, and reply_body are required");
  }

  if (!validator.isUUID(thread_id)) {
    throw new ApiError(400, "Invalid thread ID format");
  }

  //  Fetch thread
  const { rows: threadRows } = await pool.query(
    "SELECT * FROM email_threads WHERE id = $1",
    [thread_id]
  );
  if (threadRows.length === 0) {
    throw new ApiError(404, "Email thread not found");
  }
  const thread = threadRows[0];

  // Fetch customer email
  const { rows: custRows } = await pool.query(
    "SELECT email FROM customers WHERE id = $1",
    [thread.customer_id]
  );
  if (custRows.length === 0) {
    throw new ApiError(404, "Customer not found");
  }
  const recipient = custRows[0].email;

  //  Send reply
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "developer.vraj@gmail.com",
      pass: "scjz gsed ptly znhc",
    },
  });

  const info = await transporter.sendMail({
    from: "developer.vraj@gmail.com",
    to: recipient,
    subject: `Re: ${thread.subject}`,
    html: reply_body.trim(),
    inReplyTo: thread.message_id,
    references: [thread.message_id],
  });

  //  Save reply in DB
  const { rows: replyRows } = await pool.query(
    `INSERT INTO email_replies (thread_id, customer_id, reply_body, sender_email, message_id, in_reply_to, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [
      thread.id,
      thread.customer_id,
      reply_body.trim(),
      "developer.vraj@gmail.com",
      info.messageId,
      thread.message_id,
    ]
  );

  //  Update thread status
  await pool.query(
    `UPDATE email_threads SET status = 'replied', updated_at = NOW() WHERE id = $1`,
    [thread.id]
  );

  return res
    .status(200)
    .json(new ApiResponse(200, replyRows[0], "Reply sent successfully"));
});

// FETCH EMAIL THREADS + REPLIES

const getEmailThreads = asyncHandler(async (req, res) => {
  const { customer_id } = req.params;

  if (!validator.isUUID(customer_id)) {
    throw new ApiError(400, "Invalid customer ID");
  }

  // 🔹 Fetch threads
  const { rows: threads } = await pool.query(
    `
    SELECT 
      et.id AS thread_id,
      et.subject,
      et.body,
      et.status,
      et.message_id,
      et.sent_at,
      et.created_at,
      et.updated_at,
      u.full_name AS sent_by_name,
      u.email AS sent_by_email,
      c.name AS customer_name,
      c.email AS customer_email
    FROM email_threads et
    LEFT JOIN users u ON et.sent_by = u.id
    LEFT JOIN customers c ON et.customer_id = c.id
    WHERE et.customer_id = $1
    ORDER BY et.created_at DESC;
    `,
    [customer_id]
  );

  if (threads.length === 0) {
    throw new ApiError(404, "No email threads found for this customer");
  }

  //  Fetch replies
  const { rows: replies } = await pool.query(
    `
    SELECT 
      er.thread_id,
      er.reply_body,
      er.sender_email,
      er.message_id,
      er.in_reply_to,
      er.created_at,
      er.updated_at,
      er.received_at
    FROM email_replies er
    WHERE er.customer_id = $1
    ORDER BY er.created_at ASC;
    `,
    [customer_id]
  );

  //  Combine threads + replies
  const combined = threads.map((thread) => ({
    thread_id: thread.thread_id,
    subject: thread.subject,
    body: thread.body,
    status: thread.status,
    sent_at: thread.sent_at,
    message_id: thread.message_id,
    sent_by: {
      name: thread.sent_by_name,
      email: thread.sent_by_email,
    },
    customer: {
      name: thread.customer_name,
      email: thread.customer_email,
    },
    replies: replies
      .filter((r) => r.thread_id === thread.thread_id)
      .map((r) => ({
        reply_body: r.reply_body,
        sender_email: r.sender_email,
        message_id: r.message_id,
        in_reply_to: r.in_reply_to,
        created_at: r.created_at,
        received_at: r.received_at,
      })),
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(200, combined, "Email threads retrieved successfully")
    );
});

const getAllEmails = asyncHandler(async (req, res) => {
  //  Parse and validate pagination params
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  if (isNaN(page) || page < 1) {
    throw new ApiError(400, "Invalid page number");
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "Invalid limit value (1–100 allowed)");
  }

  const { customer_id } = req.query; // optional filter

  //  Validate optional UUID filter
  if (customer_id && !validator.isUUID(customer_id)) {
    throw new ApiError(400, "Invalid customer ID format");
  }

  //  Base SQL query
  let baseQuery = `
    SELECT 
      et.id,
      et.subject,
      et.body,
      et.status,
      et.sent_at,
      et.customer_id,
      et.sent_by,
      json_build_object('id', c.id, 'name', c.name, 'email', c.email) AS customer,
      json_build_object('id', u.id, 'full_name', u.full_name, 'email', u.email) AS sent_by_user
    FROM email_threads et
    LEFT JOIN customers c ON et.customer_id = c.id
    LEFT JOIN users u ON et.sent_by = u.id
  `;

  const params = [];

  //  Optional customer filter
  if (customer_id) {
    baseQuery += ` WHERE et.customer_id = $1 `;
    params.push(customer_id);
  }

  baseQuery += ` ORDER BY et.sent_at DESC `;

  //  Fetch paginated threads
  const { data: threads, pagination } = await paginateQuery(
    pool,
    baseQuery,
    params,
    page,
    limit
  );

  //  Handle no results gracefully
  if (!threads || threads.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { threads: [], pagination },
          "No email threads found"
        )
      );
  }

  //  Extract thread IDs for replies query
  const threadIds = threads.map((t) => t.id);
  if (threadIds.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { threads: [], pagination }, "No threads found")
      );
  }

  //  Fetch all replies for visible threads
  const repliesQuery = `
    SELECT 
      er.id,
      er.thread_id,
      er.reply_body,
      er.received_at,
      er.sender_email
    FROM email_replies er
    WHERE er.thread_id = ANY($1::uuid[])
    ORDER BY er.received_at ASC;
  `;
  const { rows: replies } = await pool.query(repliesQuery, [threadIds]);

  //  Group replies by thread_id
  const groupedReplies = replies.reduce((acc, reply) => {
    if (!acc[reply.thread_id]) acc[reply.thread_id] = [];
    acc[reply.thread_id].push({
      id: reply.id,
      reply_body: reply.reply_body,
      sender_email: reply.sender_email,
      received_at: reply.received_at,
    });
    return acc;
  }, {});

  //  Combine threads and replies
  const combinedThreads = threads.map((thread) => ({
    id: thread.id,
    subject: thread.subject,
    body: thread.body,
    status: thread.status,
    sent_at: thread.sent_at,
    sent_by: thread.sent_by_user,
    customer: thread.customer,
    replies: groupedReplies[thread.id] || [],
  }));

  //  Return formatted API response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        threads: combinedThreads,
        pagination,
      },
      "Email threads fetched successfully"
    )
  );
});

const getEmailStats = asyncHandler(async (req, res) => {
  const query = `
    WITH threads AS (
      SELECT
        et.id,
        et.status,
        et.sent_at,
        COUNT(er.id) AS reply_count
      FROM email_threads et
      LEFT JOIN email_replies er ON er.thread_id = et.id
      GROUP BY et.id
    )
    SELECT
      COUNT(*)::int AS total_threads,
      COUNT(*) FILTER (WHERE status IN ('sent', 'replied'))::int AS emails_sent_all_time,
      COUNT(*) FILTER (
        WHERE status IN ('sent', 'replied')
          AND sent_at >= date_trunc('month', now())
      )::int AS emails_sent_this_month,
      COUNT(*) FILTER (WHERE reply_count > 0)::int AS replied_threads
    FROM threads;
  `;

  const { rows } = await pool.query(query);

  const stats = rows[0] || {
    total_threads: 0,
    emails_sent_all_time: 0,
    emails_sent_this_month: 0,
    replied_threads: 0,
  };

  const totalThreads = stats.total_threads ?? 0;
  const repliedThreads = stats.replied_threads ?? 0;
  const replyRate = totalThreads
    ? Math.round((repliedThreads / totalThreads) * 100)
    : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalThreads,
        emailsSentAllTime: stats.emails_sent_all_time ?? 0,
        emailsSentThisMonth: stats.emails_sent_this_month ?? 0,
        repliedThreads,
        replyRate,
      },
      "Email stats retrieved successfully"
    )
  );
});

const triggerEmailSync = asyncHandler(async (req, res) => {
  const result = await fetchIncomingEmails();

  if (!result.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, { code: result.code }, result.message));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { processed: result.processed }, result.message)
    );
});

export {
  sendEmail,
  replyToEmail,
  getEmailThreads,
  getAllEmails,
  getEmailStats,
  triggerEmailSync,
};
