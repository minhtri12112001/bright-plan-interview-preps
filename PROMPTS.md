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

## Prompt 2: end-to-end tests and screenshots

```
start local server and run e2e tests with playwright then screenshot all tests and put in PR
```

**How the AI worked:** it added `@playwright/test` with two projects (Desktop Chrome and Pixel 7) and a `webServer` that starts or reuses `vite dev`. It wrote 7 tests that map to the spec ids (U1–U5, R7), with a `snap()` helper that saves named screenshots per project. It started the dev server, ran the suite, and then **looked at the screenshots** before putting them in the PR.

| # | Problem | How it was caught | Fix |
|---|---------|-------------------|-----|
| 6 | The first draft of the U2 test typed `O` and expected 2 matches. Only "Olivia Park" contains an "o". | Re-reading the test against the data before running it | Changed the input to `A` → `AN` → `AN N`, which narrows 5 → 2 → 1 |
| 7 | **Layout bug:** the card stretched to the full viewport height and left a large empty area below the list. Very visible on mobile. `<main>` was `flex` with the default `align-items: stretch`. | **Looking at the e2e screenshots.** Unit tests in jsdom can't catch layout problems. | Added `items-start` to `<main>`, regenerated the screenshots, and re-ran both suites |

**What I did not verify:** a physical phone. The "mobile" run is Chromium emulating a Pixel 7 viewport.

## Prompt 3: Linear-style issues

```
Now create basic ticket management as Linear and test it with team members
```

**How the AI read it:** "with team members" means the five people from the directory are the assignees. Testing it means assigning, filtering and pre-assigning for **each** of them, not just one. "Basic" means a list grouped by status, create/edit/delete, and row menus for status, priority and assignee. A board view, labels and a backend are listed as not done.

**How the AI worked:**
1. It appended the Issues spec to [`web/SPEC.md`](web/SPEC.md) first, with ids for the logic (T1–T9) and behaviours (I1–I8).
2. It built pure functions in `lib/tickets.ts` (clock passed in as `now`), then the Zustand store with `persist`, then the components. Assignees are read from the directory store, so there's one team list.
3. It reused lessons from prompts 1–2:
   - The empty state's button is "Show all issues", not a second "Clear filters" (the a11y bug from #2).
   - The derived list uses `useMemo` over primitive selectors (the selector pitfall from #4).
4. It wrote 131 new unit and component tests and 13 new Playwright tests. The person-specific tests run once for each of the five teammates (`it.each(PEOPLE)` and a loop in Playwright).
5. All 39 component tests passed on the first run, which was suspicious. So it **deliberately broke the code** to confirm the tests can fail:
   - It removed the `C` shortcut's `preventDefault` and then its typing guard. Each time the matching test failed.
   - It added a `console.warn` to the app, and the new e2e console guard failed.

   It restored the code after each check.
6. It ran the e2e suite and **looked at every screenshot** before calling it done.

| # | Problem | How it was caught | Fix |
|---|---------|-------------------|-----|
| 8 | A route test expected `"issues"` (no `#`) to fall back to the team page. `location.hash` always starts with `#` or is empty, so the case can't happen. The test was wrong, not the code. | The test failed, and reading why showed the input was impossible | Removed that case |
| 9 | The "Low" and "Medium" priority icons looked like stray dots. Lucide's signal icons draw only the lit bars. | **Screenshots** | Custom three-bar icon with the unlit bars dimmed, as Linear does |
| 10 | On a phone, one-line titles were cut to a few words ("Write e2e tests for the iss…") | **Screenshots** (mobile) | Two lines on small screens (`line-clamp-2`), one line from `sm` up |
| 11 | Moving `snap()` into `e2e/helpers.ts` broke `tsc -b`: the `nodenext` config wants `./helpers.ts`. Playwright ran fine, so only the typecheck caught it. | Running `npm run typecheck`, not just the tests | Import with the `.ts` extension (`allowImportingTsExtensions` was already on) |
| 12 | Gap: e2e tests would pass even if React or Radix logged errors, such as a dialog missing its title | Reviewing what the e2e suite could and couldn't see | Each test now fails on any console error, warning or page error. Proven with an injected warning. |

**What I did not verify:** a real phone or Safari. Two browsers sharing data: issues live in each browser's `localStorage`.

## Prompting habits I used

- **Give types and constraints up front:** the `Person` shape, "pure function", "controlled input", "name only".
- **Small steps, each one verified:** typecheck after the components, run tests after every test file, build before the PR.
- **Spec first, then code to match it.** The rule ids make review fast.
- **Don't trust output that hasn't run.** Correction #2 above only surfaced because the tests actually ran.
- **Don't trust a test that has never failed.** Break the code on purpose and watch the right test go red (prompt 3, step 5).
- **Look at the screenshots, not just the green ticks.** Corrections #7, #9 and #10 were all visual, and no assertion would have caught them.

## Next prompt (mobile)

```
Add mobile/ with `npx create-expo-app@latest mobile --template blank-typescript`.
Reuse the exact Person type, PEOPLE data and filterPeople from web/src (copy for now;
note a shared package as follow-up). UI: controlled TextInput, FlatList with
keyExtractor={p => p.id}, and the same "No one matches \"xyz\"" empty state via
ListEmptyComponent. Keep the diff small; no new state library unless needed.
Add a Vitest test for filterPeople in mobile too, and tell me exactly what you ran.
```
