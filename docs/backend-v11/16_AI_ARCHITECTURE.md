# Cashly Backend V11 — AI Architecture & Hallucination Defense

## 1. Prime Directive: AI is NOT the Financial Source of Truth

In Cashly V11:
- The **PostgreSQL database** is the authoritative source of truth.
- Financial arithmetic is computed deterministically in code via the `Money` integer cents engine and pure metric functions (`computeFinancialHealthMetrics`).
- **AI NEVER calculates balances, never executes direct SQL, and never mutates financial state directly.**

```
[ AI Engine Roles ]
✅ Interpret user intent (e.g. "How much did I spend on dining?")
✅ Categorization suggestions (confidence 0.0 - 1.0)
✅ Weekly Coach narrative & behavioral summaries
✅ Semantic parsing for natural voice / text commands
❌ Calculating balances or Safe-to-Spend
❌ Executing arbitrary SQL or direct DB updates
❌ Overriding explicit user category assignments
```

---

## 2. Grounded Context Pipeline

When the AI assistant or weekly coach generates insights:
1. **Bounded Data Retrieval:** `financialContextService` aggregates user-scoped canonical data (current month spend, active budgets, subscriptions, and top categories).
2. **Context Sanitization:** Excludes private credentials, card numbers, or out-of-scope historical records.
3. **Fact Grounding Injection:** Deterministic numbers (e.g. `Safe to Spend: $2,450.00`, `Monthly Expense: $1,200.00`) are supplied directly in the system prompt as immutable facts.
4. **Structured Output Enforcement:** OpenRouter / Groq / OpenAI responses must conform to strict JSON schemas validated by Zod before being returned or staged for execution.

---

## 3. Two-Phase Action Execution Workflow

If the AI recommends an action (e.g., "Create a budget of $300 for Dining"):

```
[ AI Intent Output ]
       │
       ▼
[ Zod Schema Validation ]  (Rejects malformed structures)
       │
       ▼
[ User Review & Confirmation ]  (Frontend prompts user with explicit parameters)
       │
       ▼
[ Domain Service Execution ]  (Executed via budgetDomainService with canonical user_id)
       │
       ▼
[ Audit Event Logged ]  (action: 'AI_ASSISTED_BUDGET_CREATE', actor: user_id)
```

---

## 4. Multi-Tenant Memory Isolation
- AI chat memory and conversation history are partitioned strictly by `user_id`.
- Vector embeddings and cached completions use composite tenant keys `cache:ai:user_${userId}:${queryHash}` with explicit invalidation upon any financial write (`invalidateUserAICacheIfEnabled`).
