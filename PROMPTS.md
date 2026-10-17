# Prompts and AI review notes

Tool: Claude Code (Claude Opus 5.5), run in the terminal against this repo.

## Prompt 1: setup, spec, build, test, PR

Context I attached: the interviewer's task brief (screenshot), plus a mentor's checklist covering the `Person` type, a pure `filterPeople`, a controlled input, `map` with keys, the empty-state copy, Vitest cases, PROMPTS.md and the README.

The prompt, verbatim:

```
setup react.js web with these requirements:

* framework: vite.js
* syntax: typescript
* state management: zustand
* test: vitest
* UI lib: shadcn
* define all necessary utils, classes, functions

After done the initial step, define the specs of features and start to build,
then well-test all functions and create PR to main
```

**Why I wrote it this way:**
- I named the exact stack, so the AI had no room to pick its own (for example, Redux or plain CSS).
- I split the work into ordered steps: setup → spec → build → test → PR. Writing the spec first gave me something to check the code against.
- "Well-test all functions" sets a clear bar for testing.

**How the AI worked:**
1. It scaffolded `web/` with `npm create vite@latest web -- --template react-ts`, then added Tailwind v4, the `@/` path alias, Vitest (jsdom) and shadcn (`input`, `card`, `badge`, `avatar`).
2. It wrote [`web/SPEC.md`](web/SPEC.md) **before** any feature code. Each filtering rule (R1–R9) and UI behaviour (U1–U6) has an id, so tests can point back to the spec.
3. It built pure logic first (`text.ts`, `filter-people.ts`), then the store, then the components.
4. It ran `vitest`, `tsc -b`, `oxlint` and `vite build` after the changes.

## What I checked or corrected after the AI's output

| # | Problem | How it was caught | Fix |
|---|---------|-------------------|-----|
| 1 | `shadcn init -y` still stopped at an interactive "Which preset?" prompt and failed | The command errored | Re-ran it with `-t vite -b radix -p nova` |
| 2 | The first UI had **two buttons labelled "Clear search"** once the empty state was showing (the X in the input and the button in the empty state). That's ambiguous for screen readers. | The RTL test `getByRole('button', { name: 'Clear search' })` failed with "multiple elements found". **The test caught a real a11y bug.** | Renamed the empty-state button to "Show everyone" and updated SPEC U4 |
| 3 | The first draft of the "store changes from outside the input" test used `Promise.resolve().then(...)` to wait for re-render. That's fragile and hides React `act()` warnings. | Reviewing the test code | Replaced it with `act(() => setQuery('marcus'))` and plain assertions |
| 4 | An obvious approach is `useDirectoryStore(s => filterPeople(s.people, s.query))`. In Zustand v5 that returns a new array on every call, so `useSyncExternalStore` loops forever. | Known pitfall; checked during design | Derived the list in `useFilteredPeople()` with two primitive selectors plus `useMemo`. A test asserts the reference stays stable across re-renders. |
| 5 | Case-insensitive matching alone doesn't handle Vietnamese names: "duc" wouldn't find "Đức", and `normalize('NFD')` doesn't split "đ" | Thought about the data and added test cases | `normalizeText` maps đ/Đ to d/D explicitly, with tests |

**What I did not verify:** I haven't clicked through the UI in a browser or on a phone. The browser tool wasn't connected, so I only confirmed with curl that the dev server serves and compiles the app. That's listed under "Not yet checked by hand" in the README.

## Prompting habits I used

- **Give types and constraints up front:** the `Person` shape, "pure function", "controlled input", "name only".
- **Small steps, each one verified:** typecheck after the components, run tests after every test file, build before the PR.
- **Spec first, then code to match it.** The rule ids make review fast.
- **Don't trust output that hasn't run.** Correction #2 above only surfaced because the tests actually ran.

## Next prompt (mobile)

```
Add mobile/ with `npx create-expo-app@latest mobile --template blank-typescript`.
Reuse the exact Person type, PEOPLE data and filterPeople from web/src (copy for now;
note a shared package as follow-up). UI: controlled TextInput, FlatList with
keyExtractor={p => p.id}, and the same "No one matches \"xyz\"" empty state via
ListEmptyComponent. Keep the diff small; no new state library unless needed.
Add a Vitest test for filterPeople in mobile too, and tell me exactly what you ran.
```
