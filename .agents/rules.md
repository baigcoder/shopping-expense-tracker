# Global Project Rules

Always inspect the project before coding.

Never modify unrelated files.

Prefer small, incremental changes.

Before coding:
1. Understand the folder structure.
2. Identify relevant frontend/backend/database/auth files.
3. Create a short implementation plan.

After coding:
1. Run lint/build/tests if available.
2. Verify UI changes in browser when applicable.
3. Summarize changed files.
4. Explain how to test the feature.

Safety rules:
- Do not hardcode secrets.
- Do not delete files without approval.
- Do not change database schema without explaining risk first.
- Do not modify auth, payment, security, or production config without review.
- Use TypeScript-safe code.
- Prefer clean architecture and maintainable structure.