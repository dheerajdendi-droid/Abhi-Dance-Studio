import { formatMonth } from "./date.js";

export function buildInvoiceMessage({ studentName, month, sessions, rate, amount }) {
  const monthLabel = formatMonth(month);
  return (
    `Hi! This is Abhi's Dance Studio.\n\n` +
    `${studentName}'s class fees for ${monthLabel}:\n` +
    `${sessions} session${sessions === 1 ? "" : "s"} × £${rate.toFixed(2)} = £${amount.toFixed(2)}\n\n` +
    `Thank you! 🙏`
  );
}

export function waLink(phone, message) {
  const digits = (phone || "").replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
