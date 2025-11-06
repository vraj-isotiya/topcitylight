/**
 * Utility to handle pagination for PostgreSQL queries.
 *
 * @param {Object} pool - PostgreSQL connection pool
 * @param {string} baseQuery - SQL query without LIMIT/OFFSET
 * @param {Array} params - Query parameters (if any)
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Number of records per page
 * @param {string} [countQuery] - Optional custom count query
 * @returns {Object} - { data, pagination }
 */

export const paginateQuery = async (
  pool,
  baseQuery,
  params = [],
  page = 1,
  limit = 10,
  countQuery = null
) => {
  // Ensure valid numbers
  page = parseInt(page);
  limit = parseInt(limit);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 10;

  const offset = (page - 1) * limit;

  // Get total count
  const totalCountQuery =
    countQuery ||
    `SELECT COUNT(*) AS total FROM (${baseQuery}) AS total_count_query;`;
  const countResult = await pool.query(totalCountQuery, params);
  const totalItems = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(totalItems / limit);

  // Fetch paginated results
  const paginatedQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${
    params.length + 2
  }`;
  const result = await pool.query(paginatedQuery, [...params, limit, offset]);

  return {
    data: result.rows,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
