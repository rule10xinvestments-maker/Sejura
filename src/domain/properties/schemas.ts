import { z } from "zod";
import { normalizePropertyTime } from "@/domain/properties/time";

const propertyTimeSchema = z.preprocess(
  normalizePropertyTime,
  z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Foloseste ora in format HH:mm, de exemplu 15:00."
    )
);

export const propertyFormSchema = z.object({
  name: z.string().trim().min(2, "Adauga numele proprietatii."),
  city: z.string().trim().min(2, "Adauga orasul sau localitatea proprietatii."),
  contact_phone: z.string().trim().min(6, "Adauga un telefon de contact valid."),
  contact_email: z.string().trim().email("Adauga un email de contact valid."),
  check_in_time: propertyTimeSchema,
  check_out_time: propertyTimeSchema,
  rules: z.string().trim().min(3, "Adauga regulile casei.")
});
