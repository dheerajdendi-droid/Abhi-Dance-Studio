import Avatar from "./Avatar.jsx";
import { formatMonth } from "../lib/date.js";
import { levelLabel } from "../lib/levels.js";
import { buildInvoiceMessage, waLink } from "../lib/whatsapp.js";

export default function BillingRow({ row, showMonth, onTogglePaid }) {
  const message = buildInvoiceMessage({
    studentName: row.studentName,
    month: row.month,
    lines: row.lines,
    amount: row.amount,
  });
  const link = waLink(row.parentPhone, message);
  const multiRate = row.lines.length > 1;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white">
      <Avatar name={row.studentName} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{row.studentName}</p>
        {showMonth && <p className="text-xs text-plum-400">{formatMonth(row.month)}</p>}
        <div className="text-xs text-plum-400">
          {row.lines.map((l, i) => (
            <p key={i}>
              {l.sessions} × £{l.rate.toFixed(2)}
              {multiRate ? ` (${levelLabel(l.tierLabel)})` : ""} ={" "}
              <span className={multiRate ? "" : "font-semibold text-plum-700"}>£{l.amount.toFixed(2)}</span>
            </p>
          ))}
          {multiRate && (
            <p className="font-semibold text-plum-700">Total: £{row.amount.toFixed(2)}</p>
          )}
          {!row.parentPhone && <p className="text-coral-500">no phone saved</p>}
        </div>
      </div>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-[40px] px-3 rounded-full bg-plum-50 text-plum-700 text-sm font-medium flex items-center"
      >
        Send
      </a>
      <button
        onClick={() => onTogglePaid(!row.paid)}
        className={`min-h-[40px] px-3 rounded-full text-sm font-semibold ${
          row.paid ? "bg-coral-500 text-white" : "bg-plum-100 text-plum-700"
        }`}
      >
        {row.paid ? "Paid" : "Unpaid"}
      </button>
    </div>
  );
}
