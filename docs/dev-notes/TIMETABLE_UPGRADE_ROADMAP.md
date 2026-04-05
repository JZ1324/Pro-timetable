# Timetable Upgrade Roadmap

This roadmap turns the timetable from a single legacy surface into a clearer workspace with room for feature growth.

## Current Foundation

- `Timetable.js` has started being split into smaller UI surfaces.
- Shared timetable day and period config should live outside the main component.
- Layout and spacing rules still have legacy duplication and should be consolidated further.

## UI Upgrade Order

1. Consolidate shell and layout CSS
- Remove duplicated timetable width and spacing rules.
- Define one source of truth for shell width, panel spacing, and modal spacing.
- Reduce old generic selectors that leak across features.

2. Split the timetable into focused components
- Header and tools
- Day switcher
- Timetable grid
- Time slot card
- Edit flows and popups

3. Introduce a cleaner design system
- Shared spacing scale
- Shared button styles
- Shared surface and modal rules
- Better typography hierarchy for titles, meta text, and actions

4. Redesign one surface at a time
- Header and controls
- Day switcher
- Grid and period labels
- Slot card
- Edit modal

## Capability Upgrade Order

1. Drag-and-drop editing
- Reorder or move classes between periods and days.
- Keep a keyboard-accessible fallback for all drag interactions.

2. Multiple timetable views
- Compact view
- Focus view
- Print view
- Exam view

3. Smarter reminders
- Recurring reminders
- Better reminder scheduling
- Study and practice reminders tied to class context

4. Better analytics
- Subject balance
- Workload and free-time insights
- Study time and attendance-adjacent summaries

5. Stronger sync and safety
- Undo/redo
- Version history
- Cleaner cloud sync states and conflict handling

6. Better import and integrations
- Import from screenshots and PDFs
- School portal adapters where possible
- Calendar export and eventual two-way sync

## Recommended Delivery Sequence

1. Finish refactoring the timetable UI into smaller components.
2. Consolidate duplicated CSS into one layout system.
3. Rebuild the timetable page using those cleaner foundations.
4. Ship one headline capability first: drag-and-drop editing.
5. Follow with view modes, reminders, and analytics.

## Notes for Future Work

- Prefer extracting stable config and presentational components before feature work.
- Avoid adding more global CSS selectors shared with unrelated surfaces.
- Treat accessibility and mobile layout as part of every phase, not a later patch.
