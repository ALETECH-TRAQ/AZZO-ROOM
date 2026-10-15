export * from "@azzo/avatar";
import { defaultAvatar, validateAvatar, type AvatarConfig } from "@azzo/avatar";
const KEY = "azzo-room-avatar-v1";
export function loadAvatar(): AvatarConfig | null {
  try {
    return validateAvatar(JSON.parse(localStorage.getItem(KEY) || "null"));
  } catch {
    return null;
  }
}
export function saveAvatar(config: AvatarConfig) {
  const valid = validateAvatar(config);
  if (!valid) throw new Error("Revise o nome e as opções do avatar.");
  localStorage.setItem(KEY, JSON.stringify(valid));
}
export function initialAvatar(): AvatarConfig {
  return { ...defaultAvatar, accessories: [...defaultAvatar.accessories] };
}
