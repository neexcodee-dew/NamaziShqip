import {
  calculatePrayerDay,
  getPrayerWindow,
  getQibla,
  timezoneForCoordinates,
  zonedWallTimeToInstant,
  PRAYER_KEYS,
  OBLIGATORY_KEYS
} from "./assets/js/prayer-core.mjs";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const STORAGE_KEY = "namazishqip.settings.v2";
const LEGACY_KEY = "nsq";
const CIRCUMFERENCE = 2 * Math.PI * 106;
const PRAYER_SYMBOLS = { fajr: "☼", sunrise: "◌", dhuhr: "◉", asr: "◒", maghrib: "◕", isha: "☾" };
const PRAYER_ARABIC = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء"
};
const DEFAULT_ADJUSTMENTS = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
const DEFAULT_PRAYERS = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };

const COPY = {
  sq: {
    brandTagline: "Koha jote. Qetësia jote.",
    online: "Online", offline: "Pa internet", install: "Instalo",
    chooseLocation: "Zgjidh vendndodhjen", pageEyebrow: "Udhërrëfyesi yt i përditshëm",
    pageTitle: "Kohët e namazit", nextPrayer: "Namazi i radhës",
    timeRemaining: "Koha e mbetur", dailySchedule: "Orari i ditës",
    prayerSchedule: "Namazet e sotme",
    methodNote: "Orari varet nga metoda e zgjedhur dhe mund të ndryshojë nga kalendari i xhamisë suaj.",
    yourDay: "Dita jote", prayerProgress: "Namazet e shënuara",
    quranVerse: "Ajet për kohët e namazit",
    sourceNisa: "En-Nisa, 4:103 · Lexo burimin",
    dailyHadith: "Hadith i verifikuar",
    hadithSource: "Sahih al-Bukhari 6464 · Lexo burimin",
    hadithSourceMuslim: "Sahih Muslim 597a · Lexo burimin",
    ramadan: "Ramazani", sehri: "Syfyri", iftar: "Iftari",
    ramadanNote: "Kohët e syfyrit dhe iftarit bazohen te Sabahu dhe Akshami.",
    fridayReminder: "Kujtesë për xhumanë", monthView: "Pamja mujore",
    monthlyCalendar: "Takvimi mujor", print: "Shtyp",
    downloadCsv: "Shkarko CSV",
    calendarNote: "Takvimi përdor të njëjtën metodë, medh'heb dhe rregullime si orari i ditës.",
    direction: "Drejtimi", qibla: "Kibla", activateCompass: "Aktivizo busullën",
    bearing: "Këndi i kibles", distanceToKaaba: "Largësia deri te Qabja",
    compassFallback: "Drejtimi statik llogaritet nga koordinatat. Busulla kërkon sensor dhe leje nga pajisja.",
    quietPractice: "Praktikë e qetë", tasbih: "Tesbihu digjital",
    customTarget: "Cak i personalizuar", reset: "Rifillo",
    tasbihPersistence: "Numërimi ruhet në këtë pajisje. Dridhja varet nga mbështetja e telefonit.",
    personalize: "Përshtate për vete", settings: "Cilësimet",
    locationSettings: "Vendndodhja",
    locationExplain: "Orari dhe zona kohore përcaktohen nga koordinatat e zgjedhura.",
    country: "Shteti", city: "Qyteti", search: "Kërko", useGps: "Përdor GPS",
    identifyGps: "Gjej qytetin (dërgo koordinatat)", clearLocation: "Hiq vendndodhjen",
    privacyNote: "Koordinatat nga GPS llogariten në pajisje. Për emrin e qytetit, mund t'i dërgosh veçmas te OpenStreetMap.",
    popularCities: "Qytete të shpejta",
    prayerCalculation: "Llogaritja e namazit",
    calculationExplain: "Zgjidh konventën që përdor komuniteti yt lokal.",
    calculationMethod: "Metoda e llogaritjes", asrMethod: "Metoda e Ikindisë",
    standard: "Shafi'i / Standard", hanafi: "Hanefi", timeFormat: "Formati i orës",
    adjustmentNote: "Rregullimet shtohen në minutat e metodës së zgjedhur.",
    alerts: "Njoftimet",
    notificationsExplain: "Njoftimet lokale kërkojnë që kjo faqe të jetë e hapur.",
    reminderBefore: "Kujto para namazit", atPrayerTime: "Në kohën e namazit",
    enableNotifications: "Lejo njoftimet", testNotification: "Provo njoftimin",
    backgroundLimit: "Shfletuesit nuk dërgojnë njoftime kur aplikacioni është mbyllur; kjo kërkon Web Push dhe server. Në iOS, njoftimet web kërkojnë instalim në Home Screen dhe version të mbështetur.",
    azan: "Ezani",
    azanExplain: "Kontrollet e audios funksionojnë pasi të japësh leje me një prekje.",
    enableAzan: "Aktivizo ezanin e plotë", volume: "Volumi",
    previewAzan: "Dëgjo provën", pauseResume: "Ndalo / vazhdo", stopAudio: "Ndalo audion",
    audioNote: "Ky projekt përmban një skedar ezani. Luajtja automatike mund të bllokohet nga shfletuesi.",
    appearance: "Pamja", appearanceExplain: "Ruhet në këtë pajisje.",
    language: "Gjuha", theme: "Tema", systemTheme: "Sipas pajisjes",
    lightTheme: "E çelët", darkTheme: "E errët",
    installOffline: "Instalimi dhe offline",
    installExplain: "Orari llogaritet në pajisje dhe mund të rifreskohet pa internet.",
    iosInstallNote: "Në iPhone: hap menynë Share në Safari dhe zgjidh “Add to Home Screen”.",
    navHome: "Sot", navCalendar: "Takvimi", navQibla: "Kibla",
    navTasbih: "Tesbih", navSettings: "Cilësimet",
    chooseCountry: "Zgjidh shtetin", choosePopular: "Zgjidh qytetin",
    searchCityPlaceholder: "Kërko qytet në botë",
    noLocation: "Vendndodhja nuk është caktuar. Përdor GPS ose kërko një qytet.",
    noSchedule: "Vendos një vendndodhje për të llogaritur orarin.",
    awaitingLocation: "Duke pritur vendndodhjen",
    coordinates: "Koordinatat", timezone: "Zona kohore",
    localTime: "Ora lokale", method: "Metoda",
    noCityResults: "Nuk u gjet qytet. Provo një emër tjetër ose shto shtetin.",
    searchError: "Kërkimi i qytetit dështoi. Kontrollo lidhjen dhe provo sërish.",
    searchForCity: "Shkruaj një qytet për të kërkuar.",
    selectedLocation: "Vendndodhja u përditësua.",
    myLocation: "Vendndodhja ime",
    gpsUnavailable: "GPS nuk mbështetet nga ky shfletues.",
    gpsDenied: "Vendndodhja nuk u mor. Lejo GPS-in ose kërko qytetin manualisht.",
    gpsTimeout: "GPS nuk u përgjigj me kohë. Provo përsëri ose kërko qytetin.",
    gpsPrivacyConfirm: "Për të gjetur emrin e qytetit, koordinatat e sakta do t'i dërgohen shërbimit OpenStreetMap/Photon. Të vazhdohet?",
    gpsNameReady: "Vendndodhja u ruajt lokalisht. Emrin e qytetit mund ta kërkosh veçmas.",
    gpsNameError: "Nuk u gjet emri i qytetit. Koordinatat dhe zona kohore vazhdojnë të përdoren.",
    locationCleared: "Vendndodhja u hoq. Zgjidh një qytet ose përdor GPS.",
    loading: "Duke llogaritur…",
    loadingLocation: "Duke kërkuar vendndodhjen…",
    calculationError: "Llogaritja dështoi. Kontrollo koordinatat dhe cilësimet.",
    prayerNames: ["Sabahu", "Lindja e diellit", "Dreka", "Ikindia", "Akshami", "Jacia"],
    method_mwl: "Liga Botërore Myslimane",
    method_isna: "Shoqata Islame e Amerikës së Veriut (ISNA)",
    method_egypt: "Autoriteti i Përgjithshëm Egjiptian",
    method_umm: "Universiteti Umm al-Qura",
    method_karachi: "Universiteti i Shkencave Islame, Karaçi",
    method_turkey: "Diyanet İşleri Başkanlığı, Turqi",
    quranTranslation: "Vërtet, namazi është detyrë për besimtarët në kohë të caktuara.",
    hadithText1: "Veprat më të dashura tek Allahu janë ato që bëhen me vazhdimësi, edhe nëse janë të pakta.",
    hadithText2: "Pas çdo namazi: madhëroje Allahun 33 herë, falënderoje 33 herë dhe shpalle madhështinë e Tij 33 herë; pastaj plotësoje të njëqindtën me teuhid.",
    prayerLabel: "Namazi", nextAt: "Namazi i radhës: {prayer}, në {time}.",
    prayerDue: "Hyri koha e {prayer}.",
    prayerReminder: "{prayer} fillon pas {minutes} min, në {time}.",
    permissionUnsupported: "Ky shfletues nuk mbështet njoftimet.",
    permissionGranted: "Leja e njoftimeve është aktive.",
    permissionDenied: "Njoftimet janë bllokuar në cilësimet e shfletuesit.",
    permissionDefault: "Leja e njoftimeve ende nuk është dhënë.",
    notificationsEnabled: "Njoftimet u aktivizuan.",
    notificationsDisabled: "Njoftimet u çaktivizuan.",
    notificationsNeedPermission: "Lejo njoftimet në shfletues për t'i përdorur.",
    testNotificationSent: "U dërgua njoftimi provë.",
    tasbihTotal: "Gjithsej: {count}",
    resetConfirm: "Të rifillohet numërimi aktual?",
    tasbihComplete: "U plotësua caku: {target}.",
    ramadanDays: "Ramazani pritet pas {count} ditësh.",
    ramadanToday: "Ramazani Mubarak",
    ramadanTomorrow: "Ramazani pritet nesër.",
    fridayToday: "Sot është e premte. Kujtoje xhumanë sipas orarit të xhamisë sate.",
    fridayNext: "E premtja e radhës është {date}. Kontrollo orarin e xhamisë sate.",
    noCalendarLocation: "Zgjidh vendndodhjen për të parë takvimin.",
    noPrayerData: "—",
    csvDownloaded: "Takvimi u shkarkua si CSV.",
    notificationTitle: "NamaziShqip",
    locationSettingsLabel: "Ndrysho vendndodhjen",
    compassPermission: "Lejo orientimin e pajisjes për të përdorur busullën.",
    compassActive: "Busulla është aktive. Ktheje pajisjen drejt shigjetës.",
    compassStatic: "Drejtimi statik është gati. Busulla e pajisjes nuk është aktive.",
    compassUnavailable: "Sensori i busullës nuk mbështetet në këtë pajisje.",
    compassDenied: "Leja e busullës nuk u dha.",
    azanPlaying: "Ezani po luhet.",
    azanBlocked: "Shfletuesi bllokoi audion. Shtyp “Dëgjo provën” fillimisht.",
    azanEnabledToast: "Ezani u aktivizua për namazet e zgjedhura.",
    azanDisabledToast: "Ezani u çaktivizua.",
    audioPaused: "Ezani u ndal përkohësisht.", audioStopped: "Audioja u ndal.",
    systemTime: "Ora e pajisjes",
    installed: "Aplikacioni është i instaluar.",
    installUnavailable: "Përdor menynë e shfletuesit për ta instaluar.",
    monthNames: ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor"],
    calendarHeaders: ["Data", "Data Hixhri", "Sabahu", "Lindja", "Dreka", "Ikindia", "Akshami", "Jacia"],
    target: "Caku", custom: "Personalizuar", saveError: "Preferencat nuk mund të ruhen në këtë shfletues."
  },
  en: {
    brandTagline: "Your time. Your peace.", online: "Online", offline: "Offline", install: "Install",
    chooseLocation: "Choose location", pageEyebrow: "Your daily guide", pageTitle: "Prayer times",
    nextPrayer: "Next prayer", timeRemaining: "Time remaining", dailySchedule: "Today's schedule",
    prayerSchedule: "Today's prayers",
    methodNote: "Times follow the selected method and may differ from your local mosque timetable.",
    yourDay: "Your day", prayerProgress: "Prayers checked", quranVerse: "A verse about prayer times",
    sourceNisa: "An-Nisa, 4:103 · Read source", dailyHadith: "Verified hadith",
    hadithSource: "Sahih al-Bukhari 6464 · Read source",
    hadithSourceMuslim: "Sahih Muslim 597a · Read source", ramadan: "Ramadan",
    sehri: "Suhoor", iftar: "Iftar",
    ramadanNote: "Suhoor and iftar times use Fajr and Maghrib.",
    fridayReminder: "Jumu'ah reminder", monthView: "Month view",
    monthlyCalendar: "Monthly calendar", print: "Print", downloadCsv: "Download CSV",
    calendarNote: "The calendar uses the same method, madhab, and adjustments as today's schedule.",
    direction: "Direction", qibla: "Qibla", activateCompass: "Activate compass",
    bearing: "Qibla bearing", distanceToKaaba: "Distance to the Kaaba",
    compassFallback: "The static direction is calculated from your coordinates. A compass needs a supported sensor and device permission.",
    quietPractice: "A quiet practice", tasbih: "Digital tasbih",
    customTarget: "Custom target", reset: "Reset",
    tasbihPersistence: "Your count is saved on this device. Haptics depend on phone support.",
    personalize: "Make it yours", settings: "Settings", locationSettings: "Location",
    locationExplain: "Times and timezone are based on the selected coordinates.",
    country: "Country", city: "City", search: "Search", useGps: "Use GPS",
    identifyGps: "Find city name (send coordinates)", clearLocation: "Clear location",
    privacyNote: "GPS coordinates are calculated on this device. To identify a city, you can send them separately to OpenStreetMap.",
    popularCities: "Popular cities", prayerCalculation: "Prayer calculation",
    calculationExplain: "Choose the convention followed by your local community.",
    calculationMethod: "Calculation method", asrMethod: "Asr method",
    standard: "Shafi'i / Standard", hanafi: "Hanafi", timeFormat: "Time format",
    adjustmentNote: "Adjustments are added to the selected method's times.",
    alerts: "Notifications",
    notificationsExplain: "Local notifications require this page to remain open.",
    reminderBefore: "Remind before prayer", atPrayerTime: "At prayer time",
    enableNotifications: "Allow notifications", testNotification: "Test notification",
    backgroundLimit: "Browsers cannot send notifications after the app is closed; that requires Web Push and a server. On iOS, web notifications require Home Screen installation and a supported version.",
    azan: "Adhan", azanExplain: "Audio controls work after you allow playback with a tap.",
    enableAzan: "Enable full adhan", volume: "Volume", previewAzan: "Play preview",
    pauseResume: "Pause / resume", stopAudio: "Stop audio",
    audioNote: "This project includes one adhan audio file. Browsers may block automatic playback.",
    appearance: "Appearance", appearanceExplain: "Saved on this device.",
    language: "Language", theme: "Theme", systemTheme: "Use device setting",
    lightTheme: "Light", darkTheme: "Dark",
    installOffline: "Install and offline", installExplain: "Times are calculated on this device and can be refreshed without internet.",
    iosInstallNote: "On iPhone: open Safari's Share menu and choose “Add to Home Screen”.",
    navHome: "Today", navCalendar: "Calendar", navQibla: "Qibla",
    navTasbih: "Tasbih", navSettings: "Settings",
    chooseCountry: "Choose a country", choosePopular: "Choose a city",
    searchCityPlaceholder: "Search for a city worldwide",
    noLocation: "No location is set. Use GPS or search for a city.",
    noSchedule: "Choose a location to calculate prayer times.",
    awaitingLocation: "Waiting for location", coordinates: "Coordinates",
    timezone: "Timezone", localTime: "Local time", method: "Method",
    noCityResults: "No city found. Try another name or add the country.",
    searchError: "City search failed. Check your connection and try again.",
    searchForCity: "Enter a city to search.", selectedLocation: "Location updated.",
    myLocation: "My location", gpsUnavailable: "GPS is not supported by this browser.",
    gpsDenied: "Location was not received. Allow GPS or search manually.",
    gpsTimeout: "GPS did not respond in time. Try again or search for a city.",
    gpsPrivacyConfirm: "To identify the city, your precise coordinates will be sent to the OpenStreetMap/Photon service. Continue?",
    gpsNameReady: "Location saved on this device. You can look up the city name separately.",
    gpsNameError: "City name was not found. Coordinates and timezone are still in use.",
    locationCleared: "Location cleared. Choose a city or use GPS.",
    loading: "Calculating…", loadingLocation: "Finding your location…",
    calculationError: "Calculation failed. Check coordinates and settings.",
    prayerNames: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"],
    method_mwl: "Muslim World League", method_isna: "Islamic Society of North America (ISNA)",
    method_egypt: "Egyptian General Authority", method_umm: "Umm Al-Qura University",
    method_karachi: "University of Islamic Sciences, Karachi",
    method_turkey: "Diyanet İşleri Başkanlığı, Turkey",
    quranTranslation: "Indeed, prayer is prescribed for believers at appointed times.",
    hadithText1: "The deeds most loved by Allah are those done consistently, even if they are few.",
    hadithText2: "After each prayer: glorify Allah 33 times, praise Him 33 times, and declare His greatness 33 times; complete the hundredth with words of tawhid.",
    prayerLabel: "Prayer", nextAt: "Next prayer: {prayer}, at {time}.",
    prayerDue: "{prayer} time has started.",
    prayerReminder: "{prayer} begins in {minutes} min, at {time}.",
    permissionUnsupported: "This browser does not support notifications.",
    permissionGranted: "Notification permission is enabled.",
    permissionDenied: "Notifications are blocked in browser settings.",
    permissionDefault: "Notification permission has not been granted.",
    notificationsEnabled: "Notifications enabled.",
    notificationsDisabled: "Notifications disabled.",
    notificationsNeedPermission: "Allow notifications in your browser to use them.",
    testNotificationSent: "Test notification sent.", tasbihTotal: "Total: {count}",
    resetConfirm: "Reset the current count?",
    tasbihComplete: "Target reached: {target}.", ramadanDays: "Ramadan is expected in {count} days.",
    ramadanToday: "Ramadan Mubarak", ramadanTomorrow: "Ramadan is expected tomorrow.",
    fridayToday: "Today is Friday. Check your mosque's Jumu'ah time.",
    fridayNext: "The next Friday is {date}. Check your mosque's Jumu'ah time.",
    noCalendarLocation: "Choose a location to view the calendar.",
    noPrayerData: "—", csvDownloaded: "Calendar downloaded as CSV.",
    notificationTitle: "NamaziShqip", locationSettingsLabel: "Change location",
    compassPermission: "Allow device orientation to use the compass.",
    compassActive: "Compass is active. Turn your device toward the pointer.",
    compassStatic: "Static direction is ready. Device compass is not active.",
    compassUnavailable: "A compass sensor is not available on this device.",
    compassDenied: "Compass permission was not granted.",
    azanPlaying: "Adhan is playing.",
    azanBlocked: "The browser blocked audio. Press “Play preview” first.",
    azanEnabledToast: "Adhan enabled for selected prayers.",
    azanDisabledToast: "Adhan disabled.", audioPaused: "Adhan paused.", audioStopped: "Audio stopped.",
    systemTime: "Device time", installed: "App is installed.",
    installUnavailable: "Use the browser menu to install this app.",
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    calendarHeaders: ["Date", "Hijri date", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"],
    target: "Target", custom: "Custom", saveError: "Preferences could not be saved in this browser."
  },
  de: {
    brandTagline: "Deine Zeit. Deine Ruhe.", online: "Online", offline: "Offline", install: "Installieren",
    chooseLocation: "Standort auswählen", pageEyebrow: "Dein täglicher Wegweiser",
    pageTitle: "Gebetszeiten", nextPrayer: "Nächstes Gebet",
    timeRemaining: "Verbleibende Zeit", dailySchedule: "Tagesplan",
    prayerSchedule: "Heutige Gebete",
    methodNote: "Die Zeiten richten sich nach der gewählten Methode und können vom Plan deiner Moschee abweichen.",
    yourDay: "Dein Tag", prayerProgress: "Abgehakte Gebete",
    quranVerse: "Ein Vers über Gebetszeiten",
    sourceNisa: "An-Nisa, 4:103 · Quelle lesen", dailyHadith: "Verifizierter Hadith",
    hadithSource: "Sahih al-Bukhari 6464 · Quelle lesen",
    hadithSourceMuslim: "Sahih Muslim 597a · Quelle lesen",
    ramadan: "Ramadan", sehri: "Suhur", iftar: "Iftar",
    ramadanNote: "Suhur- und Iftarzeiten richten sich nach Fadschr und Maghrib.",
    fridayReminder: "Jumu'ah-Erinnerung", monthView: "Monatsansicht",
    monthlyCalendar: "Monatskalender", print: "Drucken", downloadCsv: "CSV herunterladen",
    calendarNote: "Der Kalender verwendet dieselbe Methode, Madhhab-Einstellung und Korrektur wie der Tagesplan.",
    direction: "Richtung", qibla: "Qibla", activateCompass: "Kompass aktivieren",
    bearing: "Qibla-Richtung", distanceToKaaba: "Entfernung zur Kaaba",
    compassFallback: "Die feste Richtung wird anhand deiner Koordinaten berechnet. Ein Kompass benötigt einen unterstützten Sensor und Gerätefreigabe.",
    quietPractice: "Ein stilles Ritual", tasbih: "Digitaler Tasbih",
    customTarget: "Eigenes Ziel", reset: "Zurücksetzen",
    tasbihPersistence: "Dein Zählerstand wird auf diesem Gerät gespeichert. Vibration hängt von der Geräteunterstützung ab.",
    personalize: "Persönlich anpassen", settings: "Einstellungen",
    locationSettings: "Standort",
    locationExplain: "Zeiten und Zeitzone richten sich nach den ausgewählten Koordinaten.",
    country: "Land", city: "Stadt", search: "Suchen", useGps: "GPS verwenden",
    identifyGps: "Stadtname finden (Koordinaten senden)", clearLocation: "Standort löschen",
    privacyNote: "GPS-Koordinaten werden auf diesem Gerät berechnet. Für den Stadtnamen kannst du sie separat an OpenStreetMap senden.",
    popularCities: "Beliebte Städte", prayerCalculation: "Gebetsberechnung",
    calculationExplain: "Wähle die Konvention deiner örtlichen Gemeinschaft.",
    calculationMethod: "Berechnungsmethode", asrMethod: "Asr-Methode",
    standard: "Schafi'i / Standard", hanafi: "Hanafitisch", timeFormat: "Zeitformat",
    adjustmentNote: "Korrekturen werden zu den Zeiten der gewählten Methode addiert.",
    alerts: "Benachrichtigungen",
    notificationsExplain: "Lokale Benachrichtigungen benötigen eine geöffnete Seite.",
    reminderBefore: "Vor dem Gebet erinnern", atPrayerTime: "Zur Gebetszeit",
    enableNotifications: "Benachrichtigungen erlauben", testNotification: "Testbenachrichtigung",
    backgroundLimit: "Browser senden keine Benachrichtigungen, wenn die App geschlossen ist; dafür sind Web Push und ein Server nötig. Unter iOS sind eine Installation auf dem Home-Bildschirm und eine unterstützte Version erforderlich.",
    azan: "Adhan", azanExplain: "Audio funktioniert, nachdem du die Wiedergabe per Tippen freigegeben hast.",
    enableAzan: "Vollen Adhan aktivieren", volume: "Lautstärke",
    previewAzan: "Vorschau abspielen", pauseResume: "Anhalten / fortsetzen", stopAudio: "Audio stoppen",
    audioNote: "Dieses Projekt enthält eine Adhan-Audiodatei. Der Browser kann die automatische Wiedergabe blockieren.",
    appearance: "Darstellung", appearanceExplain: "Wird auf diesem Gerät gespeichert.",
    language: "Sprache", theme: "Design", systemTheme: "Geräteeinstellung verwenden",
    lightTheme: "Hell", darkTheme: "Dunkel",
    installOffline: "Installation und Offlinebetrieb",
    installExplain: "Zeiten werden auf dem Gerät berechnet und können ohne Internet aktualisiert werden.",
    iosInstallNote: "Auf dem iPhone: Öffne in Safari das Teilen-Menü und wähle „Zum Home-Bildschirm“.",
    navHome: "Heute", navCalendar: "Kalender", navQibla: "Qibla",
    navTasbih: "Tasbih", navSettings: "Einstellungen",
    chooseCountry: "Land wählen", choosePopular: "Stadt wählen",
    searchCityPlaceholder: "Weltweit nach einer Stadt suchen",
    noLocation: "Kein Standort festgelegt. Nutze GPS oder suche eine Stadt.",
    noSchedule: "Wähle einen Standort, um Gebetszeiten zu berechnen.",
    awaitingLocation: "Warte auf Standort", coordinates: "Koordinaten",
    timezone: "Zeitzone", localTime: "Ortszeit", method: "Methode",
    noCityResults: "Keine Stadt gefunden. Probiere einen anderen Namen oder ergänze das Land.",
    searchError: "Stadtsuche fehlgeschlagen. Prüfe die Verbindung und versuche es erneut.",
    searchForCity: "Gib eine Stadt für die Suche ein.", selectedLocation: "Standort aktualisiert.",
    myLocation: "Mein Standort", gpsUnavailable: "GPS wird von diesem Browser nicht unterstützt.",
    gpsDenied: "Standort nicht erhalten. Erlaube GPS oder suche manuell nach einer Stadt.",
    gpsTimeout: "GPS hat nicht rechtzeitig geantwortet. Versuche es erneut oder suche eine Stadt.",
    gpsPrivacyConfirm: "Um den Stadtnamen zu ermitteln, werden deine genauen Koordinaten an OpenStreetMap/Photon gesendet. Fortfahren?",
    gpsNameReady: "Standort auf diesem Gerät gespeichert. Den Stadtnamen kannst du separat suchen.",
    gpsNameError: "Stadtname nicht gefunden. Koordinaten und Zeitzone werden weiterhin verwendet.",
    locationCleared: "Standort gelöscht. Wähle eine Stadt oder nutze GPS.",
    loading: "Berechnung läuft…", loadingLocation: "Standort wird ermittelt…",
    calculationError: "Berechnung fehlgeschlagen. Prüfe Koordinaten und Einstellungen.",
    prayerNames: ["Fadschr", "Sonnenaufgang", "Dhuhr", "Asr", "Maghrib", "Ischaa"],
    method_mwl: "Muslim World League",
    method_isna: "Islamische Gesellschaft Nordamerikas (ISNA)",
    method_egypt: "Ägyptische Allgemeine Behörde",
    method_umm: "Umm-al-Qura-Universität",
    method_karachi: "Universität für Islamwissenschaften, Karatschi",
    method_turkey: "Diyanet İşleri Başkanlığı, Türkei",
    quranTranslation: "Das Gebet ist den Gläubigen zu bestimmten Zeiten vorgeschrieben.",
    hadithText1: "Allah liebt am meisten die Taten, die beständig verrichtet werden, auch wenn sie gering sind.",
    hadithText2: "Nach jedem Gebet: Allah 33-mal preisen, Ihm 33-mal danken und Seine Größe 33-mal verkünden; das Hundertste mit dem Glaubensbekenntnis vervollständigen.",
    prayerLabel: "Gebet", nextAt: "Nächstes Gebet: {prayer}, um {time}.",
    prayerDue: "Die Zeit für {prayer} hat begonnen.",
    prayerReminder: "{prayer} beginnt in {minutes} Min. um {time}.",
    permissionUnsupported: "Dieser Browser unterstützt keine Benachrichtigungen.",
    permissionGranted: "Benachrichtigungen sind freigegeben.",
    permissionDenied: "Benachrichtigungen sind in den Browsereinstellungen gesperrt.",
    permissionDefault: "Die Freigabe für Benachrichtigungen wurde noch nicht erteilt.",
    notificationsEnabled: "Benachrichtigungen aktiviert.",
    notificationsDisabled: "Benachrichtigungen deaktiviert.",
    notificationsNeedPermission: "Erlaube Benachrichtigungen im Browser, um sie zu verwenden.",
    testNotificationSent: "Testbenachrichtigung gesendet.", tasbihTotal: "Gesamt: {count}",
    resetConfirm: "Aktuellen Zählerstand zurücksetzen?",
    tasbihComplete: "Ziel erreicht: {target}.", ramadanDays: "Ramadan wird in {count} Tagen erwartet.",
    ramadanToday: "Ramadan Mubarak", ramadanTomorrow: "Ramadan wird morgen erwartet.",
    fridayToday: "Heute ist Freitag. Prüfe die Jumu'ah-Zeit deiner Moschee.",
    fridayNext: "Der nächste Freitag ist {date}. Prüfe die Jumu'ah-Zeit deiner Moschee.",
    noCalendarLocation: "Wähle einen Standort, um den Kalender zu sehen.",
    noPrayerData: "—", csvDownloaded: "Kalender als CSV heruntergeladen.",
    notificationTitle: "NamaziShqip", locationSettingsLabel: "Standort ändern",
    compassPermission: "Erlaube die Geräteausrichtung, um den Kompass zu nutzen.",
    compassActive: "Kompass aktiv. Drehe dein Gerät in Richtung des Zeigers.",
    compassStatic: "Feste Richtung verfügbar. Der Gerätekompass ist nicht aktiv.",
    compassUnavailable: "Auf diesem Gerät ist kein Kompasssensor verfügbar.",
    compassDenied: "Kompassfreigabe wurde nicht erteilt.",
    azanPlaying: "Adhan wird abgespielt.",
    azanBlocked: "Der Browser hat Audio blockiert. Drücke zuerst „Vorschau abspielen“.",
    azanEnabledToast: "Adhan für ausgewählte Gebete aktiviert.",
    azanDisabledToast: "Adhan deaktiviert.", audioPaused: "Adhan pausiert.", audioStopped: "Audio gestoppt.",
    systemTime: "Gerätezeit", installed: "App ist installiert.",
    installUnavailable: "Nutze das Browsermenü, um die App zu installieren.",
    monthNames: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    calendarHeaders: ["Datum", "Hidschri", "Fadschr", "Sonnenaufgang", "Dhuhr", "Asr", "Maghrib", "Ischaa"],
    target: "Ziel", custom: "Benutzerdefiniert", saveError: "Einstellungen konnten in diesem Browser nicht gespeichert werden."
  }
};

const CITIES = [
  { id: "prishtina", name: "Prishtinë", country: "XK", lat: 42.6629, lon: 21.1655, zone: "Europe/Belgrade" },
  { id: "prizren", name: "Prizren", country: "XK", lat: 42.2139, lon: 20.7397, zone: "Europe/Belgrade" },
  { id: "peje", name: "Pejë", country: "XK", lat: 42.6593, lon: 20.2887, zone: "Europe/Belgrade" },
  { id: "gjakova", name: "Gjakovë", country: "XK", lat: 42.3803, lon: 20.4308, zone: "Europe/Belgrade" },
  { id: "mitrovica", name: "Mitrovicë", country: "XK", lat: 42.8914, lon: 20.866, zone: "Europe/Belgrade" },
  { id: "tirana", name: "Tiranë", country: "AL", lat: 41.3275, lon: 19.8187, zone: "Europe/Tirane" },
  { id: "durres", name: "Durrës", country: "AL", lat: 41.3246, lon: 19.4565, zone: "Europe/Tirane" },
  { id: "skopje", name: "Shkup", country: "MK", lat: 41.9981, lon: 21.4254, zone: "Europe/Skopje" },
  { id: "tetovo", name: "Tetovë", country: "MK", lat: 42.0069, lon: 20.9715, zone: "Europe/Skopje" },
  { id: "belgrade", name: "Beograd", country: "RS", lat: 44.7866, lon: 20.4489, zone: "Europe/Belgrade" },
  { id: "novipazar", name: "Novi Pazar", country: "RS", lat: 43.1367, lon: 20.5122, zone: "Europe/Belgrade" },
  { id: "sarajevo", name: "Sarajevo", country: "BA", lat: 43.8563, lon: 18.4131, zone: "Europe/Sarajevo" },
  { id: "podgorica", name: "Podgorica", country: "ME", lat: 42.4304, lon: 19.2594, zone: "Europe/Podgorica" },
  { id: "istanbul", name: "İstanbul", country: "TR", lat: 41.0082, lon: 28.9784, zone: "Europe/Istanbul" },
  { id: "berlin", name: "Berlin", country: "DE", lat: 52.52, lon: 13.405, zone: "Europe/Berlin" },
  { id: "munich", name: "München", country: "DE", lat: 48.1372, lon: 11.5756, zone: "Europe/Berlin" },
  { id: "zurich", name: "Zürich", country: "CH", lat: 47.3769, lon: 8.5417, zone: "Europe/Zurich" },
  { id: "vienna", name: "Wien", country: "AT", lat: 48.2082, lon: 16.3738, zone: "Europe/Vienna" },
  { id: "london", name: "London", country: "GB", lat: 51.5072, lon: -0.1276, zone: "Europe/London" },
  { id: "paris", name: "Paris", country: "FR", lat: 48.8566, lon: 2.3522, zone: "Europe/Paris" },
  { id: "newyork", name: "New York", country: "US", lat: 40.7128, lon: -74.006, zone: "America/New_York" },
  { id: "toronto", name: "Toronto", country: "CA", lat: 43.6532, lon: -79.3832, zone: "America/Toronto" },
  { id: "makkah", name: "Makkah", country: "SA", lat: 21.3891, lon: 39.8579, zone: "Asia/Riyadh" },
  { id: "jakarta", name: "Jakarta", country: "ID", lat: -6.2088, lon: 106.8456, zone: "Asia/Jakarta" },
  { id: "kualalumpur", name: "Kuala Lumpur", country: "MY", lat: 3.139, lon: 101.6869, zone: "Asia/Kuala_Lumpur" },
  { id: "sydney", name: "Sydney", country: "AU", lat: -33.8688, lon: 151.2093, zone: "Australia/Sydney" },
  { id: "tokyo", name: "Tokyo", country: "JP", lat: 35.6762, lon: 139.6503, zone: "Asia/Tokyo" }
];

const localeFor = language => ({ sq: "sq-AL", en: "en-GB", de: "de-DE" }[language] || "sq-AL");
const t = (key, values = {}) => {
  const pack = COPY[S.language] || COPY.sq;
  let result = pack[key] ?? COPY.sq[key] ?? key;
  if (Array.isArray(result)) return result;
  for (const [name, value] of Object.entries(values)) {
    result = result.replace(new RegExp("\\{" + name + "\\}", "g"), String(value));
  }
  return result;
};
const safeText = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const pad = value => String(value).padStart(2, "0");
const vib = duration => {
  try { if (navigator.vibrate) navigator.vibrate(duration); } catch {}
};

function freshState() {
  return {
    location: null,
    method: "mwl",
    madhab: "shafi",
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    timeFormat: "24",
    language: "sq",
    theme: "system",
    notifications: { enabled: false, before: 0, prayers: { ...DEFAULT_PRAYERS } },
    azan: { enabled: false, volume: 0.8, prayers: { ...DEFAULT_PRAYERS } },
    tasbih: { count: 0, target: 33, dhikr: 0, total: 0 },
    checked: {}
  };
}

function validLocation(location) {
  if (!location || !Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude))) return null;
  if (Number(location.latitude) < -90 || Number(location.latitude) > 90 ||
      Number(location.longitude) < -180 || Number(location.longitude) > 180) return null;
  let timeZone = location.timeZone;
  try {
    if (!timeZone) timeZone = timezoneForCoordinates(Number(location.latitude), Number(location.longitude));
    new Intl.DateTimeFormat("en", { timeZone });
  } catch {
    try { timeZone = timezoneForCoordinates(Number(location.latitude), Number(location.longitude)); }
    catch { return null; }
  }
  return {
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    timeZone,
    label: String(location.label || "My location"),
    country: String(location.country || ""),
    countryCode: String(location.countryCode || "").toUpperCase(),
    source: location.source === "gps" ? "gps" : "search",
    named: location.named === true || location.source !== "gps"
  };
}

function readSavedState() {
  const state = freshState();
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      const saved = JSON.parse(current);
      Object.assign(state, saved);
      state.location = validLocation(saved.location);
      state.adjustments = { ...DEFAULT_ADJUSTMENTS, ...(saved.adjustments || {}) };
      state.notifications = {
        ...state.notifications, ...(saved.notifications || {}),
        prayers: { ...DEFAULT_PRAYERS, ...((saved.notifications && saved.notifications.prayers) || {}) }
      };
      state.azan = {
        ...state.azan, ...(saved.azan || {}),
        prayers: { ...DEFAULT_PRAYERS, ...((saved.azan && saved.azan.prayers) || {}) }
      };
      state.tasbih = { ...state.tasbih, ...(saved.tasbih || {}) };
      return state;
    }
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (!legacyRaw) return state;
    const legacy = JSON.parse(legacyRaw);
    if (legacy.lat != null && legacy.lng != null) {
      const timeZone = timezoneForCoordinates(Number(legacy.lat), Number(legacy.lng));
      state.location = validLocation({
        latitude: Number(legacy.lat),
        longitude: Number(legacy.lng),
        timeZone,
        label: legacy.label || t("myLocation"),
        source: legacy.gps ? "gps" : "search"
      });
    }
    if (["mwl", "isna", "egypt", "umm", "karachi", "turkey"].includes(legacy.method)) state.method = legacy.method;
    state.madhab = Number(legacy.asr) === 2 ? "hanafi" : "shafi";
    if (Number.isFinite(Number(legacy.adj))) {
      for (const key of PRAYER_KEYS) state.adjustments[key] = Number(legacy.adj);
    }
    state.theme = ["light", "dark"].includes(legacy.theme) ? legacy.theme : "system";
    state.notifications.enabled = Object.values(legacy.notify || {}).some(Boolean);
    for (const key of OBLIGATORY_KEYS) {
      state.notifications.prayers[key] = legacy.notify ? !!legacy.notify[key] : false;
      state.azan.prayers[key] = !!legacy.ezanEnabled;
    }
    state.notifications.before = [0, 5, 10, 15].includes(Number(legacy.pre)) ? Number(legacy.pre) : 0;
    state.azan.enabled = !!legacy.ezanEnabled;
    state.azan.volume = 0.8;
    state.timeFormat = "24";
    if (legacy.ts) {
      state.tasbih = {
        count: clamp(parseInt(legacy.ts.n, 10) || 0, 0, 10000),
        target: [33, 99, 100].includes(Number(legacy.ts.t)) ? Number(legacy.ts.t) : 33,
        dhikr: clamp(parseInt(legacy.ts.d, 10) || 0, 0, 3),
        total: Math.max(0, parseInt(legacy.ts.total, 10) || 0)
      };
    }
    state.checked = legacy.done || {};
  } catch {
    return state;
  }
  return state;
}

const S = readSavedState();
if (!["sq", "en", "de"].includes(S.language)) S.language = "sq";
if (!["mwl", "isna", "egypt", "umm", "karachi", "turkey"].includes(S.method)) S.method = "mwl";
if (!["shafi", "hanafi"].includes(S.madhab)) S.madhab = "shafi";
if (!["system", "light", "dark"].includes(S.theme)) S.theme = "system";
let saveAvailable = true;
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
    saveAvailable = true;
  } catch {
    saveAvailable = false;
    showToast(t("saveError"));
  }
}

const toast = $("#toast");
let toastTimer = 0;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4200);
}

window.addEventListener("error", event => {
  console.error("NamaziShqip runtime error.", event.error || event.message);
  showToast(t("calculationError"));
});
window.addEventListener("unhandledrejection", event => {
  console.error("NamaziShqip async error.", event.reason);
  showToast(t("calculationError"));
});

function translateStatic() {
  document.documentElement.lang = S.language;
  for (const element of $$("[data-i18n]")) element.textContent = t(element.dataset.i18n);
  for (const element of $$("[data-i18n-placeholder]")) element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  $("#locBtn").setAttribute("aria-label", t("locationSettingsLabel"));
  $("#localClock").setAttribute("aria-label", t("localTime"));
  $("#citySearch").setAttribute("placeholder", t("searchCityPlaceholder"));
  $("#searchCityButton").setAttribute("aria-label", t("search"));
  $("#calendarTable").setAttribute("aria-label", t("monthlyCalendar"));
  $("#countButton").setAttribute("aria-label", t("tasbih"));
  $("#compassRose").setAttribute("aria-label", t("qibla"));
  fillCountrySelect();
  fillQuickCities();
  fillMethodSelect();
  fillToggles();
}

function fillCountrySelect() {
  const select = $("#countrySelect");
  if (!select) return;
  const previous = S.location?.countryCode || select.value;
  const locale = localeFor(S.language);
  const displayNames = new Intl.DisplayNames([locale], { type: "region" });
  const ignored = new Set(["AA", "AC", "CP", "DG", "EA", "EU", "EZ", "IC", "QO", "TA", "UN", "XA", "XB", "XK"]);
  const options = [];
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      if (ignored.has(code)) continue;
      try {
        const label = displayNames.of(code);
        if (label && label !== code) options.push({ code, label });
      } catch {}
    }
  }
  options.push({ code: "XK", label: S.language === "sq" ? "Kosovë" : (S.language === "de" ? "Kosovo" : "Kosovo") });
  options.sort((a, b) => a.label.localeCompare(b.label, locale));
  select.innerHTML = '<option value="">' + safeText(t("chooseCountry")) + "</option>" +
    options.map(item => '<option value="' + item.code + '">' + safeText(item.label) + "</option>").join("");
  if (previous) select.value = previous;
}

function fillQuickCities() {
  const select = $("#quickCity");
  if (!select) return;
  select.innerHTML = '<option value="">' + safeText(t("choosePopular")) + "</option>" +
    CITIES.map(city => '<option value="' + city.id + '">' + safeText(city.name) + " · " +
      safeText(countryName(city.country)) + "</option>").join("");
}

function fillMethodSelect() {
  const select = $("#methodSelect");
  if (!select) return;
  select.innerHTML = ["mwl", "isna", "egypt", "umm", "karachi", "turkey"]
    .map(key => '<option value="' + key + '">' + safeText(t("method_" + key)) + "</option>").join("");
  select.value = S.method;
}

function fillToggles() {
  const names = t("prayerNames");
  const make = (group, selector, values) => {
    $(selector).innerHTML = OBLIGATORY_KEYS.map(key => {
      const index = PRAYER_KEYS.indexOf(key);
      return '<label class="prayer-toggle"><input type="checkbox" data-' + group + '-prayer="' + key + '"' +
        (values[key] ? " checked" : "") + '><span>' + safeText(names[index]) + "</span></label>";
    }).join("");
  };
  make("notification", "#notificationToggles", S.notifications.prayers);
  make("azan", "#azanToggles", S.azan.prayers);
}

function countryName(code) {
  if (!code) return "";
  if (code === "XK") return S.language === "sq" ? "Kosovë" : "Kosovo";
  try { return new Intl.DisplayNames([localeFor(S.language)], { type: "region" }).of(code) || code; }
  catch { return code; }
}

function activateTheme() {
  if (S.theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.dataset.theme = S.theme;
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const light = S.theme === "light" || (S.theme === "system" && prefersLight);
  $("meta[name=\"theme-color\"]").content = light ? "#f3f6f0" : "#071612";
  $("#themeSelect").value = S.theme;
}

function localParts(instant, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(instant);
  const result = {};
  for (const item of parts) if (item.type !== "literal") result[item.type] = Number(item.value);
  return { year: result.year, month: result.month, day: result.day };
}

function shiftedDate(date, amount) {
  const item = new Date(Date.UTC(date.year, date.month - 1, date.day + amount, 12));
  return { year: item.getUTCFullYear(), month: item.getUTCMonth() + 1, day: item.getUTCDate() };
}

function dayKey(date) {
  return [date.year, pad(date.month), pad(date.day)].join("-");
}

function dateOnlyInstant(date, timeZone) {
  return zonedWallTimeToInstant(date.year, date.month, date.day, 12, 0, timeZone);
}

function localizedDate(date, options = {}) {
  return new Intl.DateTimeFormat(localeFor(S.language), { timeZone: "UTC", ...options })
    .format(new Date(Date.UTC(date.year, date.month - 1, date.day, 12)));
}

function formatTime(instant) {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) return "—";
  return new Intl.DateTimeFormat(localeFor(S.language), {
    timeZone: S.location.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: S.timeFormat === "12" ? "h12" : "h23"
  }).format(instant);
}

function formatDateKey(date) {
  return new Intl.DateTimeFormat(localeFor(S.language), {
    timeZone: "UTC", weekday: "short", day: "2-digit", month: "short"
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day, 12)));
}

function hijriParts(date) {
  if (!S.location) return null;
  try {
    const instant = dateOnlyInstant(date, S.location.timeZone);
    const formatter = new Intl.DateTimeFormat(localeFor(S.language) + "-u-ca-islamic-umalqura", {
      timeZone: S.location.timeZone, day: "numeric", month: "long", year: "numeric"
    });
    const parts = formatter.formatToParts(instant);
    const byType = {};
    for (const item of parts) if (item.type !== "literal") byType[item.type] = item.value;
    const numeric = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      timeZone: S.location.timeZone, day: "numeric", month: "numeric", year: "numeric"
    }).formatToParts(instant);
    const values = {};
    for (const item of numeric) if (item.type !== "literal") values[item.type] = Number(item.value);
    return {
      label: formatter.format(instant),
      day: values.day,
      month: values.month,
      year: values.year,
      monthName: byType.month
    };
  } catch {
    return null;
  }
}

const scheduleCache = new Map();
function scheduleFor(date) {
  if (!S.location) return null;
  const key = [
    dayKey(date), S.location.latitude.toFixed(5), S.location.longitude.toFixed(5),
    S.location.timeZone, S.method, S.madhab, JSON.stringify(S.adjustments)
  ].join("|");
  if (scheduleCache.has(key)) return scheduleCache.get(key);
  const result = calculatePrayerDay({
    latitude: S.location.latitude,
    longitude: S.location.longitude,
    timeZone: S.location.timeZone,
    year: date.year,
    month: date.month,
    day: date.day,
    method: S.method,
    madhab: S.madhab,
    adjustments: S.adjustments
  });
  scheduleCache.set(key, result);
  if (scheduleCache.size > 500) scheduleCache.delete(scheduleCache.keys().next().value);
  return result;
}

let currentDateKey = "";
let todaySchedule = null;
let monthView = null;
let compassHeading = null;
let absoluteHeadingSeen = false;
let firedReminders = new Set();
let lastRamadanKey = "";
let cachedRamadan = null;
let deferredInstallPrompt = null;
let searchAbort = null;
let searchTimer = 0;

function prayerNames() { return t("prayerNames"); }

function prayerLabel(key) {
  return prayerNames()[PRAYER_KEYS.indexOf(key)] || key;
}

function methodLabel(key = S.method) {
  return t("method_" + key);
}

function hijriCalendarMonth(date) {
  const info = hijriParts(date);
  return info ? { month: info.month, day: info.day } : null;
}

function renderHeader(now, date) {
  const timeZone = S.location?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  $("#localClock").textContent = new Intl.DateTimeFormat(localeFor(S.language), {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: S.timeFormat === "12" ? "h12" : "h23"
  }).format(now);
  if (!S.location) {
    $("#gregorianDate").textContent = localizedDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    $("#hijriDate").textContent = "";
    return;
  }
  $("#gregorianDate").textContent = localizedDate(date, {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  const hijri = hijriParts(date);
  $("#hijriDate").textContent = hijri ? hijri.label + (S.language === "sq" ? " H." : "") : "";
}

function locationDisplayName(location) {
  if (!location) return t("chooseLocation");
  if (location.source === "gps" && !location.named) {
    return t("myLocation") + " (" + location.latitude.toFixed(3) + ", " + location.longitude.toFixed(3) + ")";
  }
  return location.label;
}

function renderLocation() {
  const location = S.location;
  const label = locationDisplayName(location);
  $("#locationLabel").textContent = label;
  $("#heroLocation").textContent = label;
  const country = location && (location.countryCode ? countryName(location.countryCode) : location.country);
  $("#locationDetails").innerHTML = location
    ? "<b>" + safeText(locationDisplayName(location)) + "</b>" +
      (country ? " · " + safeText(country) : "") +
      "<br>" + safeText(t("coordinates")) + ": " + location.latitude.toFixed(4) + ", " + location.longitude.toFixed(4) +
      "<br>" + safeText(t("timezone")) + ": " + safeText(location.timeZone)
    : safeText(t("noLocation"));
  $("#identifyGpsButton").hidden = !(location && location.source === "gps" && !location.named);
  $("#clearLocationButton").disabled = !location;
  $("#timezoneCaption").textContent = location ? location.timeZone : t("systemTime");
}

function renderPrayerRows(now, windowInfo) {
  const list = $("#prayerList");
  if (!S.location || !todaySchedule) {
    list.innerHTML = '<p class="small-note">' + safeText(t("noSchedule")) + "</p>";
    $("#methodLabel").textContent = t("awaitingLocation");
    $("#scheduleNote").textContent = t("noLocation");
    return;
  }
  const names = prayerNames();
  const currentDay = localParts(now, S.location.timeZone);
  const key = dayKey(currentDay);
  const checked = S.checked[key] || {};
  const nextKey = windowInfo && windowInfo.next ? windowInfo.next.key : "";
  list.innerHTML = PRAYER_KEYS.map((prayer, index) => {
    const checkedState = !!checked[prayer] && prayer !== "sunrise";
    const isPast = todaySchedule[prayer] && todaySchedule[prayer].getTime() <= now.getTime();
    const isNext = prayer === nextKey;
    const button = prayer === "sunrise"
      ? '<button class="prayer-check" type="button" disabled aria-hidden="true"></button>'
      : '<button class="prayer-check ' + (checkedState ? "is-checked" : "") +
        '" type="button" data-check-prayer="' + prayer + '" aria-label="' +
        safeText((checkedState ? (S.language === "en" ? "Uncheck " : S.language === "de" ? "Markierung entfernen: " : "Hiq shenjën: ") : (S.language === "en" ? "Mark " : S.language === "de" ? "Abhaken: " : "Shëno: ")) + names[index]) +
        '" aria-pressed="' + checkedState + '">' +
        (checkedState ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>' : "") + "</button>";
    return '<div class="prayer-row' + (isNext ? " is-next" : "") + (isPast && !isNext ? " is-past" : "") +
      '" data-prayer-row="' + prayer + '">' + button +
      '<div class="prayer-name-wrap"><span class="prayer-symbol" aria-hidden="true">' + PRAYER_SYMBOLS[prayer] + "</span>" +
      '<span class="prayer-name">' + safeText(names[index]) + "</span>" +
      (S.language === "sq" ? '<span class="prayer-arabic" lang="ar" dir="rtl">' + PRAYER_ARABIC[prayer] + "</span>" : "") +
      "</div><time class=\"prayer-time\">" + safeText(formatTime(todaySchedule[prayer])) + "</time></div>";
  }).join("");
  $("#methodLabel").textContent = methodLabel();
  $("#scheduleNote").textContent = t("methodNote");
  $("#calculationCaption").textContent = methodLabel();
}

function setProgress() {
  if (!S.location) {
    $("#progressCount").textContent = "0 / 5";
    $("#progressBar").style.width = "0%";
    $("#weekStrip").innerHTML = "";
    return;
  }
  const now = new Date();
  const today = localParts(now, S.location.timeZone);
  const todayKey = dayKey(today);
  const countFor = date => OBLIGATORY_KEYS.filter(key => (S.checked[dayKey(date)] || {})[key]).length;
  const currentCount = countFor(today);
  $("#progressCount").textContent = currentCount + " / 5";
  $("#progressBar").style.width = (currentCount * 20) + "%";
  const week = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const date = shiftedDate(today, offset);
    const progress = countFor(date) * 20;
    const label = localizedDate(date, { weekday: "short" }).replace(/\.$/, "");
    week.push('<span class="week-day' + (offset === 0 ? " is-today" : "") + '">' +
      safeText(label) + '<i style="--day-progress:' + progress + '%" title="' + progress + '%"></i></span>');
  }
  $("#weekStrip").innerHTML = week.join("");
}

function ramadanCountdown(today) {
  const key = dayKey(today) + "|" + (S.location?.timeZone || "");
  if (key === lastRamadanKey) return cachedRamadan;
  lastRamadanKey = key;
  cachedRamadan = null;
  if (!S.location) return null;
  const currentHijri = hijriCalendarMonth(today);
  if (currentHijri && currentHijri.month === 9) {
    cachedRamadan = { isRamadan: true, days: 0 };
    return cachedRamadan;
  }
  for (let offset = 1; offset <= 370; offset += 1) {
    const candidate = shiftedDate(today, offset);
    const info = hijriCalendarMonth(candidate);
    if (info && info.month === 9 && info.day === 1) {
      cachedRamadan = { isRamadan: false, days: offset };
      return cachedRamadan;
    }
  }
  return cachedRamadan;
}

function renderDailyContent(today) {
  $("#verseTranslation").textContent = t("quranTranslation");
  const dayNumber = Math.floor(Date.UTC(today.year, today.month - 1, today.day) / 86400000);
  const hadithIndex = Math.abs(dayNumber) % 2;
  $("#hadithText").textContent = t(hadithIndex === 0 ? "hadithText1" : "hadithText2");
  const hadithLink = $(".hadith-card .source-link");
  hadithLink.href = hadithIndex === 0 ? "https://sunnah.com/bukhari/81/53" : "https://sunnah.com/muslim:597a";
  hadithLink.querySelector("span").textContent = t(hadithIndex === 0 ? "hadithSource" : "hadithSourceMuslim");

  if (!S.location || !todaySchedule) {
    $("#ramadanTitle").textContent = t("awaitingLocation");
    $("#sehriTime").textContent = "—";
    $("#iftarTime").textContent = "—";
    $("#fridayText").textContent = t("noLocation");
    return;
  }
  const ramadan = ramadanCountdown(today);
  $("#ramadanTitle").textContent = ramadan
    ? (ramadan.isRamadan ? t("ramadanToday") : (ramadan.days === 1 ? t("ramadanTomorrow") : t("ramadanDays", { count: ramadan.days })))
    : "—";
  $("#sehriTime").textContent = formatTime(todaySchedule.fajr);
  $("#iftarTime").textContent = formatTime(todaySchedule.maghrib);
  const weekday = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  const daysUntilFriday = (5 - weekday + 7) % 7;
  $("#fridayText").textContent = daysUntilFriday === 0
    ? t("fridayToday")
    : t("fridayNext", { date: formatDateKey(shiftedDate(today, daysUntilFriday)) });
}

function buildPrayerContext(now) {
  const date = localParts(now, S.location.timeZone);
  const yesterdayDate = shiftedDate(date, -1);
  const tomorrowDate = shiftedDate(date, 1);
  const previous = scheduleFor(yesterdayDate);
  const today = scheduleFor(date);
  const tomorrow = scheduleFor(tomorrowDate);
  todaySchedule = today;
  return {
    date,
    today,
    window: getPrayerWindow(
      { isha: previous.isha },
      today,
      { fajr: tomorrow.fajr },
      now
    )
  };
}

function renderCountdown(context, now) {
  const info = context && context.window;
  if (!S.location || !info || !info.next) {
    $("#nextPrayerName").textContent = "—";
    $("#nextPrayerTime").textContent = t("chooseLocation");
    $("#countdown").textContent = "--:--:--";
    $("#countdownRing").style.strokeDashoffset = String(CIRCUMFERENCE);
    return;
  }
  const totalSeconds = Math.floor(info.remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  $("#nextPrayerName").textContent = prayerLabel(info.next.key);
  $("#nextPrayerTime").textContent = formatTime(info.next.time);
  $("#countdown").textContent = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
  $("#countdownRing").style.strokeDashoffset = String(CIRCUMFERENCE * (1 - info.progress));
  $("#countdown").setAttribute("aria-label", t("nextAt", {
    prayer: prayerLabel(info.next.key), time: formatTime(info.next.time)
  }));
  if (todaySchedule) {
    for (const row of $$(".prayer-row")) {
      const key = row.dataset.prayerRow;
      row.classList.toggle("is-next", key === info.next.key);
      row.classList.toggle("is-past", key !== info.next.key && todaySchedule[key] && todaySchedule[key] <= now);
    }
  }
}

function notify(title, body, tag) {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  try {
    const options = {
      body,
      tag,
      icon: "./assets/logo/icon-192.png",
      badge: "./assets/logo/icon-192.png"
    };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => registration.showNotification(title, options)).catch(() => {});
    } else {
      new Notification(title, options);
    }
    return true;
  } catch {
    return false;
  }
}

const azanAudio = new Audio("./ezani.mp3");
azanAudio.preload = "none";
azanAudio.addEventListener("ended", () => showToast(t("audioStopped")));

async function playAzan(isPreview = false) {
  azanAudio.pause();
  azanAudio.currentTime = 0;
  azanAudio.volume = clamp(Number(S.azan.volume), 0, 1);
  try {
    await azanAudio.play();
    showToast(t(isPreview ? "azanPlaying" : "azanPlaying"));
  } catch {
    showToast(t("azanBlocked"));
  }
}

function firePrayerAlert(key, dateKey, minutesBefore) {
  const title = t("notificationTitle");
  const body = minutesBefore
    ? t("prayerReminder", { prayer: prayerLabel(key), minutes: minutesBefore, time: formatTime(todaySchedule[key]) })
    : t("prayerDue", { prayer: prayerLabel(key) });
  showToast(body);
  const sent = notify(title, body, "namazishqip-" + dateKey + "-" + key + "-" + minutesBefore);
  if (sent) vib([140, 70, 140]);
  if (S.azan.enabled && S.azan.prayers[key]) playAzan();
}

function checkPrayerAlerts(now, context) {
  if (!S.location || !todaySchedule || !S.notifications.enabled) return;
  const keyDate = dayKey(context.date);
  for (const key of OBLIGATORY_KEYS) {
    if (!S.notifications.prayers[key]) continue;
    const before = clamp(Number(S.notifications.before) || 0, 0, 15);
    const target = todaySchedule[key].getTime() - before * 60000;
    const id = keyDate + "|" + key + "|" + before;
    const drift = now.getTime() - target;
    if (drift >= 0 && drift < 90000 && !firedReminders.has(id)) {
      firedReminders.add(id);
      firePrayerAlert(key, keyDate, before);
    }
  }
}

function updateNotificationStatus() {
  const status = $("#notificationStatus");
  if (!("Notification" in window)) status.textContent = t("permissionUnsupported");
  else if (Notification.permission === "granted") status.textContent = t("permissionGranted");
  else if (Notification.permission === "denied") status.textContent = t("permissionDenied");
  else status.textContent = t("permissionDefault");
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast(t("permissionUnsupported"));
    updateNotificationStatus();
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    updateNotificationStatus();
    if (permission === "granted") {
      S.notifications.enabled = true;
      if (!OBLIGATORY_KEYS.some(key => S.notifications.prayers[key])) {
        for (const key of OBLIGATORY_KEYS) S.notifications.prayers[key] = true;
      }
      fillToggles();
      save();
      showToast(t("notificationsEnabled"));
      return true;
    }
    showToast(permission === "denied" ? t("permissionDenied") : t("notificationsNeedPermission"));
  } catch {
    showToast(t("permissionUnsupported"));
  }
  return false;
}

function updateConnectionStatus() {
  const isOnline = navigator.onLine;
  const chip = $("#connectionStatus");
  chip.textContent = isOnline ? t("online") : t("offline");
  chip.classList.toggle("is-offline", !isOnline);
  $("#offlineStatus").textContent = isOnline ? t("online") : t("offline");
}

function renderQibla() {
  if (!S.location) {
    $("#qiblaBearing").textContent = "—°";
    $("#qiblaDistance").textContent = "— km";
    $("#qiblaSummary").textContent = t("noLocation");
    $("#compassStatus").textContent = "";
    $("#qiblaNeedle").setAttribute("transform", "rotate(0 120 120)");
    $("#compassRose").style.transform = "rotate(0deg)";
    return;
  }
  const info = getQibla(S.location.latitude, S.location.longitude);
  const bearing = ((info.bearing % 360) + 360) % 360;
  $("#qiblaBearing").textContent = Math.round(bearing) + "°";
  $("#qiblaDistance").textContent = Math.round(info.distanceKm).toLocaleString(localeFor(S.language)) + " km";
  $("#qiblaSummary").textContent = S.language === "en"
    ? "From " + S.location.label + ", face " + Math.round(bearing) + "° clockwise from north."
    : S.language === "de"
      ? "Von " + S.location.label + " aus liegt die Richtung " + Math.round(bearing) + "° im Uhrzeigersinn ab Norden."
      : "Nga " + S.location.label + ", drejtimi është " + Math.round(bearing) + "° nga veriu në drejtim të akrepave të orës.";
  $("#qiblaNeedle").setAttribute("transform", "rotate(" + bearing + " 120 120)");
  drawCompass();
}

function drawCompass() {
  $("#compassRose").style.transform = "rotate(" + (compassHeading == null ? 0 : -compassHeading) + "deg)";
  $("#compassStatus").textContent = compassHeading == null ? t("compassStatic") : t("compassActive");
}

function screenOrientationAngle() {
  return (screen.orientation && Number.isFinite(screen.orientation.angle))
    ? screen.orientation.angle
    : (Number.isFinite(window.orientation) ? window.orientation : 0);
}

function handleOrientation(event) {
  let heading = null;
  if (Number.isFinite(event.webkitCompassHeading)) {
    heading = event.webkitCompassHeading;
  } else if (event.type === "deviceorientationabsolute" && Number.isFinite(event.alpha)) {
    absoluteHeadingSeen = true;
    heading = 360 - event.alpha;
  } else if (!absoluteHeadingSeen && event.absolute && Number.isFinite(event.alpha)) {
    heading = 360 - event.alpha;
  }
  if (heading == null) return;
  compassHeading = (heading + screenOrientationAngle() + 360) % 360;
  drawCompass();
}

async function activateCompass() {
  if (!("DeviceOrientationEvent" in window)) {
    showToast(t("compassUnavailable"));
    return;
  }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") {
        showToast(t("compassDenied"));
        return;
      }
    }
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
    showToast(t("compassPermission"));
  } catch {
    showToast(t("compassDenied"));
  }
}

const DHIKR = [
  { label: "Subhanallah", arabic: "سُبْحَانَ ٱللَّٰهِ" },
  { label: "Elhamdulilah", arabic: "ٱلْحَمْدُ لِلَّٰهِ" },
  { label: "Allahu Ekber", arabic: "ٱللَّٰهُ أَكْبَرُ" },
  { label: "La ilahe il-lAllah", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ" }
];
const TARGETS = [33, 99, 100];

function renderTasbih() {
  const current = S.tasbih;
  $("#dhikrChoices").innerHTML = DHIKR.map((item, index) =>
    '<button class="choice-chip' + (index === current.dhikr ? " is-active" : "") +
    '" type="button" data-dhikr="' + index + '" aria-pressed="' + (index === current.dhikr) + '">' +
    safeText(item.label) + "</button>").join("");
  $("#dhikrArabic").textContent = DHIKR[current.dhikr]?.arabic || "";
  $("#tasbihCount").textContent = current.count;
  $("#tasbihTargetLabel").textContent = current.count + " / " + current.target;
  $("#tasbihTotal").textContent = t("tasbihTotal", { count: Number(current.total || 0).toLocaleString(localeFor(S.language)) });
  $("#tasbihProgress").style.strokeDashoffset = String(CIRCUMFERENCE * (1 - clamp(current.count / Math.max(1, current.target), 0, 1)));
  $("#targetOptions").innerHTML = TARGETS.map(target =>
    '<button class="choice-chip' + (target === current.target ? " is-active" : "") +
    '" type="button" data-target="' + target + '" aria-pressed="' + (target === current.target) + '">' +
    target + "</button>").join("");
  $("#customTarget").value = TARGETS.includes(current.target) ? "" : current.target;
}

function renderSettings() {
  $("#methodSelect").value = S.method;
  $("#madhabSelect").value = S.madhab;
  $("#timeFormat").value = S.timeFormat;
  $("#languageSelect").value = S.language;
  $("#themeSelect").value = S.theme;
  $("#reminderMinutes").value = String(S.notifications.before);
  $("#azanEnabled").checked = S.azan.enabled;
  $("#azanVolume").value = String(S.azan.volume);
  $("#adjustmentList").innerHTML = PRAYER_KEYS.map((key, index) =>
    '<div class="adjustment-row"><label for="adjustment-' + key + '">' +
    safeText(prayerLabel(key)) + "</label><input id=\"adjustment-" + key +
    '" type="number" inputmode="numeric" min="-60" max="60" step="1" value="' +
    clamp(Number(S.adjustments[key]) || 0, -60, 60) + '" data-adjustment="' + key +
    '" aria-label="' + safeText(prayerLabel(key)) + '"></div>').join("");
  fillToggles();
  renderLocation();
  updateNotificationStatus();
}

function renderCalendar() {
  const table = $("#calendarTable");
  if (!S.location) {
    table.innerHTML = '<tbody><tr><td colspan="8">' + safeText(t("noCalendarLocation")) + "</td></tr></tbody>";
    $("#monthTitle").textContent = t("monthlyCalendar");
    return;
  }
  const nowParts = localParts(new Date(), S.location.timeZone);
  if (!monthView) monthView = { year: nowParts.year, month: nowParts.month };
  const year = monthView.year;
  const month = monthView.month;
  const monthDate = new Date(Date.UTC(year, month - 1, 15, 12));
  $("#monthTitle").textContent = new Intl.DateTimeFormat(localeFor(S.language), {
    timeZone: "UTC", month: "long", year: "numeric"
  }).format(monthDate);
  const headers = t("calendarHeaders");
  const header = "<thead><tr>" + headers.map(text => "<th scope=\"col\">" + safeText(text) + "</th>").join("") + "</tr></thead>";
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const todayKey = dayKey(nowParts);
  let rows = "";
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = { year, month, day };
    const schedule = scheduleFor(date);
    const hijri = hijriParts(date);
    const current = dayKey(date) === todayKey;
    const dateText = localizedDate(date, { weekday: "short", day: "2-digit", month: "2-digit" });
    const values = PRAYER_KEYS.map(key => "<td>" + safeText(formatTime(schedule[key])) + "</td>").join("");
    rows += '<tr' + (current ? ' class="is-today"' : "") + "><td>" + safeText(dateText) +
      "</td><td class=\"hijri-cell\">" + safeText(hijri ? hijri.label : "—") + "</td>" + values + "</tr>";
  }
  table.innerHTML = header + "<tbody>" + rows + "</tbody>";
}

function renderAll() {
  const now = new Date();
  const zone = S.location?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const date = localParts(now, zone);
  currentDateKey = dayKey(date);
  renderHeader(now, date);
  renderLocation();
  renderSettings();
  if (S.location) {
    try {
      const context = buildPrayerContext(now);
      renderPrayerRows(now, context.window);
      renderCountdown(context, now);
      renderDailyContent(context.date);
      renderQibla();
      setProgress();
    } catch (error) {
      console.error("Prayer schedule could not be calculated.", error);
      todaySchedule = null;
      $("#prayerList").innerHTML = '<p class="small-note">' + safeText(t("calculationError")) + "</p>";
      $("#nextPrayerName").textContent = "—";
      $("#countdown").textContent = "--:--:--";
      $("#scheduleNote").textContent = t("calculationError");
      renderQibla();
      renderDailyContent(date);
    }
  } else {
    todaySchedule = null;
    renderPrayerRows(now, null);
    renderCountdown(null, now);
    renderDailyContent(date);
    renderQibla();
    setProgress();
  }
  renderCalendar();
  updateConnectionStatus();
  updateNotificationStatus();
  $("#mainContent").setAttribute("aria-busy", "false");
  if (!saveAvailable) $("#locationMessage").textContent = t("saveError");
}

function tick() {
  const now = new Date();
  const timeZone = S.location?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const localDate = localParts(now, timeZone);
  const key = dayKey(localDate);
  $("#localClock").textContent = new Intl.DateTimeFormat(localeFor(S.language), {
    timeZone,
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: S.timeFormat === "12" ? "h12" : "h23"
  }).format(now);
  if (key !== currentDateKey) {
    renderAll();
    return;
  }
  if (!S.location) return;
  try {
    const context = buildPrayerContext(now);
    renderCountdown(context, now);
    checkPrayerAlerts(now, context);
  } catch (error) {
    console.error("Countdown update failed.", error);
    $("#countdown").textContent = "--:--:--";
  }
}

function updateSchedule() {
  scheduleCache.clear();
  firedReminders = new Set();
  renderAll();
  tick();
}

function storeLocation(location) {
  const result = validLocation(location);
  if (!result) {
    showToast(t("calculationError"));
    return;
  }
  S.location = result;
  $("#appLoadingStatus").hidden = true;
  $("#mainContent").setAttribute("aria-busy", "false");
  monthView = null;
  save();
  $("#locationMessage").textContent = t("selectedLocation");
  renderAll();
  tick();
  showToast(t("selectedLocation"));
}

function setView(viewName) {
  const allowed = new Set(["home", "calendar", "qibla", "tasbih", "settings"]);
  const key = allowed.has(viewName) ? viewName : "home";
  for (const section of $$(".view")) {
    const active = section.id === "view-" + key;
    section.classList.toggle("is-active", active);
    section.hidden = !active;
  }
  for (const button of $$(".nav-item")) {
    const active = button.dataset.view === key;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  if (key === "calendar") renderCalendar();
  if (key === "settings") renderSettings();
  history.replaceState(null, "", "#" + key);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateCountryFromLocation(location) {
  if (location.countryCode) $("#countrySelect").value = location.countryCode;
}

function getFeatureCity(feature) {
  const properties = feature && feature.properties ? feature.properties : {};
  const name = properties.name || properties.city || properties.locality || properties.district || properties.county;
  const country = properties.country || "";
  return { name: name || country || t("myLocation"), country, countryCode: (properties.countrycode || "").toUpperCase() };
}

function displayCityResults(features) {
  const root = $("#locationResults");
  root.replaceChildren();
  if (!features.length) {
    root.textContent = t("noCityResults");
    return;
  }
  for (const feature of features.slice(0, 7)) {
    const city = getFeatureCity(feature);
    const coordinates = feature.geometry && feature.geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
    const latitude = Number(coordinates[1]);
    const longitude = Number(coordinates[0]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    let zone;
    try { zone = timezoneForCoordinates(latitude, longitude); } catch { continue; }
    const button = document.createElement("button");
    button.className = "location-result";
    button.type = "button";
    button.setAttribute("role", "option");
    button.innerHTML = "<span><b>" + safeText(city.name) + "</b><small>" +
      safeText([city.country, zone].filter(Boolean).join(" · ")) + "</small></span><span aria-hidden=\"true\">→</span>";
    button.addEventListener("click", () => {
      storeLocation({
        latitude, longitude, timeZone: zone, label: city.name, country: city.country,
        countryCode: city.countryCode, source: "search"
      });
      updateCountryFromLocation(S.location);
      root.replaceChildren();
    });
    root.append(button);
  }
  if (!root.childElementCount) root.textContent = t("noCityResults");
}

async function searchCity() {
  const cityText = $("#citySearch").value.trim();
  if (!cityText) {
    $("#locationMessage").textContent = t("searchForCity");
    return;
  }
  const selectedCountry = $("#countrySelect").value;
  const query = [cityText, selectedCountry ? countryName(selectedCountry) : ""].filter(Boolean).join(", ");
  const button = $("#searchCityButton");
  button.disabled = true;
  $("#locationMessage").textContent = t("loading");
  if (searchAbort) searchAbort.abort();
  searchAbort = new AbortController();
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "7");
    url.searchParams.set("lang", S.language);
    const response = await fetch(url, { signal: searchAbort.signal });
    if (!response.ok) throw new Error("The location search service returned an error.");
    const data = await response.json();
    displayCityResults(Array.isArray(data.features) ? data.features : []);
    $("#locationMessage").textContent = "";
  } catch (error) {
    if (error.name !== "AbortError") {
      $("#locationResults").replaceChildren();
      $("#locationMessage").textContent = t("searchError");
    }
  } finally {
    button.disabled = false;
  }
}

function requestGps(isAutomatic = false) {
  if (!navigator.geolocation) {
    $("#appLoadingStatus").hidden = true;
    $("#locationMessage").textContent = t("gpsUnavailable");
    if (!isAutomatic) showToast(t("gpsUnavailable"));
    return;
  }
  $("#appLoadingStatus").textContent = t("loadingLocation");
  $("#appLoadingStatus").hidden = false;
  $("#mainContent").setAttribute("aria-busy", "true");
  $("#locationMessage").textContent = t("loading");
  navigator.geolocation.getCurrentPosition(position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    let timeZone;
    try { timeZone = timezoneForCoordinates(latitude, longitude); }
    catch {
      $("#appLoadingStatus").hidden = true;
      $("#mainContent").setAttribute("aria-busy", "false");
      $("#locationMessage").textContent = t("calculationError");
      return;
    }
    storeLocation({
      latitude,
      longitude,
      timeZone,
      label: "",
      source: "gps",
      named: false
    });
    $("#locationMessage").textContent = t("gpsNameReady");
  }, error => {
    $("#appLoadingStatus").hidden = true;
    $("#mainContent").setAttribute("aria-busy", "false");
    const message = error.code === 3 ? t("gpsTimeout") : t("gpsDenied");
    $("#locationMessage").textContent = message;
    if (!isAutomatic) showToast(message);
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 });
}

async function identifyGpsCity() {
  if (!S.location || S.location.source !== "gps") return;
  if (!window.confirm(t("gpsPrivacyConfirm"))) return;
  $("#locationMessage").textContent = t("loading");
  try {
    const url = new URL("https://photon.komoot.io/reverse");
    url.searchParams.set("lat", String(S.location.latitude));
    url.searchParams.set("lon", String(S.location.longitude));
    url.searchParams.set("lang", S.language);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Reverse geocoding failed.");
    const data = await response.json();
    const feature = data.features && data.features[0];
    if (!feature) throw new Error("No city was returned.");
    const city = getFeatureCity(feature);
    S.location.label = city.name;
    S.location.country = city.country;
    S.location.countryCode = city.countryCode;
    S.location.named = true;
    save();
    updateCountryFromLocation(S.location);
    renderAll();
    $("#locationMessage").textContent = t("selectedLocation");
  } catch {
    $("#locationMessage").textContent = t("gpsNameError");
  }
}

function clearLocation() {
  S.location = null;
  monthView = null;
  scheduleCache.clear();
  save();
  renderAll();
  $("#locationMessage").textContent = t("locationCleared");
}

function changeMonth(amount) {
  if (!S.location) return;
  if (!monthView) {
    const date = localParts(new Date(), S.location.timeZone);
    monthView = { year: date.year, month: date.month };
  }
  const updated = new Date(Date.UTC(monthView.year, monthView.month - 1 + amount, 1, 12));
  monthView = { year: updated.getUTCFullYear(), month: updated.getUTCMonth() + 1 };
  renderCalendar();
}

function csvCell(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

function exportCalendar() {
  if (!S.location || !monthView) {
    showToast(t("noCalendarLocation"));
    return;
  }
  const headers = t("calendarHeaders");
  const rows = [headers.map(csvCell).join(",")];
  const total = new Date(Date.UTC(monthView.year, monthView.month, 0)).getUTCDate();
  for (let day = 1; day <= total; day += 1) {
    const date = { year: monthView.year, month: monthView.month, day };
    const times = scheduleFor(date);
    const hijri = hijriParts(date);
    rows.push([
      localizedDate(date, { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }),
      hijri ? hijri.label : "",
      ...PRAYER_KEYS.map(key => formatTime(times[key]))
    ].map(csvCell).join(","));
  }
  const blob = new Blob(["\ufeff" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "namazishqip-" + monthView.year + "-" + pad(monthView.month) + ".csv";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
  showToast(t("csvDownloaded"));
}

function setTasbihTarget(value) {
  const target = parseInt(value, 10);
  if (!Number.isFinite(target) || target < 1 || target > 10000) {
    $("#customTarget").value = "";
    showToast(t("customTarget") + ": 1–10000");
    return;
  }
  S.tasbih.target = target;
  S.tasbih.count = 0;
  save();
  renderTasbih();
}

function tapTasbih() {
  if (S.tasbih.count >= S.tasbih.target) S.tasbih.count = 0;
  S.tasbih.count += 1;
  S.tasbih.total += 1;
  save();
  renderTasbih();
  vib(S.tasbih.count === S.tasbih.target ? [90, 45, 90] : 12);
  if (S.tasbih.count === S.tasbih.target) showToast(t("tasbihComplete", { target: S.tasbih.target }));
}

function markPrayer(key) {
  const now = new Date();
  const date = localParts(now, S.location.timeZone);
  const keyDate = dayKey(date);
  if (!S.checked[keyDate]) S.checked[keyDate] = {};
  S.checked[keyDate][key] = !S.checked[keyDate][key];
  save();
  renderPrayerRows(now, buildPrayerContext(now).window);
  setProgress();
  vib(15);
}

function onNotificationToggle(event) {
  const key = event.target.dataset.notificationPrayer;
  if (!key) return;
  S.notifications.prayers[key] = event.target.checked;
  S.notifications.enabled = OBLIGATORY_KEYS.some(prayer => S.notifications.prayers[prayer]);
  save();
}

function onAzanToggle(event) {
  const key = event.target.dataset.azanPrayer;
  if (!key) return;
  S.azan.prayers[key] = event.target.checked;
  save();
}

function setLanguage(language) {
  if (!["sq", "en", "de"].includes(language)) return;
  S.language = language;
  save();
  translateStatic();
  renderAll();
  renderTasbih();
  activateTheme();
}

function setTheme(theme) {
  S.theme = ["system", "light", "dark"].includes(theme) ? theme : "system";
  save();
  activateTheme();
}

function setInstallButtonVisibility() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  $("#installButton").hidden = !deferredInstallPrompt || standalone;
  $("#installButtonSettings").hidden = standalone;
}

async function promptInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    try {
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") showToast(t("installed"));
    } catch {}
    deferredInstallPrompt = null;
    setInstallButtonVisibility();
  } else {
    showToast(t("installUnavailable"));
  }
}

function updateNotificationServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  const alreadyControlled = !!navigator.serviceWorker.controller;
  if (alreadyControlled) {
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
  }
  navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" })
    .then(registration => {
      if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      registration.update().catch(() => {});
      $("#offlineStatus").textContent = navigator.onLine ? t("online") : t("offline");
    })
    .catch(error => console.warn("Service worker registration failed.", error));
}

function attachEvents() {
  for (const button of $$(".nav-item")) button.addEventListener("click", () => setView(button.dataset.view));
  $("#locBtn").addEventListener("click", () => setView("settings"));
  $("#methodSelect").addEventListener("change", event => {
    S.method = event.target.value;
    save();
    updateSchedule();
  });
  $("#madhabSelect").addEventListener("change", event => {
    S.madhab = event.target.value === "hanafi" ? "hanafi" : "shafi";
    save();
    updateSchedule();
  });
  $("#timeFormat").addEventListener("change", event => {
    S.timeFormat = event.target.value === "12" ? "12" : "24";
    save();
    renderAll();
  });
  $("#themeSelect").addEventListener("change", event => setTheme(event.target.value));
  $("#languageSelect").addEventListener("change", event => setLanguage(event.target.value));
  $("#adjustmentList").addEventListener("change", event => {
    const key = event.target.dataset.adjustment;
    if (!key) return;
    const value = Number(event.target.value);
    S.adjustments[key] = Number.isFinite(value) ? clamp(Math.round(value), -60, 60) : 0;
    event.target.value = String(S.adjustments[key]);
    save();
    updateSchedule();
  });
  $("#prayerList").addEventListener("click", event => {
    const button = event.target.closest("[data-check-prayer]");
    if (button && S.location) markPrayer(button.dataset.checkPrayer);
  });
  $("#previousMonth").addEventListener("click", () => changeMonth(-1));
  $("#nextMonth").addEventListener("click", () => changeMonth(1));
  $("#printCalendar").addEventListener("click", () => {
    document.body.classList.add("print-calendar");
    window.print();
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("print-calendar"));
  $("#exportCalendar").addEventListener("click", exportCalendar);
  $("#activateCompass").addEventListener("click", activateCompass);
  $("#countrySelect").addEventListener("change", () => {
    if ($("#citySearch").value.trim()) searchCity();
  });
  $("#searchCityButton").addEventListener("click", searchCity);
  $("#citySearch").addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchCity();
    }
  });
  $("#citySearch").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if ($("#citySearch").value.trim().length >= 3) searchCity();
    }, 650);
  });
  $("#quickCity").addEventListener("change", event => {
    const city = CITIES.find(item => item.id === event.target.value);
    if (!city) return;
    storeLocation({
      latitude: city.lat, longitude: city.lon, timeZone: city.zone, label: city.name,
      country: countryName(city.country), countryCode: city.country, source: "search"
    });
    updateCountryFromLocation(S.location);
  });
  $("#geoButton").addEventListener("click", () => requestGps(false));
  $("#identifyGpsButton").addEventListener("click", identifyGpsCity);
  $("#clearLocationButton").addEventListener("click", clearLocation);
  $("#enableNotifications").addEventListener("click", requestNotificationPermission);
  $("#testNotification").addEventListener("click", async () => {
    if (!("Notification" in window)) {
      showToast(t("permissionUnsupported"));
      return;
    }
    if (Notification.permission !== "granted" && !(await requestNotificationPermission())) return;
    const message = t("testNotificationSent");
    showToast(message);
    notify(t("notificationTitle"), message, "namazishqip-test");
  });
  $("#reminderMinutes").addEventListener("change", event => {
    S.notifications.before = [0, 5, 10, 15].includes(Number(event.target.value)) ? Number(event.target.value) : 0;
    save();
  });
  $("#notificationToggles").addEventListener("change", onNotificationToggle);
  $("#azanToggles").addEventListener("change", onAzanToggle);
  $("#azanEnabled").addEventListener("change", event => {
    S.azan.enabled = event.target.checked;
    if (S.azan.enabled && !OBLIGATORY_KEYS.some(key => S.azan.prayers[key])) {
      for (const key of OBLIGATORY_KEYS) S.azan.prayers[key] = true;
      fillToggles();
    }
    save();
    showToast(t(S.azan.enabled ? "azanEnabledToast" : "azanDisabledToast"));
  });
  $("#azanVolume").addEventListener("input", event => {
    S.azan.volume = clamp(Number(event.target.value), 0, 1);
    azanAudio.volume = S.azan.volume;
    save();
  });
  $("#previewAzan").addEventListener("click", () => playAzan(true));
  $("#toggleAzanPlayback").addEventListener("click", async () => {
    if (azanAudio.paused) {
      if (azanAudio.ended) azanAudio.currentTime = 0;
      try {
        await azanAudio.play();
        showToast(t("azanPlaying"));
      } catch {
        showToast(t("azanBlocked"));
      }
    } else {
      azanAudio.pause();
      showToast(t("audioPaused"));
    }
  });
  $("#stopAzan").addEventListener("click", () => {
    azanAudio.pause();
    azanAudio.currentTime = 0;
    showToast(t("audioStopped"));
  });
  $("#dhikrChoices").addEventListener("click", event => {
    const button = event.target.closest("[data-dhikr]");
    if (!button) return;
    S.tasbih.dhikr = clamp(parseInt(button.dataset.dhikr, 10) || 0, 0, DHIKR.length - 1);
    S.tasbih.count = 0;
    save();
    renderTasbih();
  });
  $("#targetOptions").addEventListener("click", event => {
    const button = event.target.closest("[data-target]");
    if (!button) return;
    setTasbihTarget(button.dataset.target);
  });
  $("#customTarget").addEventListener("change", event => {
    if (event.target.value !== "") setTasbihTarget(event.target.value);
  });
  $("#countButton").addEventListener("click", tapTasbih);
  $("#resetTasbih").addEventListener("click", () => {
    if (!window.confirm(t("resetConfirm"))) return;
    S.tasbih.count = 0;
    save();
    renderTasbih();
  });
  $("#installButton").addEventListener("click", promptInstall);
  $("#installButtonSettings").addEventListener("click", promptInstall);
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallButtonVisibility();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    setInstallButtonVisibility();
    showToast(t("installed"));
  });
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      scheduleCache.clear();
      renderAll();
      tick();
    }
  });
  window.addEventListener("hashchange", () => setView(location.hash.slice(1)));
  window.addEventListener("orientationchange", drawCompass);
}

function initialize() {
  translateStatic();
  renderSettings();
  activateTheme();
  attachEvents();
  renderTasbih();
  monthView = null;
  renderAll();
  setInstallButtonVisibility();
  updateNotificationServiceWorker();
  setInterval(tick, 1000);
  const initialView = location.hash.slice(1).replace(/^v/, "");
  const legacyView = { "0": "home", "1": "calendar", "2": "qibla", "3": "tasbih", "4": "settings" };
  setView(legacyView[initialView] || initialView || "home");

  const isManualLocation = new URLSearchParams(location.search).has("manual-location");
  const isFirstVisit = !localStorage.getItem(STORAGE_KEY) && !localStorage.getItem(LEGACY_KEY);
  if (!S.location && isFirstVisit && !isManualLocation) {
    setTimeout(() => requestGps(true), 400);
  }
}

initialize();
