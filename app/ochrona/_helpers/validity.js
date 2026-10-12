const passValidityDays = 183;

export function getValidity(visitor) {
  const expiresAt = new Date(
    visitor.expiresAt || addMonths(visitor.completedAt, 6),
  );
  const now = new Date();
  const millisecondsLeft = expiresAt.getTime() - now.getTime();
  const daysLeft = Math.ceil(millisecondsLeft / 86400000);
  const expired = daysLeft < 0;
  const percentLeft = expired
    ? 0
    : Math.min(100, Math.max(0, (daysLeft / passValidityDays) * 100));

  return {
    daysLeft,
    expired,
    percentLeft,
    label: expired
      ? `Wygasla ${Math.abs(daysLeft)} dni temu`
      : `${daysLeft} dni`,
  };
}

function addMonths(value, months) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}
