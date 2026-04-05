# Security Policy

## Version History
| Version | Date | Status |
|---------|------|--------|
| 2.0 | April 5, 2026 | Current |
| 1.0 | Previous | Superseded |

---

## Security Overview

Pro-Timetable takes security seriously. This document outlines our security practices and how to report vulnerabilities.

### Key Security Features
- ✅ Industry-standard Firebase Authentication
- ✅ Strict Firestore Security Rules
- ✅ HTTPS-only communication
- ✅ Regular dependency updates
- ✅ Input validation & sanitization
- ✅ Environment variable protection
- ✅ Security headers (Vercel/Firebase)

---

## Reporting Security Vulnerabilities

**Do NOT open public issues for security vulnerabilities.**

If you discover a security vulnerability, please email: **[your-email@example.com]** with:
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if available)

We will acknowledge receipt within 24 hours and keep you updated on the fix progress.

---

## Security Best Practices for Contributors

### 1. API Keys & Secrets
- ✅ Use environment variables for all secrets
- ❌ Never hardcode API keys in source code
- ❌ Never commit `.env` files
- ✅ Use `.env.example` for templates
- ✅ Regenerate keys if accidentally exposed

### 2. Dependencies
- Run `npm audit` before committing
- Keep dependencies updated monthly
- Review major version updates for breaking changes
- Check security advisories on npm

### 3. Authentication
- Use Firebase built-in hashing for passwords
- Validate all user inputs
- Never log sensitive data (passwords, tokens)
- Use HTTPS exclusively

### 4. Data Protection
- Respect user privacy
- Don't store unnecessary PII
- Comply with data retention policies
- Use encryption for sensitive data

### 5. Code Review
- All changes require security review
- Look for XSS vulnerabilities
- Check for hardcoded credentials
- Verify input validation

---

## Security Checklist

### During Development
- [ ] Running `npm audit` shows 0 vulnerabilities
- [ ] No API keys in code
- [ ] `.env` files in `.gitignore`
- [ ] Input validation on all user data
- [ ] Error messages don't expose internals
- [ ] HTTPS enforced in production config

### Before Deployment
- [ ] Security headers added (CSP, X-Frame-Options, etc.)
- [ ] Firebase Firestore rules reviewed
- [ ] Environment variables set correctly
- [ ] API keys regenerated if exposed
- [ ] Rate limiting configured
- [ ] Logging configured (no sensitive data)

### After Deployment
- [ ] Monitor for unusual activity
- [ ] Review Firebase quotas/usage
- [ ] Check error logs for attacks
- [ ] Update dependencies monthly
- [ ] Backup data regularly

---

## Infrastructure Security

### Firebase Hosting
- ✅ Automatic HTTPS
- ✅ DDoS protection
- ✅ Free SSL/TLS certificates
- ✅ Security headers support

### Firestore Database
- ✅ Encrypted at rest
- ✅ Role-based access control
- ✅ Audit logging available
- ✅ Backup & restore capability

### Authentication
- ✅ Firebase handles password hashing
- ✅ Support for 2FA (available in Firebase Console)
- ✅ Session persistence control
- ✅ Audit logs in Firebase Console

---

## Known Dependencies & Security

**Current dependency audit status:** ✅ **0 vulnerabilities**

See [SECURITY_AUDIT_2026.md](./SECURITY_AUDIT_2026.md) for detailed dependency information.

---

## Security Incidents Log

| Date | Issue | Status | Resolution |
|------|-------|--------|-----------|
| 2026-04-05 | OpenRouter API keys in backups | RESOLVED | Keys removed, repo cleaned, new key generated |
| - | - | - | - |

---

## References

- [Firebase Security Best Practices](https://firebase.google.com/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm Security Advisories](https://www.npmjs.com/advisories)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HTTP Security Headers](https://securityheaders.com/)

---

## FAQ

**Q: Is my timetable data private?**  
A: Yes. Only you can see your timetables. Firestore rules enforce user-level isolation. Admins cannot read user data without explicit permission.

**Q: How are passwords stored?**  
A: Firebase handles password storage securely using bcrypt-level hashing. We never see your passwords.

**Q: What data is collected?**  
A: Only necessary timetable data and authentication information. No tracking or analytics without consent.

**Q: Can I export my data?**  
A: Yes. You can request your data export through [contact/process].

---

## Contact

For security questions:
- 📧 Email: [your-email@example.com]
- 🔐 Security Advisory: [security@example.com]
- 📱 Report Vulnerability: [vulnerability process]

---

**Last Updated:** April 5, 2026  
**Next Review:** July 5, 2026
