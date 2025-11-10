import { JSDOM } from "jsdom";
import sanitizeHtml from "sanitize-html";

/**
 * Clean HTML or plain-text email body and remove quoted previous messages.
 * Handles Gmail, Yahoo, Zoho, Outlook, Apple Mail, Thunderbird, etc.
 * Returns clean readable text, free from wrappers and previous replies.
 */
export function cleanEmailBody(body) {
  if (!body) return "";

  // --- Detect HTML ---
  const isHTML = /<[a-z][\s\S]*>/i.test(body);

  if (isHTML) {
    const dom = new JSDOM(body);
    const doc = dom.window.document;

    // --- Remove provider-specific quote blocks ---
    const selectorsToRemove = [
      ".gmail_quote",
      ".gmail_quote_container",
      ".gmail_attr",
      "blockquote",
      ".OutlookMessageHeader",
      "hr#stopSpelling",
      "div[style*='border-left']",
      ".AppleMailQuote",
      "blockquote[type='cite']",
      ".moz-cite-prefix",
    ];
    doc
      .querySelectorAll(selectorsToRemove.join(","))
      .forEach((el) => el.remove());

    // --- Remove textual headers like "On Fri, Nov 7, 2025 wrote:" ---
    const allNodes = Array.from(doc.body.querySelectorAll("*"));
    for (const node of allNodes) {
      const text = (node.textContent || "").trim();
      if (
        /^On\s.+(wrote|sent):$/i.test(text) ||
        /^From:/i.test(text) ||
        /^Sent:/i.test(text)
      ) {
        node.remove();
      }
    }

    // --- Remove horizontal rules or separators ---
    let html = doc.body.innerHTML;
    html = html.replace(/<hr[^>]*>.*$/is, ""); // Outlook-style
    html = html.replace(/On\s.*(wrote|sent):[\s\S]*/i, ""); // fallback

    // --- Strip redundant <div>, <span>, <br> wrappers ---
    html = html
      .replace(/<\/?(div|span|br|p)[^>]*>/gi, " ") // remove tags, keep spacing
      .replace(/\s{2,}/g, " ") // collapse spaces
      .replace(/&nbsp;/g, " ") // convert HTML space
      .replace(/&quot;/g, '"') // decode quotes
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .trim();

    // --- Sanitize for safety ---
    const safe = sanitizeHtml(html, {
      allowedTags: [], // remove all tags, we want plain text
      allowedAttributes: {},
    });

    // --- Final trim ---
    return safe.trim();
  }

  // --- Plain text fallback ---
  const cleaned = body
    .split(/\r?\n/)
    .filter(
      (line) =>
        !line.startsWith(">") &&
        !/^On .+(wrote|sent):/i.test(line.trim()) &&
        !/^From:/i.test(line.trim()) &&
        !/^Sent:/i.test(line.trim())
    )
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return sanitizeHtml(cleaned, { allowedTags: [], allowedAttributes: {} });
}
