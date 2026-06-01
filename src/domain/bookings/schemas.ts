import { z } from "zod";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Foloseste formatul AAAA-LL-ZZ.");

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

export const availabilityCheckSchema = z.object({
  propertyId: z.string().uuid("Proprietatea este invalida."),
  roomId: z.string().uuid("Camera este invalida."),
  startDate: dateOnly,
  endDate: dateOnly,
  guestsCount: z.coerce.number().int().positive("Numarul de oaspeti este invalid."),
  excludeBookingId: z.string().uuid().optional()
});

export const bookingInputSchema = z.object({
  propertyId: z.string().uuid("Proprietatea este invalida."),
  roomId: z.string().uuid("Camera este invalida."),
  guestName: z.string().trim().min(2, "Numele oaspetelui este obligatoriu."),
  guestPhone: optionalText,
  guestEmail: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
    .pipe(z.string().email("Emailul oaspetelui este invalid.").nullable()),
  guestNotes: optionalText,
  startDate: dateOnly,
  endDate: dateOnly,
  guestsCount: z.coerce.number().int().positive("Numarul de oaspeti este invalid."),
  pricePerNight: z.coerce
    .number()
    .nonnegative("Pretul nu poate fi negativ.")
    .optional()
    .nullable()
});

export const bookingFormSchema = bookingInputSchema.extend({
  mode: z.enum(["pending", "confirmed"])
});

export const roomBlockSchema = z.object({
  propertyId: z.string().uuid("Proprietatea este invalida."),
  roomId: z.string().uuid("Camera este invalida."),
  startDate: dateOnly,
  endDate: dateOnly,
  reason: optionalText
});
