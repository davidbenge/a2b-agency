# Security Guidelines

## 🚨 CRITICAL: Private Keys and Secrets

### **NEVER COMMIT REAL PRIVATE KEYS OR SECRETS**

**Any private keys, secrets, or sensitive data committed to source control is a CRITICAL SECURITY VULNERABILITY.**

### Approved Placeholder Format

**ONLY** use this exact format for private keys in code/tests/documentation:

```
-----BEGIN RSA PRIVATE KEY-----
FAKE
-----END RSA PRIVATE KEY-----
```

### Files That Must Use Fake Keys

- **All test files** (`src/actions/test/**/*.ts`)
- **All documentation** (`docs/**/*.md`, `docs/**/*.json`)
- **Example configuration files** (`_dot.env`, `README.md`)
- **Any mock data files**

### What to Look For Before Committing

**❌ NEVER commit these patterns:**
- `-----BEGIN RSA PRIVATE KEY-----` followed by actual key data
- `MII[A-Za-z0-9+/]{100,}` (Base64 encoded private keys)
- API keys starting with real prefixes
- Client secrets with actual values
- Any string that looks like real cryptographic material

**✅ ALWAYS use these instead:**
- `-----BEGIN RSA PRIVATE KEY-----\nFAKE\n-----END RSA PRIVATE KEY-----`
- `FAKE_API_KEY_FOR_TESTING_ONLY`
- `FAKE_CLIENT_SECRET_FOR_TESTING_ONLY`
- `fake-uuid-1234-5678-9abc-def0`

### Pre-Commit Checklist

Before committing any code, verify:

1. ✅ No real private keys in any files
2. ✅ All API keys are fake/placeholder values
3. ✅ All client secrets are fake/placeholder values
4. ✅ No real UUIDs or IDs that could identify real resources
5. ✅ Environment variables use placeholder values

### Real Values Belong In

- **Local `.env` files** (gitignored)
- **Adobe I/O Runtime environment variables**
- **Secure secret management systems**
- **Developer's local environment only**

### If You Accidentally Commit Secrets

1. **IMMEDIATELY** rotate/regenerate the compromised keys
2. **IMMEDIATELY** revoke the old keys
3. **Notify the security team**
4. **Rewrite git history** to remove the secrets (if possible)
5. **Update all affected systems** with new keys

### Detection and Prevention

#### Gitleaks Secret Detection

**Install Gitleaks** (choose one method):

```bash
# macOS (Homebrew)
brew install gitleaks

# Linux/macOS (Go)
go install github.com/gitleaks/gitleaks/v8@latest

# Download binary from: https://github.com/gitleaks/gitleaks/releases
```

**Usage:**
```bash
# Check current changes
npm run security:check

# Scan entire git history  
npm run security:scan-history

# Run directly
gitleaks detect --config .gitleaks.toml --verbose
```

This repository implements:

- ✅ **Gitleaks configuration** (`.gitleaks.toml`) for comprehensive secret detection
- ✅ **Pre-commit security checks** via npm scripts
- [ ] **CI/CD checks** to prevent deployment with secrets
- [ ] **Code review requirements** for all security-related changes
- [ ] **Regular security audits** of committed code

### Reporting Security Issues

If you find committed secrets or security vulnerabilities:

1. **DO NOT** create a public issue
2. **Contact the security team immediately**
3. **Document the location and scope** of the issue
4. **Help with remediation** if possible

---

## Additional Security Best Practices

### Environment Variables

- Use descriptive names with `FAKE_` prefix for test values
- Document required environment variables in `README.md`
- Never include production values in example files

### Testing

- All test data must use fake/placeholder values
- Mock external services instead of using real credentials
- Use factory patterns to generate consistent fake data

### Documentation

- Examples must use placeholder values
- Include security warnings in setup instructions
- Provide clear guidance on where to find real values

---

## Security Review Requirements

### All Pull Requests Must:

- [ ] Have at least one security-focused review
- [ ] Pass automated secret detection scans
- [ ] Include verification that no real secrets are included
- [ ] Document any new security-related configuration

### Security-Sensitive Changes Require:

- [ ] Additional review from security team
- [ ] Testing in isolated environment
- [ ] Documentation updates
- [ ] Risk assessment

---

**Remember: Security is everyone's responsibility. When in doubt, ask for help!**
