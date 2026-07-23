# Chatbot-Backend Runbook (chat.bern-hypnose.ch)

Der Website-Chatbot (`src/components/Chat.svelte`) streamt von einem AnythingLLM-Embed
auf dem eigenen VPS: `https://chat.bern-hypnose.ch/api/embed/090e1c03-3e1e-4e42-a9a5-9a193c659591/stream-chat`.

Das Frontend hat seit Juli 2026 einen **Link-Guardrail**: Es rendert nur noch Links, deren
Pfad in `/site-urls.json` (build-generierte Whitelist aller echten Seiten) vorkommt. Alles
andere — halluzinierte URLs, externe Links — wird als reiner Text angezeigt. Die vom
Backend gelieferten `sources[]` werden als «Quellen»-Chips angezeigt, ebenfalls nur wenn
sie auf echte Seiten auflösen.

Damit die Antworten selbst besser werden, muss das Backend nachziehen:

## 1. Wissensbasis: llms-full.txt statt alter FAQ-Dokumente

Die Website generiert bei jedem Deploy automatisch:

- `https://bern-hypnose.ch/llms-full.txt` — der komplette Website-Inhalt als Markdown (~400 KB)
- `https://bern-hypnose.ch/llms.txt` — kuratierter Index mit allen URLs + Beschreibungen
- Jede Inhaltsseite als Markdown-Spiegel: Trailing-Slash durch `.md` ersetzen
  (z. B. `https://bern-hypnose.ch/hypnosetherapie/stress.md`)

**Aktion im AnythingLLM-Admin:**

1. Workspace des Embeds öffnen → Dokumente.
2. Die alten FAQ-Dokumente (aus `bern-hypnose-langflow/data/faq/`) entfernen — sie sind veraltet.
3. Als Link-Dokument hinzufügen: `https://bern-hypnose.ch/llms-full.txt` (eine Datei, ganze Website).
   Alternativ granularer: die einzelnen `.md`-URLs aus `llms.txt` hinzufügen (bessere Quellen-Chips,
   da jede Quelle einer Seite entspricht).
4. **Wichtig — llms.txt anpinnen:** Zusätzlich `https://bern-hypnose.ch/llms.txt` als Dokument
   hinzufügen und im Workspace **anpinnen** (Thumbtack-Icon). Grund: llms-full.txt wird beim
   Embedden in ~1000-Zeichen-Chunks zerlegt — die `URL:`-Kopfzeile fehlt in den meisten Chunks,
   der Bot rät dann Präfixe. Das angepinnte llms.txt (klein, alle 127 URLs) liegt in *jedem*
   Prompt vollständig bei. llms-full.txt selbst NICHT anpinnen (~400 KB sprengt den Kontext).
   System-Prompt-Zusatz: «Die vollständige Liste gültiger URLs steht im Dokument llms.txt —
   verlinke ausschliesslich URLs, die dort wörtlich vorkommen.»
5. **Nach jedem größeren Content-Deploy**: Dokumente re-syncen (AnythingLLM: Dokument → «Re-fetch»).
   AnythingLLM «Watched documents» kann das automatisieren.
6. Nach Dokument-Wechseln immer in **frischer Session** testen (Reset-Button im Widget) —
   die Konversations-Historie ankert sonst alte Antworten. Bei hartnäckigen Artefakten:
   Workspace → Vector Database → Reset, dann neu embedden.

## 2. System-Prompt (Workspace → Chat-Einstellungen)

Empfohlener System-Prompt (ersetzen bzw. mit bestehendem Ton abgleichen):

```
Du bist die virtuelle Assistentin von Janine Aerni, diplomierte Hypnosetherapeutin VSH
in Bern (bern-hypnose.ch). Du beantwortest Fragen zu Hypnose und Hypnosetherapie
freundlich, kurz und auf Deutsch (Du-Form, Schweizer Schreibweise: ss statt ß).

Regeln für Links – strikt einhalten:
- Verlinke AUSSCHLIESSLICH auf URLs, die wörtlich in deinen Kontextdokumenten stehen
  (Format: https://bern-hypnose.ch/...). Erfinde NIEMALS URLs oder Pfade.
- Wenn du dir bei einer URL nicht sicher bist, verlinke stattdessen auf
  https://bern-hypnose.ch/kontakt/ oder lass den Link ganz weg.
- Maximal 2 Links pro Antwort.

Inhaltliche Grenzen:
- Du gibst keine medizinischen Diagnosen und keine Therapieversprechen ab.
- Hypnosetherapie ist eine ergänzende Methode und ersetzt keine ärztliche oder
  psychotherapeutische Behandlung – weise bei gesundheitlichen Themen darauf hin.
- Bei Terminfragen: verweise auf https://bern-hypnose.ch/termin/
- Bei Preisfragen: verweise auf https://bern-hypnose.ch/angebote/
- Wenn du etwas nicht weisst, sag es ehrlich und verweise auf das Kontaktformular.

Antworte kompakt (2–5 Sätze), ausser die Frage verlangt mehr Tiefe.
```

## 2b. Qualität sichern (Stand Juli 2026)

**Regressions-Suite:** `node scripts/test-chatbot.js` stellt 14 Kern-Fragen (frische
Session, live-Backend) und prüft jede Antwort gegen die echte URL-Whitelist:
✅ korrekt · ⚠️ falscher Prefix, Frontend repariert · ❌ Thema-Link fehlt oder
nicht reparierbar erfunden. Nach jeder Prompt-/Corpus-/Embedder-Änderung ausführen.

**Bekannte Schwachstellen & Gegenmassnahmen:**

1. **Vage Nachfragen** («link zur infos?») — AnythingLLM nutzt nur die letzte
   Nachricht als Retrieval-Query; bei vagen Fragen findet das Retrieval nichts
   und das Modell erfindet Pfade oder behauptet, es gebe keine Seite.
   → System-Prompt-Zusätze (unten) + niedrige Temperatur (Workspace →
   Chat-Einstellungen → Temperature ≈ 0.3).
2. **URL-Konstruktion** — das Modell baut gelegentlich Pfade aus Wörtern
   zusammen statt sie aus llms.txt zu übernehmen (nicht deterministisch).
   Frontend-Slug-Rescue fängt viele Fälle; der Prompt muss den Rest erledigen.
3. **Embedder** — falls der Workspace den AnythingLLM-Default-Embedder
   (all-MiniLM, englisch-lastig) nutzt, ist deutsches Retrieval schwach.
   → Beim Infomaniak-Umbau: Embedder auf **BGE Multilingual Gemma2** stellen,
   danach alle Dokumente NEU embedden und die Suite laufen lassen.

**System-Prompt-Zusätze (an den bestehenden Prompt anhängen):**

```
Zusätzliche Link-Regeln:
- Übernimm URLs IMMER wörtlich aus dem Dokument llms.txt. Baue niemals selbst
  eine URL aus Wörtern zusammen.
- Bei vagen Nachfragen wie «hast du einen Link dazu?» bezieht sich die Frage
  auf das vorherige Thema: suche dieses Thema in der llms.txt-Liste und gib
  genau die dort stehende URL an.
- Zu allen Kernthemen (Ängste, Schmerzen, Schlaf, Rauchstopp, Gewicht, Stress,
  Kinder, Sport, Selbstvertrauen) existieren Seiten unter /hypnosetherapie/ —
  behaupte nie, es gebe zu einem dieser Themen keine Seite.
- Nenne bei thematischen Fragen immer den Link zur passenden Themenseite.
```

**Antworten einsehen:** https://bern-hypnose.ch/chat-questions (Basic-Auth) zeigt
alle Konversationen inkl. Antworten; verlinkte Pfade sind markiert, «keine Quellen»
kennzeichnet Antworten ohne Retrieval-Treffer (fehleranfällig).

## 3. Frage-Mining für Keyword-Discovery

AnythingLLM speichert alle Embed-Konversationen serverseitig
(Admin → Workspace → Chat-Logs, exportierbar als CSV/JSON). Workflow:

1. Monatlich Chat-Logs exportieren.
2. Fragen clustern (Themen, Formulierungen) — das sind echte Suchintentionen.
3. Als Seed-Keywords in Mangools KWFinder prüfen (Volumen/Schwierigkeit) und in
   `reports/seo/content-ideas.md` als Blog-/FAQ-Kandidaten festhalten.

Zusätzlich zählt Umami jetzt die Events `Chat geöffnet`, `Chat Frage gesendet`,
`Chat Antwort erhalten` (nur Zähler, keine Frageinhalte — Datenschutz).

## 4. Migrationspfad: eigener Endpoint mit Claude API (Option, nicht aktiv)

Falls AnythingLLM qualitativ nicht reicht oder der VPS wegfallen soll:

- **Architektur**: Netlify Function (`netlify/functions/chat.ts`) mit Anthropic SDK,
  `client.messages.stream()`, SSE-Bridge im selben Format wie AnythingLLM
  (`data: {"textResponse": ...}`) — das Frontend bliebe unverändert.
- **Grounding ohne Vektor-DB**: `llms-full.txt` (~100k Tokens) passt komplett in den
  Kontext von Claude; als gecachter System-Block (`cache_control: ephemeral`) kostet
  er nach dem ersten Request nur ~10 % des Input-Preises.
- **Modellwahl**: `claude-haiku-4-5` als kostengünstiger Default, `claude-opus-4-8`
  wenn Qualität wichtiger ist als Kosten.
- **Aufwand**: ~2–3 Tage (Function, Rate-Limiting, Key-Management, Tests).

Der Frontend-Guardrail (Whitelist, Quellen-Chips) funktioniert mit beiden Backends.
