import { z } from "zod";

// Regex patterns
const phoneRegex = /^[\d\s\-+()]+$/;
const websiteRegex =
  /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

export const customerSchema = z.object({
  // --- Required fields ---
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),

  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters"),

  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Invalid phone number format")
    .max(20, "Phone number must be less than 20 characters"),

  company: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(100, "Company name must be less than 100 characters"),

  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(255, "Address must be less than 255 characters"),

  country: z
    .string()
    .trim()
    .min(1, "Country is required")
    .max(100, "Country must be less than 100 characters"),

  province: z
    .string()
    .trim()
    .min(1, "Province is required")
    .max(100, "Province must be less than 100 characters"),

  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),

  postal_code: z
    .string()
    .trim()
    .min(1, "Postal code is required")
    .max(20, "Postal code must be less than 20 characters"),

  bank_name: z
    .string()
    .trim()
    .min(1, "Bank name is required")
    .max(100, "Bank name must be less than 100 characters"),

  bank_account: z
    .string()
    .trim()
    .min(1, "Bank account is required")
    .max(50, "Bank account must be less than 50 characters"),

  customer_source_id: z.string().trim().min(1, "Customer source is required"),

  business_type_id: z.string().trim().min(1, "Business type is required"),

  website: z
    .string()
    .trim()
    .min(1, "Website is required")
    .regex(websiteRegex, "Invalid website URL format")
    .max(255, "Website URL must be less than 255 characters"),

  contact_person_name: z
    .string()
    .trim()
    .min(1, "Contact person name is required")
    .max(100, "Contact person name must be less than 100 characters"),

  contact_person_email: z
    .string()
    .trim()
    .min(1, "Contact person email is required")
    .email("Invalid contact email format")
    .max(255, "Contact email must be less than 255 characters"),

  contact_person_phone: z
    .string()
    .trim()
    .min(1, "Contact person phone is required")
    .regex(phoneRegex, "Invalid contact phone format")
    .max(20, "Contact phone must be less than 20 characters"),

  status: z.enum(["Lead", "Prospect", "Customer"], {
    required_error: "Status is required",
  }),

  // --- Optional fields ---
  fax: z
    .string()
    .trim()
    .regex(phoneRegex, "Invalid fax number format")
    .max(20, "Fax number must be less than 20 characters")
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
