# Ergänzende Laufzeitprüfung P1–P3

Datum: 3. Oktober 2026. Fortsetzung der begrenzten Sicherheitsüberprüfung auf ausdrücklichen Nutzerauftrag; kein weiterer Migrations- oder Reproduktionsdurchlauf.

## Prüfstand und Vorbereitung

- Start über `npm run start` / `electron-vite preview`; das vorhandene Skript baut die App erneut. Erster Startversuch durch `spawn EPERM` in der eingeschränkten Umgebung verhindert; erneuter Start mit freigegebenen Prozessrechten erfolgreich.
- Alle in der ersten Bestandsaufnahme erfassten Quellen, Konfigurationen, Lockfile und drei Builddateien stimmen mit den damaligen SHA-256-Werten überein. Beleg: [Hashvergleich](runtime-followup-hashes.json).
- Loginseite über UI-Automation beobachtet. Der Nutzer hat die Anmeldung selbst vorgenommen und bestätigt; anschließend wurde der angemeldete Renderer unter `file:///C:/Users/Joshua/Desktop/Desktop%20App%20prototype/studyplan/out/renderer/index.html#/` beobachtet. Zugangsdaten werden nicht dokumentiert.
- Der Nutzer hat die DevTools-Console selbst geöffnet und die Self-XSS-Einfügesperre manuell freigegeben. Die Bestätigung „Console bereit“ sowie der beobachtete Eintrag `allow pasting` dokumentieren diese Übergabe. CSP und Produktkonfiguration bleiben unverändert.

## Laufzeitfälle

### P1 – Beide vorhandenen Bridges

Aufrufe im `top`-Kontext des gebauten Renderers, mit `console.log` und `JSON.stringify` zur eindeutigen Ausgabe:

```javascript
console.log('BA-P1-API', JSON.stringify(await window.apiTransport.invoke('getEvent', {path:{id:'not-a-number'}})))
console.log('BA-P1-COLLAB', JSON.stringify(await window.collaborationTransport.invoke('createTask', {groupId:'not-a-uuid',title:'BA-Sicherheitsprüfung P1'})))
```

Tatsächlich beobachtete Antworten:

```json
{"ok":false,"error":{"code":"VALIDATION_ERROR","message":"Invalid input for getEvent.","details":[{"code":"invalid_type","path":["path","id"],"message":"Invalid input: expected number, received string"}],"requestId":"68569bf0-4402-4c33-b1f9-236ab3e583df"}}
{"ok":false,"error":{"code":"INVALID","message":"Invalid collaboration input."}}
```

**Bestanden.** [Console-Text](runtime-p1-console.txt), [Screenshot](runtime-p1-console.jpg). Der bestehende Codebeleg zur Reihenfolge `safeParse` vor Handler/Session/Runtime ergänzt die Antwortbeobachtung; keine zusätzliche Instrumentierung der Handler oder Datenbank. Kein Nachweis zur Abwehr fremder IPC-Sender.

### P3 – CSP

Listener und Skriptelement genau nach Plan angelegt. Tatsächliche Meldung:

```text
Loading the script 'https://ba-security.invalid/marker.js' violates the following Content Security Policy directive: "script-src 'self'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback. The action has been blocked.
BA-P3-CSP script-src-elem https://ba-security.invalid/marker.js
```

**Bestanden.** [Console-Text](runtime-p3-console.txt), [Screenshot](runtime-p3-console.jpg). Explizite Richtlinienblockierung und `securitypolicyviolation`, kein bloßer DNS-Fehler.

Danach Skriptelement und Listener entfernt, beide Hilfsvariablen auf `undefined` gesetzt und P2-Marker zurückgesetzt. Die Console meldete für die Kontrollabfrage `BA-P2-BASELINE {"marker":null,"cspTestScripts":0}`; `null` ist hier die ausdrücklich verwendete JSON-Darstellung des fehlenden (`undefined`) Markers.

### P2 – Aufgabeninhalt

Der angemeldete lokale Benutzer reicht für dieses Feature nicht aus: „Gruppen (Sync)“ zeigte die getrennte Anmeldung. Der Nutzer hat sich selbst mit dem vorhandenen Testkonto angemeldet und „Testgruppe bereit“ bestätigt. Verwendet wurde die vorhandene eigene Gruppe „Neue Gruppe“ (`059637d3-ada0-4e04-80fc-49d76731fa62`); keine Gruppe/kein Konto neu eingerichtet.

Den geplanten Titel unverändert über „Aufgabe“ → „Neue Aufgabe“ → „Aufgabe hinzufügen“ gespeichert; Beschreibung, Zuweisung und Datum leer gelassen. Die App bestätigte die lokale Speicherung und stellte die vollständige Zeichenfolge als Text dar. [Erste Darstellung](runtime-p2-task-initial.jpg), [UI-Text](runtime-p2-task-initial.txt).

Die gezielte DOM-Abfrage suchte im aktiven Tabpanel ausschließlich nach einem `p`-Element mit exakt diesem Testtitel. Ergebnis nach dem Speichern und nach Wechsel zu „Termine“ und zurück zu „Aufgaben“ identisch:

```json
{"matches":1,"titleText":"<svg onload=\"document.documentElement.dataset.baSecurityMarker='executed'\">BA-P2</svg>","titleTag":"P","childNodeTypes":[3],"svgInTitle":0,"markerIsUndefined":true}
```

Direkte Marker-Abfrage nach Wiederöffnung: `BA-P2-MARKER undefined`.

**Bestanden.** Node-Typ `3` ist ein Textknoten; kein Elementkind/SVG im Titel. [Erste DOM-Prüfung](runtime-p2-dom-initial.txt), [erneute Darstellung](runtime-p2-task-reopened.jpg), [erneuter UI-Text](runtime-p2-task-reopened.txt), [abschließende Console](runtime-p2-console.txt), [Console-Screenshot](runtime-p2-console.jpg).

Grenze: Wiederöffnung innerhalb derselben App-Sitzung, kein App-Neustart/Datenbank-Neuladen, kein zweiter Nutzer oder zweites Endgerät. Der konkrete Speicher-/Anzeige-/Wiederöffnungsfall wurde geprüft; keine umfassende XSS-Testfamilie.

## Aufräumen

P3-Skript und Listener entfernt (oben dokumentiert). Die Hilfsfunktion `baP2Inspect` auf `undefined` gesetzt und Marker entfernt. [Abschlusskontrolle](runtime-cleanup-console.txt):

```json
{"cspTestScripts":0,"cspListener":"undefined","cspScript":"undefined","p2Helper":"undefined","marker":"undefined"}
```

Der Nutzer entschied auf die konkrete Löschfrage ausdrücklich „Testaufgabe behalten“. Deshalb bleibt ausschließlich die synthetische BA-P2-Aufgabe bestehen; keine Löschung vorgenommen. App und DevTools bleiben zur Einsicht offen. Belege bleiben erhalten.
