# LocalHub Copilot Execution Guide (v6.1)

This guide prevents uncontrolled auto-build behavior and keeps all Copilot changes safe and incremental.

## Scope Rules

- Use Copilot on one module at a time (single file or single API route).
- Do not ask Copilot to rebuild the entire project from any master blueprint.
- Do not regenerate folder structures or global scaffolding.
- All changes must be scoped and incremental.
- All changes must respect existing environment variables, internal guards, and SEO rules.

## Controlled Modification Protocol

Apply modifications in this exact order:

1. Schema
2. API
3. UI
4. AI
5. SEO
6. Auto-builder

## Integration Constraints

- Copilot must not regenerate the project.
- All patches must integrate with src/lib/authConfig.ts.
- All patches must integrate with src/lib/seoRules.ts.
- All internal AI, SEO, auto-builder, and admin bulk operations must use shared internal API guards.
- All AI and SEO changes must enforce pacing, quality, and indexing rules.