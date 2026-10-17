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
- Playwright e2e (`e2e/`): U1–U5 and R7 in real Chromium, desktop and Pixel 7 viewports, with screenshots per test

## Out of scope / follow-ups

- Debounced search. Not needed for 5 local items; worth adding for large or remote lists.
- Matching on role, and highlighting the matched substring.
- A shared `core` package so web and mobile reuse `Person`, `PEOPLE` and `filterPeople`.
- The React Native (Expo) version.

---

# Issues (Linear-style tickets) — Feature Spec

Basic issue tracking for the same five teammates. Issues live in the browser: Zustand `persist` saves them to `localStorage`. There is no backend and no multi-user sync.

## I-F1. Data model

`src/types/ticket.ts`:

```ts
type TicketStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled'
type TicketPriority = 'none' | 'urgent' | 'high' | 'medium' | 'low'
type Ticket = {
  id: string                // "ENG-7": team key + number. Unique, used as the React key
  number: number            // 7. Never reused, even after a delete
  title: string             // trimmed, 1–120 characters
  description: string       // trimmed, may be empty
  status: TicketStatus
  priority: TicketPriority
  assigneeId: string | null // a Person['id'] from the team directory, or null
  createdAt: string         // ISO 8601
  updatedAt: string
}
```

Seed data (`src/data/tickets.ts`): 7 example issues covering every status and every teammate, plus one unassigned, so the first screen isn't empty.

## I-F2. Pure logic: `src/lib/tickets.ts`

| # | Function | Rule |
|---|----------|------|
| T1 | `validateTicketTitle(title)` | Required after trimming, at most 120 characters. Returns an error message or `null` |
| T2 | `buildTicket(input, { number, now })` | Trims title and description, sets `id = "ENG-<number>"` and `createdAt = updatedAt = now`. Defaults: status Todo, No priority, unassigned. Throws on an invalid title |
| T3 | `applyTicketPatch(ticket, patch, now)` | Returns a new ticket with the patch applied and `updatedAt = now`. Same title rules as T2. Returns the same object when nothing changed. Never mutates |
| T4 | `filterTickets(tickets, filters)` | `query` matches the title or the id through `normalizeText` (case, diacritics, whitespace). `assignee` is `all`, `unassigned` or a person id. Both filters must match |
| T5 | `sortTickets(tickets)` | Urgent → High → Medium → Low → No priority, then newest (higher number) first. Doesn't mutate |
| T6 | `groupTicketsByStatus(tickets)` | Groups in display order In Progress → Todo → Backlog → Done → Canceled, keeping the order inside each group. Every status is present, even when empty; the UI hides empty groups |
| T7 | `findAssignee(people, assigneeId)` | The matching `Person`, or `undefined` for `null` or an unknown id. The UI shows "Unassigned" |
| T8 | `formatIssueCount(count)` | "1 issue" / "N issues" |
| T9 | `shouldIgnoreShortcut(target)` | `true` when focus is in an input, textarea, select, contenteditable, menu or dialog, so typing "c" there never opens the create dialog |

## I-F3. State: `src/store/ticket-store.ts`

- State: `{ tickets, nextNumber, filters: { query, assignee } }`.
- Actions: `createTicket(input) → Ticket`, `updateTicket(id, patch)`, `deleteTicket(id)`, `setQuery`, `setAssigneeFilter`, `resetFilters`.
- `nextNumber` only goes up, so ids are never reused after a delete.
- `persist` saves `tickets` and `nextNumber` to `localStorage` (key `team-directory.issues`, version 1). Filters are view state, so they reset on reload.
- `useVisibleTickets()` derives filter → sort → group with `useMemo`, using the same pattern as `useFilteredPeople`.
- Assignees come from the directory store's `people`, so there is one source for the team.

## I-F4. UI and navigation

- A top nav has "Team" (`#/team`, the default) and "Issues" (`#/issues`). The active link has `aria-current="page"`, and the document title follows the route.

`src/features/issues/`:

| Component | Responsibility |
|-----------|----------------|
| `IssuesPage` | Header with "New issue", toolbar, live count, grouped list or empty state, dialogs, `C` shortcut |
| `IssueToolbar` | "Search issues" input, assignee filter (All assignees / Unassigned / each teammate), and "Clear filters" while a filter is active |
| `IssueGroup` | Status heading with icon and count, then a `<ul>` of rows |
| `IssueRow` | Priority menu, id, status menu, title (opens the editor), assignee menu |
| `PropertyMenu` | One dropdown with radio items, used for status, priority and assignee |
| `IssueForm` | Title, description, status, priority and assignee (native selects), with validation. Shared by create and edit |
| `CreateIssueDialog` / `EditIssueDialog` | Wrap `IssueForm`. Edit also has "Delete issue", behind a confirmation |
| `IssuesEmptyState` | "No issues yet", or the no-match message with "Clear filters" |

Behaviour:
- I1: `#/issues` shows the seed issues grouped by status in display order. Empty groups are hidden. The count reads "7 issues".
- I2: "New issue", or pressing `C` while not typing, opens the create dialog with the title focused. A blank title shows "Title is required" and creates nothing. A valid submit (button, Enter in the title, or Cmd/Ctrl+Enter) closes the dialog and adds `ENG-<next number>` to its status group.
- I3: Every teammate from the directory can be assigned. When the assignee filter is set to a teammate, the create form pre-selects that teammate.
- I4: Each row's menus change status, priority and assignee in place. Changing the status moves the row to its new group.
- I5: Clicking a title opens the editor. "Save changes" updates the issue. "Delete issue" asks for confirmation, then removes it.
- I6: Search and the assignee filter combine. When nothing matches, the page shows `No issues match "<trimmed query>"` (or "No issues match these filters" when only the assignee filter is set) and a "Clear filters" button.
- I7: Created, edited and deleted issues survive a page reload.
- I8: The count is in an `aria-live="polite"` region.

## I-F5. Tests

- `lib/tickets.ts`: T1–T9, including no-mutation checks
- `lib/routes.ts` and `useHashRoute`: route parsing and `hashchange`
- store: create/update/delete, numbers never reused, filters, what `persist` writes, and rehydrating from storage
- `IssuesPage` (RTL and user-event): I1–I6 and I8, including filtering by **each** of the five teammates
- Playwright e2e (`e2e/issues.spec.ts`): I1–I7 plus N1 (top nav) in real Chromium, desktop and Pixel 7, with screenshots. I3 runs once per teammate
- Every e2e test, including the directory ones, fails if the page logs a console error or warning, or throws

## Out of scope / follow-ups

- Board (kanban) view and drag-and-drop
- Labels, projects, cycles, comments, sub-issues, due dates
- A backend and multi-user sync; undo after delete
- A toast linking to a new issue that the current filters hide
