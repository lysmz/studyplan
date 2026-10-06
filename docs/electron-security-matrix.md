# Electron-Sicherheit: konsolidierte Ergebnismatrix für die Bachelorarbeit

Dokumentationsstand: **6. Oktober 2026**, Europe/Berlin. Technischer Prüfstand: paketierter Windows-Demonstrator vom **4. Oktober 2026**, nach den Nachbesserungen. Diese Matrix führt die ursprüngliche Prüfung und die Nachprüfung zusammen; die historischen Berichte und Belege bleiben erhalten.

## Bewertungsrahmen und Prüfgegenstand

„Sicherheit“ und „Härtung“ beziehen sich in dieser Arbeit auf die Electron Security Guidelines sowie die vereinbarte Eingabevalidierung und den Schutz gegen fremden Code. Referenz sind die [20 Empfehlungen der Electron-Checkliste](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations), am 6. Oktober erneut abgeglichen. Defaults werden anhand der [WebPreferences von Electron 44.5.1](https://raw.githubusercontent.com/electron/electron/v44.5.1/docs/api/structures/web-preferences.md) eingeordnet.

Geprüft wurde die lokale Windows-Buildkopie mit Electron **44.5.1** und Rendereradresse `app://bundle/index.html`. Die [offizielle Release-Übersicht](https://releases.electronjs.org/) führte 44.5.1 beim Abruf am 6. Oktober weiterhin als neueste veröffentlichte Stable-Version; 44.6.0 befand sich im Build. Diese Aktualitätsbewertung ist zeitpunktbezogen.

Die Produktänderungen sind durch Commit `fc25822fc812f33902ea94837b958f5609c97e5e` und Tag `post-security-check` gebunden; Merge nach `master`: `99208c2a17686dbffc8b41d12a92e2a9cf6d2b23`. [Paketidentität und Fuses](security-check/evidence/remediation/package-check.json) sowie [Dateihashes](security-check/evidence/remediation/file-hashes.json) identifizieren die tatsächlich getesteten Dateien. Der Tag kennzeichnet den Security-Stand vor dem Merge, keine allgemeine Sicherheitszertifizierung.

**Bewertungsregel:** „Erfüllt“ gilt auf der angegebenen Nachweisebene. Codeinspektion, Unit-Test, Paketinspektion und beobachtete Laufzeitwirkung werden unterschieden. Ein bestandener ausgewählter Laufzeitfall belegt keine vollständige Testabdeckung. „Begründet nicht anwendbar“ setzt voraus, dass die betreffende Funktion im Demonstrator fehlt.

**Festlegung zu Punkt 1 vom 6. Oktober:** Der Nutzer bewertet die geprüfte HTTPS-Konfiguration und das an Katalog und Supabase nachgewiesene Absicherungsmuster als ausreichend für den begrenzten BA-Prüfumfang. Eine eigene Prüfung oder Neuentwicklung des SDK-internen PowerSync-Transports wird nicht als zusätzliche Abschlussaufgabe angesetzt. Deshalb lautet die Bewertung dort „Erfüllt im BA-Prüfumfang“ mit ausdrücklich begrenztem Nachweis. Daraus wird weder eine getestete PowerSync-Redirectsperre noch eine zusätzliche Zustimmung des Betreuers abgeleitet.

## Ergebnismatrix

| Nr. | Empfehlung | Umsetzung und Beleg | Bewertung | Nachweisebene und Grenze |
| --- | --- | --- | --- | --- |
| 1 | Externe Ressourcen über sichere Protokolle laden | Rendererassets lokal. Katalog-, Supabase- und PowerSync-Startadressen werden vor Nutzung auf HTTPS und fehlende URL-Zugangsdaten geprüft. Katalog/Supabase verweigern Redirects. [E1](#e1--netzwerk-konfiguration-und-absicherungsmuster). | **Erfüllt im BA-Prüfumfang** | Konfigurations-/Codeprüfung, negative Unit-Tests und tatsächlicher Fetch-Redirecttest; HTTPS-Sync im Aufgabenfall funktionsfähig. SDK-interne PowerSync-Redirectbehandlung nicht praktisch geprüft; der Nachweis an den anderen Transporten wird nicht als PowerSync-Test ausgegeben. |
| 2 | Node-Zugriff aus dem Renderer ausschalten | `nodeIntegration: false` im einzigen App-Fenster, [Fensterkonfiguration](../src/main/index.ts). | Erfüllt | Codeinspektion; keine zusätzliche Laufzeit-Abfrage der WebPreferences. |
| 3 | Renderer und Preload isolieren | `contextIsolation: true`; Preload verwendet `contextBridge`, [Preload](../src/preload/index.ts). | Erfüllt | Codeinspektion. |
| 4 | Renderer-Sandbox aktivieren | `sandbox: true`; kein Sandbox-Abschalter in den geprüften App-/Startpfaden. [Fensterkonfiguration](../src/main/index.ts). | Erfüllt | Code-/Startpfadprüfung; keine eigenständige OS-Sandbox-Analyse. |
| 5 | Berechtigungsanfragen kontrollieren | Check- und Request-Handler auf der verwendeten Session. Nur bereinigtes Clipboard-Schreiben aus dem erlaubten App-Fenster und Dokument zugelassen. [Handler](../src/main/index.ts). | Erfüllt | Codeinspektion; keine gesonderte Berechtigungsdialog-Testreihe. |
| 6 | Web-Sicherheitsmechanismen beibehalten | `webSecurity` nicht deaktiviert; Default in 44.5.1 ist `true`. | Erfüllt | Codeinspektion und versionsbezogene Default-Referenz. |
| 7 | Ressourcen durch eine restriktive CSP begrenzen | `default-src 'none'`, `script-src 'self'`, `object-src 'none'`, `frame-src 'none'`; [CSP](../src/renderer/index.html). P3 blockiert eine fremde Skriptquelle. [E2](#e2--gezielte-laufzeitprüfung-p1p3). | Erfüllt | Code und beobachtetes CSP-Ereignis. Inline-Styles bleiben erlaubt; keine allgemeine XSS-Freiheit behauptet. |
| 8 | Unsichere nachgeladene Inhalte nicht freigeben | `allowRunningInsecureContent` nicht aktiviert; Default in 44.5.1 ist `false`. | Erfüllt | Codeinspektion und versionsbezogene Default-Referenz. |
| 9 | Experimentelle Chromium-Funktionen ausgeschaltet lassen | Kein entsprechender App-Override; `experimentalFeatures` hat Default `false`. | Erfüllt | Code-/Startpfadprüfung und versionsbezogene Default-Referenz. |
| 10 | Keine zusätzlichen Blink-Funktionen aktivieren | Kein `enableBlinkFeatures` oder entsprechender App-Startswitch im geprüften Pfad. | Erfüllt | Code-/Startpfadprüfung. |
| 11 | Popups aus Webviews verhindern | Keine Webview-Nutzung; `webviewTag` nicht aktiviert, Default `false`. | Begründet nicht anwendbar | Quellcodesuche und versionsbezogene Default-Referenz. |
| 12 | Webview-Erzeugung und Optionen prüfen | Im Demonstrator werden keine Webviews erzeugt; gleiche Grundlage wie Nr. 11. | Begründet nicht anwendbar | Quellcodesuche; kein zusätzlicher Webview-Harness erforderlich. |
| 13 | Navigation auf erlaubte App-Ziele begrenzen | `will-navigate` und [Dokumentpolicy](../src/main/security/renderer-url.ts): festes Schema, Host und Dokument; Hash-Routen erlaubt. Fremdes Navigationsziel im Paket blockiert. [E3](#e3--navigation-fenster-und-lokales-protokoll). | Erfüllt | Code, Policy-Tests und ausgewählter Laufzeitversuch. |
| 14 | Zusätzliche Fenster begrenzen | `setWindowOpenHandler` lehnt neue Fenster ab; `window.open` liefert im Paket `null`. [E3](#e3--navigation-fenster-und-lokales-protokoll). | Erfüllt | Code und Fensterbeobachtung beim ausgewählten Versuch. |
| 15 | Fremde Inhalte nicht über die Betriebssystem-Shell öffnen | `shell.openExternal` entfernt. Beim Öffnungsversuch kein neues App-Fenster und kein beobachtetes Systembrowseröffnen. [E3](#e3--navigation-fenster-und-lokales-protokoll). | Erfüllt | Codeinspektion und Laufzeitbeobachtung. |
| 16 | Eine aktuelle Electron-Version einsetzen | Exakt 44.5.1 in Package/Lockfile; Build, native Laufzeit und Paket-User-Agent bestätigen die Version. [E4](#e4--version-build-und-native-kompatibilität). | Erfüllt | Paket-/Laufzeitbeleg; Aktualität am 6. Oktober bestätigt. Keine dauerhafte Aussage über spätere Releases. |
| 17 | Absender sämtlicher IPC-Eingänge prüfen | Beide Bridges nutzen dieselbe [Senderpolicy](../src/main/ipc/sender-policy.ts): registriertes Fensterobjekt, vorhandener Hauptframe und erlaubte Dokumentadresse. Sechs Senderfälle geprüft. [E5](#e5--ipc-sender-und-eingabevalidierung). | Erfüllt | Code und Unit-Tests der tatsächlichen Policy; kein zusätzlicher Fenster-/Frame-Harness. Ein kompromittierter erlaubter Hauptframe bleibt erlaubter Sender. |
| 18 | Lokale Inhalte über ein begrenztes eigenes Protokoll laden | `app://bundle/index.html`, [Handler](../src/main/security/app-protocol.ts) mit fester Rendererwurzel, GET/HEAD, Pfad-/Realpathprüfung und passenden Inhaltstypen. Kein `bypassCSP`. [E3](#e3--navigation-fenster-und-lokales-protokoll). | Erfüllt | Handler-/Pfadtests einschließlich Junction-Ausbruch; Assets, Login, Gruppenroute und Aufgaben im tatsächlichen Paket funktionsfähig. |
| 19 | Benötigte Fuse-Optionen bewusst auswählen | Vier unbenötigte Zusatzmodi aus; Laden aus ASAR und eingebettete Integritätsprüfung an. Cookie-/Snapshot-Fuses nach Bedarfsprüfung unverändert. [E6](#e6--fuses-und-asar-integrität). | Erfüllt | Werte an der tatsächlichen EXE ausgelesen, ASAR-Headerhash verglichen, Paket-/DB-/Worker-/Aufgabenfunktion geprüft. Keine Signierungs- oder Distributionsbewertung. |
| 20 | Electron-/IPC-Rohschnittstellen nicht exponieren | [Preload](../src/preload/index.ts) bietet nur die zwei fachlichen Invoke-Bridges auf festen Kanälen; keine Rohobjekte, frei wählbaren IPC-Kanäle oder Eventobjekte. Eingaben im Main validiert. [E5](#e5--ipc-sender-und-eingabevalidierung). | Erfüllt | Codeinspektion; P1 ergänzt den Nachweis für zwei ausgewählte ungültige Eingaben, keine vollständige Operationsmatrix. |

**Ergebnis:** 17 Empfehlungen sind auf der jeweils angegebenen Nachweisebene erfüllt, Punkt 1 ist im ausdrücklich begrenzten BA-Prüfumfang erfüllt, zwei Webview-Empfehlungen sind begründet nicht anwendbar. Innerhalb dieser festgelegten Bewertung verbleibt keine zusätzliche Security-Umsetzungsaufgabe. Die SDK-interne PowerSync-Redirectbehandlung bleibt eine dokumentierte Nachweisgrenze.

## Belegübersicht

### E1 – Netzwerk-Konfiguration und Absicherungsmuster

[HTTPS-Hilfe](../src/main/security/network.ts), [Sync-Konfiguration](../src/main/collaboration/remote-config.ts), [Connector](../src/main/collaboration/connector.ts) und [Katalogservice](../src/main/services/study-programs.service.ts). Die [Security-Suite](security-check/evidence/remediation/security-test.txt) prüft unsichere Adressen, Ablehnung vor Transport und die Redirectverweigerung des tatsächlich verwendeten Node-Fetch-Verhaltens. Die [Katalogsuite](security-check/evidence/remediation/study-programs-test.txt) bestätigt den bestehenden Import einschließlich Fehlerfällen. Die transportbezogenen Einschränkungen erläutert der [Nachbesserungsbericht](electron-security-remediation-results.md).

### E2 – Gezielte Laufzeitprüfung P1–P3

[Finale P1-/P3-Console](security-check/evidence/remediation/runtime-final-negative.txt): ungültige API- und Kollaborationseingaben abgelehnt, fremdes Skript durch CSP blockiert. [P2-DOM-/DB-/Sync-Beleg](security-check/evidence/remediation/runtime-final-p2-dom-reopened.txt) und [Aufgabenansicht](security-check/evidence/remediation/runtime-final-p2-reopened.jpg): datierter HTML-artiger Titel nach Speichern und Wiederöffnen als Textknoten, kein SVG-Element, kein Ausführungsmarker; Sync verbunden und null ausstehende Uploads zum Prüfzeitpunkt. Die Testaufgaben bleiben erhalten; temporäre Prüfhilfen wurden entfernt.

### E3 – Navigation, Fenster und lokales Protokoll

[Finale Console](security-check/evidence/remediation/runtime-final-negative.txt) dokumentiert tatsächliche App-Adresse, Renderer-Skript, blockierte Navigation und `window.open`-Ergebnis. [Security-Suite](security-check/evidence/remediation/security-test.txt) enthält Dokumentpolicy-, Pfad- und Handlerfälle einschließlich Verzeichnisbegrenzung und Junction-Ausbruch. Der Aufgabenbeleg E2 bestätigt den angemeldeten Betrieb unter dem neuen Protokoll.

### E4 – Version, Build und native Kompatibilität

[Umgebung](security-check/evidence/remediation/environment-final.json), [finaler Windows-Paketbuild](security-check/evidence/remediation/build-unpack-final.txt), [native SQLite-/libSQL-Prüfung](security-check/evidence/remediation/native-check.txt) und [Paket-Worker-Smoke](security-check/evidence/remediation/powersync-package-smoke.json). Insgesamt 53 erfolgreiche Tests in Security-, API-, Gruppenressourcen-, Katalog- und Kollaborations-Service-/Upload-Suiten; zusätzlich drei erfolgreiche Fälle des vorhandenen isolierten Paket-Smoke-Tests. Am 6. Oktober wurden für diese Dokumentationskonsolidierung keine Tests erneut ausgeführt und kein Paket neu gebaut.

### E5 – IPC-Sender und Eingabevalidierung

[Security-Suite](security-check/evidence/remediation/security-test.txt): erlaubter Hauptframe akzeptiert; fremdes Fenster, Unterframe, fehlender Frame, falsche Adresse und zerstörtes Fenster abgelehnt. Gemeinsame Policy an [API-Dispatcher](../src/main/ipc/api-dispatcher.ts) und [Kollaborationsbridge](../src/main/collaboration/ipc.ts) gebunden. E2 belegt die ausgewählten negativen Aufrufe durch beide echten Renderer-Bridges. Fachliche Eingabevalidierung und Berechtigungen bleiben neben der Senderprüfung notwendig.

### E6 – Fuses und ASAR-Integrität

[Builder-Konfiguration](../electron-builder.yml) und [Paketcheck](security-check/evidence/remediation/package-check.json): `RunAsNode`, `EnableNodeOptionsEnvironmentVariable`, `EnableNodeCliInspectArguments` und `GrantFileProtocolExtraPrivileges` aus; `OnlyLoadAppFromAsar` und `EnableEmbeddedAsarIntegrityValidation` an. Im JSON stehen 48/49 für die ausgelesenen ASCII-Zustände aus/an. Integritätsresource und tatsächlicher ASAR-Headerhash stimmen überein. Native Funktion belegen E4 und der gespeicherte Aufgabenfall E2.

## Aussage für die Bachelorarbeit

Der Demonstrator wurde anhand der 20 Electron-Sicherheitsempfehlungen bewertet und bei festgestellten Abweichungen gezielt nachgebessert. Die anwendbaren Empfehlungen gelten im festgelegten BA-Prüfumfang und auf den ausgewiesenen Nachweisebenen als erfüllt. Eingabevalidierung, Textdarstellung und CSP-Wirkung wurden zusätzlich durch ausgewählte Negativfälle geprüft. Bei der PowerSync-Verbindung wird der Nachweis auf die geprüfte HTTPS-Konfiguration und das an den direkt kontrollierten Transporten belegte Absicherungsmuster begrenzt; SDK-interne Redirects sind nicht umfassend untersucht.

Diese Aussage beschreibt die Härtung im vereinbarten BA-Kontext. Sie bestätigt keine uneingeschränkte Sicherheitsgarantie oder vollständige Prüfung aller SDK-/Netzwerkpfade. Die später protokollierten PowerSync-Verbindungsabbrüche bleiben als Stabilitätsbefund im [Nachbesserungsbericht](electron-security-remediation-results.md) dokumentiert. SQLite-Verschlüsselung, Supabase-Datenbankhärtung, Signierung, Veröffentlichung, Mehrgeräteprüfung, neue E2E-Infrastruktur und ein weiterer Migrations-/Reproduktionsdurchlauf bleiben außerhalb des vereinbarten Umfangs.

Historischer Ablauf: [Prüfung vom 3. Oktober](electron-security-check-results.md), [Nachbesserung und Nachprüfung vom 4. Oktober](electron-security-remediation-results.md). Deren damalige Bewertungen werden nicht rückwirkend verändert; für die aktuelle BA-Bewertung gilt diese konsolidierte Matrix einschließlich der Scope-Festlegung vom 6. Oktober.
