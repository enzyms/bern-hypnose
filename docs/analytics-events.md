# Umami Event-Taxonomie

Konvention für `data-umami-event` (und `umami.track()` im JS): **`<Aktion> – <Kontext/Seite>`**,
mit Gedankenstrich «–» als Trenner. Beispiele: `Termin buchen – Flugangst`, `Kontakt – Stress`.

## Event-Familien (Stand Juli 2026)

| Familie | Bedeutung | Beispiele |
|---|---|---|
| `Termin buchen – <Thema>` | Klick auf Termin-CTA einer Themenseite | `Termin buchen – Flugangst` |
| `Kontakt – <Thema>` | Klick auf Kontakt-CTA einer Themenseite | `Kontakt – Burnout` |
| `Open Calendly – <Thema>` | Calendly-Widget geöffnet | `Open Calendly – Kinderhypnose` |
| `<Seite> – Button <Ziel>` | Ältere Konvention (invertiert) | `Home – Button Kontakt` |
| `Open Google Map` / `Leave Google Review` | Kontaktseiten-Aktionen | – |
| `Chat geöffnet` / `Chat Frage gesendet` / `Chat Antwort erhalten` | Chatbot-Nutzung (nur Zähler, keine Frageinhalte) | via `umami.track()` in `Chat.svelte` |

## Bekannte Inkonsistenzen (Aufräum-Backlog)

1. **Copy-Paste-Fehler**: `Home – Button Kontakt` wird auch auf Nicht-Home-Seiten verwendet —
   u. a. `angstfrei-zum-arzt-zahnarzt-mit-hypnose.mdx` (3×), `hypnose-gegen-alkoholsucht.mdx`,
   `was-ist-hypnose.md` (FAQ). Dadurch ist die Home-CTA-Statistik verfälscht.
2. **Zwei Konventionen gemischt**: `Aktion – Seite` (neu, Mehrheit) vs. `Seite – Button Aktion` (alt).
   Bei Gelegenheit auf `Aktion – Seite` vereinheitlichen.
3. **Trenner uneinheitlich**: meist «–» (Gedankenstrich), vereinzelt «-» (Bindestrich),
   z. B. `Landing - Open Calendly`.

Beim Bereinigen: Umami zählt alte und neue Namen getrennt — Umbenennung bricht die Historie
des jeweiligen Events. Am besten zusammen mit der VPS-Migration (Neustart bei null) erledigen.
