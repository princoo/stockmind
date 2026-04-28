type RestockTemplateInput = {
  supplierName: string;
  productName: string;
  sku: string;
  currentStock: number;
  requestedQuantity: number;
  message: string;
  requestedByName?: string;
};

export function buildRestockEmailSubject(input: {
  productName: string;
  sku: string;
  currentStock: number;
}) {
  return `[StockMind] Restock request for ${input.productName} (${input.sku}) - stock ${input.currentStock}`;
}

export function buildRestockEmailBody({
  supplierName,
  productName,
  sku,
  currentStock,
  requestedQuantity,
  message,
  requestedByName,
}: RestockTemplateInput) {
  const requestedByLine = requestedByName
    ? `Requested by: ${requestedByName}`
    : "Requested by: StockMind Team";

  const text = [
    `Hello ${supplierName},`,
    "",
    "A restock is needed for the product below:",
    `- Product: ${productName}`,
    `- SKU: ${sku}`,
    `- Current stock: ${currentStock}`,
    `- Requested quantity: ${requestedQuantity}`,
    "",
    "Message:",
    message,
    "",
    requestedByLine,
    "",
    "Please confirm availability and expected delivery date.",
    "",
    "Regards,",
    "StockMind",
  ].join("\n");

  const html = `
    <div style="background-color:#f5f7fb;padding:24px 12px;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;color:#111827;">
      <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="background:#0058be;padding:18px 24px;color:#ffffff;">
            <p style="margin:0;font-size:13px;letter-spacing:.04em;text-transform:uppercase;opacity:.9;">StockMind</p>
            <h1 style="margin:6px 0 0;font-size:20px;line-height:1.3;font-weight:700;">Restock Request</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 24px 8px;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Hello ${supplierName},</p>
            <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#374151;">
              A restock is needed for the following product. Please review the request details below.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:10px 12px;background:#f9fafb;font-size:12px;font-weight:600;color:#6b7280;width:45%;">Product</td>
                <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#111827;">${productName}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;background:#f9fafb;font-size:12px;font-weight:600;color:#6b7280;">SKU</td>
                <td style="padding:10px 12px;font-size:14px;color:#111827;">${sku}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;background:#f9fafb;font-size:12px;font-weight:600;color:#6b7280;">Current stock</td>
                <td style="padding:10px 12px;font-size:14px;color:#111827;">${currentStock}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;background:#f9fafb;font-size:12px;font-weight:600;color:#6b7280;">Requested quantity</td>
                <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#b91c1c;">${requestedQuantity}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 24px 6px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#6b7280;">Message</p>
            <div style="margin:0;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#fcfcfd;font-size:14px;line-height:1.65;color:#1f2937;">
              ${message.replace(/\n/g, "<br />")}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 24px 18px;">
            <p style="margin:0;font-size:13px;color:#4b5563;">${requestedByLine}</p>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #eef0f4;padding:16px 24px 22px;">
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;">
              Please confirm availability and expected delivery date.
            </p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">
              Regards,<br />
              <strong>StockMind</strong>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return { text, html };
}
