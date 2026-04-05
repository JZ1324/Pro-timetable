# Pro-Timetable Security Assessment & Recommendations

**Date:** April 5, 2026  
**Project:** Premium Timetable Application  
**Status:** ✅ Generally Secure with recommendations for hardening

---

## 🔴 CRITICAL ISSUES

### 1. **Exposed API Keys in Backup Files** ⚠️ HIGH PRIORITY
**Location:** `/aiparser-backups/` folder  
**Issue:** OpenRouter API keys are stored in backup files that shouldn't be in version control
```
aiParserService_gemini_20250517_214920.js contains:
const OPENROUTER_API_KEY = "sk-or-v1-...";
```
**Recommendation:**
- Delete all backup files with exposed keys from repo history using `git filter-branch` or BFG Repo-Cleaner
- Regenerate OpenRouter API key immediately
- Use environment variables exclusively: `process.env.REACT_APP_OPENROUTER_API_KEY`

**Action Items:**
```bash
# Option 1: Remove specific files from git history
git rm --cached aiparser-backups/aiParserService_gemini_*.js
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch aiparser-backups/aiParserService_gemini_*.js' --prune-empty --tag-name-filter cat -- --all

# Option 2: Use gitignore for future
echo "aiparser-backups/" >> .gitignore
git add .gitignore && git commit -m "Add backups to .gitignore"
```

### 2. **Firebase API Key in HTML (Normal but verify security)**
**Location:** `/public/index.html` and `/src/firebase-config.js`  
**Status:** ✅ Expected - Firebase web API keys are designed to be public  
**Verification Needed:**
- ✅ Verify in Firebase Console: Firestore Rules restrict unauthorized access ✓ (already good!)
- ✅ Verify Web/App Authentication is restricted
- ✅ Storage buckets have security rules configured

---

## 🟡 MEDIUM PRIORITY ISSUES

### 1. **Missing Security HTTP Headers**
**Current:** No CSP (Content Security Policy), X-Frame-Options, or other security headers  
**Recommendation:** Add to deployment platform (Vercel/Firebase)

**For Vercel (vercel.json):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "X-Frame-Options", "value": "DENY"},
        {"key": "X-XSS-Protection", "value": "1; mode=block"},
        {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
        {"key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()"}
      ]
    }
  ]
}
```

**For Firebase (firebase.json):**
Add headers configuration to hosting section

### 2. **Missing CSRF Protection for Forms**
**Current:** UI is client-side only with Firebase auth (relatively safe)  
**Recommendation:** Add CSRF tokens if backend endpoints are added

### 3. **Input Validation Could Be Enhanced**
✅ Good: jsonSanitizer.js exists and cleans JSON  
⚠️ Missing: Comprehensive input validation on all user inputs
- Username validation (length, charset)
- Class names, times validation
- File upload validation (if applicable)

---

## 🟢 GOOD SECURITY PRACTICES IN PLACE

### ✅ 1. **Firestore Security Rules**
```
+ Only authenticated users can read/write their own data
+ Admin role validation before admin operations
+ Public read restricted (username checks only)
+ Template isolation per user
```

### ✅ 2. **Latest Dependencies**
- React 18.3.1 (current)
- Firebase 11.7.1 (current)
- Webpack 5.97.1 (current)
- All major libraries recently updated
- **0 known vulnerabilities** according to npm audit

### ✅ 3. **Environment Variable Configuration**
- webpack.config.js properly loads from `.env` files
- .gitignore protects `.env` files
- Support for environment-specific configs (.env.production, etc.)

### ✅ 4. **Authentication Flow**
- Firebase Auth (industry standard)
- Email/password with secure hashing (Firebase handles)
- Persistence set to LOCAL
- User document creation on registration

### ✅ 5. **No Mixed Content**
- All Firebase scripts load from HTTPS
- Consistent with deployment platforms

---

## 📋 SECURITY CHECKLIST & TODO

### Immediate (This Week)
- [ ] **CRITICAL:** Remove/clean API keys from backup files
- [ ] Regenerate OpenRouter API key
- [ ] Verify Firebase Security Rules are deployed
- [ ] Add security headers to deployment config

### Short Term (This Month)
- [ ] Add input validation helper functions
- [ ] Implement rate limiting for API calls (if backend exists)
- [ ] Add logging for auth failures
- [ ] Review Firebase Storage rules (if used)
- [ ] Document API key management process

### Medium Term (Next Quarter)
- [ ] Add Content Security Policy headers
- [ ] Implement session timeout
- [ ] Add audit logging for admin operations
- [ ] Set up automated security scans (Snyk, GitHub Security)
- [ ] Add error boundary with secure error messages

### Ongoing
- [ ] Run `npm audit` monthly
- [ ] Review Firebase billing/quotas for unusual activity
- [ ] Monitor for deprecated Firebase APIs
- [ ] Keep dependencies updated automatically (Dependabot)

---

## 🔒 Recommended Security Additions

### 1. Add Input Validation Utility
**File:** `src/utils/validation.js`
```javascript
export const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 30) return false;
  return /^[a-zA-Z0-9_-]+$/.test(username);
};

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 number
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
};
```

### 2. Enhanced Error Messages (Don't expose internals)
**Current:** May expose stack traces in development  
**Recommendation:**
```javascript
// ✗ Avoid
console.log('Error:', error.stack);

// ✓ Use
console.error('Auth failed');
showUserMessage('Unable to sign in. Please try again.');
```

### 3. Rate Limiting for Auth Endpoints
**Recommendation:** Use Firebase Cloud Functions with rate limiting
```javascript
// Pseudo code
const rateLimit = require('firebasecloud:ratelimit');
exports.signIn = rateLimit(
  async (req, res) => { /* auth logic */ },
  { windowMS: 60000, maxRequests: 5 }
);
```

---

## 📊 Dependency Health

| Package | Version | Status | Last Updated |
|---------|---------|--------|--------------|
| React | 18.3.1 | ✅ Current | 2024 |
| Firebase | 11.7.1 | ✅ Current | 2025 |
| Webpack | 5.97.1 | ✅ Current | 2025 |
| Babel | 7.26.0 | ✅ Current | 2025 |
| Jest | 29.7.0 | ✅ Current | 2024 |

**Overall:** All dependencies are up-to-date with 0 vulnerabilities

---

## 🚀 Quick Wins (Easy Improvements)

1. **Add .env.example** - Show what env vars are needed without exposing values
2. **Add vercel.json headers** - 5-minute security boost
3. **Update .gitignore** - Add `**/backup*`, `**/bak*`, `*.bak` 
4. **Add SECURITY.md** - Document security policy and reporting
5. **Use GitHub Security tab** - Enable branch protection rules

---

## 📞 Next Steps

1. **Action the CRITICAL issue first** (API key cleanup)
2. **Review Firebase rules deployment** - Confirm they're live
3. **Add security headers** - Quick win for most platforms
4. **Set up monitoring** - Firebase alerts, error tracking
5. **Document the process** - Make security routine

---

## References

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
