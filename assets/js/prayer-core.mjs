import * as Adhan from "../vendor/adhan.esm.min.mjs";
import tzLookup from "../vendor/tz-lookup.mjs";

export const PRAYER_KEYS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
export const OBLIGATORY_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
export const KAABA = Object.freeze({ latitude: 21.422487, longitude: 39.826206 });

const METHOD_FACTORIES = Object.freeze({
  mwl: Adhan.CalculationMethod.MuslimWorldLeague,
  isna: Adhan.CalculationMethod.NorthAmerica,
  egypt: Adhan.CalculationMethod.Egyptian,
  umm: Adhan.CalculationMethod.UmmAlQura,
  karachi: Adhan.CalculationMethod.Karachi,
  turkey: Adhan.CalculationMethod.Turkey
});

export const METHOD_LABELS = Object.freeze({
  mwl: "Muslim World League",
  isna: "Islamic Society of North America (ISNA)",
  egypt: "Egyptian General Authority",
  umm: "Umm Al-Qura University",
  karachi: "University of Islamic Sciences, Karachi",
  turkey: "Diyanet İşleri Başkanlığı, Turkey"
});

function assertCoordinates(latitude, longitude) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new RangeError("Latitude must be between -90 and 90.");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError("Longitude must be between -180 and 180.");
  }
}

export function timezoneForCoordinates(latitude, longitude) {
  assertCoordinates(latitude, longitude);
  return tzLookup(latitude, longitude);
}

function formatterParts(instant, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(new Date(instant));
  const result = {};
  for (const part of parts) {
    if (part.type !== "literal") result[part.type] = Number(part.value);
  }
  return result;
}

export function timezoneOffsetMinutes(timeZone, instant) {
  const timestamp = Math.floor(Number(instant) / 1000) * 1000;
  const p = formatterParts(timestamp, timeZone);
  const representedAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((representedAsUtc - timestamp) / 60000);
}

export function zonedWallTimeToInstant(year, month, day, hour, minute, timeZone) {
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let instant = wallAsUtc - timezoneOffsetMinutes(timeZone, wallAsUtc) * 60000;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const adjusted = wallAsUtc - timezoneOffsetMinutes(timeZone, instant) * 60000;
    if (adjusted === instant) break;
    instant = adjusted;
  }
  return new Date(instant);
}

function makeParameters(method, madhab, adjustments) {
  const factory = METHOD_FACTORIES[method];
  if (!factory) throw new RangeError("Choose a supported prayer calculation method.");
  const parameters = factory();
  parameters.madhab = madhab === "hanafi" ? Adhan.Madhab.Hanafi : Adhan.Madhab.Shafi;
  parameters.highLatitudeRule = Adhan.HighLatitudeRule.MiddleOfTheNight;
  for (const key of PRAYER_KEYS) {
    parameters.adjustments[key] = Number.isFinite(Number(adjustments && adjustments[key]))
      ? Number(adjustments[key])
      : 0;
  }
  return parameters;
}

export function calculatePrayerDay({
  latitude,
  longitude,
  timeZone,
  year,
  month,
  day,
  method = "mwl",
  madhab = "shafi",
  adjustments = {}
}) {
  assertCoordinates(latitude, longitude);
  if (!timeZone) throw new RangeError("A location timezone is required.");
  new Intl.DateTimeFormat("en", { timeZone });
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new RangeError("Choose a valid Gregorian date.");
  }

  const coordinates = new Adhan.Coordinates(latitude, longitude);
  const prayerTimes = new Adhan.PrayerTimes(
    coordinates,
    date,
    makeParameters(method, madhab, adjustments)
  );
  const result = {};
  for (const key of PRAYER_KEYS) {
    const raw = prayerTimes[key];
    if (!(raw instanceof Date) || Number.isNaN(raw.getTime())) {
      result[key] = null;
      continue;
    }
    result[key] = new Date(raw.getTime());
  }
  return result;
}

export function getPrayerWindow(yesterday, today, tomorrow, now = new Date()) {
  const events = [];
  if (yesterday && yesterday.isha) events.push({ key: "isha", time: yesterday.isha });
  for (const key of OBLIGATORY_KEYS) {
    if (today && today[key]) events.push({ key, time: today[key] });
  }
  if (tomorrow && tomorrow.fajr) events.push({ key: "fajr", time: tomorrow.fajr });
  events.sort((a, b) => a.time.getTime() - b.time.getTime());

  const instant = now.getTime();
  let previous = null;
  let next = null;
  for (const event of events) {
    if (event.time.getTime() <= instant) previous = event;
    else if (!next) next = event;
  }
  if (!next) return { previous, next: null, remainingMs: 0, progress: 0 };
  const duration = previous ? next.time.getTime() - previous.time.getTime() : 0;
  const elapsed = previous ? instant - previous.time.getTime() : 0;
  return {
    previous,
    next,
    remainingMs: Math.max(0, next.time.getTime() - instant),
    progress: duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 0
  };
}

export function getQibla(latitude, longitude) {
  assertCoordinates(latitude, longitude);
  const bearing = Adhan.Qibla(new Adhan.Coordinates(latitude, longitude));
  const radians = Math.PI / 180;
  const lat1 = latitude * radians;
  const lat2 = KAABA.latitude * radians;
  const deltaLatitude = (KAABA.latitude - latitude) * radians;
  const deltaLongitude = (KAABA.longitude - longitude) * radians;
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;
  const distanceKm = 6371.0088 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return { bearing, distanceKm };
}
