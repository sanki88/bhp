export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("pl-PL");
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("pl-PL");
}
