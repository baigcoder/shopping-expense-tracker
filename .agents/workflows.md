# Full-Stack Development Workflow

When the user asks to build a feature:

1. Inspect the project.
2. Identify relevant files.
3. Make an implementation plan.
4. Implement in small steps.
5. Run build/lint/tests.
6. Verify with browser if UI is involved.
7. Provide final summary:
   - Files changed
   - Feature added
   - How to test
   - Risks or limitations

# Bug Fix Workflow

When the user reports a bug:

1. Reproduce the issue.
2. Find the root cause.
3. Explain the cause.
4. Fix the smallest possible area.
5. Add or update test if useful.
6. Run verification.
7. Show proof that the bug is fixed.

# UI Improvement Workflow

When improving UI:

1. Inspect current UI/component.
2. Improve layout, spacing, typography, colors, responsiveness, and accessibility.
3. Do not break existing logic.
4. Verify in browser.
5. Provide before/after summary.

# Refactor Workflow

When refactoring:

1. Preserve behavior.
2. Improve readability, maintainability, and type safety.
3. Avoid unnecessary architecture changes.
4. Run tests/build after changes.
5. Explain what improved.