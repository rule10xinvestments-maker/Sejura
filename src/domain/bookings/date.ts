import { BookingDomainError } from "@/domain/bookings/errors";

export function parseDateOnly(value: string, fieldName: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BookingDomainError("VALIDATION", `${fieldName} este invalid.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BookingDomainError("VALIDATION", `${fieldName} este invalid.`);
  }

  return date;
}

export function getNightsCount(startDate: string, endDate: string) {
  const start = parseDateOnly(startDate, "Data de inceput");
  const end = parseDateOnly(endDate, "Data de final");
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);

  if (nights <= 0) {
    throw new BookingDomainError(
      "VALIDATION",
      "Data de final trebuie sa fie dupa data de inceput."
    );
  }

  return nights;
}

export function overlaps(
  startDate: string,
  endDate: string,
  existingStartDate: string,
  existingEndDate: string
) {
  return startDate < existingEndDate && endDate > existingStartDate;
}
