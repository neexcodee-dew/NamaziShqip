import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePrayerDay,
  getPrayerWindow,
  timezoneForCoordinates,
  timezoneOffsetMinutes
} from "../assets/js/prayer-core.mjs";

const references = [
  {
    city: "Prishtina", latitude: 42.6629, longitude: 21.1655, timeZone: "Europe/Belgrade",
    times: { fajr: "04:50", sunrise: "06:28", dhuhr: "11:20", asr: "13:52", maghrib: "16:12", isha: "17:44" }
  },
  {
    city: "Tirana", latitude: 41.3275, longitude: 19.8187, timeZone: "Europe/Tirane",
    times: { fajr: "04:54", sunrise: "06:30", dhuhr: "11:25", asr: "14:00", maghrib: "16:21", isha: "17:51" }
  },
  {
    city: "Skopje", latitude: 41.9981, longitude: 21.4254, timeZone: "Europe/Skopje",
    times: { fajr: "04:48", sunrise: "06:25", dhuhr: "11:19", asr: "13:52", maghrib: "16:12", isha: "17:44" }
  },
  {
    city: "Belgrade", latitude: 44.7866, longitude: 20.4489, timeZone: "Europe/Belgrade",
    times: { fajr: "04:55", sunrise: "06:36", dhuhr: "11:23", asr: "13:49", maghrib: "16:09", isha: "17:45" }
  },
  {
    city: "Berlin", latitude: 52.52, longitude: 13.405, timeZone: "Europe/Berlin",
    times: { fajr: "05:29", sunrise: "07:30", dhuhr: "11:51", asr: "13:51", maghrib: "16:12", isha: "18:05" }
  }
];

function localClock(date, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).format(date);
}

function minuteOfDay(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function dateFor(reference, day) {
  return {
    latitude: reference.latitude,
    longitude: reference.longitude,
    timeZone: reference.timeZone,
    year: 2026,
    month: 11,
    day,
    method: "mwl"
  };
}

test("MWL results stay within three minutes of AlAdhan's independent 2026-11-16 reference", () => {
  for (const reference of references) {
    const schedule = calculatePrayerDay(dateFor(reference, 16));
    for (const [key, expected] of Object.entries(reference.times)) {
      const actual = localClock(schedule[key], reference.timeZone);
      const difference = Math.abs(minuteOfDay(actual) - minuteOfDay(expected));
      assert.ok(
        difference <= 3,
        reference.city + " " + key + ": app " + actual + ", AlAdhan " + expected + " (" + difference + " min)"
      );
    }
  }
});

test("coordinate lookup returns the IANA zones used by the requested cities", () => {
  assert.equal(timezoneForCoordinates(42.6629, 21.1655), "Europe/Belgrade");
  assert.equal(timezoneForCoordinates(41.3275, 19.8187), "Europe/Tirane");
  assert.equal(timezoneForCoordinates(41.9981, 21.4254), "Europe/Skopje");
  assert.equal(timezoneForCoordinates(44.7866, 20.4489), "Europe/Belgrade");
  assert.equal(timezoneForCoordinates(52.52, 13.405), "Europe/Berlin");
});

test("timezone offsets follow both European daylight-saving transitions", () => {
  const offset = (month, day) => timezoneOffsetMinutes("Europe/Belgrade", Date.UTC(2026, month - 1, day, 12));
  assert.equal(offset(3, 28), 60);
  assert.equal(offset(3, 30), 120);
  assert.equal(offset(10, 24), 120);
  assert.equal(offset(10, 26), 60);
});

test("Hanafi Asr is later than standard Asr and manual adjustments are applied per prayer", () => {
  const standard = calculatePrayerDay(dateFor(references[0], 16));
  const hanafi = calculatePrayerDay({ ...dateFor(references[0], 16), madhab: "hanafi" });
  assert.ok(hanafi.asr.getTime() > standard.asr.getTime() + 30 * 60000);

  const adjusted = calculatePrayerDay({
    ...dateFor(references[0], 16),
    adjustments: { fajr: 7, sunrise: 0, dhuhr: 0, asr: -2, maghrib: 0, isha: 0 }
  });
  assert.equal((adjusted.fajr.getTime() - standard.fajr.getTime()) / 60000, 7);
  assert.equal((adjusted.asr.getTime() - standard.asr.getTime()) / 60000, -2);
  assert.equal(adjusted.dhuhr.getTime(), standard.dhuhr.getTime());
});

test("daily prayer windows move from Isha to tomorrow's Fajr without a negative countdown", () => {
  const reference = references[0];
  const yesterday = calculatePrayerDay(dateFor(reference, 15));
  const today = calculatePrayerDay(dateFor(reference, 16));
  const tomorrow = calculatePrayerDay(dateFor(reference, 17));
  const afterIsha = new Date(today.isha.getTime() + 30 * 60000);
  const window = getPrayerWindow({ isha: today.isha }, today, { fajr: tomorrow.fajr }, afterIsha);

  assert.equal(window.next.key, "fajr");
  assert.equal(window.next.time.getTime(), tomorrow.fajr.getTime());
  assert.ok(window.remainingMs > 0);
  assert.ok(window.progress >= 0 && window.progress <= 1);

  const twoMinutesBeforeFajr = new Date(today.fajr.getTime() - 2 * 60000);
  const beforeFajr = getPrayerWindow({ isha: yesterday.isha }, today, { fajr: tomorrow.fajr }, twoMinutesBeforeFajr);
  assert.equal(beforeFajr.next.key, "fajr");
  assert.equal(beforeFajr.remainingMs, 120000);

  const afterFajr = new Date(today.fajr.getTime() + 60000);
  const afterFajrWindow = getPrayerWindow({ isha: yesterday.isha }, today, { fajr: tomorrow.fajr }, afterFajr);
  assert.equal(afterFajrWindow.next.key, "dhuhr");
  assert.ok(afterFajrWindow.remainingMs > 0);
});

test("the month view can reuse the same daily calculation inputs exactly", () => {
  const reference = references[0];
  const daily = calculatePrayerDay(dateFor(reference, 16));
  const monthlyRow = calculatePrayerDay(dateFor(reference, 16));
  for (const key of Object.keys(daily)) {
    assert.equal(monthlyRow[key].getTime(), daily[key].getTime(), key);
  }
});
