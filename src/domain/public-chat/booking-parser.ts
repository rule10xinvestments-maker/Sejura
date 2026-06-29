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

type DatePair = {
  startDay: number;
  startMonth: number;
  endDay: number;
  endMonth: number;
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function normalizeText(message: string) {
  return message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
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
  const today = toLocalDay(currentDate);

  if (candidate < today) {
    return { iso: null, needsYear: true };
  }

  return { iso: toIso(currentYear, month, day), needsYear: false };
}

function extractDatePair(normalizedMessage: string): DatePair | null {
  const numeric = normalizedMessage.match(
    /(?:de pe|din|intre)?\s*(\d{1,2})[\s./-]+(\d{1,2})\s*(?:pana(?:\s+pe)?|pina(?:\s+pe)?|-)\s*(?:pe|in|la)?\s*(\d{1,2})[\s./-]+(\d{1,2})/i
  );
  if (numeric) {
    return {
      startDay: Number(numeric[1]),
      startMonth: Number(numeric[2]),
      endDay: Number(numeric[3]),
      endMonth: Number(numeric[4])
    };
  }

  const monthAlternation = Object.keys(monthNames).join("|");
  const named = normalizedMessage.match(
    new RegExp(
      `(?:de pe|din|intre)?\\s*(\\d{1,2})\\s+(${monthAlternation})\\s*(?:pana(?:\\s+pe)?|pina(?:\\s+pe)?|-)\\s*(?:pe|in|la)?\\s*(\\d{1,2})\\s+(${monthAlternation})`,
      "i"
    )
  );
  if (named) {
    return {
      startDay: Number(named[1]),
      startMonth: monthNames[named[2]],
      endDay: Number(named[3]),
      endMonth: monthNames[named[4]]
    };
  }

  const sharedNamedMonth = normalizedMessage.match(
    new RegExp(
      `(?:de pe|din|intre)?\\s*(\\d{1,2})\\s*(?:pana(?:\\s+pe)?|pina(?:\\s+pe)?|-)\\s*(\\d{1,2})\\s+(${monthAlternation})`,
      "i"
    )
  );
  if (sharedNamedMonth) {
    const month = monthNames[sharedNamedMonth[3]];
    return {
      startDay: Number(sharedNamedMonth[1]),
      startMonth: month,
      endDay: Number(sharedNamedMonth[2]),
      endMonth: month
    };
  }

  return null;
}

function extractRelativeDateRange(normalizedMessage: string, currentDate: Date) {
  const mentionsTomorrow = /\bmaine\b/.test(normalizedMessage);
  const oneNight = /\b(?:o|1)\s+noapte\b/.test(normalizedMessage);

  if (!mentionsTomorrow || !oneNight) {
    return null;
  }

  const start = addDays(toLocalDay(currentDate), 1);
  const end = addDays(start, 1);

  return {
    start_date: toIso(start.getFullYear(), start.getMonth() + 1, start.getDate()),
    end_date: toIso(end.getFullYear(), end.getMonth() + 1, end.getDate())
  };
}

function extractGuests(normalizedMessage: string) {
  const adultsAndChildren = normalizedMessage.match(
    /(\d{1,2})\s*adulti?\s+si\s+(?:(\d{1,2})|un|o)\s+cop(?:il|ii)\b/i
  );
  if (adultsAndChildren) {
    const children =
      adultsAndChildren[2] === undefined ? 1 : Number(adultsAndChildren[2]);
    return Number(adultsAndChildren[1]) + children;
  }

  const peopleAndChild = normalizedMessage.match(
    /(\d{1,2})\s*persoane?\s+si\s+(?:(\d{1,2})|un|o)\s+cop(?:il|ii)\b/i
  );
  if (peopleAndChild) {
    const children = peopleAndChild[2] === undefined ? 1 : Number(peopleAndChild[2]);
    return Number(peopleAndChild[1]) + children;
  }

  const direct = normalizedMessage.match(
    /(?:suntem|pentru)?\s*(\d{1,2})\s*(?:persoane|pers|adulti|oaspeti)\b/i
  );
  if (direct) return Number(direct[1]);

  const suntem = normalizedMessage.match(/\bsuntem\s+(\d{1,2})\b/i);
  if (suntem) return Number(suntem[1]);

  const pentru = normalizedMessage.match(
    /\bpentru\s+(\d{1,2})(?!\s*(?:\d|[./-]|ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie))\b/i
  );
  if (pentru) return Number(pentru[1]);

  return null;
}

export function parseBookingDetailsFromRomanianMessage(
  message: string,
  currentDate = new Date()
): ParsedBookingDetails {
  const normalizedMessage = normalizeText(message);
  const datePair = extractDatePair(normalizedMessage);
  const relativeDateRange = datePair
    ? null
    : extractRelativeDateRange(normalizedMessage, currentDate);
  const guests = extractGuests(normalizedMessage);
  const missing: ParsedBookingDetails["missing_fields"] = [];
  let startDate: string | null = relativeDateRange?.start_date ?? null;
  let endDate: string | null = relativeDateRange?.end_date ?? null;

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
    confidence: missing.length === 0 ? "high" : datePair || relativeDateRange || guests ? "medium" : "low",
    missing_fields: missing
  };
}
