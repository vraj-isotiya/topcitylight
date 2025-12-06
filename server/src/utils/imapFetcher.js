// import Imap from "imap";
// import { simpleParser } from "mailparser";
// import { pool } from "../db/index.js";
// import { cleanEmailBody } from "./cleanEmailBody.js";

// export const fetchIncomingEmails = async () => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       //  Get user's IMAP configuration & last_uid
//       const { rows } = await pool.query(
//         "SELECT * FROM email_provider_settings WHERE provider_type = 'Gmail / Google Workspace' AND is_active = true LIMIT 1"
//       );

//       const configs = rows;
//       if (!configs || configs.length === 0) {
//         console.warn("[IMAP] No active email configuration found.");
//         resolve("No active email configuration found.");
//         return;
//       }

//       const config = configs[0];
//       const lastUid = Number(config.last_uid || 0);

//       const imap = new Imap({
//         user: "developer.vraj@gmail.com",
//         password: "scjz gsed ptly znhc",
//         host: "imap.gmail.com",
//         port: 993,
//         tls: true,
//         tlsOptions: { rejectUnauthorized: false },
//       });

//       const handleError = (err, context = "IMAP") => {
//         console.error(`[${context} ERROR]`, err?.message || err);
//         try {
//           imap.end();
//         } catch (_) {}
//         reject(err);
//       };

//       imap.once("ready", () => {
//         console.log("[IMAP] Connection established.");

//         imap.openBox("INBOX", false, (err, box) => {
//           if (err) return handleError(err, "OpenBox");

//           //  Search messages after last UID
//           const searchCriteria = [["UID", `${lastUid + 1}:*`]];
//           imap.search(searchCriteria, (err, results) => {
//             if (err) return handleError(err, "Search");

//             if (!results || results.length === 0) {
//               console.log("[IMAP] No new messages after UID", lastUid);
//               imap.end();
//               return resolve("No new emails");
//             }

//             console.log(
//               `[IMAP] Found ${results.length} new messages since UID ${lastUid}`
//             );

//             let maxUid = lastUid;

//             //  Fetch those emails
//             const fetcher = imap.fetch(results, { bodies: "", struct: true });

//             fetcher.on("message", (msg, seqno) => {
//               console.log(`[IMAP] Processing message #${seqno}`);

//               let uid = null;

//               msg.on("attributes", (attrs) => {
//                 uid = attrs.uid;
//                 if (uid > maxUid) maxUid = uid;
//               });

//               msg.on("body", (stream) => {
//                 simpleParser(stream, async (err, parsed) => {
//                   if (err) return handleError(err, "MailParser");

//                   const { from, subject, text, html, messageId } = parsed;
//                   const inReplyTo = parsed.headers.get("in-reply-to");

//                   try {
//                     if (!messageId)
//                       return console.warn(
//                         "[IMAP] Skipping email without messageId"
//                       );

//                     if (inReplyTo) {
//                       const { rows } = await pool.query(
//                         "SELECT id, customer_id FROM email_threads WHERE message_id = $1",
//                         [inReplyTo]
//                       );

//                       if (rows.length > 0) {
//                         const thread = rows[0];
//                         const rawBody = html || text;
//                         const cleanedBody = cleanEmailBody(rawBody);

//                         await pool.query(
//                           `INSERT INTO email_replies (thread_id, customer_id, reply_body, sender_email, message_id, in_reply_to)
//                            VALUES ($1, $2, $3, $4, $5, $6)
//                            ON CONFLICT (message_id) DO NOTHING`,
//                           [
//                             thread.id,
//                             thread.customer_id,
//                             cleanedBody,
//                             from.text,
//                             messageId,
//                             inReplyTo,
//                           ]
//                         );

//                         await pool.query(
//                           `UPDATE email_threads SET status = 'replied', updated_at = NOW() WHERE id = $1`,
//                           [thread.id]
//                         );

//                         console.log(
//                           `[DB] Saved reply for thread ${thread.id} (UID: ${uid})`
//                         );
//                       } else {
//                         console.warn(
//                           `[IMAP] No matching thread found for in-reply-to ${inReplyTo}`
//                         );
//                       }
//                     } else {
//                       console.log(
//                         "[IMAP] Skipping non-reply email (no in-reply-to)."
//                       );
//                     }
//                   } catch (dbErr) {
//                     handleError(dbErr, "Database");
//                   }
//                 });
//               });
//             });

//             //  Update last_uid after fetch
//             fetcher.once("end", async () => {
//               console.log(
//                 `[IMAP] Fetch complete. Updating last_uid = ${maxUid}`
//               );

//               await pool.query(
//                 "UPDATE email_provider_settings SET last_uid = $1, updated_at = NOW() WHERE id = $2",
//                 [maxUid, config.id]
//               );

//               imap.end();
//               resolve(`Processed emails up to UID ${maxUid}`);
//             });

//             fetcher.once("error", (err) => handleError(err, "Fetch"));
//           });
//         });
//       });

//       imap.once("error", (err) => handleError(err, "IMAP connection"));
//       imap.once("end", () => console.log("[IMAP] Connection closed."));
//       imap.connect();
//     } catch (err) {
//       console.error("[General ERROR]", err.message);
//       reject(err);
//     }
//   });
// };
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { pool } from "../db/index.js";
import { cleanEmailBody } from "./cleanEmailBody.js";

function normalizeImapError(err) {
  const msg = err?.response || err?.responseText || "";

  if (msg.includes("AUTHENTICATIONFAILED")) {
    return {
      code: "AUTH_FAILED",
      message: "Invalid IMAP credentials",
    };
  }

  if (msg.includes("Invalid credentials")) {
    return {
      code: "AUTH_FAILED",
      message: "Invalid IMAP credentials",
    };
  }

  if (msg.includes("ENOTFOUND")) {
    return {
      code: "IMAP_HOST_NOT_FOUND",
      message: "IMAP host not reachable",
    };
  }

  if (msg.includes("ECONNREFUSED")) {
    return {
      code: "IMAP_CONNECTION_REFUSED",
      message: "IMAP connection refused",
    };
  }

  if (msg.includes("ETIMEDOUT")) {
    return {
      code: "IMAP_TIMEOUT",
      message: "IMAP connection timed out",
    };
  }

  if (msg.includes("TLS")) {
    return {
      code: "IMAP_TLS_ERROR",
      message: "IMAP TLS negotiation failed",
    };
  }

  return {
    code: "IMAP_UNKNOWN_ERROR",
    message: "Unknown error occurred during sync process",
  };
}

export const fetchIncomingEmails = async () => {
  let client;

  try {
    // 1. Load IMAP config
    const { rows } = await pool.query(
      "SELECT * FROM email_provider_settings WHERE provider_type = 'Gmail / Google Workspace' AND is_active = true LIMIT 1"
    );

    if (!rows.length) {
      console.warn("[IMAP] No active email configuration found.");
      return "No active email configuration found.";
    }

    const config = rows[0];
    const lastUid = Number(config.last_uid || 0);

    // 2. Init ImapFlow Client
    const client = new ImapFlow({
      host: process.env.IMAP_HOST,
      port: Number(process.env.IMAP_PORT),
      secure: true,
      auth: {
        user: process.env.IMAP_USER,
        pass: process.env.IMAP_PASS,
      },
      logger: false,
    });

    // 3. Connect
    await client.connect();
    console.log("[IMAP] Connected");

    // 4. Lock inbox
    let lock = await client.getMailboxLock("INBOX");

    try {
      // 5. Fetch messages after last UID
      const messages = client.fetch(
        { uid: `${lastUid + 1}:*` },
        { uid: true, source: true }
      );

      let maxUid = lastUid;
      let found = false;

      for await (let msg of messages) {
        found = true;
        const uid = msg.uid;
        if (uid > maxUid) maxUid = uid;

        const parsed = await simpleParser(msg.source);
        const { from, subject, text, html, messageId } = parsed;
        const inReplyTo = parsed.headers.get("in-reply-to");

        if (!messageId) {
          console.warn("[IMAP] Skipping email without messageId");
          continue;
        }

        if (!inReplyTo) {
          console.log("[IMAP] Skipping non-reply email");
          continue;
        }

        // 6. Find original thread
        const { rows } = await pool.query(
          "SELECT id, customer_id FROM email_threads WHERE message_id = $1",
          [inReplyTo]
        );

        if (!rows.length) {
          console.warn(`[IMAP] No thread found for reply ${inReplyTo}`);
          continue;
        }

        const thread = rows[0];
        const rawBody = html || text;
        const cleanedBody = cleanEmailBody(rawBody);

        // 7. Save reply
        await pool.query(
          `INSERT INTO email_replies (thread_id, customer_id, reply_body, sender_email, message_id, in_reply_to)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (message_id) DO NOTHING`,
          [
            thread.id,
            thread.customer_id,
            cleanedBody,
            from?.text || "",
            messageId,
            inReplyTo,
          ]
        );

        // 8. Update thread status
        await pool.query(
          `UPDATE email_threads SET status = 'replied', updated_at = NOW() WHERE id = $1`,
          [thread.id]
        );

        console.log(`[DB] Saved reply for thread ${thread.id} (UID ${uid})`);
      }

      // 9. Update last UID ONLY if new emails were processed
      if (found) {
        await pool.query(
          "UPDATE email_provider_settings SET last_uid = $1, updated_at = NOW() WHERE id = $2",
          [maxUid, config.id]
        );

        console.log(`[IMAP] Updated last_uid to ${maxUid}`);
      } else {
        console.log("[IMAP] No new emails after UID", lastUid);
      }
    } finally {
      lock.release();
    }

    await client.logout();
    console.log("[IMAP] Disconnected");

    return {
      success: true,
      message: "IMAP sync completed successfully",
    };
  } catch (err) {
    console.error("[IMAP ERROR]", err);
    if (client) await client.logout().catch(() => {});

    const normalized = normalizeImapError(err);

    return {
      success: false,
      code: normalized.code,
      message: normalized.message,
    };
  }
};
