# CASHLY — VOICE ASSISTANT & AUDIO TELEMETRY (V5)

**Classification:** Voice Interaction Specification (Authority #25)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Voice Interaction Pipeline

Voice interaction in Cashly follows a 5-step deterministic lifecycle:
```
[ LISTENING ] ──> Web Speech API captures spoken audio input with live amplitude visualizer
     │
[ UNDERSTANDING ] > Local/FastAPI NLP maps input to intent (e.g., 'Log expense Rs 500 for coffee')
     │
[ CONFIRMATION ]  > Explicit visual modal presents parsed parameters (Merchant, Category, Amount)
     │
[ EXECUTION ]   ──> User confirms or says 'Save'; payload commits to Supabase transaction ledger
     │
[ RESULT ]      ──> Auditory chime + visual receipt toast + real-time ledger update
```

Destructive actions (such as account purge or batch transaction deletion) are strictly prohibited via voice without manual physical confirmation.
