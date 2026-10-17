# Team Directory (web) — Feature Spec

A small searchable directory of five fictional teammates. Local data only: no backend, no routing, no persistence.

## F1. Data model

- `type Person = { id: string; name: string; role: string }` (`src/types/person.ts`)
- `PEOPLE` has exactly 5 fictional people with unique, non-empty `id`s (`src/data/people.ts`)

## F2. Filtering: `filterPeople(people, query)`

Pure function in `src/lib/filter-people.ts`. It never mutates its input.

| # | Rule | Example |
|---|------|---------|
| R1 | Leading and trailing whitespace in the query is ignored | `"  ava "` behaves like `"ava"` |
| R2 | An empty or whitespace-only query returns every person, in the original order | `""` gives all 5 |
| R3 | Matching ignores case | `"AVA"` matches `"Ava Chen"` |
| R4 | Matching is a substring match anywhere in the name | `"li"` matches `"Olivia Park"` |
| R5 | Only `name` is matched. `role` is not | `"engineer"` matches no one |
| R6 | No match returns `[]` | `"xyz"` gives `[]` |
| R7 | Matching ignores diacritics | `"an"` matches `"Ân Nguyễn"`, `"duc"` matches `"Đức"` |
| R8 | Runs of internal whitespace collapse to one space | `"ava   chen"` matches `"Ava Chen"` |
| R9 | Results keep the original list order | |

Helpers in `src/lib/text.ts`:
- `normalizeText(value)`: trim, collapse whitespace, strip diacritics, lowercase. Shared by the query and the name, so both sides go through the same steps.
- `getInitials(name)`: up to 2 uppercase initials for the avatar fallback (`"Ava Chen"` gives `"AC"`, `"Cher"` gives `"C"`, `""` gives `"?"`).

## F3. State: Zustand store

`src/store/directory-store.ts`:

```ts
type DirectoryState = { people: Person[]; query: string }
type DirectoryActions = { setQuery(q: string): void; clearQuery(): void }
```

- `query` holds the raw text the user typed. It is not trimmed, so the controlled input never fights the cursor.
- The filtered list is **derived** at render time with `useMemo(filterPeople(people, query))` in `useFilteredPeople()`. It is never stored, so it can't go stale. It also isn't computed inside the Zustand selector, because a selector that returns a new array on every call causes an infinite re-render under `useSyncExternalStore`.
- `people` lives in the store so tests can seed it.

## F4. UI

`src/features/directory/`:

| Component | Responsibility |
|-----------|----------------|
| `TeamDirectory` | Page shell: header, search, result count, list or empty state |
| `SearchInput` | **Controlled** `<Input>` (`value` = store `query`, `onChange` calls `setQuery`), visible label, search icon, clear button shown only when the query is non-empty |
| `PeopleList` | `<ul>` rendered with `people.map(...)` and `key={person.id}` |
| `PersonCard` | Avatar initials, name, role badge |
| `EmptyState` | `No one matches "<trimmed query>"` plus a "Show everyone" action |

Behaviour:
- U1: Initial render shows all 5 people, and the count reads "5 people".
- U2: Typing filters the list on every keystroke.
- U3: When nothing matches, the list is replaced by the empty state, which quotes the trimmed query.
- U4: The inline "Clear search" button and the empty state's "Show everyone" button (labelled differently so screen readers can tell them apart) both reset the query, show all people again, and move focus back to the input.
- U5: The result count is in an `aria-live="polite"` region so screen readers announce changes.
- U6: The count uses the correct plural: "1 person" / "N people".

## F5. Tests (Vitest + React Testing Library)

- `filterPeople`: each rule R1–R9, plus a check that the input isn't mutated
- `normalizeText` / `getInitials`: edge cases
- store: `setQuery` / `clearQuery`
- `PEOPLE` data: 5 entries, unique ids
- `TeamDirectory`: U1–U4 and U6 through real user events

## Out of scope / follow-ups

- Debounced search. Not needed for 5 local items; worth adding for large or remote lists.
- Matching on role, and highlighting the matched substring.
- A shared `core` package so web and mobile reuse `Person`, `PEOPLE` and `filterPeople`.
- The React Native (Expo) version.
