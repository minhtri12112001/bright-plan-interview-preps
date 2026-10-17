# bright-plan-interview-preps

Practice task: a small, searchable team directory of five fictional people. You can filter by name, and an empty state appears when nothing matches. Local data only.

| Folder | Stack | Status |
|--------|-------|--------|
| [`web/`](web/) | Vite · React 19 · TypeScript · Zustand · shadcn/ui (Tailwind v4) · Vitest + React Testing Library · Playwright | Done |
| `mobile/` | Expo / React Native | Not started |

- Feature spec: [`web/SPEC.md`](web/SPEC.md)
- AI prompts and review notes: [`PROMPTS.md`](PROMPTS.md)

## Run it

Requires Node 22.22+, 24.15+, or 26+, because of the jsdom/Vitest engine ranges. Developed on Node 26.7 / npm 11.

```bash
cd web
npm install
npm run dev        # http://localhost:5173
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
├── types/person.ts           # type Person = { id; name; role }
├── data/people.ts            # 5 fictional people
├── lib/
│   ├── text.ts               # normalizeText, getInitials, formatPeopleCount
│   └── filter-people.ts      # filterPeople(people, query), pure
├── store/directory-store.ts  # Zustand: { people, query, setQuery, clearQuery } + useFilteredPeople()
└── features/directory/
    ├── TeamDirectory.tsx     # connects the store to presentational components
    └── components/           # SearchInput, PeopleList, PersonCard, EmptyState
```

- **`filterPeople`** trims the query, collapses internal whitespace, ignores case and diacritics ("duc" finds "Đức"), and does a substring match on `name` only. A blank query returns everyone. It never mutates its input.
- **Controlled input:** `value` comes from the Zustand `query` and `onChange` calls `setQuery`. The store keeps the *raw* query and does not trim it, so the input never moves the cursor out from under the user.
- **Derived state:** the filtered list is computed with `useMemo` inside `useFilteredPeople()` and never stored. It is also not computed inside the Zustand selector, because a selector that returns a new array on every call makes `useSyncExternalStore` re-render forever. With 5 items, `useMemo` saves almost nothing. It's there to keep the array reference stable and to show the pattern.
- **List keys:** `people.map(...)` with `key={person.id}`, never the array index. Indexes shift as the list is filtered.
- **Accessibility:** the search field has a visible `<label>`, and the result count is in an `aria-live="polite"` region. The inline "Clear search" button and the empty state's "Show everyone" button have different labels, and both return focus to the input.

## What was tested, and where

**Unit/component:** 45 Vitest tests across 5 files, all passing.

| File | Covers |
|------|--------|
| `lib/filter-people.test.ts` | Partial match, case-insensitive, no match gives `[]`, trimming, blank query, name-only (role ignored), diacritics, whitespace collapse, order preserved, no mutation, empty input |
| `lib/text.test.ts` | `normalizeText`, `getInitials`, `formatPeopleCount` edge cases |
| `data/people.test.ts` | 5 people, unique ids (safe as React keys), no blank fields |
| `store/directory-store.test.ts` | `setQuery` (raw value), `clearQuery`, `useFilteredPeople` derivation and reference stability |
| `features/directory/TeamDirectory.test.tsx` | RTL with `user-event`: initial render, typing filters, empty state quotes the trimmed query, both clear actions restore the list and refocus the input, store changes from outside the input show up in the UI |

**End-to-end:** 7 Playwright tests (`web/e2e/team-directory.spec.ts`), each run in two projects: **desktop** (Desktop Chrome, 1280×720) and **mobile** (Pixel 7 emulation, 412×839, touch). 14/14 passing. Playwright starts the Vite dev server itself, or reuses one that's already running.

| Test | Checks |
|------|--------|
| U1 | Page title and heading, empty input, 5 people with name and role, "5 people" |
| U2 | Typing `A` → `AN` → `AN N` narrows 5 → 2 → 1 on each keystroke (case-insensitive partial match) |
| R7 | `duc tran` finds "Đức Trần" (diacritics, including đ) |
| U3 | `"  xyz "` shows `No one matches "xyz"`, hides the list, and shows "0 people" |
| U4a | Inline "Clear search" appears only when there's a query, resets the list, and refocuses the input |
| U4b | Empty state's "Show everyone" resets the list and refocuses the input |
| U5 | Count is in an `aria-live="polite"` region and updates to "1 person" |

Each test saves full-page screenshots to [`web/e2e/screenshots/`](web/e2e/screenshots/) (`desktop/` and `mobile/`). They are also attached to the HTML report (`npx playwright show-report`).

**Also checked:** `tsc -b` passes and `vite build` succeeds.

**Not checked:** a physical phone. "Mobile" here means Chromium emulating a Pixel 7 viewport, not a real device or Safari/WebKit.

## Not done yet

- **Mobile (Expo) version:** not started.
- **Shared `core` package** so web and mobile reuse `Person`, `PEOPLE` and `filterPeople` instead of keeping copies.
- **Debounced search:** not needed for 5 local items, but worth adding for a large or remote list.
- **Highlighting the match** in names, and optionally matching on role.
- **Dark-mode toggle:** shadcn theme tokens for dark mode exist, but nothing switches them on.
