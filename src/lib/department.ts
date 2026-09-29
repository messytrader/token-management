export const DEPARTMENTS = [
  { value: "medical", en: "Medical / Hospital", hi: "मेडिकल / अस्पताल" },
  { value: "academic", en: "Academic / College", hi: "शैक्षणिक / कॉलेज" },
  { value: "admin", en: "Administration", hi: "प्रशासन" },
  { value: "finance", en: "Finance / Accounts", hi: "वित्त / लेखा" },
  { value: "hr", en: "HR / Establishment", hi: "एचआर / स्थापना" },
  { value: "other", en: "Other", hi: "अन्य" },
] as const;

export type DepartmentValue = (typeof DEPARTMENTS)[number]["value"];