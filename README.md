# NamaziShqip

NamaziShqip is a static Albanian-first prayer times PWA. The browser calculates prayer times from the saved coordinates, calculation method, madhab, and per-prayer adjustments. Prayer schedules do not depend on a prayer-times API at runtime.

## Run and deploy

- Publish the project root as the Netlify publish directory. This project has no build step.
- Keep `_headers` in the published root. It sets a JavaScript MIME type for the `.mjs` calculation and timezone modules used by the app.
- Serve over HTTPS for installation, geolocation, notifications, and device orientation. `localhost` is also a secure context in modern browsers.
- The app uses the bundled Adhan JS and `tz-lookup` modules under `assets/vendor/`; their license files are beside the bundles.

## Verify the calculation core

Run the automated prayer calculation tests with:

```sh
node --test tests/prayer-core.test.mjs
```

The test set covers MWL comparisons for Prishtina, Tirana, Skopje, Belgrade, and Berlin; IANA timezone lookup; European daylight-saving transitions; Hanafi Asr; per-prayer adjustments; midnight countdown transitions; and shared daily/monthly calculation inputs.

## Behavior and limits

- On a first visit, the app asks for location permission. If permission is declined, select a city or use search; it does not silently select a default city.
- Prayer times are calculated locally. A city search sends the search text to Photon/OpenStreetMap. GPS coordinates stay on the device unless the user separately chooses the city-identification action and confirms sending them.
- The selected calculation convention is shown in the schedule. Different conventions and local mosque timetables can differ; manual adjustments are available.
- Browser notifications require the page to remain open. Closed-app delivery needs a Web Push service and a backend, which this static project does not include.
- Browsers require a user gesture for audio playback. The project contains one full Azan recording, so there are no alternate recordings to select.
- The Qibla bearing and distance work without a compass sensor. Live device orientation depends on hardware, browser support, and permission.
- The Hijri date uses the browser's `islamic-umalqura` calendar data and may differ from local moon-sighting announcements.
- The Quran card currently shows An-Nisa 4:103. Two Hadith summaries with source references rotate by day. A full Quran-of-the-day collection, the 99 Names of Allah, and a sourced morning/evening adhkar collection are not included yet; they need reviewed Albanian content before publication.
- GPS, audio, notification, installation, and orientation behavior still needs a final check on supported physical phones and browsers after deployment.
