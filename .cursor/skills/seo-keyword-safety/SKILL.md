---
name: seo-keyword-safety
description: Prevents SEO ranking disasters caused by keyword homogenization, bulk find-and-replace operations, and over-optimization. Use when making SEO changes, renaming brand keywords across files, editing Schema.org structured data, or performing any bulk text replacement that touches SEO-sensitive content like meta tags, schema markup, alt texts, or page titles.
---

# SEO Keyword Safety

## The Golden Rule

**Never normalize keyword variations to a single exact-match phrase across an entire site.** Google interprets identical keyword usage across all structured data, meta tags, and alt texts as over-optimization and will demote rankings.

## Pre-Flight Checklist

Before any bulk keyword or brand name change:

1. **Audit current keyword distribution** -- run a grep to see all variations currently in use
2. **Map each variation to its context** -- different pages should use different keyword forms
3. **Identify structured data** -- Schema.org `name`, `description`, breadcrumb `name` fields are high-signal for Google
4. **Check NAP consistency** -- legal business name in Impressum must match Google Business Profile exactly
5. **Never change more than 3 keyword instances in a single commit without reviewing the diversity impact**

## Keyword Diversity Rules

### Required: Use varied keyword forms across schemas

Each Schema.org file should use a **contextually appropriate** keyword variant:

| Context | Keyword strategy | Example |
|---------|-----------------|---------|
| Homepage schema | Primary target keyword | "Hypnose Bern" |
| Default/sitewide schema | Natural long-form phrase | "Hypnose und Hypnosetherapie in Bern" |
| Service-specific schemas | Service + location | "Hypnosetherapie Bern" |
| Contact/legal schemas | Brand/domain name | "Bern Hypnose" |
| Blog publisher | Brand name | "Bern Hypnose" |

### Forbidden patterns (will cause ranking drops)

- Same 2-3 word keyword in every `"name"` field across all schemas
- Keyword-stuffed schema descriptions (bullet fragments instead of natural sentences)
- Changing legal business name in Impressum to match SEO keyword
- Adding third-party widget scripts to every page without CWV impact assessment

### Required: Natural schema descriptions

Schema `"description"` fields must read like natural sentences written for humans, not keyword-loaded fragments.

**Bad:**
```
"Hypnose Bern – Janine Aerni. Diplomierte Hypnosetherapeutin VSH. Hypnosetherapie gegen Stress."
```

**Good:**
```
"In meiner Praxis biete ich Hypnosetherapie an, um Stress, Ängste und Phobien zu überwinden. Entdecken Sie, wie Hypnose Ihnen helfen kann."
```

## Bulk Replace Safety Protocol

When asked to do a find-and-replace across multiple files:

1. **List all files that will be affected** before making changes
2. **Categorize each file** as: schema, meta tag, visible content, alt text, config, legal
3. **For each category, decide independently** what the replacement should be (it should NOT be the same everywhere)
4. **Schema files get the most scrutiny** -- each schema `name` should be unique
5. **Show the user a diversity table** (like the one above) before executing

## Post-Change Verification

After any SEO-related changes:

1. Grep for the target keyword -- count occurrences per file
2. Verify at least 3 distinct keyword variations exist across schema files
3. Confirm schema descriptions are natural sentences, not fragment lists
4. Check that Impressum business name matches GBP
5. Run build to catch any syntax errors
6. Check that no third-party scripts were added without explicit discussion

## Real-World Case Study

**What happened:** A bulk find-and-replace changed "Bern Hypnose", "Hypnosetherapie Bern", and "Hypnose und Hypnosetherapie in Bern" to "Hypnose Bern" across 19 files. Schema descriptions were also rewritten from natural sentences to keyword-optimized fragments.

**Result:** 17 days later, the site dropped from page 1 position 2 to page 3 for the target keyword "Hypnose Bern". The yoyo pattern (sometimes page 1, sometimes page 3) indicated Google's multi-datacenter reindex was gradually picking up the over-optimized version.

**Root cause:** Google's quality algorithms detected the loss of natural keyword diversity as an over-optimization signal. The simultaneous description rewrites from natural to keyword-stuffed compounded the demotion.

**Fix:** Restored original keyword variations (each schema with its own contextually appropriate phrase) and natural descriptions. Removed an unrelated third-party widget script that was loading on every page.
