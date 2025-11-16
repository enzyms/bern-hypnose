# Google Search Console - "Crawled, Currently Not Indexed" Fix

## 📊 Root Causes

"Crawled - currently not indexed" means Google found your pages but decided they're not valuable enough to index **yet**. Common causes:

1. **Low page authority** - Blog posts lack internal/external links
2. **Thin content** - Posts may be too short or lack depth
3. **Low crawl budget** - Too many low-value pages competing
4. **Duplicate/similar content** - Multiple posts on similar topics
5. **New content** - Google needs time to evaluate quality
6. **Lack of engagement signals** - No social shares, backlinks, or traffic

---

## ✅ Proven Solutions (Prioritized)

### 1. Add Internal Links FROM High-Authority Pages (PRIORITY 1 🔥)

**Why this works:** Internal links pass authority. Your therapy pages are indexed, blog posts aren't. Link from therapy → blog.

**Action:** Add a "Weiterführende Artikel" (Related Articles) section to ALL therapy pages.

**Example for `/hypnosetherapie/stress-burnout-und-depression/`:**

```markdown
### Weiterführende Blogartikel

Du möchtest mehr erfahren? Diese Artikel könnten dich interessieren:

- [Die Wirkung von Hypnose](/blog/die-wirkung-von-hypnose/)
- [Vom Ausbrennen und der Wertschätzung](/blog/vom-ausbrennen-und-der-wertschatzung/)
- [Grenzen von Hypnosetherapie](/blog/grenzen-von-hypnosetherapie/)
```

**Mapping:**

- `/hypnosetherapie/stress-burnout-und-depression/` → stress/burnout blog posts
- `/hypnosetherapie/selbstvertrauen/` → self-confidence blog posts
- `/hypnosetherapie/angste-und-phobien/` → anxiety blog posts
- `/hypnosetherapie/kinderhypnose/` → children hypnosis blog posts
- `/hypnosetherapie/sporthypnose/` → sports blog posts

---

### 2. Add Internal Links WITHIN Blog Posts (PRIORITY 1 🔥)

**Action:** Edit each blog post to include 2-3 contextual links.

**Example additions:**

**For "mein-neues-hobby-und-ich-was-ist-dein-traum.md":**

```markdown
Weil ich vermute, dass auch du lang gehegte Träume hast. Und wohl auch langjährige
Zweifel, Gründe, die dagegen sprechen. [Hypnose kann dir helfen, Selbstzweifel zu
überwinden](/hypnosetherapie/selbstvertrauen/) und den Mut zu finden, deine Träume
zu verfolgen.
```

**For stress/burnout posts:**

```markdown
Wenn du professionelle Unterstützung suchst, kann
[Hypnose bei Stress und Burnout](/hypnosetherapie/stress-burnout-und-depression/)
eine wertvolle Ergänzung sein.
```

---

### 3. Link to Blog Posts from Homepage (PRIORITY 2)

**Action:** Add a "Aktuelle Blogartikel" section to your homepage featuring 3-4 recent posts.

This signals to Google that these posts are important.

---

### 4. Create a Related Posts Component (PRIORITY 2)

**Action:** At the end of each blog post, show 3 related articles.

**Implementation:** Create `/src/components/RelatedBlogPosts.astro`

```astro
---
import { getCollection } from 'astro:content';

const { currentSlug, tags } = Astro.props;
const allPosts = await getCollection('blog');

// Find posts with matching tags
const relatedPosts = allPosts
  .filter(post => post.slug !== currentSlug)
  .filter(post => post.data.tags?.some(tag => tags?.includes(tag)))
  .slice(0, 3);
---

{relatedPosts.length > 0 && (
  <section class="mt-12">
    <h2>Ähnliche Artikel</h2>
    <div class="grid gap-4 md:grid-cols-3">
      {relatedPosts.map(post => (
        <a href={`/blog/${post.slug}/`} class="block p-4 border rounded hover:shadow-lg">
          <h3>{post.data.title}</h3>
          <p class="text-sm text-gray-600">{post.data.excerpt}</p>
        </a>
      ))}
    </div>
  </section>
)}
```

Then use it in `/src/pages/blog/[slug].astro`:

```astro
<RelatedBlogPosts currentSlug={post.slug} tags={tags} />
```

---

### 5. Improve Content Quality (PRIORITY 2)

**Minimum standards for indexing:**

- ✅ **Word count:** 300+ words (you have this)
- ✅ **Headings:** H2, H3 structure (you have this)
- ⚠️ **Internal links:** 2-3 per post (ADD THIS)
- ✅ **Images:** With alt text (you have this)
- ✅ **Meta description:** Excerpt (you have this)

**Action:** Review shorter posts and consider expanding them with:

- Personal examples
- Actionable tips
- FAQ section
- Summary/conclusion

---

### 6. Request Indexing (PRIORITY 1)

**After adding internal links:**

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Use URL Inspection tool
3. Enter each blog post URL: `https://bern-hypnose.ch/blog/[slug]/`
4. Click "Request Indexing"

**Important:**

- Only request 10-15 URLs per day
- Prioritize your best/longest posts first
- Wait 1-2 weeks between batches

**Recommended order:**

1. Posts with most content (longest/best quality)
2. Posts on popular topics (stress, anxiety, self-confidence)
3. Recent posts
4. Older posts

---

### 7. Build External Signals (PRIORITY 3)

**Why:** External signals tell Google your content is valuable.

**Actions:**

#### a) Social Media Sharing

- Share each blog post on Facebook, Instagram, LinkedIn
- Ask clients/friends to share
- Post in relevant Swiss health/wellness groups

#### b) Newsletter

- Send blog post links to your email subscribers
- Include 2-3 posts per newsletter

#### c) Backlinks

- Guest post on other health/wellness blogs
- Link back to your blog posts
- Get listed in Swiss therapist directories
- Partner with local businesses

#### d) Traffic

- Run small Facebook/Instagram ads to posts (even €20-30)
- This generates traffic signals that help indexing

---

### 8. Optimize Sitemap (PRIORITY 3)

**Action:** Add `lastmod`, `changefreq`, and `priority` to sitemap.

**In `astro.config.mjs`**, update sitemap integration:

```javascript
sitemap({
  changefreq: 'weekly',
  priority: 0.7,
  lastmod: new Date(),
  serialize(item) {
    // Therapy pages get higher priority
    if (item.url.includes('/hypnosetherapie/')) {
      item.priority = 0.9;
      item.changefreq = 'monthly';
    }
    // Blog posts
    if (item.url.includes('/blog/')) {
      item.priority = 0.6;
      item.changefreq = 'monthly';
    }
    return item;
  }
});
```

Then submit updated sitemap in Google Search Console.

---

### 9. Add Schema Markup (PRIORITY 3)

**Check your blog post schema includes all fields.**

In `/src/pages/blog/[slug].astro`, ensure BlogPosting schema has:

```javascript
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "...",
  "description": "...",
  "image": "...",
  "datePublished": "...",
  "dateModified": "...",
  "author": {
    "@type": "Person",
    "name": "Janine Aerni",
    "url": "https://bern-hypnose.ch/janine-aerni/"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Bern Hypnose",
    "logo": {
      "@type": "ImageObject",
      "url": "https://bern-hypnose.ch/logo-janine-aerni.avif"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://bern-hypnose.ch/blog/[slug]/"
  }
}
```

---

### 10. Consolidate Similar Content (PRIORITY 4)

**Check for duplicate topics:**

- Do you have multiple posts about the same thing?
- Consider merging very similar posts
- Use canonical tags if needed

**Example:** If you have 3 short posts about "stress", consider:

1. Merging them into one comprehensive post
2. Using canonical tags to point to the main post
3. Keeping separate but linking them together

---

## 🚀 Quick Win Implementation (Do This First!)

### Week 1: Internal Linking Blitz

1. **Add "Ähnliche Artikel" sections to all 14 therapy pages**

   - Link each therapy page to 3-5 relevant blog posts
   - This takes ~2 hours total

2. **Add 2-3 internal links to each blog post**

   - Link to relevant therapy pages
   - Link to other blog posts
   - This takes ~3-4 hours total

3. **Request indexing for top 10 blog posts**
   - Focus on your best content first

### Week 2-3: External Signals

4. **Share all blog posts on social media**

   - 1-2 per day on Instagram/Facebook
   - Tag relevant hashtags

5. **Send newsletter** featuring top blog posts

6. **Submit updated sitemap** in Google Search Console

### Month 2-3: Monitor & Expand

7. **Check indexing status weekly**
8. **Continue adding internal links**
9. **Improve shorter posts**
10. **Build backlinks**

---

## 📊 Expected Timeline

**Realistic expectations:**

- **Week 1-2:** No change (Google needs time to recrawl)
- **Week 2-4:** 10-20% of posts may get indexed
- **Month 2-3:** 40-60% of posts should be indexed
- **Month 3-6:** 70-80% of posts indexed
- **Month 6-12:** Most posts indexed

**Important:** "Crawled - currently not indexed" is normal for blog content and can take 3-6 months to resolve. **Be patient!**

---

## 🎯 Success Metrics

Track these in Google Search Console:

- ✅ Number of indexed blog posts (Coverage report)
- ✅ Impressions from blog posts (Performance report)
- ✅ Average position for blog keywords
- ✅ Click-through rate from search

---

## 📝 Immediate Action Checklist

- [ ] Add "Ähnliche Artikel" to stress-burnout page (link 3 blog posts)
- [ ] Add "Ähnliche Artikel" to selbstvertrauen page (link 3 blog posts)
- [ ] Add "Ähnliche Artikel" to aengste-und-phobien page (link 3 blog posts)
- [ ] Add internal links to 5 blog posts today
- [ ] Request indexing for 5 best blog posts
- [ ] Share 3 blog posts on Instagram
- [ ] Send newsletter with blog post links
- [ ] Check back in 2 weeks

---

## 💡 Pro Tips

1. **Focus on your best content first** - Don't try to index everything at once
2. **Internal links are more powerful than you think** - They're free and you control them
3. **Be patient** - This takes months, not days
4. **Keep publishing** - Fresh content helps overall site authority
5. **Monitor but don't obsess** - Check weekly, not daily

---

## Need Help Implementing?

I can help you:

1. ✅ Add internal links to all blog posts automatically
2. ✅ Create a "Related Articles" component
3. ✅ Add sections to therapy pages linking to blogs
4. ✅ Create a mapping of which posts to link where

Just let me know!
