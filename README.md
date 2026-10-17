# bright-plan-interview-preps

Practice task: a small, searchable team directory of five fictional people. You can filter by name, and an empty state appears when nothing matches. Local data only.

Extension: a basic **Linear-style issue tracker** for the same five people. You can create, edit and delete issues, change status, priority and assignee from each row, and filter by teammate. Issues are saved in the browser.

| Folder | Stack | Status |
|--------|-------|--------|
| [`web/`](web/) | Vite · React 19 · TypeScript · Zustand · shadcn/ui (Tailwind v4) · Vitest + React Testing Library · Playwright | Team Directory: done. Issues: done (basic) |
| `mobile/` | Expo / React Native | Not started |

- Feature spec: [`web/SPEC.md`](web/SPEC.md) (Team Directory, then Issues)
- AI prompts and review notes: [`PROMPTS.md`](PROMPTS.md)

## Run it

Requires Node 22.22+, 24.15+, or 26+, because of the jsdom/Vitest engine ranges. Developed on Node 26.7 / npm 11.

```bash
cd web
npm install
npm run dev        # http://localhost:5173 (Team), http://localhost:5173/#/issues (Issues)
npm test           # Vitest, single run
npm run test:watch
npm run test:e2e   # Playwright; first time: npx playwright install chromium
npm run typecheck  # tsc -b
npm run lint       # oxlint
npm run build
```

## How it's built (web)

```
web/src/
├── App.tsx                   # top nav + hash route: #/team (default) or #/issues
├── components/AppNav.tsx     # "Team" / "Issues" links, aria-current on the active one
├── hooks/use-hash-route.ts   # useSyncExternalStore over hashchange; no router library
├── types/
│   ├── person.ts             # type Person = { id; name; role }
│   └── ticket.ts             # Ticket, TicketStatus, TicketPriority, filters
├── data/
│   ├── people.ts             # 5 fictional people
│   └── tickets.ts            # 7 seed issues covering every status and teammate
├── lib/
│   ├── text.ts               # normalizeText, getInitials, formatPeopleCount
│   ├── filter-people.ts      # filterPeople(people, query), pure
│   ├── tickets.ts            # validate, build, patch, filter, sort, group: all pure
│   └── routes.ts             # parseRoute, routeHref, page titles
├── store/
│   ├── directory-store.ts    # Zustand: { people, query } + useFilteredPeople()
│   └── ticket-store.ts       # Zustand + persist: { tickets, nextNumber, filters } + useVisibleTickets()
└── features/
    ├── directory/            # TeamDirectory + SearchInput, PeopleList, PersonCard, EmptyState
    └── issues/               # IssuesPage + toolbar, group, row, property menus, form, dialogs
```

**Team Directory**
- **`filterPeople`** trims the query, collapses internal whitespace, ignores case and diacritics ("duc" finds "Đức"), and does a substring match on `name` only. A blank query returns everyone. It never mutates its input.
- **Controlled input:** `value` comes from the Zustand `query` and `onChange` calls `setQuery`. The store keeps the *raw* query and does not trim it, so the input never moves the cursor out from under the user.
- **Derived state:** the filtered list is computed with `useMemo` inside `useFilteredPeople()` and never stored. It is also not computed inside the Zustand selector, because a selector that returns a new array on every call makes `useSyncExternalStore` re-render forever. With 5 items, `useMemo` saves almost nothing. It's there to keep the array reference stable and to show the pattern.
- **List keys:** `people.map(...)` with `key={person.id}`, never the array index. Indexes shift as the list is filtered.
- **Accessibility:** the search field has a visible `<label>`, and the result count is in an `aria-live="polite"` region. The inline "Clear search" button and the empty state's "Show everyone" button have different labels, and both return focus to the input.

**Issues**
- **One team list:** assignees come from the directory store's `people`, so the Issues page and the Team page can't disagree about who is on the team. An issue whose assignee isn't on the team shows "Unassigned" instead of crashing.
- **Pure logic first:** everything in `lib/tickets.ts` takes data and returns new data. `buildTicket` and `applyTicketPatch` take `now` as a parameter, so tests don't depend on the clock. `applyTicketPatch` returns the *same* object when nothing changed, and the store then skips the update entirely.
- **Ids:** `ENG-<number>`, where `nextNumber` only goes up. Deleting `ENG-8` never hands `ENG-8` out again, as in Linear.
- **Persistence:** Zustand `persist` saves `tickets` and `nextNumber` to `localStorage`. Filters are view state, so they reset on reload.
- **Derived view:** `useVisibleTickets()` runs filter → sort → group in one `useMemo`, the same pattern as `useFilteredPeople()`. Groups go In Progress → Todo → Backlog → Done → Canceled, so active work comes first, and empty groups are hidden. Inside a group, issues sort by priority, then newest first.
- **Forms:** the create and edit dialogs share `IssueForm`. Its draft lives in local `useState`, not Zustand, because nothing else needs it and it should vanish when the dialog closes. It uses native `<select>`s, so phones get their own pickers.
- **Linear touches:** press `C` to create an issue. The shortcut is ignored while typing or while a menu or dialog is open. Ctrl/⌘+Enter submits a form. When the list is filtered to a teammate, a new issue is pre-assigned to them.
- **Accessibility:** each row menu's trigger is announced as "Status: Todo", "Priority: High" or "Assignee: Ava Chen". Delete asks for confirmation in an alert dialog. The empty state's "Show all issues" button is labelled differently from the toolbar's "Clear filters"; the directory's duplicate "Clear search" labels taught that.

## What was tested, and where

**Unit/component:** 176 Vitest tests across 10 files, all passing.

| File | Tests | Covers |
|------|------:|--------|
| `lib/filter-people.test.ts` | 13 | Partial match, case-insensitive, no match gives `[]`, trimming, blank query, name-only (role ignored), diacritics, whitespace collapse, order preserved, no mutation, empty input |
| `lib/text.test.ts` | 17 | `normalizeText`, `getInitials`, `formatPeopleCount` edge cases |
| `data/people.test.ts` | 3 | 5 people, unique ids (safe as React keys), no blank fields |
| `store/directory-store.test.ts` | 6 | `setQuery` (raw value), `clearQuery`, `useFilteredPeople` derivation and reference stability |
| `features/directory/TeamDirectory.test.tsx` | 6 | RTL with `user-event`: initial render, typing filters, empty state, both clear actions, store changes from outside |
| `lib/tickets.test.ts` | 58 | Title validation, defaults and trimming, patch semantics (`undefined` = leave it, same object when unchanged, no mutation), filter by title / id / diacritics / unassigned / **each teammate**, priority sort, status grouping, the `C` shortcut guard |
| `lib/routes.test.ts`, `hooks/use-hash-route.test.ts` | 15 | Hash parsing and fallbacks, `hashchange` updates, unsubscribe on unmount |
| `store/ticket-store.test.ts` | 19 | Create/update/delete, numbers never reused, a new issue for **each teammate**, filters, what `persist` writes (not the filters), rehydrating from storage, `useVisibleTickets` |
| `features/issues/IssuesPage.test.tsx` | 39 | RTL with `user-event`: grouped render, create (validation, every field, defaults, Enter, Ctrl+Enter, `C`, `C` while typing, Cancel), filter to **each teammate** and pre-assign, assign **each teammate** from the row menu, status/priority menus, edit, delete with confirmation, search, empty states |

**End-to-end:** 20 Playwright tests (`web/e2e/`), each run in two projects: **desktop** (Desktop Chrome, 1280×720) and **mobile** (Pixel 7 emulation, 412×839, touch). 40/40 passing. Playwright starts the Vite dev server itself, or reuses one that's already running. **Every test also fails if the page logs a console error or warning, or throws.** I checked the guard works by adding a `console.warn` to the app and watching the test fail.

| Test | Checks |
|------|--------|
| U1 | Page title and heading, empty input, 5 people with name and role, "5 people" |
| U2 | Typing `A` → `AN` → `AN N` narrows 5 → 2 → 1 on each keystroke |
| R7 | `duc tran` finds "Đức Trần" (diacritics, including đ) |
| U3 | `"  xyz "` shows `No one matches "xyz"`, hides the list, and shows "0 people" |
| U4a / U4b | "Clear search" and "Show everyone" reset the list and refocus the input |
| U5 | Count is in an `aria-live="polite"` region and updates to "1 person" |
| I1 | `#/issues` shows the 7 seed issues in 5 status groups, active nav link, page title |
| I2 | Blank title is rejected; a filled-in issue assigned to Ân Nguyễn appears as `ENG-8` at the top of In Progress |
| I2s | `C` opens the dialog, but not while typing in search; Ctrl/⌘+Enter creates |
| I3 ×5 | **Once per teammate:** filtering shows exactly their issues with their initials, and a new issue is pre-assigned to them |
| I4 | Row menus: status (the row moves group), priority (re-sorts), assignee |
| I5 | Edit title and assignee, then delete behind the confirmation dialog |
| I6 | Search by id and title, combined with the assignee filter, then the empty state and "Show all issues" |
| I7 | A created issue, a status change and a delete all survive a reload; filters reset |
| N1 | Top nav switches pages, and the directory keeps its search after going back |

Each test saves full-page screenshots to [`web/e2e/screenshots/`](web/e2e/screenshots/) (`desktop/` and `mobile/`). They are also attached to the HTML report (`npx playwright show-report`). I looked through them, and they caught two visual problems the assertions couldn't (see PROMPTS.md #9 and #10).

**Also checked:** `tsc -b` passes, `vite build` succeeds, and `oxlint` reports 0 errors. Its 3 warnings are all in files this work didn't change: two shadcn components and `vite.config.ts`.

**Not checked:** a physical phone. "Mobile" here means Chromium emulating a Pixel 7 viewport, not a real device or Safari/WebKit. Issues are stored per browser, so two people never see each other's changes.

## Not done yet

- **Mobile (Expo) version:** not started.
- **Issues:** no board (kanban) view or drag-and-drop; no labels, projects, cycles, comments or due dates; no backend or multi-user sync; no undo after delete. A new issue that the current filters hide just doesn't appear. Linear would show a toast with a link.
- **Shared `core` package** so web and mobile reuse `Person`, `PEOPLE` and `filterPeople` instead of keeping copies.
- **Debounced search:** not needed for 5 local items, but worth adding for a large or remote list.
- **Highlighting the match** in names, and optionally matching on role.
- **Dark-mode toggle:** shadcn theme tokens for dark mode exist, but nothing switches them on.
