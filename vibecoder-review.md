# Vibecoder Security Review

**Project:** Cashly — Shopping Expense Tracker & Financial OS  
**Date:** October 8, 2026  
**Stack:** React 18 / TypeScript / Vite (Frontend) • Node.js / Express / Prisma / Supabase PostgREST (Backend) • FastAPI / Python / Uvicorn (AI Document Server) • Groq / OpenRouter / ElevenLabs (AI Engines)  
**Review Type:** AI-Assisted Codebase Security Triage — OWASP-Focused, Evidence-Driven  

---

## Executive Summary

A comprehensive application security triage was performed on the Cashly codebase. The architecture exhibits typical hallmarks of rapid AI-assisted development: sophisticated user-facing features (voice AI actions, receipt intelligence, financial forecasting, bank syncing) juxtaposed with severe security boundary oversights in secondary modules, financial data handling, and microservice isolation.

### Critical Highlights & Posture
- **Immediate Remediation Required:** The application currently exposes sensitive banking records, allows unauthenticated account deletion, stores prohibited payment authentication data (CVVs and ATM PINs) in plaintext, and hosts an unauthenticated public Python AI service consuming paid LLM API quotas.
- **Most Dangerous Vulnerability:** **Unauthenticated BOLA / IDOR on Plaid Banking Integrations (`plaid.controller.ts`).** The Plaid bank connection endpoints completely lack authentication middleware and execute all database operations using `SUPABASE_SERVICE_ROLE_KEY` (bypassing Postgres RLS). Any unauthenticated actor on the internet can query bank balances for arbitrary users or delete linked bank accounts.
- **Critical Regulatory & Financial Risk:** **Plaintext Storage of CVV and ATM PIN Data (`cardController.ts` & `create_cards_table.sql`).** The `cards` table schema explicitly creates `cvv` and `pin` text columns, and the backend controller requires and persists raw card numbers, CVVs, and ATM PINs, returning them in plaintext over REST responses (catastrophic PCI-DSS Requirement 3.2 violation).
- **Core Strengths:** Core transaction domains (`transactionDomainService.ts`), feature expansion modules, and AI voice actions (`backend/src/routes/ai.ts`) correctly resolve user identities server-side (`getCanonicalUserId`), enforce ownership scopes on queries, and sanitize prompts.

---

## Risk Summary

```text
CRITICAL: 2
HIGH:     4
MEDIUM:   4
LOW:      3
INFO:     2
```

---

## Priority Findings

| Ref | Severity | Title | Location | Exploitability |
|---|---|---|---|---|
| **SEC-01** | **CRITICAL** | Zero-Authentication BOLA / IDOR on Plaid Bank Connection Endpoints | `backend/src/controllers/plaid.controller.ts:20-265` | Trivial (Public URL) |
| **SEC-02** | **CRITICAL** | Prohibited Plaintext Storage & Exposure of Card CVVs and ATM PINs (PCI-DSS Req 3.2 Violation) | `backend/src/controllers/cardController.ts:18-128` | High (Authenticated API / PostgREST) |
| **SEC-03** | **HIGH** | Unauthenticated Public AI Service with Quota Drainage, Wildcard CORS, and Resource Abuse | `ai-server/main.py:76-88, 718-780, 825-876` | Trivial (Public Port 8000) |
| **SEC-04** | **HIGH** | Reversible Password Encryption with Static Fallback Secret & Hardcoded Salt in Signup OTP | `backend/src/controllers/otpController.ts:11-32` | High (Database Read) |
| **SEC-05** | **HIGH** | Unencrypted Storage of Third-Party Financial Provider Tokens (Plaid Access Tokens) | `backend/src/controllers/plaid.controller.ts:94-96` | High (Database Read) |
| **SEC-06** | **HIGH** | Missing Attempt Lockout & Brute-Force Vulnerability on Data Reset OTP Verification | `backend/src/controllers/resetController.ts:86-106` | Medium (Authenticated Network) |
| **SEC-07** | **MEDIUM** | Inconsistent User Identifier Mapping in Card Controller Breaking Session Context | `backend/src/controllers/cardController.ts:8, 97, 158` | Medium |
| **SEC-08** | **MEDIUM** | Direct Prompt Injection via Unsanitized Document Ingestion in AI Parser | `ai-server/main.py:526-550` | Medium |
| **SEC-09** | **MEDIUM** | Unpaginated Supabase Admin `listUsers()` Causing False User-Collision Checks | `backend/src/controllers/otpController.ts:49-53, 249-253` | Low (Over 50 Users) |
| **SEC-10** | **MEDIUM** | Exploitable Critical & High Severity Node.js Production Dependencies (`proxy-addr`, `nodemailer`) | `backend/package.json:28-34` | Medium |
| **SEC-11** | **LOW** | Production Environment File Tracked in Git Repository (`frontend/.env.production`) | `frontend/.env.production:1-11` | Low |
| **SEC-12** | **LOW** | In-Memory OTP Storage Precluding Horizontal Scaling and Container Failover | `backend/src/controllers/resetController.ts:14` | Low |
| **SEC-13** | **LOW** | Permissive Unchecked Wildcard CORS Origins on Extension Protocols | `backend/src/app.ts:42-45` | Low |
