/**
 * Cloudflare Worker – Comments & Ratings API backed by Turso (libSQL HTTP API)
 *
 * Environment variables (set via `wrangler secret put`):
 *   TURSO_URL        – e.g. libsql://your-db.turso.io
 *   TURSO_AUTH_TOKEN  – auth token from Turso
 *   ADMIN_SECRET      – secret token for admin endpoints
 *
 * Public endpoints:
 *   POST /comments/get     { postSlug, postType }         – returns approved comments only
 *   POST /comments/add     { postSlug, postType, author, body }
 *   POST /ratings/get      { postSlug, postType }
 *   POST /ratings/add      { postSlug, postType, value }
 *
 * Admin endpoints (require Authorization: Bearer <ADMIN_SECRET>):
 *   POST /admin/comments/pending                          – list all unapproved comments
 *   POST /admin/comments/approve   { id }                 – approve a comment
 *   POST /admin/comments/reject    { id }                 – delete a comment
 */

const ALLOWED_ORIGINS = [
  "https://tadawilifetech.com",
  "https://www.tadawilifetech.com",
  "http://localhost:4321",
  "http://localhost:4322",
  "http://localhost:4323",
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

/** Verify admin authorization header */
function isAdmin(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  return token.length > 0 && token === env.ADMIN_SECRET;
}

/** Execute SQL statements against Turso HTTP API */
async function tursoExecute(env, statements) {
  const url = env.TURSO_URL.replace("libsql://", "https://");
  const results = [];

  for (const stmt of statements) {
    const resp = await fetch(`${url}/v2/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: stmt.sql, args: stmt.args || [] } },
          { type: "close" },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Turso error ${resp.status}: ${text}`);
    }

    const body = await resp.json();
    const result = body.results?.[0]?.response?.result;
    results.push(result);
  }

  return results;
}

/** Validate and sanitize input */
function validateString(val, name, maxLen = 2000) {
  if (typeof val !== "string" || val.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  if (val.length > maxLen) {
    throw new Error(`${name} must be ${maxLen} characters or less`);
  }
  return val.trim();
}

function validatePostType(val) {
  if (val !== "post" && val !== "product") {
    throw new Error("postType must be 'post' or 'product'");
  }
  return val;
}

function parseRows(result) {
  if (!result?.rows || !result?.cols) return [];
  const colNames = result.cols.map((c) => c.name);
  return result.rows.map((row) => {
    const obj = {};
    row.forEach((cell, i) => {
      obj[colNames[i]] = cell.type === "integer" ? Number(cell.value) : cell.value;
    });
    return obj;
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    const url = new URL(request.url);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    try {
      // --- GET COMMENTS (approved only) ---
      if (url.pathname === "/comments/get") {
        const postSlug = validateString(body.postSlug, "postSlug", 200);
        const postType = validatePostType(body.postType);

        const [result] = await tursoExecute(env, [
          {
            sql: "SELECT id, postSlug, postType, author, body, createdAt FROM Comment WHERE postSlug = ? AND postType = ? AND approved = 1 ORDER BY createdAt ASC",
            args: [
              { type: "text", value: postSlug },
              { type: "text", value: postType },
            ],
          },
        ]);

        return json({ data: parseRows(result) }, 200, origin);
      }

      // --- ADD COMMENT (pending by default) ---
      if (url.pathname === "/comments/add") {
        const postSlug = validateString(body.postSlug, "postSlug", 200);
        const postType = validatePostType(body.postType);
        const author = validateString(body.author, "author", 100);
        const commentBody = validateString(body.body, "body", 2000);
        const createdAt = new Date().toISOString();

        const [result] = await tursoExecute(env, [
          {
            sql: "INSERT INTO Comment (postSlug, postType, author, body, approved, createdAt) VALUES (?, ?, ?, ?, 0, ?) RETURNING *",
            args: [
              { type: "text", value: postSlug },
              { type: "text", value: postType },
              { type: "text", value: author },
              { type: "text", value: commentBody },
              { type: "text", value: createdAt },
            ],
          },
        ]);

        const rows = parseRows(result);
        return json({ data: rows[0] || null, pending: true }, 201, origin);
      }

      // --- GET RATING ---
      if (url.pathname === "/ratings/get") {
        const postSlug = validateString(body.postSlug, "postSlug", 200);
        const postType = validatePostType(body.postType);

        const [avgResult] = await tursoExecute(env, [
          {
            sql: "SELECT AVG(value) as avgRating, COUNT(*) as cnt FROM Rating WHERE postSlug = ? AND postType = ?",
            args: [
              { type: "text", value: postSlug },
              { type: "text", value: postType },
            ],
          },
        ]);

        const rows = parseRows(avgResult);
        const row = rows[0] || {};
        return json(
          {
            data: {
              average: row.avgRating ? Math.round(Number(row.avgRating) * 10) / 10 : 0,
              count: row.cnt || 0,
            },
          },
          200,
          origin,
        );
      }

      // --- ADD RATING ---
      if (url.pathname === "/ratings/add") {
        const postSlug = validateString(body.postSlug, "postSlug", 200);
        const postType = validatePostType(body.postType);
        const value = Number(body.value);
        if (!Number.isInteger(value) || value < 1 || value > 5) {
          return json({ error: "value must be integer 1-5" }, 400, origin);
        }
        const createdAt = new Date().toISOString();

        await tursoExecute(env, [
          {
            sql: "INSERT INTO Rating (postSlug, postType, value, createdAt) VALUES (?, ?, ?, ?)",
            args: [
              { type: "text", value: postSlug },
              { type: "text", value: postType },
              { type: "integer", value: String(value) },
              { type: "text", value: createdAt },
            ],
          },
        ]);

        // Return updated average
        const [avgResult] = await tursoExecute(env, [
          {
            sql: "SELECT AVG(value) as avgRating, COUNT(*) as cnt FROM Rating WHERE postSlug = ? AND postType = ?",
            args: [
              { type: "text", value: postSlug },
              { type: "text", value: postType },
            ],
          },
        ]);

        const rows = parseRows(avgResult);
        const row = rows[0] || {};
        return json(
          {
            data: {
              average: row.avgRating ? Math.round(Number(row.avgRating) * 10) / 10 : 0,
              count: row.cnt || 0,
            },
          },
          201,
          origin,
        );
      }

      // ========== ADMIN ENDPOINTS ==========

      // --- LIST PENDING COMMENTS ---
      if (url.pathname === "/admin/comments/pending") {
        if (!isAdmin(request, env)) {
          return json({ error: "Unauthorized" }, 401, origin);
        }

        const [result] = await tursoExecute(env, [
          {
            sql: "SELECT id, postSlug, postType, author, body, approved, createdAt FROM Comment WHERE approved = 0 ORDER BY createdAt DESC",
          },
        ]);

        return json({ data: parseRows(result) }, 200, origin);
      }

      // --- LIST ALL COMMENTS (admin) ---
      if (url.pathname === "/admin/comments/all") {
        if (!isAdmin(request, env)) {
          return json({ error: "Unauthorized" }, 401, origin);
        }

        const [result] = await tursoExecute(env, [
          {
            sql: "SELECT id, postSlug, postType, author, body, approved, createdAt FROM Comment ORDER BY createdAt DESC",
          },
        ]);

        return json({ data: parseRows(result) }, 200, origin);
      }

      // --- APPROVE COMMENT ---
      if (url.pathname === "/admin/comments/approve") {
        if (!isAdmin(request, env)) {
          return json({ error: "Unauthorized" }, 401, origin);
        }

        const id = Number(body.id);
        if (!Number.isInteger(id) || id < 1) {
          return json({ error: "Valid comment id is required" }, 400, origin);
        }

        await tursoExecute(env, [
          {
            sql: "UPDATE Comment SET approved = 1 WHERE id = ?",
            args: [{ type: "integer", value: String(id) }],
          },
        ]);

        return json({ success: true }, 200, origin);
      }

      // --- REJECT / DELETE COMMENT ---
      if (url.pathname === "/admin/comments/reject") {
        if (!isAdmin(request, env)) {
          return json({ error: "Unauthorized" }, 401, origin);
        }

        const id = Number(body.id);
        if (!Number.isInteger(id) || id < 1) {
          return json({ error: "Valid comment id is required" }, 400, origin);
        }

        await tursoExecute(env, [
          {
            sql: "DELETE FROM Comment WHERE id = ?",
            args: [{ type: "integer", value: String(id) }],
          },
        ]);

        return json({ success: true }, 200, origin);
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (err) {
      return json({ error: err.message || "Internal error" }, 500, origin);
    }
  },
};
