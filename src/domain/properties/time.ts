function toPaddedTime(hours: number, minutes: number) {
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizePropertyTime(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  const twelveHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)$/i);

  if (twelveHourMatch) {
    const period = twelveHourMatch[3].toLowerCase();
    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);

    if (hours < 1 || hours > 12) {
      return trimmed;
    }

    if (period === "pm" && hours !== 12) {
      hours += 12;
    }

    if (period === "am" && hours === 12) {
      hours = 0;
    }

    return toPaddedTime(hours, minutes) ?? trimmed;
  }

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);
    return toPaddedTime(hours, minutes) ?? trimmed;
  }

  return trimmed;
}
