const monthNames: Record<string, number> = {
  ianuarie: 1,
  februarie: 2,
  martie: 3,
  aprilie: 4,
  mai: 5,
  iunie: 6,
  iulie: 7,
  august: 8,
  septembrie: 9,
  octombrie: 10,
  noiembrie: 11,
  decembrie: 12
};

export type ParsedBookingDetails = {
  start_date: string | null;
  end_date: string | null;
  guests_count: number | null;
  confidence: "low" | "medium" | "high";
  missing_fields: Array<"start_date" | "end_date" | "guests_count" | "year">;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function isValidDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeDate(
  day: number,
  month: number,
  currentDate: Date
): { iso: string | null; needsYear: boolean } {
  const currentYear = currentDate.getFullYear();
  if (!isValidDate(currentYear, month, day)) {
    return { iso: null, needsYear: false };
  }

  const candidate = new Date(currentYear, month - 1, day);
  const today = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );

  if (candidate < today) {
    return { iso: null, needsYear: true };
  }

  return { iso: toIso(currentYear, month, day), needsYear: false };
}

function extractDatePair(message: string) {
  const numeric = message.match(
    /(?:de pe|din|intre|între)?\s*(\d{1,2})[\s./-]+(\d{1,2})\s*(?:pana(?:\s+pe)?|până(?:\s+pe)?|pina(?:\s+pe)?|-|–|—)\s*(?:pe|in|în|la)?\s*(\d{1,2})[\s./-]+(\d{1,2})/i
  );
  if (numeric) {
    return {
      startDay: Number(numeric[1]),
      startMonth: Number(numeric[2]),
      endDay: Number(numeric[3]),
      endMonth: Number(numeric[4])
    };
  }

  const named = message.match(
    /(?:de pe|din|intre|între)?\s*(\d{1,2})\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s*(?:pana(?:\s+pe)?|până(?:\s+pe)?|pina(?:\s+pe)?|-|–|—)\s*(?:pe|in|în|la)?\s*(\d{1,2})\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)/i
  );
  if (named) {
    return {
      startDay: Number(named[1]),
      startMonth: monthNames[named[2].toLowerCase()],
      endDay: Number(named[3]),
      endMonth: monthNames[named[4].toLowerCase()]
    };
  }

  return null;
}

function extractGuests(message: string) {
  const direct = message.match(
    /(?:suntem|pentru)?\s*(\d{1,2})\s*(?:persoane|pers|adulti|adulți|oaspeti|oaspeți)\b/i
  );
  if (direct) return Number(direct[1]);

  const simpleChild = message.match(/(\d{1,2})\s*persoane?\s+si\s+un\s+copil/i);
  if (simpleChild) return Number(simpleChild[1]) + 1;

  const suntem = message.match(/\bsuntem\s+(\d{1,2})\b/i);
  if (suntem) return Number(suntem[1]);

  const pentru = message.match(/\bpentru\s+(\d{1,2})\b/i);
  if (pentru) return Number(pentru[1]);

  return null;
}

export function parseBookingDetailsFromRomanianMessage(
  message: string,
  currentDate = new Date()
): ParsedBookingDetails {
  const datePair = extractDatePair(message);
  const guests = extractGuests(message);
  const missing: ParsedBookingDetails["missing_fields"] = [];
  let startDate: string | null = null;
  let endDate: string | null = null;

  if (datePair) {
    const start = normalizeDate(datePair.startDay, datePair.startMonth, currentDate);
    const end = normalizeDate(datePair.endDay, datePair.endMonth, currentDate);
    startDate = start.iso;
    endDate = end.iso;

    if (start.needsYear || end.needsYear) {
      missing.push("year");
    }

    if (startDate && endDate && endDate <= startDate) {
      endDate = null;
    }
  }

  if (!startDate) missing.push("start_date");
  if (!endDate) missing.push("end_date");
  if (!guests) missing.push("guests_count");

  return {
    start_date: startDate,
    end_date: endDate,
    guests_count: guests,
    confidence: missing.length === 0 ? "high" : datePair || guests ? "medium" : "low",
    missing_fields: missing
  };
}
