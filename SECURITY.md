# 🔒 Security Guide

This document outlines security best practices for the Chainmate project, particularly regarding environment variables and sensitive data handling.

## ⚠️ Critical Security Rules

### 1. Environment Variables in Vite

**NEVER use `VITE_PUBLIC_` prefix for sensitive data!**

In Vite, all environment variables prefixed with `VITE_PUBLIC_` are **exposed in the client-side JavaScript bundle**. This means:

- ✅ **Safe to use `VITE_PUBLIC_` for:**
  - Public contract addresses
  - Public RPC URLs
  - Public API endpoints
  - Non-sensitive configuration values
  - WalletConnect Project IDs (public identifiers)

- ❌ **NEVER use `VITE_PUBLIC_` for:**
  - Private keys
  - API keys with write permissions
  - Database credentials
  - Authentication tokens
  - Any secrets or sensitive data

### 2. Private Keys

**Private keys should NEVER be in client-side code or environment variables with `VITE_PUBLIC_` prefix.**

If you need to perform operations that require a private key:
- Use server-side API endpoints
- Use deployment scripts (for contract deployment only)
- Use hardware wallets for production deployments
- Never commit private keys to version control

### 3. Environment File Management

- ✅ **DO commit:** `.env.example` files (with placeholder values)
- ❌ **NEVER commit:** `.env`, `.env.local`, or any file with actual secrets
- ✅ **DO add to `.gitignore`:** All `.env*` files except `.env.example`

## 📋 Environment Variable Setup

### Client Environment Variables

Create `client/.env.local` (not committed to git) based on `client/.env.example`:

```bash
# Required: WalletConnect Project ID
# Get from https://cloud.reown.com
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Optional: Contract addresses (public information)
VITE_MATCH_MANAGER_BASE=0x...
VITE_MATCH_MANAGER_MANTLE=0x...
VITE_MATCH_MANAGER_MANTLE_TESTNET=0x...
```

### Contract Deployment Environment Variables

Create `contract/.env` (not committed to git) based on `contract/.env.example`:

```bash
# Required for deployment
PRIVATE_KEY=your_deployer_private_key_here
MANTLE_TESTNET_RPC=https://rpc.testnet.mantle.xyz
MANTLE_MAINNET_RPC=https://rpc.mantle.xyz

# Optional: For contract verification
MANTLE_API_KEY=your_api_key_here
```

## 🛡️ Security Checklist

Before deploying or sharing code:

- [ ] No private keys in code or `VITE_PUBLIC_` variables
- [ ] `.env` and `.env.local` files are in `.gitignore`
- [ ] `.env.example` files exist with placeholder values
- [ ] No hardcoded secrets in source code
- [ ] API keys are stored securely (environment variables, not code)
- [ ] Deployment keys use dedicated wallets with minimal funds
- [ ] Production deployments use hardware wallets or secure key management

## 🚨 If You've Exposed a Secret

If you accidentally commit a secret:

1. **Immediately rotate/revoke the exposed secret**
2. **Remove it from git history** (if possible):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (coordinate with team first!)
4. **Update the secret** in all environments
5. **Review access logs** if available

## 📚 Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## 🤝 Reporting Security Issues

If you discover a security vulnerability, please:
1. **DO NOT** create a public issue
2. Contact the maintainers privately
3. Provide details about the vulnerability
4. Allow time for a fix before public disclosure

---

**Remember:** Security is everyone's responsibility. When in doubt, ask before committing sensitive data.


