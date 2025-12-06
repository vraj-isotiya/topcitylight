import { pool } from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getDashboardReport = asyncHandler(async (req, res) => {
  const months = Number(req.query.months) || 6;

  const customerGrowthQuery = `
    SELECT
      to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
      COUNT(*)::int AS customers
    FROM customers
    WHERE created_at >= (now() - ($1 || ' months')::interval)
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at);
  `;

  const emailActivityQuery = `
    SELECT
      to_char(date_trunc('month', sent_at), 'Mon YYYY') AS month,
      COUNT(*)::int AS emails
    FROM email_threads
    WHERE sent_at IS NOT NULL
      AND sent_at >= (now() - ($1 || ' months')::interval)
    GROUP BY date_trunc('month', sent_at)
    ORDER BY date_trunc('month', sent_at);
  `;

  const statusDistributionQuery = `
    SELECT
      COALESCE(status, 'Unknown') AS status,
      COUNT(*)::int AS count
    FROM customers
    GROUP BY COALESCE(status, 'Unknown');
  `;

  const topCustomersQuery = `
    SELECT
      c.id,
      c.name,
      COUNT(et.id)::int AS count
    FROM email_threads et
    JOIN customers c ON et.customer_id = c.id
    GROUP BY c.id, c.name
    ORDER BY count DESC
    LIMIT 5;
  `;

  const [
    customerGrowthResult,
    emailActivityResult,
    statusDistributionResult,
    topCustomersResult,
  ] = await Promise.all([
    pool.query(customerGrowthQuery, [months]),
    pool.query(emailActivityQuery, [months]),
    pool.query(statusDistributionQuery),
    pool.query(topCustomersQuery),
  ]);

  const customerGrowth = customerGrowthResult.rows.map((row) => ({
    month: row.month,
    customers: row.customers,
  }));

  const emailActivity = emailActivityResult.rows.map((row) => ({
    month: row.month,
    emails: row.emails,
  }));

  const statusDistribution = statusDistributionResult.rows.map((row) => ({
    status: row.status,
    count: row.count,
  }));

  const topCustomers = topCustomersResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    count: row.count,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        customerGrowth,
        emailActivity,
        statusDistribution,
        topCustomers,
      },
      "Dashboard report fetched successfully"
    )
  );
});
