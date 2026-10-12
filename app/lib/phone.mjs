// Shared by the browser's pattern attribute and the API; only ordinary spaces are allowed.
export const PHONE_PATTERN = String.raw`(?=.*[0-9])[0-9 \(\)\+\-]{1,160}`;
const phoneRegex = new RegExp(`^(?:${PHONE_PATTERN})$`, "u");

export function isValidPhone(value) {
  // Comparing the full match also rejects a trailing newline (which $ alone permits).
  return typeof value === "string" && phoneRegex.exec(value)?.[0] === value;
}
