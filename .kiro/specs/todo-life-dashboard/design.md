# Design Document: ToDo List Life Dashboard

## Overview

The ToDo List Life Dashboard is a single-page, client-side web application built with plain HTML5, CSS3, and ES6+ Vanilla JavaScript — no frameworks, no build tools, no package managers. It delivers four interactive widgets on one screen:

1. **Greeting Widget** — live clock, date, and time-based greeting
2. **Focus Timer** — 25-minute Pomodoro-style countdown
3. **Todo List** — persistent task manager with add, edit, complete, and delete
4. **Quick Links** — user-defined shortcut buttons that open URLs in new tabs

All state is persisted to the browser's `localStorage`. The app runs directly from the filesystem (`file://`) or any static HTTP server without a build step.

### Design Goals

- **Zero dependencies**: no npm, no bundler, no CDN libraries
- **Single-file per concern**: one HTML, one CSS, one JS
- **Resilient persistence**: graceful degradation when `localStorage` is unavailable or corrupted
- **Accessible**: semantic HTML, ARIA attributes where needed, WCAG 2.1 AA colour contrast

---

## Architecture

The application follows a **module-revealing IIFE** pattern inside `js/app.js`. All code is wrapped in a single immediately-invoked function expression to avoid polluting the global scope. Logical concerns are separated into named factory functions (modules) that communicate through a shared in-memory state object.

```
┌─────────────────────────────────────────────────────────┐
│                        app.js (IIFE)                    │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  GreetingMod │  │  TimerMod    │  │  TodoMod     │  │
│  │  - clock     │  │  - countdown │  │  - tasks[]   │  │
│  │  - greeting  │  │  - controls  │  │  - CRUD ops  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────────────────────────┐ │
│  │  LinksMod    │  │  StorageService                  │ │
│  │  - links[]   │  │  - load / save / safeParse       │ │
│  │  - CRUD ops  │  └──────────────────────────────────┘ │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Interaction
      │
      ▼
  DOM Event Handler (in module)
      │
      ▼
  Mutate in-memory state array
      │
      ├──► StorageService.save(key, data)   ──► localStorage
      │
      └──► renderXxx()  ──► DOM update
```

State is the single source of truth. The DOM is always derived from state; `localStorage` is a persistence mirror of state.

---

## Components and Interfaces

### File Structure

```
index.html
css/
  style.css
js/
  app.js
```

No other files are created or required.

---

### index.html Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Life Dashboard</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <!-- Browser compatibility warning (hidden by default) -->
  <div id="unsupported-banner" class="unsupported-banner" hidden>
    Your browser does not support required features. Please upgrade to a modern browser.
  </div>

  <main class="dashboard-grid">

    <!-- Widget 1: Greeting -->
    <section class="widget widget--greeting" aria-label="Greeting">
      <p id="greeting-text" class="greeting__text"></p>
      <p id="clock-display" class="greeting__clock" aria-live="polite"></p>
      <p id="date-display" class="greeting__date"></p>
    </section>

    <!-- Widget 2: Focus Timer -->
    <section class="widget widget--timer" aria-label="Focus Timer">
      <h2 class="widget__heading">Focus Timer</h2>
      <p id="timer-display" class="timer__display" aria-live="polite">25:00</p>
      <div id="timer-ended" class="timer__ended" hidden aria-live="assertive">
        Session complete!
      </div>
      <div class="timer__controls">
        <button id="timer-start" class="btn btn--primary">Start</button>
        <button id="timer-stop"  class="btn btn--secondary" disabled>Stop</button>
        <button id="timer-reset" class="btn btn--ghost">Reset</button>
      </div>
    </section>

    <!-- Widget 3: Todo List -->
    <section class="widget widget--todo" aria-label="To-Do List">
      <h2 class="widget__heading">To-Do</h2>
      <div class="todo__add-form">
        <input id="todo-input" type="text" maxlength="200"
               placeholder="Add a task…" aria-label="New task description" />
        <button id="todo-add" class="btn btn--primary">Add</button>
      </div>
      <p id="todo-error" class="error-msg" hidden aria-live="polite"></p>
      <ul id="todo-list" class="todo__list" aria-label="Task list"></ul>
    </section>

    <!-- Widget 4: Quick Links -->
    <section class="widget widget--links" aria-label="Quick Links">
      <h2 class="widget__heading">Quick Links</h2>
      <div class="links__add-form">
        <input id="link-label-input" type="text" maxlength="50"
               placeholder="Label" aria-label="Link label" />
        <input id="link-url-input" type="url"
               placeholder="https://…" aria-label="Link URL" />
        <button id="link-add" class="btn btn--primary">Add</button>
      </div>
      <p id="link-error" class="error-msg" hidden aria-live="polite"></p>
      <div id="links-panel" class="links__panel" aria-label="Saved links"></div>
    </section>

  </main>

  <script src="js/app.js"></script>
</body>
</html>
```

---

### CSS Layout (`css/style.css`)

The dashboard uses **CSS Grid** with two equal columns. On a 1280×800 viewport the four widgets fill the screen without vertical scrolling.

```
┌──────────────────┬──────────────────┐
│  Greeting Widget │  Focus Timer     │
│  (col 1, row 1)  │  (col 2, row 1)  │
├──────────────────┼──────────────────┤
│  Todo List       │  Quick Links     │
│  (col 1, row 2)  │  (col 2, row 2)  │
└──────────────────┴──────────────────┘
```

Key CSS rules:

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  height: 100vh;
  gap: 1rem;
  padding: 1rem;
  box-sizing: border-box;
}

/* Responsive: stack to single column below 768px */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    height: auto;
  }
}
```

Typography scale:
- Body: `font-size: 16px` (≥14px requirement)
- Widget headings (`h2`): `font-size: 1.25rem` (≥1.2× body)
- Colour contrast: dark text (`#1a1a2e`) on light background (`#f0f4f8`) — contrast ratio ≥7:1

---

### JavaScript Architecture (`js/app.js`)

The entire application is wrapped in a single IIFE:

```javascript
(function () {
  'use strict';

  // ── Feature detection ──────────────────────────────────────────────
  const StorageService = (function () { /* … */ })();
  const GreetingModule = (function () { /* … */ })();
  const TimerModule    = (function () { /* … */ })();
  const TodoModule     = (function () { /* … */ })();
  const LinksModule    = (function () { /* … */ })();

  // ── Bootstrap ──────────────────────────────────────────────────────
  function init() {
    GreetingModule.init();
    TimerModule.init();
    TodoModule.init();
    LinksModule.init();
  }

  init();
})();
```

#### StorageService

Provides safe `localStorage` access with try/catch guards:

```javascript
const StorageService = (function () {
  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;  // quota exceeded or private-browsing restriction
    }
  }

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      return fallback;  // corrupted JSON
    }
  }

  return { save, load };
})();
```

#### GreetingModule

- Reads `new Date()` on init and on each minute boundary.
- Uses `setInterval` to poll every second; when `seconds === 0` it updates the clock display and greeting.
- Greeting ranges: 05–11 → "Good Morning", 12–17 → "Good Afternoon", 18–20 → "Good Evening", 21–04 → "Good Night".

```javascript
function getGreeting(hour) {
  if (hour >= 5  && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 20) return 'Good Evening';
  return 'Good Night';  // 21–04
}
```

Date formatting uses `Intl.DateTimeFormat` or manual construction with `toLocaleDateString` options to produce "Weekday, DD Month YYYY".

#### TimerModule

State:
```javascript
let totalSeconds = 25 * 60;  // 1500
let intervalId   = null;
let running      = false;
```

Controls:
- **Start**: calls `setInterval(tick, 1000)`, disables Start, enables Stop, hides session-ended indicator.
- **Stop**: calls `clearInterval(intervalId)`, enables Start, disables Stop.
- **Reset**: calls `clearInterval(intervalId)`, resets `totalSeconds = 1500`, re-renders display, enables Start, disables Stop, hides session-ended indicator.
- **tick()**: decrements `totalSeconds`, updates display. When `totalSeconds === 0`, calls `clearInterval`, shows session-ended indicator, disables both Start and Stop.

Display formatting:
```javascript
function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
```

#### TodoModule

In-memory state: `let tasks = []` — array of task objects loaded from `localStorage` on init.

Operations:
- **addTask(description)**: trims input, rejects if empty/whitespace, pushes `{ id, description, completed: false }`, saves, renders.
- **editTask(id, newDescription)**: trims, rejects if empty, updates matching task, saves, renders.
- **toggleTask(id)**: flips `completed`, saves, renders.
- **deleteTask(id)**: splices task from array, saves, renders.

IDs are generated with `Date.now() + Math.random()` to ensure uniqueness within a session.

Rendering uses `innerHTML` on the `<ul>` element, building HTML strings for each task. Each task item includes:
- Description `<span>` (with `text-decoration: line-through` when completed)
- Edit `<button>`
- Delete `<button>`
- Completion checkbox/toggle `<button>`

Edit mode: a single `editingId` variable tracks which task (if any) is in edit mode. Rendering checks this variable to swap the description span for an `<input>` element.

#### LinksModule

In-memory state: `let links = []` — array of link objects loaded from `localStorage` on init.

Operations:
- **addLink(label, url)**: validates non-empty label and `http://`/`https://` URL prefix, pushes `{ id, label, url }`, saves, renders.
- **deleteLink(id)**: splices from array, saves, renders.

Rendering builds a `<div>` per link containing an `<a>` button (opens in `target="_blank" rel="noopener noreferrer"`) and a delete `<button>`.

---

## Data Models

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `"tasks"` | JSON array | All to-do task objects |
| `"quickLinks"` | JSON array | All quick-link objects |

These two keys are independent and never overlap.

### Task Object

```json
{
  "id": 1716300000000.123,
  "description": "Buy groceries",
  "completed": false
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | number | Unique within session; generated via `Date.now() + Math.random()` |
| `description` | string | 1–200 characters, trimmed |
| `completed` | boolean | `true` = done, `false` = pending |

### Link Object

```json
{
  "id": 1716300001000.456,
  "label": "GitHub",
  "url": "https://github.com"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | number | Unique within session |
| `label` | string | 1–50 characters |
| `url` | string | Must begin with `http://` or `https://` |

### Serialisation Contract

Both arrays are stored as `JSON.stringify(array)` and loaded with `JSON.parse(raw)`. On load, if `JSON.parse` throws or the result is not an array, the module falls back to `[]` and discards the corrupted value. No migration logic is needed for this version.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Time Formatting Correctness

*For any* integer hour in [0, 23] and integer minute in [0, 59], the `formatClockTime(hour, minute)` function SHALL return a string of the form `"HH:MM"` where HH is zero-padded to two digits in the range 00–23 and MM is zero-padded to two digits in the range 00–59.

**Validates: Requirements 1.1**

---

### Property 2: Greeting Range Coverage

*For any* integer hour in [0, 23], the `getGreeting(hour)` function SHALL return exactly one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, or `"Good Night"`, and the returned value SHALL match the correct range: hours 5–11 → "Good Morning", hours 12–17 → "Good Afternoon", hours 18–20 → "Good Evening", hours 0–4 and 21–23 → "Good Night".

**Validates: Requirements 1.4, 1.5, 1.6, 1.7**

---

### Property 3: Timer Countdown Decrements by One

*For any* timer value `n` in [1, 1500], after a single tick the timer value SHALL equal `n - 1`.

**Validates: Requirements 2.2, 2.3**

---

### Property 4: Timer Button State Invariant

*For any* timer state (running or stopped), the button states SHALL satisfy: when the timer is running, the Start button is disabled and the Stop button is enabled; when the timer is stopped or at its initial value, the Stop button is disabled.

**Validates: Requirements 2.7, 2.8**

---

### Property 5: Valid Task Addition Grows the List

*For any* tasks array and any non-empty, non-whitespace-only string `s` of length ≤ 200, calling `addTask(s)` SHALL result in the tasks array having exactly one more element than before, and the new element SHALL have `description === s.trim()` and `completed === false`.

**Validates: Requirements 3.2, 3.5**

---

### Property 6: Whitespace Task Rejection

*For any* string composed entirely of whitespace characters (including the empty string), calling `addTask(s)` SHALL leave the tasks array unchanged.

**Validates: Requirements 3.3**

---

### Property 7: Task Render Contains Required Controls

*For any* task object with valid `id`, `description`, and `completed` fields, the rendered task list item SHALL contain: the description text, a completion toggle control, an edit control, and a delete control.

**Validates: Requirements 3.4**

---

### Property 8: Edit Validation and Trimming

*For any* task and any candidate edit string `s`: if `s.trim()` is non-empty, confirming the edit SHALL update the task's description to `s.trim()`; if `s.trim()` is empty (whitespace-only or empty string), confirming the edit SHALL leave the task's description unchanged and keep the edit input visible.

**Validates: Requirements 4.2, 4.3**

---

### Property 9: Edit Cancel Preserves Description

*For any* task with description `d`, entering edit mode and then cancelling SHALL leave the task's description equal to `d` and SHALL NOT write to `localStorage`.

**Validates: Requirements 4.4**

---

### Property 10: Single Edit Mode Invariant

*For any* tasks array of any length, after activating the edit control on any one task, exactly one task SHALL be in edit mode (the `editingId` variable SHALL equal that task's id, and all other tasks SHALL be in display mode).

**Validates: Requirements 4.1**

---

### Property 11: Completion Toggle Round-Trip

*For any* task with completion state `c`, toggling the task twice SHALL return the completion state to `c`. Toggling once SHALL set the completion state to `!c`.

**Validates: Requirements 5.1**

---

### Property 12: Strikethrough Reflects Completion State

*For any* task object, the rendered task item SHALL apply a strikethrough style to the description text if and only if `completed === true`.

**Validates: Requirements 5.2, 5.3**

---

### Property 13: Task Deletion Removes by ID

*For any* tasks array and any task id `i` present in the array, calling `deleteTask(i)` SHALL result in a tasks array that contains no element with `id === i`, and all other tasks SHALL remain unchanged.

**Validates: Requirements 5.4, 5.6**

---

### Property 14: Task Serialisation Round-Trip

*For any* array of task objects each having a `description` string and a `completed` boolean, serialising the array to `localStorage` under key `"tasks"` and then deserialising it SHALL produce an array of objects with identical `description` and `completed` values for every element.

**Validates: Requirements 6.1, 6.2, 6.3, 3.5, 4.5, 5.5**

---

### Property 15: Corrupted Storage Resilience

*For any* string value stored under `"tasks"` or `"quickLinks"` that is either not valid JSON or does not deserialise to an array, calling `StorageService.load(key, [])` SHALL return `[]` without throwing any exception.

**Validates: Requirements 6.4, 9.4**

---

### Property 16: Valid Link Addition Grows the List

*For any* links array, any non-empty label string of length ≤ 50, and any URL string beginning with `"http://"` or `"https://"`, calling `addLink(label, url)` SHALL result in the links array having exactly one more element than before, and the new element SHALL have `label` and `url` equal to the provided values.

**Validates: Requirements 7.2, 7.5**

---

### Property 17: Invalid Link Rejection

*For any* combination of inputs where the label is empty, the URL is empty, or the URL does not begin with `"http://"` or `"https://"`, calling `addLink(label, url)` SHALL leave the links array unchanged.

**Validates: Requirements 7.3**

---

### Property 18: Link Render Contains URL and Delete Control

*For any* link object with valid `id`, `label`, and `url` fields, the rendered link item SHALL contain: an anchor element with `href === url` and `target="_blank"`, and a delete control.

**Validates: Requirements 7.4, 8.1**

---

### Property 19: Link Deletion Removes by ID

*For any* links array and any link id `i` present in the array, calling `deleteLink(i)` SHALL result in a links array that contains no element with `id === i`, and all other links SHALL remain unchanged.

**Validates: Requirements 8.2, 8.3**

---

### Property 20: Link Serialisation Round-Trip

*For any* array of link objects each having a `label` string and a `url` string, serialising the array to `localStorage` under key `"quickLinks"` and then deserialising it SHALL produce an array of objects with identical `label` and `url` values for every element.

**Validates: Requirements 9.1, 9.2, 9.3**

---

### Property 21: Storage Key Independence

*For any* tasks array and links array, saving tasks under `"tasks"` SHALL NOT modify the value stored under `"quickLinks"`, and saving links under `"quickLinks"` SHALL NOT modify the value stored under `"tasks"`.

**Validates: Requirements 9.2**

---

## Error Handling

### localStorage Failures

`StorageService.save()` wraps `localStorage.setItem()` in a try/catch and returns `false` on failure (e.g., quota exceeded, private browsing mode). Callers check the return value:

- **TodoModule**: if `save` returns `false` after `addTask`, shows the `#todo-error` element with the message "Task could not be saved. Changes are temporary." The task still appears in the in-memory list and is rendered.
- **LinksModule**: if `save` returns `false` after `addLink`, shows the `#link-error` element with a similar message.

### Corrupted localStorage Data

`StorageService.load()` wraps `JSON.parse()` in a try/catch. If parsing fails or the result is not an array, it returns the provided fallback value (`[]`). This means:
- Corrupted `"tasks"` data → empty task list rendered, no exception thrown.
- Corrupted `"quickLinks"` data → empty links panel rendered, no exception thrown.

### Input Validation

All user input is validated before any state mutation:
- Task descriptions: `value.trim().length === 0` → reject, show inline error, retain focus.
- Link labels: `value.trim().length === 0` → reject, show inline validation message.
- Link URLs: `!/^https?:\/\//i.test(value)` → reject, show inline validation message identifying the URL field.

### Browser Feature Detection

On startup, the IIFE checks for required features:

```javascript
const supported = (
  typeof localStorage !== 'undefined' &&
  typeof JSON !== 'undefined' &&
  typeof Array.prototype.findIndex !== 'undefined'
);
if (!supported) {
  document.getElementById('unsupported-banner').hidden = false;
  return;  // exit IIFE early, no further initialisation
}
```

If any required feature is absent, the unsupported-browser banner is shown and no further code runs, preventing unhandled exceptions.

### Timer Cleanup

`clearInterval(intervalId)` is called before any new `setInterval` call and on reset/stop to prevent duplicate intervals. `intervalId` is set to `null` after clearing to allow safe re-checking.

---

## Testing Strategy

> **Note**: Per the project constraints, no test files are created. The testing strategy below describes how the correctness properties and acceptance criteria would be verified if tests were written, and serves as a specification for manual verification and future automated testing.

### Dual Testing Approach

**Unit / Example Tests** cover specific scenarios:
- Timer initialises to 25:00 (Req 2.1)
- Timer resets to 25:00 after being started and ticked (Req 2.5)
- Session-ended indicator appears when timer reaches 00:00 (Req 2.6)
- Unsupported browser banner shown when feature detection fails (Req 11.5)
- DOM structure contains all required input fields and buttons (Req 3.1, 7.1)

**Property-Based Tests** cover universal properties across generated inputs. The recommended library for this project is **fast-check** (JavaScript), which can be loaded from a CDN in a separate test HTML file if testing is ever introduced. Each property test should run a minimum of 100 iterations.

Property test tag format: `Feature: todo-life-dashboard, Property {N}: {property_text}`

| Property | Test Type | Key Generator |
|----------|-----------|---------------|
| P1: Time formatting | PBT | `fc.integer({min:0,max:23})`, `fc.integer({min:0,max:59})` |
| P2: Greeting range | PBT | `fc.integer({min:0,max:23})` |
| P3: Timer countdown | PBT | `fc.integer({min:1,max:1500})` |
| P4: Button state invariant | PBT | `fc.boolean()` (running state) |
| P5: Valid task addition | PBT | `fc.string({minLength:1}).filter(s => s.trim().length > 0)` |
| P6: Whitespace rejection | PBT | `fc.stringOf(fc.constantFrom(' ','\t','\n'))` |
| P7: Task render controls | PBT | `fc.record({id: fc.float(), description: fc.string({minLength:1}), completed: fc.boolean()})` |
| P8: Edit validation | PBT | `fc.string()` (covers both empty and non-empty after trim) |
| P9: Edit cancel | PBT | `fc.string({minLength:1})` |
| P10: Single edit mode | PBT | `fc.array(taskArbitrary, {minLength:1})` |
| P11: Toggle round-trip | PBT | `fc.boolean()` |
| P12: Strikethrough | PBT | `fc.boolean()` |
| P13: Task deletion | PBT | `fc.array(taskArbitrary, {minLength:1})` |
| P14: Task serialisation | PBT | `fc.array(taskArbitrary)` |
| P15: Corrupted storage | PBT | `fc.string()` (arbitrary strings) |
| P16: Valid link addition | PBT | `fc.string({minLength:1})`, `fc.webUrl()` |
| P17: Invalid link rejection | PBT | Invalid label/URL combinations |
| P18: Link render | PBT | `fc.record({id: fc.float(), label: fc.string({minLength:1}), url: fc.webUrl()})` |
| P19: Link deletion | PBT | `fc.array(linkArbitrary, {minLength:1})` |
| P20: Link serialisation | PBT | `fc.array(linkArbitrary)` |
| P21: Key independence | PBT | `fc.array(taskArbitrary)`, `fc.array(linkArbitrary)` |

### Smoke / Manual Checks

The following are verified manually or via browser DevTools:
- 2-column grid layout at 1280×800 without vertical scroll (Req 10.1)
- Body font ≥ 14px, headings ≥ 1.2× body (Req 10.4)
- WCAG 2.1 AA colour contrast (Req 10.5) — use browser accessibility inspector or [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Load time < 2 seconds from `file://` (Req 11.1)
- Cross-browser rendering in Chrome, Firefox, Edge, Safari (Req 11.2)
- Interaction response < 100ms (Req 11.3)
