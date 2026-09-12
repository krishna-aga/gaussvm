# AI assistance and contribution disclosure

## What is known

This repository was developed with substantial AI assistance through OpenAI Codex. The initial smart-contract implementation, Gaussian numerical solver, deployment scripts, independent-reference and integration tests, React interface, browser tests, CI workflows and most documentation were generated or edited by Codex under the user's direction. This includes project-authored files in `contracts/`, `lib/`, `scripts/`, `test/`, `web/`, `.github/workflows/` and the root/docs Markdown files. The design review and initial design handoff also used Codex sub-agents.

The solo builder is **Krishna Agarwal**, confirmed directly on 2026-09-12. Krishna provided the project direction (Paradigm pm-AMM on 1inch Aqua/SwapVM), prize requirements, name and remote, testnet/free-infrastructure constraint, neumorphic visual preference and incremental-commit requirement. Krishna approved React/TypeScript and a local EVM demo, directed the later usability simplification with Laws of UX, connected the `krishna-aga` CLI account, and explicitly limited the project to the $5,000 Build an Aqua App track.

Codex researched primary sources, ran the automated checks and local/fork executions, and inspected browser screenshots. These are **AI-performed checks**, not evidence of independent human review. The research seed pasted by the user was attributed to Claude; its speculative competition/prize estimates were not adopted as project facts.

Git author `Krishna` follows the owner's requested repository-local configuration. It does **not** imply that Krishna manually wrote every line or personally performed the recorded tests. Commit timestamps have not been fabricated.

## Human contribution still needs to be documented

At this review, the conversation establishes direction and product decisions. It does not establish independent human implementation, mathematical review, testing or a personally recorded demo. No such contribution is asserted here.

[ETHOnline's AI rules](https://ethglobal.com/events/ethonline2026/info/details) permit assistance, require disclosure, and say that entirely AI-produced submissions without meaningful team contributions may be ineligible. We cannot certify compliance with that involvement requirement solely from this repository. The team must truthfully document work it actually performs and resolve any eligibility uncertainty with the organizers; this file is not a workaround for that rule.

For each completed contribution, record the person's name, date, concrete work, relevant commit/test/review evidence and what they concluded or changed. Do not fill this section with planned work, a rubber-stamp review or invented authorship.

**Confirmed additional human contributions:** no independent implementation or review is inferred from the solo-builder confirmation. Krishna is handling the submission and any further contribution details.

## New and reused material

Project-specific local commits begin on 2026-09-11. Any project work predating the event outside this repository still requires disclosure. The registration track has not been independently checked.

Reused sources are the pm-AMM research, pinned Aqua/SwapVM/Solidity Utils submodules, OpenZeppelin and other listed npm dependencies, Manrope and Lucide. See `THIRD_PARTY_NOTICES.md` for provenance and licenses. No generated raster assets or AI voiceover are included.

Direction and planning artifacts are retained in `PRODUCT.md`, `DESIGN.md`, `docs/design-direction.md`, `docs/research.md`, `docs/math.md`, `docs/architecture.md` and `docs/ux.md`. No OpenSpec/Kiro/spec-kit workflow was used. This disclosure summarizes the development instructions; it is not represented as a full model transcript.
