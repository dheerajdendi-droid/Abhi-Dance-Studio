const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toDateStr(d) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

// Given a class's day_of_week (e.g. "Sunday"), returns the most recent date
// (today or earlier, within the last 7 days) that falls on that weekday.
export function mostRecentDateForWeekday(weekdayName, referenceDate = new Date()) {
  const targetIdx = WEEKDAYS.indexOf(weekdayName);
  if (targetIdx === -1) return toDateStr(referenceDate);
  const diff = (referenceDate.getDay() - targetIdx + 7) % 7;
  const d = new Date(referenceDate);
  d.setDate(d.getDate() - diff);
  return toDateStr(d);
}
