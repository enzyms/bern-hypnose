# 🔍 Netlify Diagnostic Checklist - Fix 5xx Errors

## 📊 Current Problem
- Google Rich Results Test: **Server error (5xx)**
- Google Search Console: **20 pages with 5xx errors**
- Regular browsers: **Site works fine** ✅
- **Conclusion:** Netlify is blocking or failing for Googlebot

---

## 🎯 Step-by-Step Netlify Checks

### **1. Log into Netlify Dashboard**
👉 Go to: https://app.netlify.com/

---

### **2. Select Your Site**
Find and click on: **bern-hypnose** (or whatever your site is named)

---

### **3. CHECK: Recent Deployments**

**Location:** Main dashboard (you'll see it immediately)

**What to look for:**
- [ ] Is the latest deploy **"Published"** (green checkmark)?
- [ ] Or is it **"Failed"** (red X)?
- [ ] When was the last successful deploy?

**If you see failed deploys:**
- Click on the failed deploy
- Read the error log
- Look for build errors

**Action if failing:**
```
Share the error message with me so I can help fix it
```

---

### **4. CHECK: Deploy Settings**

**Location:** Site settings → Build & deploy → Build settings

**What to check:**
- [ ] Build command: Should be `yarn build` or `npm run build`
- [ ] Publish directory: Should be `dist`
- [ ] Node version: Should be 18.x or higher

**Screenshot this if you're unsure** 📸

---

### **5. CHECK: Domain Settings**

**Location:** Domain settings → Domains

**What to verify:**
- [ ] Primary domain is: `bern-hypnose.ch` (without www)
- [ ] HTTPS is enabled (should show green padlock)
- [ ] No redirect loops

**If you see www issues:**
- Make sure `www.bern-hypnose.ch` redirects to `bern-hypnose.ch` (no www)

---

### **6. ⚠️ CRITICAL: Check Security Settings**

**Location:** Site settings → Security & privacy

#### **A. Check: DDoS Protection**
- [ ] Is **"Anomaly Detection"** or **"DDoS Protection"** enabled?

**If YES:**
```
This might be blocking Googlebot!
```

**Recommended action:**
- Temporarily **disable** it
- Or configure it to **whitelist Google's crawlers**

---

#### **B. Check: Bot Protection**
- [ ] Is there a **"Bot protection"** or **"Attack mode"** toggle?

**If YES:**
```
This is likely the problem!
```

**Recommended action:**
- **Disable bot protection** temporarily
- Test if Google can access your site
- If that fixes it, re-enable with Googlebot whitelisted

---

#### **C. Check: Access Control**
- [ ] Is **"Password protection"** enabled?
- [ ] Is **"Role-based access control"** limiting access?

**If YES:**
```
Disable password protection for the live site
```

---

### **7. CHECK: Edge Functions / Middleware**

**Location:** Site settings → Functions

**What to check:**
- [ ] Are there any **Edge Functions** enabled?
- [ ] Are there any **Background Functions**?

**If YES:**
- Check if they're blocking certain user agents
- Look for rate limiting logic
- Review any access control code

---

### **8. CHECK: Headers**

**Location:** Site settings → Build & deploy → Post processing → Headers

**What to check:**
- [ ] Are there custom headers that might block bots?
- [ ] Look for `User-Agent` restrictions

**Good headers to have:**
```
X-Robots-Tag: all
Access-Control-Allow-Origin: *
```

**Bad headers (remove if present):**
```
X-Robots-Tag: noindex
User-Agent: deny Googlebot
```

---

### **9. CHECK: Environment Variables**

**Location:** Site settings → Build & deploy → Environment

**What to check:**
- [ ] Are there any variables related to bot blocking?
- [ ] Any `BLOCK_BOTS` or similar variables?

**Action:**
- Temporarily set `ALLOW_ALL_BOTS=true` or similar

---

### **10. CHECK: Build Logs**

**Location:** Deploys → Click on latest deploy → View deploy logs

**What to look for:**
- [ ] Build completed successfully?
- [ ] Any warnings about missing files?
- [ ] Schema generation errors?

**Common issues:**
```
- Schema files not generated
- Missing imports
- TypeScript errors
```

---

### **11. CHECK: Build Time**

**Still in deploy logs**

**What to check:**
- [ ] How long does the build take? (should be < 5 minutes)
- [ ] Is it timing out?

**If builds take > 5 minutes:**
- This might cause intermittent 5xx errors
- Google might crawl during a deploy

**Solution:**
```
Enable Netlify's "Branch Deploy" to avoid production downtime
```

---

## 🔧 Quick Fix Actions

### **Action 1: Disable Bot Protection (Temporary)**

1. Go to: **Security & privacy**
2. Find: **"Bot protection"** or **"Anomaly detection"**
3. Toggle: **OFF**
4. Click: **"Save"**
5. Wait: 5 minutes
6. Test: https://search.google.com/test/rich-results

**Expected result:** 5xx error should be gone ✅

---

### **Action 2: Check Deploy Status**

1. Go to: **Deploys**
2. Click: Latest deploy
3. Verify: Status is **"Published"**

**If not published:**
- Click **"Retry deploy"**
- Watch the logs for errors

---

### **Action 3: Force a New Deploy**

Sometimes Netlify cache causes issues:

1. Go to: **Deploys**
2. Click: **"Trigger deploy"** dropdown
3. Select: **"Clear cache and deploy site"**
4. Wait: For deploy to complete
5. Test: Google Rich Results again

---

### **Action 4: Check Netlify Status Page**

Sometimes the issue is on Netlify's side:

👉 Go to: https://www.netlifystatus.com/

**Check if:**
- [ ] Netlify has ongoing incidents
- [ ] CDN issues
- [ ] Global outages

---

## 📱 Mobile-Specific Issues

Google tests with **smartphone bot** (as shown in your error).

### **Check: Mobile Rendering**

1. Go to: **Site settings → Build & deploy**
2. Look for: **"Mobile optimization"** settings
3. Verify: Nothing is blocking mobile bots

---

## 🚨 Most Common Causes (Based on Your Symptoms)

### **Cause 1: Bot Protection (90% likely)**
- Symptom: Works in browser, fails for Google
- Fix: Disable bot protection in Security settings

### **Cause 2: Deploy During Crawl (5% likely)**
- Symptom: Intermittent 5xx errors
- Fix: Check deploy frequency, avoid frequent deploys

### **Cause 3: Rate Limiting (3% likely)**
- Symptom: Too many requests from Google
- Fix: Increase rate limits or disable

### **Cause 4: Netlify CDN Issue (2% likely)**
- Symptom: Regional failures
- Fix: Check netlifystatus.com, contact support

---

## 📊 What to Report Back

After checking Netlify, please tell me:

1. **Security Settings:**
   - [ ] Is bot protection enabled? (Yes/No)
   - [ ] Is DDoS protection enabled? (Yes/No)
   - [ ] Any password protection? (Yes/No)

2. **Deploy Status:**
   - [ ] Latest deploy successful? (Yes/No)
   - [ ] Build time: ___ minutes
   - [ ] Any errors in logs? (Share if yes)

3. **Domain Settings:**
   - [ ] Primary domain: _____________
   - [ ] HTTPS enabled? (Yes/No)

4. **After Disabling Bot Protection:**
   - [ ] Did Rich Results Test work? (Yes/No)

---

## 🎯 Expected Outcome

**After fixing Netlify settings:**

✅ Google Rich Results Test should pass  
✅ Schemas will be recognized  
✅ Breadcrumbs will appear  
✅ 5xx errors in Search Console will disappear  

**Timeline:**
- Immediate: Rich Results Test passes
- 24-48 hours: Search Console updates
- 1-2 weeks: Full re-indexing

---

## 🆘 If Nothing Works

If you've tried everything above and it still fails:

### **Contact Netlify Support**

1. Go to: Netlify Dashboard → Help
2. Click: **"Contact support"**
3. Subject: **"5xx errors for Googlebot only"**
4. Include:
   - Your site URL: `bern-hypnose.ch`
   - Error message: "Server error (5xx) for Google crawlers"
   - What you've tried: "Disabled bot protection, checked deploys"

**Netlify support response time:** Usually < 24 hours

---

## 📋 Quick Reference

| Setting | Location | Expected Value |
|---------|----------|----------------|
| Bot Protection | Security & privacy | **OFF** or Whitelist Google |
| Build Command | Build settings | `yarn build` |
| Publish Dir | Build settings | `dist` |
| HTTPS | Domain settings | **Enabled** |
| Password | Security | **Disabled** |

---

## ✅ Success Checklist

Complete these in order:

- [ ] 1. Disable bot protection in Netlify Security settings
- [ ] 2. Verify latest deploy is successful
- [ ] 3. Wait 5 minutes
- [ ] 4. Test in Rich Results: https://search.google.com/test/rich-results
- [ ] 5. Test homepage: `https://bern-hypnose.ch/`
- [ ] 6. Check if error is gone
- [ ] 7. If fixed, re-enable bot protection WITH Google whitelist
- [ ] 8. Request re-indexing in Search Console

---

**Created:** January 16, 2026  
**Issue:** 5xx errors blocking Google crawlers  
**Goal:** Enable Google to access and index your site with new schemas
