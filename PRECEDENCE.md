# Precedence

Conflicts between project documents are resolved here, once, so no agent
re-litigates them.

## Rank (highest first)

0. **Dayna's newest explicit correction** (in conversation)
1. **Master Build Directive** — `MCP Agent and Data System`, incl. §A 40-role
   blueprint and §B boundary matrix
2. **Stage specs** — `stages/*.md`
3. **Prior audits** — evidence about past builds only, never authority
4. **Previous implementations** — reference material only

## Rule zero — the build plan is SUBORDINATE

The build plan is **not** a correction and does **not** outrank the directive.
Where the plan is narrower than the directive, **the directive controls**.

**A plan omission is not a scope decision.** If a requirement appears in the
directive and not in the plan, it is still required. Fix the plan.

## Resolved conflicts

| Conflict | Resolution | Authority |
|---|---|---|
| Cloudflare in/out | **OUT.** No Workers/R2/D1/Wrangler | Dayna, this session |
| Domain binding | **NOT bound** to her domain. Neutral host URL. `mcp.thewelllivedcitizenco.com` is a later DNS change only | Dayna, this session (supersedes Directive §5, §18) |
| Localhost as production | **Forbidden.** Dev only | STAGE_RULES r5 |
| 40 roles | **Never collapsed, merged, or replaced.** Infrastructure may be shared; occupational authority may not | Directive §7, STAGE_RULES r11 |
| Retention / version count | **OPEN — unresolved, not guessed.** "100 versions never discard" was a *prior agent's inference*, not Dayna's requirement. Her requirement (verbatim) is continuity: *"you have to maintain the contiuity until each word is where i want it … things are never a new draft unless i say 'start over or something' … the memory has to hold"* | Transcript #14 vs #15 |

## Provenance rule applies to this repo

An agent inference may **never** be recorded as Dayna's requirement. Anything
inferred is labelled inferred. Anything unverified is labelled unverified.
Unresolved items stay unresolved rather than being guessed. (Directive §2:
*"Preserve genuinely unresolved items instead of guessing."*)
