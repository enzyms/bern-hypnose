# SEO-Strategie bern-hypnose.ch (ab Juli 2026)

Ausgangslage (W30-Baseline): «hypnose bern» **#1**, Performance-Index **86.6**,
~437 geschätzte Besuche/Monat aus 6 getrackten Keywords, KI-Sichtbarkeit **55.6 %**
bei Ø Position 4. Die Marke dominiert die Brand-/Head-Terms bereits — die Strategie
richtet das Tooling deshalb auf das, was wir noch **nicht** wissen.

## Säule 1 — Messen: Keyword-Set ausbauen (6 → ~36 von 200 Slots)

Ein Keyword pro Service-Seite + Top-Blogthemen + Preis-/Informations-Terms.
Wöchentlicher Report (GitHub Action, montags) zeigt dann pro Service:
rankt die Seite, stagniert sie, lohnt sich Ausbau?

**Getrackte Erweiterung** (via SERPWatcher API, Standort «Canton of Bern», Desktop):

| Cluster | Keywords |
|---|---|
| Rauchstopp | hypnose rauchstopp bern · rauchen aufhören hypnose |
| Gewicht | hypnose abnehmen bern · abnehmen mit hypnose · hypnose zuckersucht |
| Ängste | hypnose gegen angst · hypnose angststörung · flugangst hypnose · hypnose höhenangst · hypnose klaustrophobie · hypnose prüfungsangst · hypnose redeangst · zahnarztangst hypnose · hypnose emetophobie |
| Stress/Psyche | hypnose burnout · hypnose stress abbauen · hypnose depression · hypnose schlafstörungen · hypnose selbstvertrauen · hypnose zwangsstörungen · hypnose gegen schmerzen |
| Sucht | hypnose spielsucht · hypnose alkohol |
| Zielgruppen | kinderhypnose bern · hypnose für kinder · sporthypnose |
| Kommerziell/Info | hypnose kosten · was kostet hypnose · selbsthypnose lernen · hypnose bern erfahrungen |

Regel: Jeder **neue** Blogpost/jede neue Service-Seite bekommt beim Publizieren
ihr Ziel-Keyword ins Tracking (Slots sind da: 200).

## Säule 2 — Chatbot als Keyword-Radar

Voraussetzung: Corpus-Swap im AnythingLLM (llms-full.txt rein, alte FAQ-Docs raus —
docs/chatbot-backend.md §1). Danach monatlich:

1. Chat-Logs exportieren (AnythingLLM Admin → Workspace → Chat-Logs).
2. Fragen clustern → echte Suchintentionen.
3. Kandidaten in KWFinder prüfen (Volumen/Schwierigkeit, Standort CH).
4. In `content-ideas.md` als Blog-/FAQ-Kandidat eintragen; geschriebene Artikel
   → Keyword ins Tracking → GBP-Post über die bestehende Automation.

Das ist der Vorteil, den Mitbewerber nicht haben: echte Besucherfragen als Content-Pipeline.

## Säule 3 — GEO: KI-Sichtbarkeit von 55 % Richtung 70 %+

- llms.txt / llms-full.txt / .md-Spiegel sind live; robots.txt lässt alle KI-Crawler zu.
- AI Search Watcher: Prompts von generisch auf **service-spezifisch** erweitern
  («beste hypnosetherapie gegen flugangst in bern», «hypnose rauchstopp schweiz
  empfehlung», …) — zeigt, für *welche* Services KI-Engines uns zitieren und wo nicht.
- Wöchentliche Kurve im Dashboard beobachten; Einbrüche mit Modell-Updates
  (Score-Sprung 23→67→57 im Juni/Juli) korrelieren, nicht überreagieren.

## Säule 4 — Konversion validieren (Umami)

Rankings sind Mittel, Termine sind Zweck. Umami-Events (`Termin buchen – <Thema>`,
`Kontakt – <Thema>`, Chat-Events) pro Seite mit den Rankings kreuzen:
Seiten mit gutem Ranking aber wenig CTA-Klicks → Seiteninhalt/CTA überarbeiten,
nicht SEO. Migration zu Umami Cloud unabhängig davon (docs/umami-vps-setup.md,
Alternative ohne VPS: Umami Cloud — Proxy-Ziele in netlify.toml tauschen).

## Kadenz

| Rhythmus | Aufgabe |
|---|---|
| Wöchentlich (automatisch) | SEO-Report + Dashboard-Refresh (Action, montags 06:15 UTC) |
| Monatlich (~30 min) | Chat-Logs minen → KWFinder → content-ideas.md; 1–2 Content-Stücke beauftragen |
| Quartalsweise | Strategie-Review: Keyword-Set stutzen/erweitern, AI-Prompts anpassen, Dependabot-Triage |
