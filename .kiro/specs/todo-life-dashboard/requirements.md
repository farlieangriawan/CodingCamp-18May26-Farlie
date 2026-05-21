# Requirements Document

## Introduction

The ToDo List Life Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides a personal productivity dashboard featuring a live greeting with time and date, a Pomodoro-style focus timer, a persistent to-do list, and a quick-links panel. All data is stored in the browser's Local Storage — no backend or server is required. The app can be used as a standalone web page or packaged as a browser extension.

---

## Glossary

- **Dashboard**: The single-page web application that hosts all widgets.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-based greeting message.
- **Focus_Timer**: The UI component that implements a 25-minute countdown timer with start, stop, and reset controls.
- **Todo_List**: The UI component that manages a collection of task items.
- **Task**: A single to-do item with a text description and a completion state.
- **Quick_Links**: The UI component that displays a set of user-defined shortcut buttons that open URLs.
- **Link**: A user-defined entry consisting of a label and a URL stored in Quick_Links.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Modern_Browser**: Chrome, Firefox, Edge, or Safari in their current stable release.

---

## Requirements

### Requirement 1: Live Greeting Display

**User Story:** As a user, I want to see the current time, date, and a personalized greeting when I open the dashboard, so that I have immediate context about the time of day.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Greeting_Widget SHALL immediately display the current local time in HH:MM (24-hour) format.
2. THE Greeting_Widget SHALL update the displayed time at each wall-clock minute boundary (i.e., when the system clock's seconds value rolls over to 00), not on a fixed 60-second interval from page load.
3. THE Greeting_Widget SHALL display the current date in the format "Weekday, DD Month YYYY" using locale-based full names (e.g., "Thursday, 21 May 2026").
4. WHEN the local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
5. WHEN the local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
6. WHEN the local time is between 18:00 and 20:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
7. WHEN the local time is between 21:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the user activates the start control while the timer is paused or at its initial value, THE Focus_Timer SHALL begin (or resume) counting down one second per second from the current displayed value.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the reset control, THE Focus_Timer SHALL stop any active countdown and restore the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a persistent, visually distinct session-ended indicator (a separate visible element, not a modification of the countdown display itself).
7. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the start control and enable the stop control to prevent duplicate timers.
8. WHILE the Focus_Timer is stopped or at its initial value and not counting down, THE Focus_Timer SHALL disable the stop control.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to a list and see them displayed, so that I can track what I need to do.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input field and an "Add" control for creating new tasks.
2. WHEN the user submits a non-empty task description (via the Add button or the Enter key), THE Todo_List SHALL append the new Task to the list, clear the input field, and persist the updated task collection to Local_Storage.
3. IF the user submits an empty or whitespace-only task description, THEN THE Todo_List SHALL reject the submission and retain focus on the input field without modifying Local_Storage.
4. THE Todo_List SHALL display each Task with its description text (maximum 200 characters), a completion toggle, an edit control, and a delete control.
5. THE Todo_List SHALL persist all tasks to Local_Storage after every successful add operation so that tasks survive a page reload.
6. IF a Local_Storage write operation fails during an add, THEN THE Todo_List SHALL display an inline error message indicating that the task could not be saved, and the task SHALL still appear in the rendered list for the current session.

---

### Requirement 4: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct or update it without deleting and re-adding it.

#### Acceptance Criteria

1. WHEN the user activates the edit control on a Task, THE Todo_List SHALL replace the task's display text with an editable input field pre-filled with the current description, and only one Task SHALL be in edit mode at a time across the entire list.
2. WHEN the user confirms the edit with a non-empty, non-whitespace-only value, THE Todo_List SHALL trim leading and trailing whitespace, update the Task description with the trimmed value, and return the Task to display mode.
3. IF the user confirms the edit with an empty or whitespace-only value, THEN THE Todo_List SHALL reject the update, retain the original Task description, keep the edit input field visible and focused, and display an inline validation message.
4. WHEN the user cancels the edit, THE Todo_List SHALL discard any changes and return the Task to display mode without modifying Local_Storage.
5. THE Todo_List SHALL persist the updated task description to Local_Storage after every successful edit.

---

### Requirement 5: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can keep my list current.

#### Acceptance Criteria

1. WHEN the user activates the completion toggle on a Task, THE Todo_List SHALL toggle the Task's completion state between complete and incomplete.
2. WHILE a Task is in the complete state, THE Todo_List SHALL apply a strikethrough style to the Task's description text to differentiate it from incomplete tasks.
3. WHILE a Task is in the incomplete state, THE Todo_List SHALL not apply a strikethrough style to the Task's description text.
4. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove that Task from the list permanently.
5. WHEN the user activates the completion toggle on a Task, THE Todo_List SHALL persist the updated task collection to Local_Storage.
6. WHEN the user activates the delete control on a Task, THE Todo_List SHALL persist the updated task collection to Local_Storage.

---

### Requirement 6: To-Do List — Data Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that they are still available after I close and reopen the browser tab.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Todo_List SHALL read all previously saved tasks from Local_Storage under the key `"tasks"` and render them in the list; IF no data exists under that key, THE Todo_List SHALL render an empty list.
2. THE Todo_List SHALL store tasks as a JSON-serialised array in Local_Storage under the fixed key `"tasks"`.
3. THE Todo_List SHALL serialise each task as an object with at minimum a `description` string field and a `completed` boolean field, such that deserialising the stored value produces a task collection with identical descriptions and completion states.
4. IF the value stored under the `"tasks"` key cannot be parsed as valid JSON or does not conform to the expected array structure, THEN THE Todo_List SHALL discard the corrupted data, render an empty list, and not throw an unhandled exception.

---

### Requirement 7: Quick Links — Add and Display Links

**User Story:** As a user, I want to add shortcut buttons for my favourite websites, so that I can open them quickly from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide a label input field (maximum 50 characters), a URL input field, and an "Add" control for creating new links.
2. WHEN the user submits a non-empty label and a URL beginning with `http://` or `https://`, THE Quick_Links SHALL append the new Link, render it as a clickable button, clear both input fields, and persist the updated link collection to Local_Storage.
3. IF the user submits an empty label, an empty URL, or a URL that does not begin with `http://` or `https://`, THEN THE Quick_Links SHALL reject the submission and display an inline validation message identifying which field is invalid.
4. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab.
5. WHEN the user successfully adds a Link, THE Quick_Links SHALL persist the updated link collection to Local_Storage.

---

### Requirement 8: Quick Links — Delete Links

**User Story:** As a user, I want to remove quick links I no longer need, so that the panel stays relevant.

#### Acceptance Criteria

1. THE Quick_Links SHALL display a delete control alongside each Link button.
2. WHEN the user activates the delete control on a Link, THE Quick_Links SHALL immediately remove that Link from the rendered panel without requiring a confirmation step, and the Link SHALL not reappear on subsequent page reloads.
3. WHEN the user activates the delete control on a Link, THE Quick_Links SHALL persist the updated link collection to Local_Storage so that the deletion survives a page reload.

---

### Requirement 9: Quick Links — Data Persistence

**User Story:** As a user, I want my quick links to be saved automatically, so that they are still available after I close and reopen the browser tab.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Quick_Links SHALL read all previously saved links from Local_Storage under the key `"quickLinks"` and render them as buttons; IF no data exists under that key, THE Quick_Links SHALL render an empty panel with no buttons.
2. THE Quick_Links SHALL store links as a JSON-serialised array in Local_Storage under the fixed key `"quickLinks"`, which is a separate, non-overlapping key from the tasks key `"tasks"`.
3. THE Quick_Links SHALL serialise each link as an object with at minimum a `label` string field and a `url` string field, such that deserialising the stored value produces a link collection with identical labels and URLs.
4. IF the value stored under the `"quickLinks"` key cannot be parsed as valid JSON or does not conform to the expected array structure, THEN THE Quick_Links SHALL discard the corrupted data, render an empty panel, and not throw an unhandled exception.

---

### Requirement 10: Layout and Visual Design

**User Story:** As a user, I want a clean, readable, and visually organised dashboard, so that I can use it comfortably without distraction.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four widgets (Greeting_Widget, Focus_Timer, Todo_List, Quick_Links) on a single page in a 2-column grid layout without requiring vertical scrolling on a 1280×800 viewport.
2. THE Dashboard SHALL use a single CSS file located at `css/style.css` for all styling.
3. THE Dashboard SHALL use a single JavaScript file located at `js/app.js` for all behaviour.
4. THE Dashboard SHALL apply a consistent typographic scale where the body font size is at least 14px and widget headings are at least 1.2× the body font size.
5. THE Dashboard SHALL provide sufficient colour contrast between text and background to meet WCAG 2.1 AA contrast ratio requirements: minimum 4.5:1 for normal text and minimum 3:1 for large text (text ≥18px or bold text ≥14px).

---

### Requirement 11: Browser Compatibility and Performance

**User Story:** As a user, I want the dashboard to load quickly and work reliably in any modern browser, so that I can use it regardless of my preferred browser.

#### Acceptance Criteria

1. WHEN the Dashboard is opened from a local file, THE Dashboard SHALL load and render all four widgets as visible and interactive within 2 seconds.
2. THE Dashboard SHALL render all four widgets and make all controls responsive to user input in the current stable release of Chrome, Firefox, Edge, and Safari without polyfills or build tools.
3. WHEN the user interacts with any control (add, edit, delete, timer buttons), THE Dashboard SHALL reflect the updated state within 100 milliseconds.
4. THE Dashboard SHALL use only standard HTML5, CSS3, and ES6+ JavaScript features available natively in Modern_Browser without requiring a build step or package manager.
5. IF the browser does not support a required JavaScript feature used by the Dashboard, THEN THE Dashboard SHALL display a visible unsupported-browser message and not throw an unhandled exception.
