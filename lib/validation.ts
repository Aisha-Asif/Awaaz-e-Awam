export function validateCNIC(cnic: string): { valid: boolean; normalized: string; error?: string } {
  const cleaned = cnic.replace(/[-\s]/g, "");

  if (!/^\d{13}$/.test(cleaned)) {
    return { valid: false, normalized: cleaned, error: "CNIC must contain 13 digits." };
  }

  return { valid: true, normalized: cleaned };
}

export function validatePhone(phone: string): { valid: boolean; normalized: string; error?: string } {
  let cleaned = phone.replace(/[\s-]/g, "");

  if (cleaned.startsWith("92")) {
    cleaned = "0" + cleaned.slice(2);
  }
  if (!cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }

  if (!/^03\d{9}$/.test(cleaned)) {
    return { valid: false, normalized: cleaned, error: "Please enter a valid Pakistani mobile number (e.g., 03001234567)." };
  }

  return { valid: true, normalized: cleaned };
}

export function validateDate(date: string): { valid: boolean; normalized: string; error?: string } {
  const match = date.match(/(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})/);
  if (!match) {
    return { valid: false, normalized: date, error: "Please enter date in DD/MM/YYYY format." };
  }

  const [_, day, month, year] = match;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > new Date().getFullYear()) {
    return { valid: false, normalized: date, error: "Please enter a valid date." };
  }

  const normalized = `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
  return { valid: true, normalized };
}

export function getFieldValidator(type: string) {
  switch (type) {
    case "cnic":
      return validateCNIC;
    case "phone":
      return validatePhone;
    case "date":
      return validateDate;
    default:
      return (value: string) => ({ valid: value.length > 0, normalized: value });
  }
}

export const CONFIRMATION_REQUIRED_TYPES = ["cnic", "phone", "date"] as const;

export function requiresConfirmation(type: string): boolean {
  return CONFIRMATION_REQUIRED_TYPES.includes(type as typeof CONFIRMATION_REQUIRED_TYPES[number]);
}