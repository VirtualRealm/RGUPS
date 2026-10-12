export const roles = [
  "STUDENT",
  "TEACHER",
  "EDITOR",
  "EDUCATION_ADMIN",
  "ADMIN",
  "SUPER_ADMIN",
] as const;
export type Role = (typeof roles)[number];
export type Permission =
  "content:write" | "users:manage" | "roles:grant" | "education:manage";
const grants: Record<Permission, readonly Role[]> = {
  "content:write": ["EDITOR", "ADMIN", "SUPER_ADMIN"],
  "users:manage": ["ADMIN", "SUPER_ADMIN"],
  "roles:grant": ["SUPER_ADMIN"],
  "education:manage": ["EDUCATION_ADMIN", "ADMIN", "SUPER_ADMIN"],
};
// Policy foundation only. Every future handler must first obtain roles from a server-verified session.
export function hasPermission(
  serverVerifiedRoles: readonly Role[],
  permission: Permission,
) {
  return serverVerifiedRoles.some((role) => grants[permission].includes(role));
}
