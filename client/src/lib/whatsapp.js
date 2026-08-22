import { formatMonth } from "./date.js";
import { levelLabel } from "./levels.js";

// `lines` covers one or more rates a student was billed at within the
// month (a mid-month tier change produces more than one). Multi-line
// months spell out each rate so a parent can see why the total differs
// from a typical month, instead of just showing a bigger number.
export function buildInvoiceMessage({ studentName, month, lines, amount }) {
  const monthLabel = formatMonth(month);
  const multiRate = lines.length > 1;

  const lineText = lines
    .map((l) => {
      const tierSuffix = multiRate ? ` (${levelLabel(l.tierLabel)})` : "";
      return `${l.sessions} session${l.sessions === 1 ? "" : "s"} × £${l.rate.toFixed(2)}${tierSuffix} = £${l.amount.toFixed(2)}`;
    })
    .join("\n");

  const body = multiRate ? `${lineText}\nTotal: £${amount.toFixed(2)}` : lineText;

  return (
    `Hello\n\n` +
    `Here is the Attendance from Abhi Dance Academy.\n\n` +
    `${studentName}'s class fees for ${monthLabel}:\n` +
    `${body}\n\n` +
    `Thank you 🙏`
  );
}

export function waLink(phone, message) {
  const digits = (phone || "").replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
