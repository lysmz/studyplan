# Ergebnis: begrenzte Electron-Sicherheitsüberprüfung

Prüfdatum: 3. Oktober 2026 (Europe/Berlin). Grundlage: [akzeptierter Umsetzungsplan](electron-security-implementation-plan.md).

Aktuelle BA-Bewertung vom 6. Oktober: [konsolidierte Ergebnismatrix](electron-security-matrix.md) mit allen 20 Empfehlungen, Nachbesserungen und ausdrücklich begrenzter Nachweisbewertung für PowerSync. Dieser Bericht bewahrt den historischen Prüfstand vom 3. Oktober.

Nachbesserung am 4. Oktober 2026: [Umsetzungsstand und neue Belege](electron-security-remediation-results.md) zum [Nachbesserungsplan für 15, 16, 18 und 1 einschließlich 17/19](electron-security-remediation-plan.md). Der nachstehende Bericht einschließlich Matrix und P1–P3 bewahrt ausdrücklich den ursprünglichen Prüfstand vom 3. Oktober; neue Ergebnisse stehen im verlinkten Nachbesserungsbericht.

**Ergebnis:** Der Abgleich aller 20 Empfehlungen, zwei vorhandene Testläufe sowie Build und Start sind dokumentiert. Die drei ergänzenden Laufzeitfälle **P1–P3 wurden durchgeführt und bestanden**: Beide IPC-Bridges weisen die gewählten ungültigen Eingaben zurück; der HTML-artige Aufgabentitel bleibt auch nach Wiederöffnung Text; die CSP blockiert die fremde Skriptquelle. Eine vollständige Einhaltung der vereinbarten Sicherheitsanforderung ist weiterhin nicht nachgewiesen. Insbesondere `file://` und die verwendete Electron-Version weichen von der Referenz ab; externes Öffnen und Fuse-Buildentscheidungen bleiben teilweise erfüllt.

Die Prüfung erweitert den BA-Scope nicht. Es wurden keine Produktdateien, Sicherheitsoptionen, CSP oder Cloudkonfigurationen geändert und keine neuen Tests/Benutzerkonten angelegt. Eine synthetische Testaufgabe wurde im vorhandenen Testzugang gespeichert und auf ausdrücklichen Nutzerwunsch behalten. Zugangsdaten werden nicht dokumentiert. Die nachstehenden Bewertungen unterscheiden Codebelege, Buildbelege, vorhandene Servicetests und tatsächlich beobachtete Laufzeitinformationen.

## 1. Prüfstand und Referenzen

| Gegenstand | Festgehaltener Stand |
| --- | --- |
| Workspace | `C:\Users\Joshua\Desktop\Desktop App prototype\studyplan` |
| Commit | `14e92697e983dee2d9d730b5622395e269391901` |
| Arbeitsstand zu Beginn | Geändert: `docs/ba-abgleich-betreuergespraech.md`, `docs/electron-security-check-ba-vorschlag.md`; unversioniert: `docs/electron-security-implementation-plan.md`. Keine Änderungen an Produktcode/Lockfile im Git-Status. |
| Betriebssystem | Windows, Kernel `10.0.26200`, x64 |
| Buildwerkzeuge | Node `24.18.1`, npm `11.16.0` |
| Electron | Lockfile und installiertes Paket: `39.8.10`; FileVersion/ProductVersion der tatsächlich gestarteten `node_modules/electron/dist/electron.exe`: `39.8.10`. Die Versionsrange in `package.json` lautet `^39.2.6` und ist nicht die geprüfte Laufzeitversion. Belege: [Umgebung einschließlich Binary-Hash](security-check/evidence/environment.json), [Versionsmetadaten](security-check/evidence/binary-version.json). |
| Start | `npm run build`, danach `npm run start` (`electron-vite preview`). Preview führt intern erneut den Build aus; das ist das bestehende Skriptverhalten. |
| Beobachteter Renderer | `file:///C:/Users/Joshua/Desktop/Desktop%20App%20prototype/studyplan/out/renderer/index.html#/login`; kein Vite-Devserver/HMR. Durch Electron-UI-Baum und DevTools-Fenstertitel belegt. |
| Ausgangszustand | Zunächst Loginseite, keine aktive lokale Sitzung. In der ergänzenden Laufzeitprüfung nahm der Nutzer lokale Anmeldung, DevTools-Freigabe und getrennte Anmeldung für „Gruppen (Sync)“ selbst vor. |
| Artefaktgrenze | Lokaler gebauter Demonstrator mit installierter Electron-Entwicklungsbinary; kein paketierter/signierter Installer untersucht. |
| Dateibindung | [SHA-256-Werte](security-check/evidence/file-hashes.json) für relevante Quellen, Lockfile und tatsächlich verwendete Builddateien. |
| Ergänzende Laufzeitprüfung | Fortsetzung am selben Tag über `npm run start`. Alle erfassten Quellen, Konfigurationen und Builddateien stimmen mit der ersten Bestandsaufnahme überein: [Hashvergleich](security-check/evidence/runtime-followup-hashes.json). Ablauf und tatsächliche Antworten: [Laufzeitprotokoll](security-check/evidence/runtime-followup.md). Kein zusätzlicher Migrations- oder Reproduktionsdurchlauf. |

Referenzfassung: die am Prüftag abgerufene [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations), alle 20 nummerierten Punkte. Die Matrix unten bildet diese Fassung ab. Weitere Quellen:

- [WebPreferences der tatsächlich verwendeten Version v39.8.10](https://raw.githubusercontent.com/electron/electron/v39.8.10/docs/api/structures/web-preferences.md), für Defaults.
- [Electron Releases](https://releases.electronjs.org/), Abruf am 3. Oktober 2026: Stable-Linien `44.5.1`, `43.7.7`, `42.11.10`.
- [Offizielle Versionsunterstützung](https://www.electronjs.org/docs/latest/tutorial/electron-timelines#version-support-policy): die neuesten drei stabilen Hauptversionen. `39.8.10` liegt damit außerhalb der am Prüftag aufgeführten unterstützten Linien. Daraus wird kein Nachweis einer konkreten ausnutzbaren Schwachstelle abgeleitet.
- [Electron Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses), für die Bedeutung der ausgelesenen Optionen.

Die externen Referenzen sind Abrufe, keine lokal eingefrorene vollständige Dokumentationskopie. Die unveränderliche Versionsreferenz dient insbesondere dazu, heutige Defaults nicht ungeprüft auf v39 zu übertragen.

## 2. Vollständiger Richtlinienabgleich

**Bewertungsregel:** „Erfüllt“ bezeichnet hier die Erfüllung auf der jeweils angegebenen Nachweisebene. Ein statisch erfüllter Eintrag behauptet keine zusätzlich geprüfte Laufzeitwirkung. „Teilweise erfüllt“ hält Einschränkungen sichtbar; „nicht erfüllt“ kennzeichnet eine belegte Abweichung. Nicht anwendbare Webview-Punkte werden aufgrund fehlender Oberfläche und dokumentiertem deaktivierten Default begründet.

| Nr. | Richtlinie | Anwendbarkeit | Umsetzung / konkreter Beleg | Bewertung | Nachweisart |
| --- | --- | --- | --- | --- | --- |
| 1 | Sichere Ressourcen | Ja | Renderer-Skripte/CSS sind lokale Buildassets; keine fremden Skriptquellen im [gebauten HTML](security-check/evidence/built-renderer.html). CSP schränkt Renderer-Verbindungen ein. Studienkatalog-Default ist HTTPS (`src/main/services/study-programs.service.ts:6–20`). Aktuelle Kollaborationskonfiguration enthält HTTPS für beide Endpunkte, belegt nur als [Protokolle ohne Hosts/Schlüssel](security-check/evidence/network-protocols.txt). URL-Overrides werden in `src/main/collaboration/runtime.ts:50–63` und beim Katalog nicht auf sichere Protokolle validiert. | Teilweise erfüllt: geprüfte Einstellungen sicher, keine vollständige Absicherung beliebiger Konfigurationen oder Redirects nachgewiesen. | Code, Build, lokale Konfigurationsinspektion; keine Netzwerkverkehrsprüfung |
| 2 | Node-Integration deaktiviert | Ja | `nodeIntegration: false` in `src/main/index.ts:95–99`; einziger BrowserWindow-Konstruktor. Keine weiteren Renderer mit Node-Integration gefunden. | Erfüllt | Code; keine Laufzeit-Abfrage der WebPreferences |
| 3 | Context Isolation | Ja | `contextIsolation: true`, gleiche Fensterkonfiguration; Preload nutzt `contextBridge`. | Erfüllt | Code |
| 4 | Renderer-Sandbox | Ja | `sandbox: true`, gleiche Fensterkonfiguration. Kein `--no-sandbox`/Sandbox-Override in den geprüften Start-/Buildpfaden gefunden. | Erfüllt | Code/Startskript; keine OS-Sandbox-Inspektion |
| 5 | Berechtigungsbehandlung | Ja, vorbeugend auch bei lokalem Renderer | Check- und Request-Handler auf der Fenstersession (`src/main/index.ts:119–135`); nur `clipboard-sanitized-write` für genau diesen WebContents und erlaubte Renderer-URL, alles andere abgelehnt. | Erfüllt | Code; keine Berechtigungsdialoge ausgelöst |
| 6 | Web Security beibehalten | Ja | Kein `webSecurity: false` in Fenster/Build/Startpfad; v39.8.10 dokumentiert `true` als Default. | Erfüllt | Code + versionsbezogene Default-Dokumentation |
| 7 | Restriktive CSP | Ja | Meta-CSP in `src/renderer/index.html` und gebautem HTML: `default-src 'none'`, `script-src 'self'`, `object-src 'none'`, `frame-src 'none'`; kein `unsafe-eval`/`unsafe-inline` für Skripte. Styles erlauben `unsafe-inline`. P3 meldet die Blockierung der Testquelle und `securitypolicyviolation` für `script-src-elem` mit Fallback auf `script-src`. | Erfüllt; Laufzeitblockierung für den gewählten Skriptladefall bestätigt | Code, Build, P3 |
| 8 | Unsichere Inhalte nicht freigeben | Ja | `allowRunningInsecureContent` nicht aktiviert; v39.8.10-Default `false`, `webSecurity` nicht deaktiviert. | Erfüllt | Code + versionsbezogene Defaults |
| 9 | Keine experimentellen Features | Ja | Kein `experimentalFeatures: true` oder entsprechender Startswitch in geprüftem App-Code; v39.8.10-Default `false`. | Erfüllt | Code + versionsbezogene Defaults |
| 10 | Keine zusätzlichen Blink-Features | Ja | Kein `enableBlinkFeatures` oder entsprechender Startswitch in geprüftem App-Code. | Erfüllt | Code/Startskript |
| 11 | Keine Webview-Popups | Webview nicht vorhanden | Keine `<webview>`-Nutzung im App-Quellcode, `webviewTag` nicht aktiviert; v39.8.10-Default `false`. | Begründet nicht anwendbar | Quellcodesuche + versionsbezogener Default |
| 12 | Webview-Parameter prüfen | Webview nicht vorhanden | Gleiche Grundlage wie Nr. 11. Es gibt keine Webview-Erzeugung, deren Parameter separat geprüft werden müssten. | Begründet nicht anwendbar | Quellcodesuche + versionsbezogener Default |
| 13 | Navigation begrenzen | Ja | `will-navigate` blockiert unerlaubte Ziele (`src/main/index.ts:107–117,137–139`); URL wird geparst und beim File-Renderer auf Protokoll/Pfad begrenzt. Hash-Routing bleibt möglich. | Erfüllt | Code; kein Navigationsversuch durchgeführt |
| 14 | Neue Fenster begrenzen | Ja | `setWindowOpenHandler` gibt immer `action: 'deny'` zurück (`src/main/index.ts:145–148`); ein definierter App-Fensterkonstruktor. | Erfüllt | Code; kein Popupversuch durchgeführt |
| 15 | Externes Öffnen kontrollieren | Ja | Einziger `shell.openExternal`-Pfad akzeptiert nur geparste `https:`-URLs (`src/main/index.ts:78–84,145–148`). Beliebige HTTPS-Ziele werden akzeptiert; keine zusätzliche Ziel-/Vertrauensliste. | Teilweise erfüllt: gefährliche Fremdprotokolle ausgeschlossen, Vertrauensprüfung des externen Ziels bleibt offen | Code; keine externen Links geöffnet |
| 16 | Aktuelle Electron-Version | Ja | Tatsächlich `39.8.10`; am Prüftag aktuelle Stable-Hauptversionen 44/43/42 gemäß offiziellen Quellen oben. | Nicht erfüllt | Lockfile, installiertes Paket, Metadaten der gestarteten Binary, offizielle Releases/Supportpolicy |
| 17 | Alle IPC-Sender validieren | Ja, beide vorhandenen Eingänge | Zwei Registrierungen: `src/main/ipc/api-dispatcher.ts:191` und `src/main/collaboration/ipc.ts:79`. Beide rufen vor fachlicher Verarbeitung dieselbe Policy auf. Sie prüft registrierte WebContents-ID, Hauptframeidentität und erlaubte URL; entfernt zerstörte Fenster (`api-dispatcher.ts:200–215`). Bindung in `src/main/index.ts:136,363–368`. | Erfüllt auf Codeebene; Abwehr fremder Fenster/Frames nicht praktisch geprüft | Code; vorhandener API-Test verwendet eine permissive Testpolicy und belegt diesen Punkt nicht |
| 18 | Eigenes App-Protokoll statt file:// | Ja | `pathToFileURL(...)` und `loadURL(rendererUrl)` (`src/main/index.ts:102–106,152`); File-URL tatsächlich im laufenden Renderer gesehen. Keine eigene Protokollregistrierung gefunden. | Nicht erfüllt | Code + UI-Laufzeitbeobachtung |
| 19 | Relevante Fuses prüfen | Ja; Umfang auf verwendete Binary begrenzt | [Fuse-Read](security-check/evidence/fuses.txt) und Bedarfsabwägung unten. Keine App-Fuse-Konfiguration im Build. Mehrere mächtige ungenutzte Optionen bleiben in der Preview-Binary aktiviert. | Teilweise erfüllt: Inspektion und Einordnung abgeschlossen, begründete Buildkonfiguration/Umsetzung bleibt offen | Binary-Read + Code/Build-Konfiguration; keine Installerbewertung |
| 20 | Electron-APIs nicht roh exponieren | Ja | Preload exponiert nur `apiTransport.invoke` und `collaborationTransport.invoke`, jeweils auf einen festen Kanal begrenzt (`src/preload/index.ts:8–23`). Keine Rohobjekte `ipcRenderer`, Eventobjekte oder frei wählbare IPC-Kanäle. Main wählt bekannte Operationen und validiert Eingaben. P1 bestätigt die Ablehnung der beiden gewählten ungültigen Eingaben über die echten Bridges. | Erfüllt | Code; ergänzend P1 für Eingabevalidierung, keine vollständige Operationsmatrix |

Die Matrix enthält **13 erfüllte, 3 teilweise erfüllte, 2 nicht erfüllte und 2 begründet nicht anwendbare Punkte**. Maßgeblich bleiben die Einzelbewertungen einschließlich ihrer Nachweisgrenzen. Ergänzende Laufzeitnachweise bestehen für die ausgewählten Fälle P1–P3; daraus wird kein praktischer Test sämtlicher Empfehlungen abgeleitet.

### Fuse-Einordnung ohne Distributionsaudit

Gelesen wurde ausschließlich die vom Preview verwendete `node_modules/electron/dist/electron.exe`, mit dem bereits installierten `@electron/fuses` 1.8.0. Keine Binary wurde verändert. Die Empfehlung verlangt eine Auswahl relevanter Optionen; sie bedeutet nicht, sämtliche Fuses pauschal umzuschalten.

| Option / gemessener Zustand | Bedarf des Demonstrators und begrenzte Bewertung |
| --- | --- |
| `RunAsNode`, `EnableNodeOptionsEnvironmentVariable`, `EnableNodeCliInspectArguments`: Enabled | In den geprüften normalen App-Pfaden keine Nutzung dieser Zusatzmodi gefunden; das ist eine Grundlage für eine spätere Abschaltentscheidung. Main nutzt seine reguläre Node-Laufzeit unabhängig vom RunAsNode-Modus. Kein praktischer Kompatibilitätsnachweis für geänderte Fuses erhoben. |
| `EnableCookieEncryption`: Disabled | Keine cookiegestützte App-Authentifizierung im geprüften Kollaborationspfad; dort `persistSession: false`. Daraus folgt weder eine Forderung nach SQLite-Verschlüsselung noch ein Nachweis über sämtliche Browsercookies. Kein eigenständiger BA-Befund zur ausgeschlossenen Datenbankverschlüsselung. |
| `EnableEmbeddedAsarIntegrityValidation`, `OnlyLoadAppFromAsar`: Disabled | Relevanz für ein später paketiertes Artefakt prüfen. Preview lädt bewusst die gebauten Dateien im Workspace; hier kein ASAR-/Installer-Nachweis. Keine Behauptung über eine bereits veröffentlichte Distribution. |
| `LoadBrowserProcessSpecificV8Snapshot`: Disabled | Keine App-eigene Snapshot-Konfiguration gefunden. Kein belastbarer notwendiger Änderungsbedarf innerhalb dieser begrenzten Prüfung abgeleitet. |
| `GrantFileProtocolExtraPrivileges`: Enabled | Passt zur vorhandenen File-URL; Abweichung Nr. 18 bleibt bestehen. Eine Umstellung müsste mit eigener Protokollwahl und App-Kompatibilität zusammen bewertet werden. |

Damit ist die relevante Auswahl dokumentiert. Die fehlende Buildentscheidung wird sichtbar gehalten, ohne aus unveränderten Entwicklungsfuses pauschal einen Produktionsfehler aller Optionen abzuleiten.

## 3. Ausgeführte Kommandos und vorhandene Tests

| Kommando | Ergebnis / Beleg | Aussagegrenze |
| --- | --- | --- |
| `npm run api:test` | Exit 0; **10/10 bestanden**, [Ausgabe](security-check/evidence/api-test.txt) | Insbesondere `malformed IPC input is rejected at runtime` weist beim direkt aufgerufenen Dispatcher ungültige Eingabe und ausbleibende Handlerausführung nach. `isSenderAllowed: () => true`; kein Electron-Bridgedurchlauf, keine reale Senderprüfung. |
| `npm run group-resources:test` | Exit 0; **5/5 bestanden**, [Ausgabe](security-check/evidence/group-resources-test.txt) | Authentifizierung/Mitgliedschaft, Gruppenressourcen und Aufgaben-Zuweisung auf Serviceebene. Diese Suite belegt keine neue Kollaborationsbridge, CSP oder sichere UI-Darstellung. |
| `npm run build` | Exit 0; API-Check und beide Typechecks erfolgreich, [Ausgabe](security-check/evidence/build.txt) | Buildfähigkeit; Zod/Rollup-Kommentarwarnungen, keine Buildfehler. Kein Sicherheitsnachweis allein durch erfolgreichen Build. |
| `npm run start` | Exit 0 nach bewusstem Schließen, [Ausgabe](security-check/evidence/start.txt) | Tatsächlicher lokaler Start/Renderer beobachtet. DevTools meldet zusätzlich unbekannte Autofill-Protokollmethoden; kein P1/P3-Ergebnis daraus. |
| `node node_modules/@electron/fuses/dist/bin.js read --app node_modules/electron/dist/electron.exe` | Exit 0, [Ausgabe](security-check/evidence/fuses.txt) | Reiner Read der verwendeten Preview-Binary. |

Die ersten beiden Testversuche in der Sandbox scheiterten vor Testausführung an `spawn EPERM` (Exit 1). Mit freigegebenen Prozessrechten wurden genau die vorhandenen Skripte erneut ausgeführt und bestanden. Die gespeicherten Testausgaben enthalten diese erfolgreichen Läufe; der erste Infrastrukturfehler ist hier dokumentiert. Build und Start liefen ebenfalls mit den freigegebenen Prozessrechten. Keine Testimplementierung wurde verändert.

Weitere reine Inspektionen: `git rev-parse HEAD`, `git status --short`, `git diff --name-only`, `node -v`, `npm -v`, Versionen aus Lockfile/Package/Dateimetadaten, SHA-256-Werte und `rg`-Suchen in den genannten Sicherheitsdateien. Bei der Netzwerk-Konfigurationsinspektion wurden nur URL-Protokolle ausgegeben, keine Schlüssel, Zugangsdaten oder vollständigen Ziele.

## 4. Protokolle P1–P3

Alle Fälle beziehen sich auf Prüfstand Nr. 1; identische Hashes binden die ergänzende Prüfung an denselben Programmstand. Die Ausdrücke und erwarteten Antworten stehen im [Umsetzungsplan](electron-security-implementation-plan.md#arbeitspaket-5-die-drei-manuellen-fälle-durchführen). Die tatsächlichen Antworten und ergänzenden Beobachtungsbefehle stehen im [Laufzeitprotokoll](security-check/evidence/runtime-followup.md).

### P1 – Eingabevalidierung der beiden Bridges

- **Prüfziel:** Ungültige Eingaben vor fachlicher Verarbeitung im Main abweisen.
- **Tatsächliche Handlung:** Nach manueller Vorbereitung durch den Nutzer beide geplanten Aufrufe im DevTools-Kontext `top` des lokalen Renderers ausgeführt; `console.log`/`JSON.stringify` sichern lesbare Antworten.
- **Erwartung:** API `VALIDATION_ERROR`, Kollaboration `INVALID`, jeweils `ok: false`.
- **Beobachtung:** API-Antwort `ok: false` mit `VALIDATION_ERROR` und Detail „expected number, received string“ für `path.id`; Kollaborationsantwort `ok: false` mit `INVALID` und „Invalid collaboration input.“
- **Beleg:** [Console-Text](security-check/evidence/runtime-p1-console.txt), [Screenshot](security-check/evidence/runtime-p1-console.jpg).
- **Bewertung:** **Bestanden.** Beide konkreten Bridgeeingaben wurden tatsächlich zurückgewiesen. Handler-/Cloud-Ausführung wurde nicht separat instrumentiert; die nachstehende Codeprüfung und der bestehende Dispatcher-Negativtest ergänzen diese Aussage. Kein Nachweis zur Abwehr fremder IPC-Sender.
- **Ergänzender Codebeleg:** API `safeParse` vor Handler (`api-dispatcher.ts:126–144`); Kollaboration `safeParse` vor lokaler Sessionabfrage und Runtime (`collaboration/ipc.ts:90–96`). `getEvent` verlangt numerische Ganzzahl (`contract.generated.ts:637–646`), `createTask.groupId` UUID (`collaboration/ipc.ts:13,38–49`). Damit ist die Reihenfolge statisch nachvollzogen.

### P2 – HTML-artiger Aufgabentitel

- **Prüfziel:** Speichern/Anzeigen/Wiederöffnen der synthetischen Aufgabe; Titel bleibt Text, kein SVG-Knoten und kein Ausführungsmarker.
- **Tatsächliche Handlung:** Nach manueller Anmeldung im Gruppenfeature eine synthetische Aufgabe in der vorhandenen eigenen Gruppe „Neue Gruppe“ über die reguläre UI gespeichert. Den geplanten Titel unverändert verwendet; Beschreibung, Zuweisung und Datum leer gelassen. Nach erster Anzeige über „Termine“ aus der Aufgabenansicht gewechselt und „Aufgaben“ erneut geöffnet; jeweils gezielte DOM-Abfrage des exakt passenden Titelabsatzes.
- **Erwartung:** Wortwörtlicher Titel, kein aus dem Titel erzeugtes SVG, Marker `undefined` nach erneuter Ansicht.
- **Beobachtung:** Vollständiger Titel wortwörtlich sichtbar; genau ein passendes `P`-Element, ausschließlich Textknoten (`childNodeTypes: [3]`), `svgInTitle: 0`. Identisches Ergebnis nach Wiederöffnung; direkte Marker-Abfrage ergibt `undefined`.
- **Beleg:** [Erste Darstellung](security-check/evidence/runtime-p2-task-initial.jpg), [Darstellung nach Wiederöffnung](security-check/evidence/runtime-p2-task-reopened.jpg), [Console-Text](security-check/evidence/runtime-p2-console.txt), [Console-Screenshot](security-check/evidence/runtime-p2-console.jpg).
- **Bewertung:** **Bestanden.** Ergänzt den JSX-Text-Codebeleg in `TaskItem` (`gruppen-sync.tsx:453,496,504`). Geprüft wurden Speichern, Darstellung und Wiederöffnung in derselben Sitzung; kein Neustart mit Datenbank-Neuladen, keine vollständige XSS-Testfamilie und keine Mehrgeräteprüfung.

### P3 – CSP gegen externe Skriptquelle

- **Prüfziel:** Eine eindeutige CSP-Verletzung für `https://ba-security.invalid/marker.js` im gebauten Renderer beobachten.
- **Tatsächliche Handlung:** Im gebauten Renderer Beobachter für `securitypolicyviolation` registriert und Skriptelement mit der geplanten Testquelle in den Head eingefügt; anschließend Skriptelement und Listener entfernt.
- **Erwartung:** CSP-Verletzungsereignis oder eindeutige CSP-Konsolenmeldung; DNS-Fehler allein wäre unzureichend.
- **Beobachtung:** Explizite Console-Meldung zur Verletzung von `script-src 'self'` und Blockierung der Testquelle. Beobachter meldet `BA-P3-CSP script-src-elem https://ba-security.invalid/marker.js`.
- **Beleg:** [Gebautes HTML mit CSP](security-check/evidence/built-renderer.html), [Console-Text](security-check/evidence/runtime-p3-console.txt), [Screenshot](security-check/evidence/runtime-p3-console.jpg).
- **Bewertung:** **Bestanden.** Eindeutige Richtliniendurchsetzung für den gewählten Ladefall. DevTools-Codeausführung selbst ist kein XSS-Nachweis; andere Ressourcen-/Abflusswege wurden nicht untersucht.

**Historie der Werkzeugvorbereitung:** Im ersten Versuch verhinderten die [Self-XSS-Einfügesperre](security-check/evidence/devtools-barrier.jpg) und die [fehlende Anmeldung](security-check/evidence/built-app-login.jpg) die Laufzeitfälle. Das waren keine negativen App-Befunde. In der Fortsetzung nahm der Nutzer Anmeldung und Einfügefreigabe selbst vor; erst danach wurden P1–P3 ausgeführt. Der angewendete [Computer-Use-Skill](</C:/Users/Joshua/.codex/plugins/cache/openai-bundled/computer-use/26.930.31730/skills/computer-use/SKILL.md>) verlangt in seinen [Bedienregeln](</C:/Users/Joshua/.codex/plugins/cache/openai-bundled/computer-use/26.930.31730/docs/guidance.md>) „Do not automate user authentication dialogs.“ Seine [Bestätigungsregeln](</C:/Users/Joshua/.codex/plugins/cache/openai-bundled/computer-use/26.930.31730/docs/confirmations.md>) ordnen „Bypass Windows/browser/web safety barriers“ einer manuellen Übergabe zu. Keine Login-Automation oder automatisierte Freigabe der Einfügesperre vorgenommen.

## 5. Abweichungen, Grenzen und Aufräumen

**Belegte Abweichungen:** File-Renderer statt eigenem App-Protokoll; zum Prüftag ältere Electron-Linie. **Teilweise belegte Bereiche:** sichere URL-Konfiguration ohne vollständige Protokollvalidierung aller Overrides; lediglich HTTPS-basierte externe Öffnungsregel; Fuse-Auswahl dokumentiert, aber kein Buildentscheid umgesetzt. Diese Punkte werden nicht wegen des BA-Umfangs als nicht anwendbar umetikettiert.

**Praktische Nachweise und Grenzen:** P1–P3 sind bestanden. Nicht praktisch geprüft sind insbesondere fremde IPC-Fenster/Frames (Nr. 17), sämtliche URL-/Redirectpfade und ein paketiertes Artefakt mit geänderten Fuses. Nr. 17 bleibt ein Codebeleg. Es wurde weder ein neuer Testharness aufgebaut noch die gesamte Checkliste als praktisch getestet ausgegeben.

Aufräumen: P3-Skript und Listener entfernt, temporäre Hilfsvariablen/Hilfsfunktion freigegeben und Marker entfernt; die [Abschlusskontrolle](security-check/evidence/runtime-cleanup-console.txt) zeigt keine Testskripte und `undefined` für die Hilfen und den Marker. Die synthetische P2-Aufgabe bleibt auf ausdrücklichen Nutzerwunsch („Testaufgabe behalten“) in „Neue Gruppe“ bestehen; vorhandene Aufgaben und Gruppen wurden nicht gelöscht. App und DevTools bleiben in der ergänzenden Sitzung zur Einsicht offen. Die erste Prüfsitzung wurde zuvor geschlossen (Startlog Exit 0); dies wird nicht als Abschluss der aktuellen Sitzung ausgegeben. Keine Debugpatches; Builddateien und Belege bleiben erhalten.

Ausgeschlossen bleiben alle im Plan genannten weiteren Audits/Tests. Es gibt keinen zweiten Migrationsdurchlauf, kein Clouddeployment und keine Prüfung eines signierten Installers.

## 6. Bausteine für Methodik und Evaluation

Diese Formulierungen sind zur Übernahme vorbereitet. Bestehende BA-Kapiteldrafts außerhalb dieses Workspaces wurden **nicht** überschrieben; ihre Übernahme bleibt ein redaktioneller Schritt.

### Methodik – Durchführung und tatsächliche Grenze

> Die Sicherheitsüberprüfung bildet einen begrenzten Teil der anforderungsbasierten Evaluation. Alle 20 Empfehlungen der am 3. Oktober 2026 abgerufenen Electron Security Guidelines wurden auf Anwendbarkeit geprüft und anhand des Quellcodes, der Konfiguration und relevanter Buildartefakte bewertet. Zwei vorhandene Testreihen ergänzen die Belege in ihrem jeweiligen Geltungsbereich. Am lokal gestarteten gebauten Demonstrator wurden drei begrenzte praktische Fälle zur IPC-Eingabevalidierung, sicheren Darstellung eines HTML-artigen Aufgabentitels und CSP-Durchsetzung durchgeführt. Für die Vorbereitung nahm der Nutzer Anmeldung und DevTools-Einfügefreigabe selbst vor. Die Ergebnisse werden zusammen mit Codebelegen, tatsächlichen Abweichungen und Grenzen der Nachweistiefe dokumentiert.

### Evaluation – belegtes Ergebnis

> Beide vorhandenen Testreihen bestanden mit zehn API- und fünf Gruppenressourcen-Tests. Build, API-Check und Typechecks waren erfolgreich; der Demonstrator startete mit lokal gebautem Renderer. P1–P3 bestanden: Beide Bridges wiesen die gewählten ungültigen Eingaben zurück; der gespeicherte HTML-artige Aufgabentitel blieb auch nach Wiederöffnung ein Textknoten ohne SVG und Ausführungsmarker; die CSP blockierte die fremde Skriptquelle ausdrücklich. Der Richtlinienabgleich belegt zugleich den Einsatz von file://, eine zum Prüftag ältere Electron-Linie und teilweise erfüllte Bereiche beim externen Öffnen, sicherer URL-Konfiguration und Fuse-Buildentscheidungen. Trotz bestandener ausgewählter Laufzeitfälle kann eine vollständige Einhaltung der vereinbarten Electron Security Guidelines für diesen Stand nicht behauptet werden.

### Diskussion – Bedeutung für die Migration

> Die Überprüfung bewertet Sicherheit als Teilanforderung der Migration. Sie liefert nachvollziehbare Belege für umgesetzte Mechanismen und macht verbleibende Abweichungen sowie Grenzen der Nachweistiefe sichtbar. Die drei Laufzeitfälle prüfen konkrete Mechanismen und begründen keine vollständige praktische Prüfung sämtlicher Richtlinien, insbesondere der Abwehr fremder IPC-Sender. Die Ergebnisse rechtfertigen weder eine Produktionsfreigabe noch Aussagen über ausgeschlossene Cloud-, Distributions- oder Mehrgeräteaspekte. Die ergänzenden Beobachtungen am unveränderten Demonstrator sind kein weiterer Migrations- oder Reproduktionsdurchlauf.

## 7. Erfüllungsstand des Umsetzungsplans

- [x] Prüfstand und Startweise festgehalten.
- [x] Alle 20 Empfehlungen mit Anwendbarkeit, Ergebnis, Beleg und Nachweisart bewertet.
- [x] Vorhandene Testläufe ausgeführt, dokumentiert und begrenzt eingeordnet.
- [x] Gebauter Demonstrator tatsächlich gestartet und Renderer-URL beobachtet.
- [x] P1–P3 tatsächlich durchgeführt, bestanden und mit Belegen dokumentiert.
- [x] Temporäre Prüfhilfen entfernt; Testaufgabe auf ausdrücklichen Nutzerwunsch behalten und offene App-Sitzung dokumentiert.
- [x] Abweichungen und Grenzen zusammengefasst.
- [ ] Redaktionelle Übernahme in bestehende Methodik-/Evaluationskapitel (Bausteine oben vorbereitet).

Die begrenzte Bestandsaufnahme ist dokumentiert; die Sicherheitsanforderung ist für diesen Stand nicht vollständig nachgewiesen.
