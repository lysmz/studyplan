# Umsetzungsplan: Electron-Sicherheitsüberprüfung für die Bachelorarbeit

Stand: 3. Oktober 2026. Der reduzierte Scope wurde im Chat akzeptiert. Dieser Plan konkretisiert seine Durchführung. Prüfungen, Builds und Tests wurden bei der Planerstellung noch nicht ausgeführt. Inzwischen dokumentiert der [Ergebnisbericht](electron-security-check-results.md) den Richtlinienabgleich, die vorhandenen Testläufe und die bestandenen Laufzeitfälle P1–P3; die vollständige Sicherheitsanforderung bleibt aufgrund der festgestellten Abweichungen unerfüllt.

## Ziel und feste Grenzen

Sicherheit wird als Anforderung der Migration bewertet: „gehärtet“ bezeichnet im vereinbarten Kontext die Einhaltung der Electron Security Guidelines einschließlich Eingabevalidierung und Schutzmaßnahmen gegen fremden Code.

Der Umfang besteht aus einem vollständigen Richtlinienabgleich, passenden vorhandenen Tests und drei begrenzten manuellen Prüffällen. Ergebnis ist ein nachvollziehbarer Sicherheitsnachweis zum vorhandenen Demonstrator. Die Migration bleibt das Hauptthema der Arbeit.

Ausgeschlossen bleiben: umfassender Penetrationstest, neue Testharnesses oder E2E-Automatisierung, absichtlich verwundbare Laborvarianten, umfassende Rollen-/Session-Wechsel-Matrizen, Cloud-Sicherheitsaudit bzw. eigenes Cloud-Testdeployment, Distributions- und Signierungsaudit, umfassende Exfiltrations- und Parserprüfungen, SQLite-Verschlüsselung und Härtung der Supabase-Datenbank. Ein weiterer Migrations- oder Reproduktionsdurchlauf findet nicht statt.

Referenz ist die [Electron-Sicherheitscheckliste](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations), eingesehen am 3. Oktober 2026. Bei Durchführung wird die verwendete Fassung festgehalten.

## Ergebnisartefakt

Bei Beginn der Durchführung wird **eine Ergebnisdatei** angelegt: `docs/electron-security-check-results.md`. Sie enthält:

1. geprüften Stand und Startweise;
2. Richtlinienmatrix;
3. Ergebnisse der wiederverwendeten Tests;
4. Protokolle P1–P3;
5. kurze Zusammenfassung der Abweichungen und Grenzen.

Testausgaben und wenige gezielte Screenshots werden bei Bedarf unter `docs/security-check/evidence/` abgelegt und aus der Ergebnisdatei verlinkt. Keine zusätzliche Auditdatenbank oder umfangreiches Befundregister.

## Arbeitspaket 1: Prüfstand festhalten

- Datum, Betriebssystem, Commit sowie sicherheitsrelevante uncommittete Änderungen notieren. Ein Commit allein beschreibt einen veränderten Arbeitsstand nicht vollständig.
- Tatsächlich aufgelöste Electron-Version aus Lockfile und verwendetem Laufzeitstand dokumentieren; Versionsangaben des früheren Plans nicht ungeprüft übernehmen.
- Ausgangszustand und Startkommando festhalten. Für die praktischen Fälle den gebauten Renderer ohne Vite-Devserver/HMR verwenden.
- Nur eine eindeutig bezeichnete Testgruppe und eine Testaufgabe mit synthetischen Daten verwenden. Für P2 genügt ein bereits eingerichteter Testzugang zum Gruppenfeature „Aufgaben“. Es werden weder weitere Konten noch ein neues Cloud-Deployment für diesen Sicherheitsnachweis aufgebaut.
- Für P1 ist kein funktionierender Cloud-Zugang nötig: Die gewählten Eingaben müssen bereits vor dem fachlichen Handler und vor Cloud-Operationen scheitern.

**Ergebnis:** Der geprüfte Stand und der Demonstrationsaufbau sind in der Ergebnisdatei identifizierbar. Reale Inhalte oder Zugangsdaten werden nicht in Belegen veröffentlicht.

## Arbeitspaket 2: Richtlinien anhand des Codes prüfen

### Konkrete Einstiegspunkte

| Gegenstand | Datei / Stelle |
| --- | --- |
| Fensterkonfiguration, lokale Renderer-URL, Berechtigungen, Navigation, externe Links | `src/main/index.ts`, insbesondere `createWindow()` |
| Exponierte Bridges | `src/preload/index.ts`: `apiTransport` und `collaborationTransport` |
| API-Senderprüfung, Operationsauswahl und Ein-/Ausgabevalidierung | `src/main/ipc/api-dispatcher.ts` |
| Zweiter IPC-Einstiegspunkt und dessen Eingabeschemas | `src/main/collaboration/ipc.ts` |
| Generierte API-Schemas | `src/shared/api/generated/contract.generated.ts` |
| CSP | `src/renderer/index.html` und das tatsächlich gebaute HTML |
| Darstellung von Aufgabeninhalten | `src/renderer/src/pages/gruppen-sync.tsx`, `TaskItem` |
| Build-Einstellungen und Versionen | `electron-builder.yml`, `electron.vite.config.ts`, `package.json`, `package-lock.json` |

Die Planerstellung hat diese Einstiegspunkte identifiziert. Das ist noch keine abgeschlossene Konformitätsbewertung.

### Vorgehen

1. Die Referenzfassung der Checkliste festhalten.
2. Jeden Punkt in der folgenden Matrix prüfen und passende Code-/Konfigurationsbelege ergänzen.
3. Bei Defaults deren Geltung für die verwendete Electron-Version nachvollziehen; fehlende explizite Konfiguration nicht automatisch als Fehler oder Erfüllung behandeln.
4. Beide vorhandenen IPC-Registrierungen einschließlich gemeinsam verwendeter Senderpolicy betrachten. Keine vollständige Berechtigungs-Testmatrix für jede Geschäftsoperation erstellen.
5. Bei buildabhängigen Aussagen nur das dafür relevante Build-Ergebnis gezielt betrachten. Daraus wird keine allgemeine Paket- oder Binäranalyse.

| Nr. | Kurzbezeichnung der Richtlinie | Primärer Prüfbereich | Anfangsstatus |
| --- | --- | --- | --- |
| 1 | Sichere Ressourcen | Renderer-Ressourcen und Electron-seitige Netzwerkziele | Nicht geprüft |
| 2 | Node-Integration | Fensterkonfiguration | Nicht geprüft |
| 3 | Context Isolation | Fenster und Preload | Nicht geprüft |
| 4 | Sandbox | Fensterkonfiguration | Nicht geprüft |
| 5 | Berechtigungen | Session-Handler | Nicht geprüft |
| 6 | Web Security | Einstellungen und Startweise | Nicht geprüft |
| 7 | CSP | Gebautes HTML; ergänzend P3 | Nicht geprüft |
| 8 | Unsichere Inhalte | Einstellungen und Ressourcen | Nicht geprüft |
| 9 | Experimentelle Features | Einstellungen und Startweise | Nicht geprüft |
| 10 | Blink-Features | Einstellungen und Startweise | Nicht geprüft |
| 11 | Webview-Popups | Tatsächlich verfügbare Webview-Oberfläche | Nicht geprüft |
| 12 | Webview-Parameter | Webview-Verfügbarkeit und gegebenenfalls Erzeugung | Nicht geprüft |
| 13 | Navigation | `will-navigate` und URL-Prüfung | Nicht geprüft |
| 14 | Neue Fenster | `setWindowOpenHandler` und weitere Fenstererzeugung | Nicht geprüft |
| 15 | Externes Öffnen | `isSafeExternalUrl` und `shell.openExternal` | Nicht geprüft |
| 16 | Electron-Version | Tatsächliche Version und offizielle Versionsinformationen am Prüftag | Nicht geprüft |
| 17 | IPC-Sender | Beide IPC-Einstiegspunkte und gemeinsame Senderpolicy | Nicht geprüft |
| 18 | App-Protokoll | Lokales Laden und mögliche Protokollregistrierung | Nicht geprüft |
| 19 | Fuses | Für die App relevante Optionen und Build-Verarbeitung | Nicht geprüft |
| 20 | Exponierte Electron-APIs | Beide Preload-Bridges | Nicht geprüft |

In der Ergebnisdatei erhält jede Zeile zusätzlich **Anwendbarkeit, Umsetzung/Beleg, Bewertung und Nachweisart**. Bewertungen: „erfüllt“, „teilweise erfüllt“, „nicht erfüllt“, „nicht geprüft“ oder „begründet nicht anwendbar“. Statische Nachweise werden von Laufzeitbeobachtungen und Tests unterschieden.

**Bereits sichtbarer Klärpunkt für die Durchführung:** Der gelesene Main-Code lädt den lokalen Renderer über `file://`. In den betrachteten Quell- und Build-Dateien wurden keine Custom-Protocol- oder Fuse-Konfigurationen gefunden. Deshalb bleiben diese Punkte ausdrücklich zur Bewertung offen. Sie werden weder wegen des BA-Umfangs gestrichen noch vorab als erfüllt markiert. Bei Fuses ist die Prüfung relevanter Änderungsmöglichkeiten von einer pauschalen Pflicht zu allen möglichen Einstellungen zu unterscheiden.

**Ergebnis:** Eine vollständige Matrix mit klar begrenzter Nachweistiefe und sichtbaren offenen Punkten.

## Arbeitspaket 3: Passende vorhandene Tests wiederverwenden

Im Projektverzeichnis ausführen und Ergebnis/Exitcode dokumentieren:

```powershell
npm run api:test
```

Relevant ist insbesondere `malformed IPC input is rejected at runtime` in `scripts/openapi-ipc/generator.test.ts`. Dieser vorhandene Test prüft ungültige Eingaben, die ausbleibende Handlerausführung und die Ablehnung einer unbekannten Operation. Seine Senderpolicy ist jedoch auf `isSenderAllowed: () => true` gesetzt; er belegt deshalb keine tatsächliche Electron-Senderprüfung.

Als ergänzender vorhandener Service-Nachweis für Gruppenaufgaben:

```powershell
npm run group-resources:test
```

Nur die für diese Sicherheitsüberprüfung relevanten Fälle kurz einordnen. Ein bestandener Testlauf wird nicht pauschal auf alle Funktionen oder auf die separate Kollaborationsbridge übertragen. Frontend-Tests, Cloud-Smokes und neue Testautomatisierung werden für diesen Plan nicht aufgenommen.

**Ergebnis:** Testkommando, geprüfter Stand, tatsächliches Ergebnis und konkreter Beitrag zum Nachweis sind festgehalten. Ein Fehlschlag wird untersucht und dokumentiert; er ist kein bestandener Nachweis.

## Arbeitspaket 4: Gebauten Demonstrator starten

Bestehende Skripte verwenden:

```powershell
npm run build
npm run start
```

Die Kommandos werden nacheinander ausgeführt. `build` beinhaltet bereits API-Check und Typecheck. Keine zusätzliche Wiederholung derselben Checks ohne Anlass.

Vor den manuellen Fällen prüfen und notieren:

- Der Renderer stammt aus dem Build und wird lokal geladen; es läuft kein HMR-Renderer.
- Die erwartete CSP steht im gebauten HTML.
- DevTools sind für die Beobachtung zugänglich. Dafür zuerst die vorhandene Electron-Menüfunktion bzw. den vorhandenen Zugang nutzen. Sollte eine vorübergehende lokale Debugöffnung erforderlich sein, bleibt sie auf das Öffnen der DevTools beschränkt; Sicherheitsoptionen, Senderprüfung und CSP werden nicht gelockert. Diese Hilfe wird dokumentiert.

Das untersuchte Artefakt ist der so gestartete gebaute Demonstrator. Es wird keine Prüfung eines signierten Installers behauptet.

## Arbeitspaket 5: Die drei manuellen Fälle durchführen

### P1 – Ungültige Eingaben an den vorhandenen IPC-Bridges

**Ziel:** Nachweisen, dass ungültige Eingaben im Main-Prozess zurückgewiesen werden und nicht nur von der Oberfläche abgefangen werden.

Im Renderer-DevTools-Kontext zwei kleine Teilprüfungen ausführen:

```javascript
await window.apiTransport.invoke('getEvent', {
  path: { id: 'not-a-number' }
})
```

Erwartung: `ok: false`, Fehlercode `VALIDATION_ERROR`.

```javascript
await window.collaborationTransport.invoke('createTask', {
  groupId: 'not-a-uuid',
  title: 'BA-Sicherheitsprüfung P1'
})
```

Erwartung: `ok: false`, Fehlercode `INVALID`; keine Testaufgabe wird angelegt. Der Codepfad muss die Eingabe vor Session-/Cloud-Verarbeitung zurückweisen.

**Beleg:** Tatsächliche Antworten und Codeverweise auf die Reihenfolge von Validierung und Handlerausführung; ergänzend der vorhandene Handler-Negativtest aus Arbeitspaket 3. Keine neue Instrumentierung allein zur Messung sämtlicher Handler.

**Grenze:** Aufrufe aus dem legitimen Renderer belegen Eingabevalidierung, keine Abwehr fremder Fenster oder kompromittierter legitimer UI-Codepfade. Senderprüfung wird in Arbeitspaket 2 gesondert nachvollzogen.

### P2 – HTML-artige Aufgabeninhalte bleiben Text

**Ziel:** Die sichere Darstellung eines nicht vertrauenswürdigen Inhalts im eingeschlossenen Aufgabenfeature demonstrieren.

1. Im bereits eingerichteten Gruppenfeature „Aufgaben“ eine ausschließlich dafür bestimmte Testaufgabe anlegen.
2. Im Renderer-Kontext zunächst einen eventuell vorhandenen Testmarker entfernen:

```javascript
delete document.documentElement.dataset.baSecurityMarker
```

3. Folgenden Text als Aufgabentitel eingeben:

```text
<svg onload="document.documentElement.dataset.baSecurityMarker='executed'">BA-P2</svg>
```

4. Aufgabe speichern, anzeigen und anschließend die Aufgabenansicht erneut öffnen; bei einem App-Neustart denselben Testzugang verwenden.
5. Beobachten: Die Zeichenfolge wird als Text dargestellt. Aus ihr entsteht im Titelbereich kein SVG-Element. Der folgende Ausdruck liefert `undefined`:

```javascript
document.documentElement.dataset.baSecurityMarker
```

**Beleg:** Screenshot des dargestellten Titels, DOM-Beobachtung im betroffenen Titelbereich, Marker-Ergebnis und Verweis auf `TaskItem` in `gruppen-sync.tsx`.

**Grenze:** Die fehlende Markerausführung allein genügt nicht; auch die Darstellung als Text wird geprüft. Es wird ein konkreter Inhaltsfall untersucht, keine vollständige XSS-Testfamilie. Zweiter Nutzer, Mehrgeräte-Synchronisierung und manipulierte Datenbankdateien sind für diesen Fall nicht erforderlich.

### P3 – CSP blockiert eine nicht zugelassene Skriptquelle

**Ziel:** Einen konkreten Laufzeitnachweis zur CSP des gebauten Renderers erheben.

In den DevTools einen Beobachter registrieren und ein Skriptelement mit einer nicht zugelassenen Quelle erzeugen:

```javascript
var baCspListener = (event) => {
  console.log('BA-P3-CSP', event.effectiveDirective, event.blockedURI)
}
document.addEventListener('securitypolicyviolation', baCspListener)
var baCspScript = document.createElement('script')
baCspScript.src = 'https://ba-security.invalid/marker.js'
document.head.appendChild(baCspScript)
```

**Erwartung:** Eine CSP-Verletzung für die Skriptquelle wird gemeldet; das Laden wird durch die Richtlinie blockiert. Ein bloßer DNS- oder Netzwerkfehler erfüllt das Prüfkriterium nicht. Es ist kein externer Testserver notwendig.

**Beleg:** CSP-Verletzungsereignis bzw. eindeutige CSP-Konsolenmeldung mit blockierter URL und passender Direktive; zusätzlich die verwendete CSP aus dem gebauten HTML.

Anschließend die Testhilfe entfernen:

```javascript
baCspScript.remove()
document.removeEventListener('securitypolicyviolation', baCspListener)
```

**Grenze:** DevTools dienen hier zum Anstoßen und Beobachten eines Ressourcenladeversuchs. Ihre eigene Codeausführung beweist weder eine erreichbare XSS-Lücke noch die Zulässigkeit injizierter Inline-Skripte. Andere Abflusswege werden durch diesen Fall nicht bewertet.

## Arbeitspaket 6: Ergebnisse bewerten und in die BA übertragen

Für P1–P3 jeweils ausfüllen:

| Feld | Einzutragender Inhalt |
| --- | --- |
| Prüfziel | Welcher konkrete Mechanismus wird geprüft? |
| Stand | Bezug auf Prüfstand aus Arbeitspaket 1 |
| Handlung/Eingabe | Tatsächlich durchgeführter Ablauf |
| Erwartung | Erfolgskriterium aus diesem Plan |
| Ergebnis | Tatsächliche Beobachtung; anfangs „nicht durchgeführt“ |
| Beleg | Testausgabe, Screenshot, Konsole und/oder Codeverweis |
| Bewertung | Erfüllt / nicht erfüllt / nicht abschließend geprüft |

Danach eine kurze Zusammenfassung verfassen:

- Welche anwendbaren Richtlinien sind mit welchen Nachweisen erfüllt?
- Welche Abweichungen oder fehlenden Nachweise bleiben?
- Was zeigen die drei praktischen Fälle, und welche Aussagen tragen sie nicht?

Bei einer relevanten Korrektur den betroffenen Matrixeintrag und den zugehörigen Prüffall aktualisieren und diesen Fall gezielt wiederholen. Der gesamte Ablauf wird nicht ohne Grund erneut ausgeführt. Neue Funktionen oder umfassende Tests werden daraus nicht automatisch abgeleitet.

Die Bewertung des erreichten Ergebnisses wird von der Vollständigkeit der Prüfung getrennt: Eine fertig ausgefüllte Matrix bedeutet nicht automatisch, dass alle Richtlinien erfüllt sind. Vollständige Härtung im vereinbarten Sinn wird nur behauptet, wenn die Bewertung aller anwendbaren Punkte dies trägt.

### Zuordnung zu den Kapiteln

| Kapitel | Inhalt |
| --- | --- |
| 3 – Methodik | Kurze Beschreibung des Richtlinienabgleichs, Auswahl der drei Fälle und Belegformen |
| 4 – Anforderungen | Festgelegter Sicherheitsbegriff und Scope-Grenzen |
| 5 – Migration | Tatsächlich umgesetzte Härtungsmaßnahmen als Teil der Migrationsentscheidungen |
| 6 – Evaluation | Kompakte Ergebnistabelle und Einordnung von P1–P3 |
| 7 – Diskussion | Abweichungen, Grenzen der Nachweistiefe und Einzelfallbezug |
| Anhang | Vollständige Matrix, Testausgaben und die kurzen Prüfprotokolle |

### Methodik-Arbeitsfassung

> Die Sicherheitsüberprüfung ist Bestandteil der anforderungsbasierten Evaluation des migrierten Demonstrators. Als Referenz dienen die Electron Security Guidelines. Alle Empfehlungen werden auf Anwendbarkeit geprüft und anhand von Quellcode, Konfiguration und geeigneten technischen Belegen bewertet. Ergänzend werden drei begrenzte praktische Fälle zur Eingabevalidierung, sicheren Darstellung nicht vertrauenswürdiger Aufgabeninhalte und CSP-Durchsetzung durchgeführt. Die Auswahl bezieht sich auf die bei der Migration relevanten Grenzen zwischen Renderer, Preload und Main. Vorhandene Tests ergänzen die Nachweise in ihrem tatsächlichen Geltungsbereich. Ergebnisse, Abweichungen und Grenzen werden dokumentiert.

## Abschlusskriterien der Durchführung

- [ ] Prüfstand und Startweise festgehalten.
- [ ] Alle Richtlinien mit Anwendbarkeit, Ergebnis, Beleg und Nachweisart bewertet.
- [ ] Relevante vorhandene Testläufe dokumentiert und passend eingeordnet.
- [ ] P1–P3 durchgeführt oder Hindernisse ausdrücklich dokumentiert; bei einem nicht durchführbaren Fall keine Erfüllung behauptet.
- [ ] Verwendete Testhilfen entfernt und Testinhalte nach Sicherung der Belege aufgeräumt.
- [ ] Abweichungen und Grenzen zusammengefasst.
- [ ] Methodikbeschreibung und Evaluationsergebnisse in die BA überführt.

Die Durchführung ist abgeschlossen, sobald die begrenzte Überprüfung nachvollziehbar dokumentiert ist. Ob die Sicherheitsanforderung vollständig erfüllt ist, ergibt sich erst aus ihren tatsächlichen Ergebnissen.
