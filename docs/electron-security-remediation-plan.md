# Nachbesserungsplan: Electron-Sicherheitsrahmen

Stand: 4. Oktober 2026. **Umsetzung und begrenzte manuelle Nachprüfung abgeschlossen.** [Tatsächliche Umsetzung und neue Nachweise](electron-security-remediation-results.md). Der folgende Text bewahrt den freigegebenen Plan; notwendige native Buildkorrekturen und tatsächliche Redirectgrenzen stehen im neuen Bericht. Hauptumfang: Richtlinien 15, 16, 18 und 1 einschließlich Präzisierungen zu 17/19. Grundlage ist der [Ergebnisbericht vom 3. Oktober](electron-security-check-results.md); dessen ursprüngliche Belege bleiben erhalten.

Ziel ist, die festgestellten Abweichungen am vorhandenen Demonstrator zu schließen und die geänderten Mechanismen gezielt nachzuprüfen. Die Migration bleibt das Hauptthema der BA. Keine neue Schutzarchitektur, kein weiterer Migrations-/Reproduktionsdurchlauf, keine E2E-Testinfrastruktur, Cloud-Datenbankhärtung, SQLite-Verschlüsselung, Signierung, Veröffentlichung oder umfassender Distributionsaudit.

## Reihenfolge und betroffene Dateien

| Schritt | Richtlinie | Änderung | Einstiegspunkte |
| --- | --- | --- | --- |
| A | 16 | Electron aktualisieren, native Abhängigkeiten prüfen | `package.json`, `package-lock.json`, bestehende Buildskripte |
| B | 15 | Externes Öffnen entfernen | `src/main/index.ts` |
| C | 1 | Netzwerk-Konfiguration validieren | `src/main/collaboration/runtime.ts`, `src/main/services/study-programs.service.ts`; gegebenenfalls kleine gemeinsame URL-Hilfe |
| D | 18 + 17 | `app://` einführen und bestehende URL-/Senderprüfung anpassen | `src/main/index.ts`, `src/main/ipc/api-dispatcher.ts`; gegebenenfalls kleines Protokollmodul |
| E | 19 | Fuses im Windows-Paket konfigurieren und Integritätsmetadaten prüfen | `electron-builder.yml`, vorhandenes Packaging; nur bei Bedarf begrenzte Buildkorrektur |
| F | alle betroffenen | Gezielte Nachprüfung und Ergebnisfortschreibung | vorhandene Tests, lokale Windows-Buildkopie, Ergebnisbericht |

Vor Beginn laufende Prüf-App und DevTools geordnet schließen, Arbeitsstand/Versionen festhalten und nur benötigte Dateien ändern. Keine vorhandenen Nutzerdaten zurücksetzen. Neue Belege getrennt unter `docs/security-check/evidence/remediation/` ablegen; Datum, Commit bzw. Änderungen und tatsächliche Binary identifizieren.

## A – Punkt 16: Electron aktualisieren

1. Zum Umsetzungsbeginn die aktuelle stabile Electron-Version erneut prüfen und als konkretes Ziel festhalten. Die Planung verwendet die auf der [offiziellen Release-Seite](https://releases.electronjs.org/) gelistete Linie 44 als Orientierung; kein Alpha-/Nightly-Ziel.
2. Die relevanten [Breaking Changes](https://www.electronjs.org/docs/latest/breaking-changes) zwischen 39 und dem Ziel auf verwendete APIs/Abhängigkeiten prüfen. Änderungen an `BrowserWindow`, Protokoll, IPC, nativen Datenbankmodulen und Worker-Ausführung priorisieren. Zwischenstände sind bei Kompatibilitätsproblemen möglich; keine vollständigen Prüfkampagnen für jede Zwischenversion.
3. Electron in `package.json` aktualisieren und das Lockfile mit npm erneuern. Nur bei belegtem Bedarf electron-vite, electron-builder oder native Module mit aktualisieren; kein pauschales Update sämtlicher Pakete.
4. Vorhandenen Installations-/Rebuildweg verwenden (`postinstall`: `electron-builder install-app-deps`). Das vorhandene `npmRebuild: false` im Builder berücksichtigen: Die Binary-Kompatibilität darf nicht allein aus einem erfolgreichen Typecheck abgeleitet werden.
5. Tatsächlich installierte und später paketierte Electron-Version dokumentieren. Preview starten und lokale Datenbankinitialisierung beobachten. Powersync-/SQLite-Nativmodule zusätzlich am Paket in F prüfen.

**Fertig, wenn:** Zielversion stabil und aktuell ist, Build und relevante Tests bestehen, der Demonstrator startet und Datenbankzugriffe funktionieren. Versionsrange, Lockfile und gestartete Binary stimmen nachvollziehbar überein.

## B – Punkt 15: Externes Öffnen entfernen

Die Oberfläche benötigt keine externen Webseiten. Deshalb wird der vorhandene externe Öffnungspfad entfernt:

```ts
mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
```

`isSafeExternalUrl` und den nun ungenutzten `shell`-Import entfernen, sofern keine weitere Nutzung besteht. `will-navigate` beibehalten; dessen Zielprüfung folgt in D.

**Gezielter Nachweis:** Im Renderer `window.open('https://example.com', '_blank')` anstoßen. Erwartung: weder neues Electron-Fenster noch Öffnung im Systembrowser. Vorher Fensterzustand beobachten; tatsächliche Beobachtung dokumentieren. Damit ist der HTTPS-Weiterleitungspfad geschlossen, ohne eine neue Liste externer Domains einzuführen. Bezug: [Richtlinie 15](https://www.electronjs.org/docs/latest/tutorial/security#15-do-not-use-shellopenexternal-with-untrusted-content).

## C – Punkt 1: Sichere Netzwerkziele

**Konkrete Eingaben:** `STUDY_CATALOG_URL` einschließlich Default, `SUPABASE_URL` und `POWERSYNC_SPIKE_ENDPOINT`.

1. Adressen mit `new URL(...)` parsen; in der regulären App nur `https:` mit vorhandenem Host zulassen. Eingebettete Benutzername-/Passwortteile ablehnen. Ungültige oder unsichere Konfiguration vor Netzwerkaufruf zurückweisen; Fehlermeldung nennt den Konfigurationsnamen, keine Schlüssel, Passwörter oder vollständige sensible URL.
2. Katalogadresse unmittelbar vor dem Download validieren. Beim Kollaborationszugang vor Erzeugen der Clients validieren; bei Fehler nicht zuerst die vorhandene Sitzung abmelden. Der reine Gruppenstatus soll bei fehlerhafter Konfiguration verständlich reagieren und keine Anfrage auslösen.
3. Für den direkt kontrollierten Katalog-Fetch zunächst `redirect: 'error'` vorsehen. Benötigt der tatsächliche Dienst Redirects, eine kleine kontrollierte HTTPS-Weiterleitungslösung begründen; kein automatisches Zurückfallen auf unkontrolliertes Folgen. URL-Prüfung erst nach dem Download wäre kein Schutz vor einem bereits erfolgten unsicheren Request.
4. Für die eingesetzten Supabase-/PowerSync-Transporte die vorhandenen Redirect-Einstellungen gezielt nachvollziehen. Eine URL-Prüfung bei Konfiguration belegt nicht automatisch die Sicherheit aller SDK-Redirects. Falls ein verbleibender Pfad nicht begrenzt nachweisbar ist, die Grenze ausdrücklich im Matrixeintrag halten; keine eigene universelle Transportarchitektur aufbauen und Punkt 1 nicht voreilig vollständig als erfüllt markieren.
5. Den bestehenden Katalogtest berücksichtigen: `scripts/study-programs/study-programs.test.ts` nutzt einen Loopback-HTTP-Server. Bevorzugt die Importprüfung über die bereits injizierbare Fetch-Funktion mit einer synthetischen HTTPS-URL erhalten; alternativ nur eine explizit injizierte Testpolicy für den lokalen Transporttest. Keine HTTP-Ausnahme über normale App-Konfiguration und kein globaler Security-Aus-Schalter.

**Gezielte Tests:** gültige HTTPS-Adresse akzeptiert; HTTP, fremdes Schema, ungültige URL und URL mit Zugangsdaten abgelehnt; bei Ablehnung kein Fetch/Clientstart. Katalog-Import und dessen Fehlerverhalten weiterhin mit vorhandener Suite prüfen. Redirect-Abweisung mit einem kleinen kontrollierten Test des tatsächlich verwendeten Fetch-Verhaltens nachweisen, soweit umgesetzt; keine externe Testinfrastruktur.

**Fertig, wenn:** die drei Konfigurationseingänge vor Benutzung abgesichert sind, der bestehende Katalogabruf und das Aufgabenfeature funktionieren und die tatsächliche Redirect-Abdeckung dokumentiert ist. Das ist App-seitige Konfigurationsprüfung, keine Härtung der Supabase-Datenbank.

## D – Punkte 18 und 17: App-Protokoll und bestehende Senderprüfung

### Lokales Laden

Geplante Startadresse: **`app://bundle/index.html`**, ergänzt um das bestehende Hash-Routing.

- Schema vor `app.whenReady()` mit `standard: true`, `secure: true` registrieren; weitere Privilegien nur bei konkretem Bedarf, `bypassCSP` bleibt aus.
- Nach Ready einen `protocol.handle('app', ...)`-Handler auf der tatsächlich verwendeten Session registrieren. Vorschau ohne Devserver und Windows-Paket verwenden dieselbe Adresse. Der bestehende Vite-Entwicklungsweg bleibt ausdrücklich auf die Entwicklung beschränkt.
- Nur Host `bundle`, GET/HEAD und Dateien aus dem festen Renderer-Buildwurzelverzeichnis bedienen. URL-Pfad kontrolliert dekodieren, auflösen und auf Verbleib im Verzeichnis prüfen; Traversal, absolute Fremdpfade, Windows-Trennzeichen-/Laufwerkstricks und unzulässige Links zurückweisen. Fremde Hosts und fehlende Dateien liefern Fehler. Kein allgemeiner Dateizugriff und kein HTTP-Proxy.
- Lokale JS-/CSS-/Font-Ressourcen mit passenden Antworttypen laden; Hash-Routing erhalten. Bestehende CSP nicht lockern. Laden aus `app.asar` berücksichtigen.

Registrierungszeitpunkt, Sessionbindung und relative Ressourcenauflösung richten sich nach der [Protocol-API](https://www.electronjs.org/docs/latest/api/protocol).

### Navigation, Berechtigungen und IPC

Die gemeinsame URL-Prüfung für Navigation, Berechtigungen und IPC akzeptiert im gebauten Renderer nur Schema `app:`, Host `bundle` ohne Port/Zugangsdaten sowie Dokumentpfad `/index.html`; die bestehenden Hash-Routen bleiben erlaubt. Assetpfade werden vom Protokollhandler bedient, erhalten dadurch aber keine IPC-Berechtigung als Hauptdokument.

`URL.origin` im Node-Code nicht als alleinige Identität verwenden: Bei nicht speziellen Schemas kann es `"null"` liefern. Bezug: [Node-URL-Dokumentation](https://nodejs.org/api/url.html#urlorigin). Die Entwicklung verwendet separat die konkret konfigurierte Devserver-Adresse; sie erweitert die Paketpolicy nicht.

In `createWindowSenderPolicy()`:

1. Registry-/Fensterprüfung beibehalten; unregistrierte bzw. aus der Registry entfernte Fenster ablehnen.
2. `senderFrame` einmal lokal lesen; fehlenden Frame ausdrücklich mit `false` ablehnen.
3. Hauptframeidentität und angepasste erlaubte URL prüfen.
4. Beide bestehenden IPC-Eingänge weiterhin vor fachlicher Verarbeitung an dieselbe Policy binden.

Ein Frame kann nach Navigation/Zerstörung fehlen: [IpcMainInvokeEvent](https://www.electronjs.org/docs/latest/api/structures/ipc-main-invoke-event). Ein kompromittierter erlaubter Hauptframe bleibt erlaubter Sender; Eingabevalidierung und fachliche Berechtigungen bleiben deshalb erforderlich.

**Begrenzte Nachweise:** Start/Assets/Hash-Routing unter `app://`; verbotene Navigation blockiert; wenige Resolver-Negativfälle für Verzeichnisbegrenzung. Optional die empfohlenen kleinen Unit-Tests der echten Senderpolicy ergänzen: erlaubter Hauptframe, fremdes Fenster, Unterframe, falsche Adresse und fehlender Frame; kein Fenster-/Frame-Harness. Bei Verzicht bleibt Nr. 17 ein Codebeleg mit ausdrücklich begrenzter praktischer Nachweistiefe.

**Fertig, wenn:** der gebaute Renderer tatsächlich `app://bundle/index.html` verwendet, fremde Dateiziele nicht bedient werden und legitime Aufrufe beider Bridges weiterhin funktionieren. Die reine Existenz eines neuen Schemas genügt nicht.

## E – Punkt 19: Fuses am lokalen Windows-Paket

Die eingebrachte Auswahl wird im bestehenden electron-builder-Weg umgesetzt. Die installierten Builder-Typen unterstützen bereits `electronFuses`; ein neuer Packaging-Stack ist nicht vorgesehen. Die [Fuse-Dokumentation](https://www.electronjs.org/docs/latest/tutorial/fuses) beschreibt die Optionen.

| Fuse | Geplantes Ziel | Bedingung / Nachweis |
| --- | --- | --- |
| `RunAsNode` | Aus | App-/PowerSync-Pfade auf tatsächlichen Bedarf prüfen; Aufgaben-Smoke nach Änderung |
| `EnableNodeOptionsEnvironmentVariable` | Aus | Keine benötigten externen Node-Startoptionen |
| `EnableNodeCliInspectArguments` | Aus | Kein Main-Debugging über Startargumente im fertigen Demonstrator nötig |
| `GrantFileProtocolExtraPrivileges` | Aus | Erst nach funktionierender Umstellung auf `app://` |
| `OnlyLoadAppFromAsar` | An | App-Code im Paket als ASAR; Preview-Binary nicht damit patchen |
| `EnableEmbeddedAsarIntegrityValidation` | An im Windows-Paket | Korrekte eingebettete Integritätsinformation nachweisen |
| `EnableCookieEncryption` | Unverändert | Kein nachgewiesener Bedarf; keine Aussage zur StudyPlan-SQLite-Verschlüsselung |
| `LoadBrowserProcessSpecificV8Snapshot` | Unverändert | Keine eigene Snapshot-Konfiguration |

Geplante Builder-Felder für die Windows-Buildkopie:

```yaml
asar: true
disableAsarIntegrity: false
electronFuses:
  runAsNode: false
  enableNodeOptionsEnvironmentVariable: false
  enableNodeCliInspectArguments: false
  grantFileProtocolExtraPrivileges: false
  onlyLoadAppFromAsar: true
  enableEmbeddedAsarIntegrityValidation: true
```

Cookie-/Snapshot-Optionen nicht als pauschale zusätzliche Maßnahmen umschalten. Die Entwicklung nutzt die unveränderte npm-Electron-Binary; ausgewerteter Fuse-Nachweis bezieht sich auf die paketierte EXE.

**Kompatibilität:** Die gelesenen PowerSync-Module verwenden `worker_threads`; kein `child_process.fork` im betrachteten Pfad gefunden. `upload-smoke.ts` enthält dagegen `spawn` für einen eigenen Crash-Testprozess. Daraus folgt keine generelle Abwesenheit von Kindprozessen. Den normalen Aufgabenpfad nach Abschalten von RunAsNode prüfen; kein zusätzlicher Crash-/Upload-Audit daraus.

**ASAR-Integrität:** Der Fuse allein genügt nicht. Für Windows eingebettete Resource `Integrity`/`ElectronAsar` und passenden ASAR-Headerhash überprüfen. Der installierte Builder enthält dafür bereits `computeData` und `addWinAsarIntegrity`; ihre tatsächliche Wirkung am neuen Paket muss belegt werden. [Electron ASAR Integrity](https://www.electronjs.org/docs/latest/tutorial/asar-integrity).

Bei fehlender Buildunterstützung diese eng begrenzt korrigieren. Fehlende Metadaten oder fehlgeschlagener Start bleiben ein offener Punkt; nicht durch stilles Abschalten der Integritätsprüfung als erledigt behandeln. Normale native Module/Worker unter den vorhandenen `asarUnpack`-Regeln funktionsfähig halten.

## F – Begrenzte Nachprüfung und Dokumentation

### Automatisierte Prüfungen

Einmal auf dem abschließenden gemeinsamen Stand ausführen; bei Fehlern nur notwendige Wiederholungen:

```powershell
npm run api:test
npm run group-resources:test
npm run study-programs:test
npm run build:unpack -- --win --x64 --publish never
```

`build:unpack` enthält bereits `npm run build` mit API-Check und beiden Typechecks; die weitergereichten Argumente begrenzen den Builder auf Windows x64 und **keine Veröffentlichung**. Zu Beginn die Argumentweitergabe am bestehenden Skript prüfen. Die lokale Buildkopie wird ohne Signierungsauftrag erstellt. Es wird ein Verzeichnisartefakt geprüft, kein Installer installiert. Eventuell ergänzte kleine Security-Unit-Tests mit dem bestehenden `tsx`/`node:test`-Werkzeug ausführen; keine neue Testsuite für die gesamte UI.

### Ein kompakter praktischer Durchgang

1. Tatsächliche Paket-EXE auswählen, Version und SHA-256 festhalten; Fuses mit dem vorhandenen `@electron/fuses`-Read auslesen. EXE und ASAR derselben Buildkopie zuordnen, eingebetteten Headerhash gegen ASAR prüfen.
2. Paket starten: `app://`-Adresse, Assets und Hash-Routing sowie Datenbankinitialisierung beobachten. Die App verwendet paketiert `studyplan.db`, in Preview `studyplan-dev.db`; ein leeres Paketprofil ist deshalb nicht automatisch Datenverlust. Vorhandenen Testzugang nutzen und echte Daten nicht überschreiben.
3. Produktive `.env`-Dateien bleiben laut bestehenden Paketregeln ausgeschlossen. Benötigte vorhandene Testendpunkte/Publishable-Konfiguration über den vorgesehenen Laufzeitweg bereitstellen, etwa Prozessumgebung; keine Zugangsdaten/Secrets ins Paket oder in Belege schreiben. Fehlende Konfiguration nicht als Fuse-/Protokollfehler ausgeben.
4. Nutzer nimmt nötige lokale/Online-Anmeldung und gegebenenfalls DevTools-Einfügefreigabe selbst vor. Start und lokaler DB-Zugriff benötigen keine neue Cloud-Testumgebung.
5. Den in B beschriebenen Fensteröffnungsversuch und einen unerlaubten Navigationsversuch durchführen; beide müssen blockiert bleiben.
6. P1 für beide Bridges und P3 gezielt wiederholen: Electron und Renderer-Adresse haben sich geändert. Erwartete Fehlercodes/CSP-Ereignisse aus dem bestehenden Prüfplan verwenden.
7. Aufgabenfeature mit vorhandener Testgruppe öffnen und einen synthetischen Aufgabeninhalt speichern/erneut anzeigen. Bei einer neuen Aufgabe einen eindeutigen Testtitel verwenden (zum Beispiel den bisherigen HTML-artigen Titel mit datierter BA-P2-Kennung); die DOM-Abfrage muss genau diesen Titel auswählen und darf vorhandene Testaufgaben nicht mitzählen. P2 bestätigt zugleich Textdarstellung unter `app://` und grundlegende Worker-/Datenbankfunktion mit geänderten Fuses. Eine reine Ansicht ohne tatsächlichen Aufgaben-/DB-Zugriff wäre für die Fuse-Kompatibilität unzureichend.
8. Testhilfen entfernen. Die bisherige BA-P2-Aufgabe bleibt entsprechend Nutzerentscheidung erhalten. Neue synthetische Testdaten eindeutig kennzeichnen und ihre Bereinigung bzw. bewusste Beibehaltung dokumentieren; keine vorhandenen Gruppen/Inhalte löschen.

Dies ist die gezielte Nachprüfung der Änderungen, kein neuer Migrationsdurchlauf. Keine zusätzlichen Rollen-/Mehrgeräte-/Synchronisationsmatrizen.

### Ergebnisfortschreibung

Den bestehenden [Ergebnisbericht](electron-security-check-results.md) um einen datierten Nachbesserungsabschnitt und den neuen Prüfstand ergänzen. Alte Belege unter altem Stand erhalten; keine alten P1–P3 rückwirkend dem neuen Paket zuordnen. Matrixpunkte 1, 15, 16, 17, 18 und 19 anhand tatsächlicher Umsetzung/Nachweise aktualisieren; Querverweise zu Navigation, Berechtigungen und CSP berücksichtigen.

Für die BA jeweils festhalten: Auslöser/Befund, Migrationsentscheidung, begrenzte Umsetzung, Nachweis und verbleibende Grenze. „Geplant“ oder „konfiguriert“ wird nicht als „praktisch bestanden“ ausgegeben. Vollständige Einhaltung des vereinbarten Sicherheitsrahmens erst behaupten, wenn die aktualisierte Matrix alle anwendbaren Punkte trägt.

## Abschlusskriterien

- [x] Electron-Zielversion festgehalten, eingebaut und im laufenden Paket bestätigt.
- [x] Externer Öffnungspfad entfernt und Blockierung beobachtet.
- [x] Drei Netzwerk-Konfigurationen vor Nutzung validiert; tatsächliche Redirect-Abdeckung dokumentiert (PowerSync-Grenze siehe Ergebnisbericht).
- [x] Renderer/Assets/Login und angemeldete Gruppen-/Aufgaben-Hashrouten funktionieren unter begrenztem `app://`-Handler.
- [x] Bestehende Senderpolicy lehnt fehlende Frames ab und prüft die neue feste App-Adresse.
- [x] Fuse-Ziele an Paket-EXE bestätigt; ASAR-Headerhash korrekt eingebettet.
- [x] Relevante Tests/Build bestehen; Paketstart, DB-Zugriff und Aufgabenfall funktionieren.
- [x] P1/P3 und ausgewählter Aufgabenfall gezielt nachgeprüft; Hilfen aufgeräumt.
- [x] Ergebnisbericht trennt ursprünglichen Stand, Nachbesserung und verbleibende Grenzen.

Die Abschlusskriterien des begrenzten Plans sind erfüllt. Die dokumentierte PowerSync-Redirectgrenze bleibt bei Punkt 1 bestehen; daraus folgt keine vollständige Erfüllung aller Electron-Empfehlungen. Die Tests, Paket-/Worker- und manuellen Nachweise stehen im Ergebnisbericht.
