# Dayna's Words — Verbatim

**This file is the highest-authority requirements source after a live correction.**

Everything in `## DAYNA'S WORDS` is quoted exactly, typos included. It is never
paraphrased, summarized, tidied, or "cleaned up." Anything an agent concludes
from it goes under `## DERIVED` and is labelled as inference.

This separation is the project's central rule. It is applied here, to the build
record, because the record is where it was first broken: a previous agent's line
("we will have version: 1 … version: 100 … forbidden from discarding") was
carried forward for fifteen builds as if Dayna had said it. She had not.

An agent inference may never be recorded as Dayna's requirement.

---

## DAYNA'S WORDS — on how she works (source: transcript #14)

> "yes and i talk - i input through voice text and exchanges just like this - i
> will edit my own emails and drafts through 100 versions and edits - you have
> to maintain the contiuity until each word is where i want it - and know when i
> am brainstorming and when i am wanting actual help refining for getting things
> to land - but things are never a new draft unless i say "start over or
> something" - the memory has to hold - i talk out loud like im processing with
> you not at you"

### DERIVED requirements (inference — labelled as such)

- **R-VOICE-1** Primary input is conversational/voice-text stream, not forms.
- **R-MODE-1** The system must distinguish **BRAINSTORMING** from **REFINING**
  and know which mode a topic is in.
- **R-MODE-2** Default posture is *passive listening*. Talking out loud is
  processing, not instruction. Do not act on a casual thought.
- **R-DRAFT-1** **Never start a new draft unless Dayna says so** ("start over"
  or similar). No agent may reset a document on its own judgement.
- **R-CONT-1** Continuity holds across long edit sequences "until each word is
  where i want it." A casual remark must never overwrite crafted text.
- **R-CONT-2** "the memory has to hold" — continuity survives sessions, devices,
  and model changes.

### OPEN — not decided, not guessed

**Retention policy.** "100 versions and edits" describes how she works; it is
not a stated retention mandate. How far back she expects to reach is
**unresolved** and must be answered by Dayna, not inferred. Until then no schema
commits to a retention number.

---

## DAYNA'S WORDS — on agents and pace (source: transcript #16)

> "and i do like 10 different jobs and tasks - im running one businesses then
> writing resumes for another - its all built out in the docs for this dashboard
> but this is not perfect that is why we are going to refine this llm and mcp
> with rubrics and why the agents cant have agent married to projects with
> specific work - the agent is definied but that task may change in a week - we
> are going to build out a complex buisiness, tackle past work we didnt finish
> this year and i will want to crank out websites in a day - i move fast -
> change gears constantly and this build of a dashboard is prepped for the
> FOUNDATION of my needs - be ready to evolve with me"

### DERIVED requirements

- **R-RUBRIC-1** **Rubrics are Dayna's requirement, in her own words.** The LLM
  and MCP are refined with rubrics. (Directive §8 specifies 14 elements each.)
- **R-ROLE-1** Agents are **defined roles, not project-bound**. An agent is
  never married to a project; its task may change in a week.
- **R-ROLE-2** Capability-based dynamic routing. Pivoting domains must not
  require reconfiguration.
- **R-EVOLVE-1** Foundation must absorb new capability without rebuild.
- **R-CTX-1** Rapid context-switching across ~10 concurrent job types.

---

## DAYNA'S WORDS — on what this is for (source: transcript #13)

> "TIME - simply put - i spent one year building a business... i need to
> accomplish about 5 days of work in 4 hours everyday and i normally use ai to
> do all of it - but a is making life harder not easier now... i have nothing
> left to invest - energy, time or money"

> "i want work fast and you to know my brain how it works emotional intelligence
> - like yesterday"

### DERIVED requirements

- **R-TIME-1** The governing constraint is **TIME**. Every decision is filtered
  through: *does this reduce what Dayna has to manage?*
- **R-TIME-2** She must never be required to administer the technical machinery.
  No git, no repos, no terminal, no manual routing.
- **R-TIME-3** Cheapest-on-paper is wrong when it costs her hours. Her time is
  the scarce resource, not the monthly bill.

---

## Provenance note on a rejected claim

**"100 versions, never discard" is NOT Dayna's requirement.** It originates in a
prior agent's transcript (#15): *"We will have version: 1, version: 2, …
version: 100. The system will be explicitly forbidden from discarding the
previous version."* That is agent inference. It was inherited as fact and drove
schema and cost decisions for fifteen builds.

Her requirement is **continuity**, quoted above. The two are different problems.
