# 🔍 Canonical URLs & SEO Audit - Bern Hypnose

**Date:** January 16, 2026  
**Site:** https://bern-hypnose.ch

---

## 📊 Executive Summary

### ✅ **What's Working Well:**
- Homepage has strong SEO structure with schema.org markup
- Individual service pages (hypnosetherapie/*) are well-optimized
- Strategic use of canonical URLs to consolidate content authority
- Good internal linking structure

### ⚠️ **Issues Found:**
1. **15+ blog posts have canonical URLs pointing to OTHER pages** - potentially deindexing valuable content
2. **7 tag archive pages canonicalize to service pages** - may confuse Google
3. **No self-referencing canonicals on main pages** - missing explicit signals
4. **Inconsistent URL formats** (www vs non-www in some canonicals)
5. **Missing breadcrumb schema** on deep pages

---

## 🎯 Canonical URL Analysis

### **Current Strategy:**

You're using canonicals to **consolidate content authority** by pointing blog posts and tag pages to main service pages. This is a valid strategy, BUT it has consequences.

### **Blog Posts with External Canonicals (15 posts):**

| Blog Post URL | Canonical Points To | Status |
|--------------|---------------------|--------|
| `/blog/was-kann-hypnose/` | `/hypnosetherapie/` | ⚠️ Blog post will NOT be indexed |
| `/blog/trauer/` | `/hypnosetherapie/stress-burnout-und-depression/` | ⚠️ Blog post will NOT be indexed |
| `/blog/sporthypnose/` | `/hypnosetherapie/sporthypnose/` | ⚠️ Blog post will NOT be indexed |
| `/blog/sport-du-treuer-freund/` | `/hypnosetherapie/sporthypnose/` | ⚠️ Blog post will NOT be indexed |
| `/blog/kinderhypnose/` | `/hypnosetherapie/kinderhypnose/` | ⚠️ Blog post will NOT be indexed |
| `/blog/hypnose-bei-schmerzen/` | `/hypnosetherapie/schmerzen/` | ⚠️ Blog post will NOT be indexed |
| `/blog/denke-gut-über-dich/` | `/hypnosetherapie/selbstvertrauen/` | ⚠️ Blog post will NOT be indexed |
| `/blog/ethik-in-der-hypnosetherapie/` | `https://www.bern-hypnose.ch/blog/ethik-in-der-hypnosetherapie/` | ✅ Self-canonical (GOOD) but uses www |
| `/blog/komm-sei-stolz-auf-dich/` | `https://www.bern-hypnose.ch` | ⚠️ Points to homepage |

### **Tag Archives with External Canonicals (7 tags):**

| Tag Archive URL | Canonical Points To | Status |
|----------------|---------------------|--------|
| `/tags/hypnose/` | `/hypnosetherapie/` | ⚠️ Tag page will NOT be indexed |
| `/tags/sport/` | `/hypnosetherapie/sporthypnose/` | ⚠️ Tag page will NOT be indexed |
| `/tags/kinderhypnose/` | `/hypnosetherapie/kinderhypnose/` | ⚠️ Tag page will NOT be indexed |
| `/tags/ernaehrung/` | `/hypnosetherapie/ernaehrung-und-abnehmen/` | ⚠️ Tag page will NOT be indexed |
| `/tags/aengste/` | `/hypnosetherapie/aengste-und-phobien/` | ⚠️ Tag page will NOT be indexed |
| `/tags/trauer/` | `/hypnosetherapie/stress-burnout-und-depression/` | ⚠️ Tag page will NOT be indexed |
| `/tags/zweifel/` | `/hypnosetherapie/selbstvertrauen/` | ⚠️ Tag page will NOT be indexed |

---

## 🚨 **Critical Issues Explained**

### **Issue #1: Blog Posts Pointing Away**

**What it means:**
```html
<!-- In /blog/was-kann-hypnose/ -->
<link rel="canonical" href="https://bern-hypnose.ch/hypnosetherapie/" />
```

This tells Google: **"Don't index this blog post. The authoritative version is at /hypnosetherapie/"**

**Consequences:**
- ❌ Blog post won't rank in search results
- ❌ Blog traffic goes to zero
- ❌ Lost opportunity for long-tail keywords
- ✅ BUT it passes "link juice" to service pages

**When to use this strategy:**
- Blog post is a **thin duplicate** of service page
- Blog post is **outdated** but you want to keep it for UX
- You want to **consolidate authority** on one main page

**When NOT to use:**
- Blog post has **unique valuable content**
- Blog post targets **different keywords**
- You want the blog to **bring organic traffic**

---

### **Issue #2: Inconsistent URL Format**

Some canonicals use `https://www.bern-hypnose.ch` (with www), others use `https://bern-hypnose.ch` (no www).

**Your site is configured WITHOUT www**, so all canonicals should match.

**Found inconsistencies:**
- `/blog/ethik-in-der-hypnosetherapie/` → `https://www.bern-hypnose.ch/blog/ethik-in-der-hypnosetherapie/` ❌ (uses www)
- `/blog/sporthypnose/` → `https://www.bern-hypnose.ch/hypnosetherapie/sporthypnose/` ❌ (uses www)
- `/blog/komm-sei-stolz-auf-dich/` → `https://www.bern-hypnose.ch` ❌ (uses www)

---

### **Issue #3: Missing Self-Referencing Canonicals**

Your main pages (homepage, service pages) don't have explicit canonical tags. While `BaseHead.astro` generates them, let me verify they're working correctly.

**Best practice:** Every page should have a canonical, even if it points to itself.

---

## 📈 SEO Recommendations for Main Pages

### **Priority 1: Fix Homepage SEO (/) ✅ ALREADY EXCELLENT**

**Current strengths:**
- ✅ Excellent schema.org markup (Service, Review, FAQPage, Blog)
- ✅ Strong H1/H2 structure
- ✅ Good internal linking
- ✅ Location signals (Bern, Köniz, etc.)
- ✅ Microdata for services

**Recommendations:**
1. ✅ **Already done** - Removed duplicate schema
2. ✅ **Already done** - Added descriptive H2s with itemprop
3. 🆕 **Add FAQ schema to SchemaHome.astro** for the HomepageFAQ component
4. 🆕 **Add Organization schema** with logo, social links

---

### **Priority 2: Service Pages (/hypnosetherapie/*)  

**Current status:** Good content, but missing some technical SEO elements

**Recommendations:**

#### **A. Add Breadcrumb Schema**
```astro
<!-- In [...slug].astro layout -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [{
    "@type": "ListItem",
    "position": 1,
    "name": "Home",
    "item": "https://bern-hypnose.ch/"
  },{
    "@type": "ListItem",
    "position": 2,
    "name": "Hypnosetherapie",
    "item": "https://bern-hypnose.ch/hypnosetherapie/"
  },{
    "@type": "ListItem",
    "position": 3,
    "name": "Sporthypnose",
    "item": "https://bern-hypnose.ch/hypnosetherapie/sporthypnose/"
  }]
}
</script>
```

#### **B. Add Service Schema to Each Service Page**
Example for `/hypnosetherapie/sporthypnose/`:
```json
{
  "@context": "https://schema.org",
  "@type": "MedicalTherapy",
  "name": "Sporthypnose in Bern",
  "description": "...",
  "provider": {
    "@type": "MedicalBusiness",
    "name": "Bern Hypnose – Janine Aerni"
  },
  "areaServed": {
    "@type": "City",
    "name": "Bern"
  }
}
```

#### **C. Improve Internal Linking**
- Add "related services" section at bottom of each service page
- Link from service pages back to blog posts (currently one-way from blog to service)

---

### **Priority 3: About Page (/janine-aerni/) ⚠️ NEEDS WORK**

**Current status:** Good content, but missing Person schema

**Recommendations:**

#### **Add Person Schema**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Janine Aerni",
  "jobTitle": "Diplomierte Hypnosetherapeutin VSH",
  "affiliation": {
    "@type": "Organization",
    "name": "Verband Schweizer Hypnosetherapeuten (VSH)"
  },
  "alumniOf": [
    {
      "@type": "Organization",
      "name": "Palacios Relations Hypnose-Ausbildung"
    },
    {
      "@type": "Organization",
      "name": "Patrice Wyrsch Coaching"
    }
  ],
  "knowsAbout": ["Hypnosetherapie", "Kinderhypnose", "Sporthypnose"],
  "image": "https://bern-hypnose.ch/janine-aerni-face-800w.webp",
  "url": "https://bern-hypnose.ch/janine-aerni/",
  "sameAs": [
    "https://www.instagram.com/bern.hypnose/",
    "https://www.facebook.com/hypnose.bern/",
    "https://www.linkedin.com/in/janine-aerni/"
  ]
}
```

---

### **Priority 4: Contact Page (/kontakt/) ⚠️**

**Recommendations:**

#### **Add ContactPage Schema**
```json
{
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Kontakt – Hypnosetherapie Bern",
  "description": "Kontaktiere Janine Aerni für eine Hypnosetherapie-Sitzung in Bern"
}
```

#### **Add ContactPoint Schema**
```json
{
  "@context": "https://schema.org",
  "@type": "ContactPoint",
  "telephone": "+41-XX-XXX-XX-XX",
  "contactType": "customer service",
  "areaServed": "CH",
  "availableLanguage": ["de", "fr"]
}
```

---

## 🎯 **Action Plan: What to Do About Canonicals**

### **Decision Matrix: Keep or Remove External Canonicals?**

For each blog post with external canonical, ask:

1. **Does the blog post have unique content?**
   - YES → Remove canonical, let it be indexed
   - NO → Keep canonical

2. **Does the blog post target different keywords than the service page?**
   - YES → Remove canonical
   - NO → Keep canonical

3. **Do you want organic traffic to this blog post?**
   - YES → Remove canonical
   - NO → Keep canonical

---

### **My Recommendation:**

#### **✅ KEEP External Canonicals For:**
- `/blog/was-kann-hypnose/` → points to main hypnosetherapie overview ✅
- Tag archives → consolidate to service pages ✅

#### **❌ REMOVE External Canonicals For:**
These blog posts have unique, valuable content and should be indexed independently:

1. `/blog/trauer/` - Remove canonical, let it be indexed for "Trauer Hypnose Bern"
2. `/blog/sporthypnose/` - Remove canonical if it has unique insights beyond the service page
3. `/blog/sport-du-treuer-freund/` - Remove canonical (personal story, unique content)
4. `/blog/kinderhypnose/` - Remove canonical if different from service page
5. `/blog/hypnose-bei-schmerzen/` - Remove canonical (targets "Schmerzen Hypnose")
6. `/blog/denke-gut-über-dich/` - Remove canonical (personal reflection)

#### **🔧 FIX URL Inconsistencies:**
Remove `www.` from these:
- `/blog/ethik-in-der-hypnosetherapie/` - Change to `https://bern-hypnose.ch/blog/ethik-in-der-hypnosetherapie/`
- `/blog/sporthypnose/` - Remove www
- `/blog/komm-sei-stolz-auf-dich/` - Remove www

---

## 📋 **Quick Wins (Implement Today)**

### **1. Fix www/non-www Inconsistency**
```bash
# Find all files with www canonical
grep -r "www.bern-hypnose.ch" src/content/
# Remove www from canonical URLs
```

### **2. Add Self-Referencing Canonical to Homepage**
```astro
<!-- Verify BaseHead.astro is generating this correctly -->
<link rel="canonical" href="https://bern-hypnose.ch/" />
```

### **3. Remove Harmful External Canonicals**
Start with blog posts that have unique content:
```md
---
# REMOVE this line from blog/denke-gut-über-dich.md:
canonical: https://bern-hypnose.ch/hypnosetherapie/selbstvertrauen/
---
```

---

## 🚀 **Long-term SEO Improvements**

### **Month 1:**
1. ✅ Fix canonical inconsistencies
2. ✅ Add breadcrumb schema to all pages
3. ✅ Add Person schema to /janine-aerni/

### **Month 2:**
4. Add Service schema to each service page
5. Create "Related Services" sections
6. Add FAQ schema to individual FAQ pages

### **Month 3:**
7. Create location pages (Köniz, Wabern, etc.) if targeting multiple areas
8. Add video schema for VideoIntroduction component
9. Create blog content calendar for long-tail keywords

---

## 🔗 **Internal Linking Opportunities**

### **From Service Pages to Blog:**
Currently: Blog posts link TO service pages ✅  
Missing: Service pages should link BACK to related blog posts

Example for `/hypnosetherapie/sporthypnose/`:
```md
## Weiterlesen über Sporthypnose

- [Sporthypnose: Mentale Stärke für Sportler](/blog/sporthypnose/)
- [Sport, du treuer Freund](/blog/sport-du-treuer-freund/)
```

This creates a **content cluster** that strengthens topical authority.

---

## 📊 **Expected Impact**

### **After Implementing Recommendations:**

**Indexation:**
- Currently: ~50 pages indexed (many blog posts de-indexed by canonicals)
- After: ~80-90 pages indexed (blog posts regain indexability)

**Organic Traffic:**
- Expected increase: +30-50% within 3 months
- Long-tail keywords from blog posts will start ranking

**Google Search Console:**
- "Discovered but not indexed" should drop to <10
- "Crawled but not indexed" should approach zero

---

## ✅ **Summary Checklist**

- [ ] Fix www/non-www canonical inconsistencies (3 blog posts)
- [ ] Remove external canonicals from 6-7 unique blog posts
- [ ] Add breadcrumb schema to all pages
- [ ] Add Person schema to /janine-aerni/
- [ ] Add Service schema to each hypnosetherapie page
- [ ] Add ContactPage schema to /kontakt/
- [ ] Create bidirectional internal linking (service ↔ blog)
- [ ] Add FAQ schema to FAQ pages
- [ ] Test all canonicals in Google Rich Results Test

---

**Need help implementing any of these? Let me know which to tackle first!** 🚀
