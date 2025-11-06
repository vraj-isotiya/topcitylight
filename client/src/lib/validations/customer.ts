import { z } from "zod";

// Phone number validation (basic international format)
const phoneRegex = /^[\d\s\-+()]+$/;

// Website URL validation
const websiteRegex =
  /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

export const customerSchema = z.object({
  //  Required
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

  status: z.enum(["Lead", "Prospect", "Customer"], {
    required_error: "Status is required",
  }),

  customer_source_id: z.string().trim().min(1, "Customer source is required"),

  business_type_id: z.string().trim().min(1, "Business type is required"),

  //  Optional
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Invalid phone number format")
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .or(z.literal("")),

  company: z
    .string()
    .trim()
    .max(100, "Company name must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .trim()
    .max(255, "Address must be less than 255 characters")
    .optional()
    .or(z.literal("")),

  country: z
    .string()
    .trim()
    .max(100, "Country must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  province: z
    .string()
    .trim()
    .max(100, "Province must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .trim()
    .max(100, "City must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  postal_code: z
    .string()
    .trim()
    .max(20, "Postal code must be less than 20 characters")
    .optional()
    .or(z.literal("")),

  fax: z
    .string()
    .trim()
    .regex(phoneRegex, "Invalid fax number format")
    .max(20, "Fax number must be less than 20 characters")
    .optional()
    .or(z.literal("")),

  bank_name: z
    .string()
    .trim()
    .max(100, "Bank name must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  bank_account: z
    .string()
    .trim()
    .max(50, "Bank account must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .trim()
    .regex(websiteRegex, "Invalid website URL format")
    .max(255, "Website URL must be less than 255 characters")
    .optional()
    .or(z.literal("")),

  contact_person_name: z
    .string()
    .trim()
    .max(100, "Contact person name must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  contact_person_email: z
    .string()
    .trim()
    .email("Invalid contact email format")
    .max(255, "Contact email must be less than 255 characters")
    .optional()
    .or(z.literal("")),

  contact_person_phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Invalid contact phone format")
    .max(20, "Contact phone must be less than 20 characters")
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
