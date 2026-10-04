# Vorschlag: Sicherheitsüberprüfung der Electron-Migration im BA-Umfang

Stand: 3. Oktober 2026. Status: Der vorgeschlagene reduzierte Scope wurde im Chat akzeptiert. Die konkrete Durchführung steht im [Umsetzungsplan](electron-security-implementation-plan.md); der [Ergebnisbericht](electron-security-check-results.md) dokumentiert den Richtlinienabgleich, vorhandene Tests und die bestandenen Laufzeitfälle P1–P3 einschließlich verbleibender Abweichungen. Dieses Dokument hält die Begründung der Scope-Anpassung fest.

Grundlage sind der bestehende `electron-security-audit-plan.md`, die im Betreuungsgespräch vereinbarten Grenzen und die im Chat festgelegte Bedeutung von „sicher“ und „gehärtet“. Die Migration und ihr Leitfaden bleiben das Hauptthema; Sicherheit ist ein Anforderungsnachweis innerhalb der Evaluation.

## Bewertung des bisherigen Plans

Der bisherige Plan kombiniert den Richtlinienabgleich mit einer weitreichenden Untersuchung von Angriffspfaden, Autorisierung, Cloud-Sitzungen und Release-Artefakten. Der Umfang wächst insbesondere durch:

- einen neuen Electron-Testharness für fremde Fenster, Frames und Sender;
- zahlreiche Rollen-, Konto- und Session-Wechsel-Konstellationen;
- eine eigene Cloud-Testumgebung;
- Tests sämtlicher benannter Exfiltrationswege mit kontrollierten Empfängern;
- absichtlich verwundbare Laborvarianten als Vergleich;
- breite Paket-, Signierungs- und Distributionsprüfungen;
- umfangreiche Befundregister mit CWE-Zuordnung und wiederholten Testmatrizen.

Diese Punkte haben fachlichen Nutzen, sind aber für den vereinbarten BA-Nachweis nicht sämtlich erforderlich. Die fachlichen Korrekturen im alten Plan bleiben nützlich: Insbesondere sind DevTools-Ausführung, absichtlich entfernte Schutzmaßnahmen und beobachtbare Konfiguration jeweils von tatsächlich nachgewiesenen Angriffen zu unterscheiden.

## Empfohlener Umfang

### 1. Ein vollständiger dokumentierter Richtlinienabgleich

Die offizielle [Electron-Sicherheitscheckliste](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations) bildet die Referenz. Sie enthält derzeit 20 Empfehlungen; eingesehen am 3. Oktober 2026. Für jeden Punkt werden Anwendbarkeit, tatsächliche Umsetzung und Belege festgehalten.

Die Prüfung erfolgt überwiegend anhand von Quellcode, Konfiguration und verwendeten Versionen. Es werden die sicherheitsrelevanten Stellen betrachtet, etwa Fensterkonfiguration, Preload, IPC-Einstiegspunkte, CSP und Navigation. Die Senderprüfung wird für alle vorhandenen IPC-Einstiegspunkte nachvollzogen; Geschäftsoperationen werden nicht jeweils durch eine vollständige Angriffsmatrix geprüft. Für Versions- und Build-Aussagen wird der tatsächlich verwendete Stand betrachtet, nicht ungeprüft die Baseline vom 26. September übernommen.

| Richtlinie | Anwendbarkeit | Umsetzung und Beleg | Ergebnis | Nachweisart |
| --- | --- | --- | --- | --- |
| Jeweils eine Zeile | Anwendbar / begründet nicht anwendbar | Code-, Konfigurations- oder Dokumentationsverweis | Erfüllt / teilweise erfüllt / nicht erfüllt / nicht geprüft | Statische Prüfung / Laufzeitbeobachtung / gezielter Test |

„Nicht anwendbar“ bedeutet, dass der betroffene Mechanismus im Demonstrator tatsächlich nicht vorhanden bzw. verfügbar ist. Zeitmangel oder fehlende Umsetzung sind keine Begründung dafür. Eine statische Prüfung wird als solche bezeichnet und nicht als Laufzeittest ausgegeben.

Protokollwahl und Fuses bleiben Teil dieses Abgleichs, weil sie ausdrücklich in der offiziellen Checkliste stehen. Das verlangt keine vollständige Untersuchung aller Distributions- und Binärsicherheitsfragen. Bei einem von Build-Verarbeitung abhängigen Befund ist gegebenenfalls eine gezielte Prüfung des betreffenden Build-Ergebnisses nötig. Eine belegte Abweichung wird benannt; aus dem kleineren Prüfumfang folgt keine automatische Erfüllung.

### 2. Wenige gezielte praktische Nachweise

Empfohlen werden drei kleine Prüffälle am vorhandenen Demonstrator. Die konkreten Eingaben und Erfolgskriterien werden erst bei der Ausarbeitung festgelegt. Die Auswahl ist ein Vorschlag, keine Aussage, dass diese Tests bereits existieren oder bestanden sind.

| Fall | Gegenstand | Begrenzung |
| --- | --- | --- |
| P1: Eingabevalidierung | Ein bestehender IPC-Aufruf mit ungültiger Eingabe und gegebenenfalls unbekannter Operation; Ablehnung vor fachlicher Verarbeitung nachweisen | Vorhandene Service-Tests verwenden, soweit passend; kein neuer Fenster-/Frame-Harness und keine vollständige Rollenmatrix |
| P2: Fremder Inhalt | Eine HTML-artige, harmlose Testeingabe in einem vorhandenen Aufgaben-Textfeld; sichere Darstellung und ausbleibende Ausführung beobachten | Ein repräsentativer Ablauf im Gruppenfeature „Aufgaben“; keine neuen Importfunktionen oder zusätzliche Demonstrator-App |
| P3: Eine Laufzeitschutzmaßnahme | Einen zur tatsächlichen Implementierung passenden Versuch unerlaubter Navigation oder eines durch die CSP untersagten Ressourcenladens prüfen | Eine begründete Auswahl; keine Untersuchung sämtlicher Abflusswege und keine externe Empfangsinfrastruktur |

Zusätzlich werden bei demselben Lauf die relevante Fensterkonfiguration und die verwendete CSP nachvollzogen, soweit sie sich mit einfachen Mitteln beobachten lassen. Tests beziehen sich auf einen festgehaltenen gebauten Demonstrator auf dem verwendeten Betriebssystem. Eine parallele Dev-/Release-Testmatrix oder mehrere Betriebssysteme sind nicht vorgesehen. Testhilfen werden dokumentiert; Tests führen zu keiner neuen Produktfunktion.

Eine abgelehnte ungültige Eingabe belegt nicht automatisch Senderauthentizität oder sämtliche Berechtigungsprüfungen. Eine inaktive Testzeichenfolge belegt nicht die Abwehr aller XSS-Varianten. Deshalb werden die praktischen Nachweise jeweils nur ihrem konkreten Prüfziel zugeordnet; der übrige Richtlinienabgleich beruht auf den ausgewiesenen Belegen.

### 3. Kompakte Dokumentation

Für praktische Fälle genügen: Prüfziel, getesteter Stand, Eingabe bzw. Handlung, erwartetes Ergebnis, tatsächliches Ergebnis und Beleg. Für den Richtlinienabgleich genügt die obige Tabelle. Abweichungen und fehlende Nachweise werden kurz eingeordnet.

Ein fehlgeschlagener Prüffall wird dokumentiert. Wird die betroffene Stelle korrigiert, wird genau dieser Fall erneut geprüft. Daraus entsteht kein vollständiger erneuter Migrationsdurchlauf.

## Änderungen gegenüber dem bisherigen Plan

| Bisheriger Bestandteil | Vorschlag für die BA |
| --- | --- |
| Vollständige Electron-Checkliste | Beibehalten, überwiegend als Code- und Konfigurationsprüfung |
| Breites Bedrohungsmodell | Kurze Herleitung: nicht vertrauenswürdige Inhalte/Eingaben und die Grenze zwischen Renderer und Main |
| E1 mit Katalog, Notizen, Aufgaben und Imports | Auf einen repräsentativen Aufgaben-Textfall reduzieren |
| E2 mit Sendern, Rollen, Ressourcen, Sessions und Konto-Wechseln | Alle IPC-Einstiegspunkte statisch prüfen; einen repräsentativen Eingabe-Negativfall praktisch belegen |
| E3 mit Fetch, WebSocket, Beacon, Bildern, Formularen, Links und Navigation | Einen passenden CSP- oder Navigationsfall auswählen |
| Neue Automatisierung und Electron-Harness | Entfällt; vorhandene Tests und kleine dokumentierte manuelle Prüfungen nutzen |
| Absichtlich verwundbare Laborvarianten | Entfallen |
| Separate Cloud-Testumgebung und Cloud-Audit | Entfallen; die Electron-seitigen Schnittstellen bleiben im Richtlinienabgleich |
| Datei-/Parser-Angriffsmatrix | Entfällt aus dieser Sicherheitsüberprüfung; vorhandene Datei-Einstiegspunkte werden, soweit richtlinienrelevant, bei der Codeprüfung berücksichtigt |
| Signing, umfassende Paket-/Binärprüfung und Distributionsaudit | Entfallen als eigener Untersuchungsblock; gezielte Belege für tatsächlich betroffene Richtlinien bleiben erforderlich |
| Electron-Version und relevante Build-Konfiguration | Beibehalten als kompakte Bestandsaufnahme und Bewertung |
| Electronegativity | Kein Pflichtbestandteil; vorhandene Hinweise bei Bedarf als Suchhilfe, nicht als alleiniger Erfüllungsnachweis |
| CWE-Zuordnung und umfangreiches Finding-Register | Durch kompakte Ergebnistabelle und kurze Beschreibung relevanter Abweichungen ersetzen |

Bereits ausgeschlossene Bereiche bleiben ausgeschlossen: Härtung der Supabase-Datenbank, SQLite-Verschlüsselung, Mehrgeräte-Synchronisierung, Echtzeitbearbeitung gemeinsamer Dokumente, Bucket-Dateifunktionen, Frontend-Unit-Tests, automatisierte End-to-End-Tests und ein weiterer Reproduktionsdurchlauf. Vorhandene lokale CSV-/ICS-Imports aus dem alten Plan sind von Bucket-Dateispeicherung zu unterscheiden; ihre Erwähnung macht eine umfassende Parser-Sicherheitsstudie nicht zur Pflicht.

## Vorschlag zur Einbindung in die Methodik

> Die Sicherheitsüberprüfung erfolgt als anforderungsbasierter Teil der Evaluation des migrierten Demonstrators. Als Bewertungsrahmen dienen die Electron Security Guidelines. Deren Empfehlungen werden auf Anwendbarkeit geprüft und anhand von Quellcode, Konfiguration und dokumentierten technischen Belegen bewertet. Ergänzend werden ausgewählte praktische Negativprüfungen für Eingabevalidierung, den Umgang mit nicht vertrauenswürdigen Inhalten und eine zentrale Laufzeitschutzmaßnahme durchgeführt. Die Auswahl orientiert sich an den bei der Migration entstandenen Grenzen zwischen Renderer, Preload und Main. Ergebnisse, Abweichungen und Grenzen der Nachweise werden dokumentiert. Der Untersuchungsumfang konzentriert sich auf die richtlinienbezogene Härtung des vorhandenen Demonstrators; ein umfassender Penetrationstest, eine Cloud-Sicherheitsprüfung und eine Distributionsfreigabe sind nicht Gegenstand der Arbeit.

Die Beschreibung der Härtungsmaßnahmen gehört in Kapitel 5, das Prüfverfahren kurz in Kapitel 3 und die Ergebnisse in Kapitel 6. Checkliste und ausführlichere Prüfprotokolle können in den Anhang. Kapitel 7 reflektiert die Grenzen der ausgewählten Nachweise.

## Geltungsbereich der Schlussfolgerung

Die Bezeichnung „gehärtet“ bleibt an den vereinbarten Richtlinienrahmen gebunden. Der kleinere Umfang reduziert die Testtiefe und die zusätzlich untersuchten Fragestellungen. Er hebt keine Richtlinienanforderung auf. Bei offenen oder nicht erfüllten anwendbaren Punkten wird der tatsächlich erreichte Stand beschrieben; vollständige Einhaltung wird nur behauptet, wenn sie durch den Richtlinienabgleich getragen wird.

Dieser Vorschlag wurde anhand des Plans und der offiziellen Dokumentation erarbeitet. Die Anwendung wurde dafür weder im Code auditiert noch praktisch geprüft.
