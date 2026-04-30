Always follow:
- CLAUDE.md
- docs/UI_GUIDE.md when writing or modifying frontend/UI code

========================
PRE-CODING CHECK (MANDATORY)
========================
Before writing any code:

1. Summarize what this task requires.
2. List what is explicitly OUT OF SCOPE.
3. List files you expect to create or modify.
4. Identify any ambiguity or missing information.

If anything is unclear or requires architectural decisions:
STOP and ask before coding.

========================
IMPLEMENTATION RULES
========================
- Only implement THIS task
- Do NOT implement adjacent features
- Do NOT continue to the next task file
- Do NOT rewrite unrelated files
- If modifying existing code, explain why

Follow:
- The task file exactly
- Relevant spec files exactly
- API response envelope format, if backend APIs are involved
- UI_GUIDE.md, if frontend UI is involved
- Project structure and conventions

========================
VALIDATION (MANDATORY)
========================
After implementation:

1. Validate against acceptance criteria:
   - List each criterion
   - Explain how your code satisfies it

2. Ensure:
   - No scope creep
   - No missing endpoints
   - No incorrect status codes
   - No security violations

========================
OUTPUT FORMAT
========================
Provide:

1. Summary of implementation
2. Files created
3. Files modified
4. Key logic decisions
5. Assumptions made
6. TODOs, if any
7. Tests run and results

========================
TESTING
========================
If tests exist:
- Run relevant tests
- Report results

If tests do not exist:
- Add minimal tests required by task

If tests cannot be run:
- Explain why
- Report what validation was still performed

========================
STOP CONDITION
========================
Stop immediately after completing this task.

Do NOT continue to next tasks.

========================
COMMIT (ONLY IF REQUESTED)
========================
Do NOT commit unless explicitly asked.