# Security Implementation Guide

## Quick Start - Priority Actions (Complete This Week)

### 🔴 CRITICAL (Today)
**Remove Exposed API Keys from Git History**

```bash
# 1. Add backup files to .gitignore (already done)
# 2. Remove from git history - CHOOSE ONE OPTION:

# Option A: Using git filter-branch (keep history, remove sensitive files)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch aiparser-backups/aiParserService_gemini_*.js' \
  --prune-empty --tag-name-filter cat -- --all

# Option B: Using BFG Repo-Cleaner (faster alternative)
bfg --delete-files aiParserService_gemini_*.js --no-blob-protection
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 3. Force push to remote
git push origin --force --all

# 4. Regenerate your OpenRouter API key immediately
# Go to: https://openrouter.ai/keys -> Revoke old key
```

**Add to .env file:**
```bash
REACT_APP_OPENROUTER_API_KEY=sk-or-v1-your-new-key-here
```

### 🟡 HIGH (This Week)
**Update Deployment Configuration with Security Headers**

```bash
# 1. Back up current vercel.json
cp vercel.json vercel.json.backup

# 2. Replace with secure version
cp vercel.json.secure vercel.json

# 3. Update firebase.json with headers
# (Firebase configuration for security headers, see setup below)

# 4. Test locally
npm run build
vercel dev  # or firebase emulators:start

# 5. Deploy
git add .gitignore .env.example vercel.json SECURITY.md SECURITY_AUDIT_2026.md
git commit -m "chore: enhance security configuration and headers"
git push origin main
```

### 🟢 MEDIUM (This Sprint)
**Implement Input Validation**

1. **Use validation utilities in signup form:**
```javascript
import { 
  validateUsername, 
  validateEmail, 
  validatePassword,
  getSecureErrorMessage 
} from '../utils/validation';

// In your signup component:
const handleSignup = async (username, email, password) => {
  // Validate before sending
  const userCheck = validateUsername(username);
  if (!userCheck.valid) {
    setError(userCheck.error);
    return;
  }
  
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    setError(emailCheck.error);
    return;
  }

  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    setError(passCheck.error);
    return;
  }

  try {
    // Proceed with signup
    await authService.registerUser(username, email, password);
  } catch (error) {
    setError(getSecureErrorMessage(error, false));
  }
};
```

2. **Add rate limiting to prevent brute force:**
```javascript
import { RateLimiter } from '../utils/validation';

// Create rate limiter (max 5 login attempts per minute)
const loginLimiter = new RateLimiter(5, 60000);

export const handleLogin = (email, password) => {
  if (!loginLimiter.isAllowed()) {
    showError(`Too many attempts. ${loginLimiter.getRemainingRequests()} attempts remaining.`);
    return;
  }
  // Proceed with login
};
```

---

## Step-by-Step Implementation

### Step 1: Clean Up Repository (30 min)

**What:** Remove sensitive files from git history  
**Why:** Prevent unauthorized access to API keys  
**Cost:** One-time effort

```bash
# List files to remove
git log --all --full-history -- aiparser-backups/aiParserService_gemini_*.js

# Remove with filter-branch
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch aiparser-backups/aiParserService_gemini_*.js' \
  --prune-empty -- --all

# Force update remote
git push origin --force --all
git push origin --force --tags

# Notify team to re-clone after this
```

### Step 2: Update Environment Variables (15 min)

**What:** Move secrets to .env files  
**Why:** Keep secrets out of source code  
**Cost:** Configure once per environment

```bash
# 1. Create .env for development
cat > .env << EOF
REACT_APP_OPENROUTER_API_KEY=sk-or-v1-NEW_KEY_HERE
NODE_ENV=development
EOF

# 2. Create .env.production for production
cat > .env.production << EOF
REACT_APP_OPENROUTER_API_KEY=sk-or-v1-PROD_KEY_HERE
NODE_ENV=production
EOF

# 3. Verify .env is in .gitignore
grep ".env" .gitignore  # Should show it's already there

# 4. Test build
npm run build
```

### Step 3: Deploy Security Headers (20 min)

**For Vercel:**
```bash
# Update vercel.json with security headers (already provided in vercel.json.secure)
cp vercel.json.secure vercel.json

# Deploy
vercel --prod
```

**For Firebase Hosting:**
Edit `firebase.json`:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-XSS-Protection", "value": "1; mode=block" }
        ]
      }
    ]
  }
}
```

Then deploy:
```bash
firebase deploy --only hosting
```

### Step 4: Add Input Validation (1-2 hours)

**What:** Validate all user input before processing  
**Why:** Prevent XSS, injection attacks  
**Where:** Already created `/src/utils/validation.js`

**Use in components:**
```javascript
import { 
  validateUsername,
  validateEmail, 
  sanitizeHtmlInput 
} from '../utils/validation';

// In signup form
const [username, setUsername] = useState('');
const [error, setError] = useState('');

const handleUsernameChange = (e) => {
  const value = e.target.value;
  const validation = validateUsername(value);
  setUsername(value);
  setError(validation.error);
};
```

### Step 5: Update Security Documentation (1 hour)

**Already created:**
- ✅ `SECURITY_AUDIT_2026.md` - Full audit report
- ✅ `SECURITY.md` - Security policy  
- ✅ `.env.example` - Environment template

**Review & customize:**
- [ ] Update email contacts in SECURITY.md
- [ ] Review SECURITY_AUDIT_2026.md
- [ ] Share with team

---

## Testing Security Changes

### 1. Test Build
```bash
npm run build
npm run verify-build
```

### 2. Test Environment Variables
```bash
# Verify no secrets in built files
grep -r "sk-or-v1" build/  # Should be empty
grep -r "apiKey" build/    # Should only show Firebase (which is public)
```

### 3. Test Security Headers (Vercel)
```bash
# After deploying to Vercel
curl -I https://your-app.vercel.app

# Check for headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
```

### 4. Test Input Validation
```bash
# Create test file: src/utils/validation.test.js
import { validateUsername, validateEmail, validatePassword } from './validation';

test('rejects short username', () => {
  const result = validateUsername('ab');
  expect(result.valid).toBe(false);
});

test('accepts valid email', () => {
  const result = validateEmail('user@example.com');
  expect(result.valid).toBe(true);
});

test('requires uppercase and number in password', () => {
  const result = validatePassword('weakpass');
  expect(result.valid).toBe(false);
});

# Run tests
npm test -- validation.test.js
```

---

## Ongoing Security Maintenance

### Monthly
```bash
# Check for vulnerabilities
npm audit

# Update packages (patch/minor only)
npm update

# Review Firebase quotas
# -> Firebase Console > Project Settings
```

### Quarterly
```bash
# Review dependencies for major updates
npm outdated

# Update dependencies (carefully test!)
npm install npm@latest -g
ncu -i  # npm-check-updates interactive mode
npm test
```

### Annually
- [ ] Security audit with professional service
- [ ] Penetration testing
- [ ] Review incident logs
- [ ] Update security policies

---

## Rollback Instructions

### If security headers break application:
```bash
# Revert vercel.json
git checkout HEAD~ vercel.json
git commit -m "revert: security headers causing issues"
git push origin main

# Redeploy
vercel --prod
```

### If validation breaks signup:
```bash
# Check browser console for validation errors
# Loosen validation rules if too strict
# Common issue: password requirements too strict

# To fix:
# Edit src/utils/validation.js -> validatePassword()
# Reduce requirements if needed
git add src/utils/validation.js
git commit -m "fix: relax password validation"
```

---

## Verification Checklist

Before considering security implementation complete:

- [ ] API keys removed from git history
- [ ] `.env` file created and secured
- [ ] New API keys generated
- [ ] Security headers deployed
- [ ] Input validation implemented
- [ ] SECURITY.md reviewed by team
- [ ] All tests passing
- [ ] Deployment successful
- [ ] Security headers verified in browser
- [ ] npm audit shows 0 vulnerabilities
- [ ] GitHub branch protection enabled
- [ ] Security policy documented

---

## Support & Questions

For questions about implementing these changes:
1. Review [SECURITY_AUDIT_2026.md](./SECURITY_AUDIT_2026.md)
2. Check [SECURITY.md](./SECURITY.md)
3. Reference [Mozilla Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
4. Contact team security lead

---

**Last Updated:** April 5, 2026  
**Next Review:** May 5, 2026
