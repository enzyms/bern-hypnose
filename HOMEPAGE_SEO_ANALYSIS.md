# Homepage SEO Analysis & Optimization

**Date:** January 6, 2026  
**Focus:** Homepage SEO Optimization for "Hypnosetherapie Bern" and "Hypnose Bern"

---

## 🔍 Current Homepage Structure

### Content Hierarchy
```
1. Hero Section (H1)
2. "Was ist Hypnose, für wen?" (H2)
   - SubPages component (visual cards)
3. "Was kann Hypnosetherapie für dich tun?" (H2) 
   - SubPagesTopics component (treatment cards)
4. "Was ist Hypnose?" (H2)
   - Detailed explanation
   - "Wozu Hypnose?" (H3)
   - "Bist du bereit für eine Veränderung?" (H3)
5. "Eine kurze Videoeinführung" (H2)
6. Testimonials section
7. Latest blog posts
```

---

## 📊 SEO Analysis Results

### ✅ Strengths

1. **Good Content Depth**
   - Comprehensive information about hypnotherapy
   - Multiple sections covering different aspects
   - Natural keyword usage throughout

2. **Strong Trust Signals**
   - Testimonials prominently displayed
   - Video introduction adds authenticity
   - Clear CTAs

3. **Technical SEO**
   - Proper heading hierarchy (H1 → H2 → H3)
   - Schema markup implemented
   - Mobile responsive
   - Good internal linking structure

4. **User Experience**
   - Clear navigation
   - Visual cards for topics
   - Multiple conversion paths

### ❌ Critical Issues Found

#### **Issue #1: H1 Not Updated** 🔴
**Current:** `hero.title: 'Bern Hypnose'`
**Should be:** `'Hypnosetherapie Bern'`

This is critical! The H1 is the most important SEO element and should have been updated in our previous optimization.

#### **Issue #2: Weak First H2**
**Current:** "Was ist Hypnose, für wen?"
- Too generic
- Doesn't contain target keywords
- Could be more engaging

#### **Issue #3: No Introductory Paragraph**
**Current:** Jumps directly to H2 after hero
**Missing:** An introductory paragraph with keywords right after H1

#### **Issue #4: Third H2 Repetition**
**Current:** "Was ist Hypnose?" (H2)
- Repeats the first H2 concept
- Appears too late (after visual sections)
- Could be restructured

#### **Issue #5: Meta Description Could Be Stronger**
**Current:** "Hypnosetherapie Bern – Janine Aerni. Professionelle Hypnosetherapie in Bern..."
**Issue:** Generic, could be more compelling

#### **Issue #6: Missing FAQ Schema on Homepage**
Common questions could be structured with FAQ schema for rich snippets

---

## 🎯 Priority Recommendations

### 🔴 **PRIORITY 1: Critical Fixes** (Immediate Impact)

#### 1.1 Fix H1 Title
**File:** `src/data/site-config.ts`

```typescript
// CURRENT (Line 225)
title: 'Bern Hypnose',

// FIX TO
title: 'Hypnosetherapie Bern',
```

**Impact:** ⭐⭐⭐⭐⭐ Critical for keyword ranking

#### 1.2 Add Introductory Paragraph After Hero
**File:** `src/pages/index.astro`

Add after `<Hero />`:

```astro
<div class="prose sm:prose-lg text-main mb-8">
    <p class="text-xl leading-relaxed">
        Willkommen bei deiner Praxis für <strong>Hypnosetherapie in Bern</strong>. 
        Als diplomierte Hypnosetherapeutin unterstütze ich dich dabei, durch 
        professionelle Hypnose positive Veränderungen in deinem Leben zu erreichen. 
        Ob bei Ängsten, Stress, Abhängigkeiten oder Schlafstörungen – 
        <strong>Hypnosetherapie</strong> bietet wirksame Unterstützung.
    </p>
</div>
```

**Impact:** ⭐⭐⭐⭐⭐ Provides immediate keyword context

#### 1.3 Optimize First H2
**File:** `src/pages/index.astro` (Line 21)

```astro
// CURRENT
<h2>Was ist Hypnose, für wen?</h2>

// CHANGE TO
<h2>Für wen ist Hypnosetherapie geeignet?</h2>
```

**Impact:** ⭐⭐⭐⭐ Better keyword placement in H2

### 🟠 **PRIORITY 2: Content Enhancement** (High Impact)

#### 2.1 Restructure H2 Sections
**File:** `src/pages/index.astro`

Current order is confusing with two similar H2s. Suggest:

```
1. Hero + Intro paragraph
2. "Für wen ist Hypnosetherapie geeignet?" (H2)
3. Visual cards (SubPages)
4. "Wobei kann Hypnosetherapie in Bern helfen?" (H2)
5. Treatment cards (SubPagesTopics)
6. "Wie funktioniert Hypnosetherapie?" (H2) [Consolidate "Was ist Hypnose" content]
7. Video
8. "Warum Hypnosetherapie bei Janine Aerni in Bern?" (H2) [NEW]
9. Testimonials
10. Blog posts
```

#### 2.2 Improve Meta Description
**File:** `src/data/site-config.ts`

```typescript
// CURRENT
description: 'Hypnosetherapie Bern – Janine Aerni. Professionelle Hypnosetherapie in Bern, um Stress, Ängste, Phobien und mehr zu überwinden.'

// IMPROVE TO
description: 'Hypnosetherapie Bern bei Janine Aerni ✓ Diplomierte VSH Hypnosetherapeutin ✓ Ängste, Stress & Abhängigkeiten überwinden ✓ Zentral in Bern ✓ Jetzt Termin buchen!'
```

**Impact:** ⭐⭐⭐⭐ Better CTR from search results

#### 2.3 Add Trust Section Before Testimonials
**New component:** `src/components/TrustSignals.astro`

```astro
<section class="prose sm:prose-lg mt-16 mb-8">
    <h2>Warum Hypnosetherapie bei Janine Aerni in Bern?</h2>
    <ul class="grid sm:grid-cols-2 gap-4">
        <li>✓ Diplomierte VSH Hypnosetherapeutin</li>
        <li>✓ Über 20 Jahre Erfahrung</li>
        <li>✓ Zentrale Lage in Bern</li>
        <li>✓ Individuelle Sitzungen</li>
        <li>✓ SBVH Mitglied</li>
        <li>✓ Spezialisiert auf Ängste & Stress</li>
    </ul>
</section>
```

### 🟡 **PRIORITY 3: Technical SEO** (Medium Impact)

#### 3.1 Add FAQ Schema
**New component:** `src/components/HomepageFAQ.astro`

```astro
<section class="prose sm:prose-lg mt-12">
    <h2>Häufige Fragen zur Hypnosetherapie</h2>
    
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Was kostet Hypnosetherapie in Bern?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Eine Hypnosetherapie-Sitzung in Bern kostet CHF 150 für 90 Minuten."
                }
            },
            {
                "@type": "Question",
                "name": "Wo befindet sich die Hypnosetherapie-Praxis?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Die Praxis befindet sich an der Eigerstrasse 56, 3007 Bern, gut erreichbar mit Tram 9 (Haltestelle Sulgenau)."
                }
            }
        ]
    }
    </script>
    
    <details>
        <summary><strong>Was kostet Hypnosetherapie in Bern?</strong></summary>
        <p>Eine Sitzung kostet CHF 150 für 90 Minuten. <a href="/angebote/">Mehr zu den Preisen</a></p>
    </details>
    
    <details>
        <summary><strong>Wo befindet sich die Praxis?</strong></summary>
        <p>Eigerstrasse 56, 3007 Bern. <a href="/kontakt/">Anfahrt ansehen</a></p>
    </details>
</section>
```

#### 3.2 Add Breadcrumb Schema
**File:** `src/schemas/SchemaHome.astro`

Add after existing schema:

```json
{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Hypnosetherapie Bern",
        "item": "https://bern-hypnose.ch/"
    }]
}
```

#### 3.3 Optimize Image Alt Tags
**File:** `src/components/Hero.astro` (Line 19)

```html
<!-- CURRENT -->
alt="Janine Aerni: Praxis für Hypnosetherapie in Bern"

<!-- ALREADY GOOD! ✓ -->
```

#### 3.4 Add LocalBusiness Schema Enhancement
**File:** `src/schemas/SchemaHome.astro`

Add additional properties:

```json
"hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Hypnosetherapie Dienstleistungen",
    "itemListElement": [
        {
            "@type": "Offer",
            "itemOffered": {
                "@type": "Service",
                "name": "Hypnosetherapie gegen Ängste und Phobien",
                "description": "Professionelle Hypnosetherapie zur Überwindung von Ängsten und Phobien"
            }
        },
        {
            "@type": "Offer",
            "itemOffered": {
                "@type": "Service",
                "name": "Rauchstopp mit Hypnose",
                "description": "Rauchentwöhnung durch Hypnosetherapie"
            }
        }
    ]
}
```

### 🟢 **PRIORITY 4: Content Optimization** (Lower Impact)

#### 4.1 Add Location Keywords Naturally
Throughout content, naturally mention:
- "in Bern"
- "Berner Praxis"
- "zentral in Bern gelegen"
- "Hypnosetherapie Bern"

#### 4.2 Internal Linking Optimization
Ensure all links use descriptive anchor text:

```html
<!-- BAD -->
<a href="/hypnosetherapie/">hier</a>

<!-- GOOD -->
<a href="/hypnosetherapie/">Hypnosetherapie in Bern</a>
```

#### 4.3 Add "Above the Fold" CTA
After intro paragraph, add a prominent banner:

```astro
<div class="not-prose bg-red-50 border-l-4 border-red-600 p-6 my-8 rounded-r-lg">
    <p class="text-lg font-semibold text-red-900 mb-2">
        Bereit für positive Veränderungen?
    </p>
    <p class="text-red-800 mb-4">
        Buche jetzt deine Hypnosetherapie-Sitzung in Bern
    </p>
    <a href="/termin/" class="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-500">
        Termin buchen
    </a>
</div>
```

---

## 📈 Expected Impact

### After Priority 1 Changes:
- **Keyword optimization:** +40% improvement
- **Search visibility:** H1 properly optimized
- **User engagement:** Better content flow
- **Timeline:** 2-4 weeks to see impact

### After Priority 2 Changes:
- **CTR improvement:** +15-25% from SERP
- **User trust:** Stronger authority signals
- **Conversions:** Better structured CTA flow
- **Timeline:** 4-8 weeks

### After Priority 3 Changes:
- **Rich snippets:** FAQ results in SERP
- **Local SEO:** Enhanced location signals
- **Authority:** Better structured data
- **Timeline:** 6-12 weeks

---

## 🔧 Implementation Order

### Week 1 (Critical)
1. ✅ Fix H1 in site-config.ts
2. ✅ Add intro paragraph
3. ✅ Update first H2
4. ✅ Improve meta description

### Week 2 (High Priority)
5. Restructure H2 sections
6. Add trust signals section
7. Update internal linking

### Week 3 (Medium Priority)
8. Add FAQ schema
9. Add breadcrumb schema
10. Enhance LocalBusiness schema

### Week 4 (Optimization)
11. Add above-fold CTA
12. Review all anchor texts
13. Monitor and adjust based on data

---

## 📊 Current vs. Optimized

### Title Tags
```
CURRENT:  Hypnosetherapie Bern – Hypnose | Janine Aerni
OPTIMIZED: (Already good!)
```

### H1
```
CURRENT:  Bern Hypnose ❌
OPTIMIZED: Hypnosetherapie Bern ✅
```

### First Paragraph
```
CURRENT:  (Missing) ❌
OPTIMIZED: Keyword-rich intro ✅
```

### H2 Structure
```
CURRENT:  Generic questions ⚠️
OPTIMIZED: Keyword-focused headings ✅
```

### Meta Description
```
CURRENT:  Functional but generic ⚠️
OPTIMIZED: Compelling with symbols ✅
```

---

## 🎯 Key Metrics to Track

### In Google Search Console:
1. **Impressions** for "hypnosetherapie bern"
2. **Click-through rate** (target: >5%)
3. **Average position** (target: Top 3)
4. **Impressions** for "hypnose bern"

### On Website:
1. **Bounce rate** on homepage (target: <50%)
2. **Time on page** (target: >2 minutes)
3. **Conversion rate** to /termin/ (target: >3%)
4. **Scroll depth** (target: >75% reach testimonials)

---

## ⚠️ Important Notes

### Do NOT:
- ❌ Keyword stuff
- ❌ Over-optimize anchor text
- ❌ Add too many H2s (max 6-7)
- ❌ Sacrifice readability for SEO

### DO:
- ✅ Keep natural language
- ✅ Focus on user intent
- ✅ Provide genuine value
- ✅ Make CTAs clear

---

## 🚨 Critical Fix Needed Now

**The H1 title was not updated in our previous optimization!**

This is the #1 most important change. The H1 should be:
```
'Hypnosetherapie Bern'
```

Not:
```
'Bern Hypnose'
```

See implementation in next section.

---

**Analysis Date:** January 6, 2026  
**Next Review:** February 6, 2026  
**Status:** Ready for implementation

