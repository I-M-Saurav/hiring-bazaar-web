/**
 * Branch codes used across the platform. The API normalises names
 * ("Computer Science" == "CSE"), so storing the code keeps comparisons exact.
 */
export const BRANCHES = [
  { code: "CSE", label: "Computer Science (CSE)" },
  { code: "ECE", label: "Electronics & Communication (ECE)" },
  { code: "Electrical", label: "Electrical (EE)" },
  { code: "Mechanical", label: "Mechanical (ME)" },
  { code: "Civil", label: "Civil (CE)" },
  { code: "Chemical", label: "Chemical (CHE)" },
] as const;

/** Map a parsed or free-text branch onto a code, when it is one we know. */
export function toBranchCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  const found = BRANCHES.find(
    (b) => b.code.toLowerCase() === v || b.label.toLowerCase().includes(v) || v.includes(b.code.toLowerCase()),
  );
  return found ? found.code : value.trim();
}
