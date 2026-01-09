import { DANGER_OPTIONS } from "../lang/dangerOptions";

export function isDangerOption(key) {
  if (!key) return false;

  return DANGER_OPTIONS.includes(String(key).trim());
}