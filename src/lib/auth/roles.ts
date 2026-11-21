export const ROLES = ["candidate", "tpo", "recruiter"] as const;
export type Role = (typeof ROLES)[number];

/** The route group each role works in (blueprint Section 9). */
export const ROLE_HOME: Record<Role, string> = {
  candidate: "/candidate/dashboard",
  tpo: "/tpo/dashboard",
  recruiter: "/recruiter/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  candidate: "Candidate",
  tpo: "Placement Officer",
  recruiter: "Recruiter",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** The role that owns a path, or null for public paths. */
export function roleForPath(pathname: string): Role | null {
  const segment = pathname.split("/")[1];
  return isRole(segment) ? segment : null;
}
