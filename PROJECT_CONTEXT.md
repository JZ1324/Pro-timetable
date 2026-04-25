# Pro Timetable Project Context

## What this website does

Pro Timetable is a React/Firebase student productivity web app. Its core feature is a signed-in, customizable 10-day school timetable with editable class slots, saved templates, imports, themes, cloud sync, notifications, and study planning tools.

The app is more than a timetable grid. It includes:

- Firebase email/password authentication with signup, login, password reset, profile, account info, change-password, and logout flows.
- A school timetable view for a two-week 10-day cycle, including current-day/current-period highlighting, break periods, after-school period support, edit mode, subject colors, saved templates, import/export, and practice reminders.
- Timetable imports from pasted text, structured JSON, tab-delimited data, and AI-assisted parser output.
- Firestore sync for authenticated users, with localStorage fallback when cloud sync is not ready or the user is offline.
- An Academic Planner with day/week/month/year views, tasks, assignments, priorities, filters, templates, progress tracking, study timers, analytics, recurring task helpers, import/export, and focus mode.
- Smart Study Search for VCE-oriented study resources through Google Custom Search.
- Theme support across light, dark, colorful, minimal, pastel, gradient, and cosmos styling.
- Browser and in-app notifications for upcoming classes, planner work, and practice reminders.
- Admin-only dashboard and terminal surfaces for user/system management.
- Error boundary and toast infrastructure for safer runtime errors and user-facing feedback.
- Security hardening utilities and documentation, including validation helpers, rate limiting helpers, security headers, and audit/implementation docs.

## Main user flow

1. `src/index.js` tracks the page view, mounts React, and wraps the app in `ErrorBoundary`.
2. `src/App.js` wraps `Router` with `AuthProvider` and `ToastProvider`.
3. `src/components/Router.js` routes all app paths to `AppContent`, using `HashRouter` on GitHub Pages and `BrowserRouter` elsewhere.
4. `src/components/AuthProvider.js` initializes Firebase auth and exposes user/auth state through `useAuth`.
5. `src/components/AppContent.js` shows `Login` when signed out, then shows the authenticated app shell after login.
6. The authenticated shell defaults to the timetable view, with header actions for Academic Planner, Smart Study Search, help/tutorial/user menus, and the settings/theme sidebar.

## Important active files

- `src/index.js`: React mount point, analytics call, `ErrorBoundary`.
- `src/App.js`: auth/toast providers and global theme imports.
- `src/components/AppContent.js`: authenticated app shell, top-level view switching, theme application, and main-screen scroll-lock recovery.
- `src/components/Header.js`: top navigation, user menu, help/tutorial access, planner/search/sidebar toggles.
- `src/components/Login.js` and `src/components/Signup.js`: auth UI.
- `src/components/AuthProvider.js`: Firebase auth state bridge.
- `src/services/authService.js`: Firebase compat auth initialization and auth operations.
- `src/services/userService.js`: Firestore user documents, roles, admin checks, and activity tracking.
- `src/components/Timetable.js`: main timetable state and action orchestration.
- `src/components/timetable/TimetableGrid.js`: timetable rows/period rendering.
- `src/components/timetable/TimetableDaySelector.js`: 10-day selector and today indicator.
- `src/components/timetable/TimetableHeaderPanel.js`: timetable title, template controls, admin controls, edit/color/import actions.
- `src/components/timetable/timetableConfig.js`: school day labels, period schedule, empty-slot factory.
- `src/components/TimeSlot.js`: individual class slot display/edit behavior.
- `src/services/timetableService.js`: local timetable operations and default school template.
- `src/services/firestoreTimetableService.js`: Firestore persistence for timetables and templates.
- `src/services/timetableManager.js`: online/offline save/load wrapper with localStorage fallback.
- `src/hooks/useSyncStatus.js`: creates Firestore sync services for the current user.
- `src/components/ImportTimetable.js`: import modal and AI-parser entrypoint.
- `src/services/multiModelParser.js`: active multi-model AI parser fallback flow.
- `src/utils/timetableParser.js`: local text parser.
- `src/utils/convertStructuredDataToTimeSlots.js`: parser-output to slot conversion.
- `src/components/AcademicPlanner.js`: planner state, task/assignment actions, calendar views, timers, analytics, focus mode.
- `src/components/AcademicPlanner/`: planner subcomponents.
- `src/hooks/useStudyTimer.js`: planner timer state.
- `src/hooks/useDebouncedLocalStorage.js`: debounced local persistence.
- `src/components/SmartStudySearch.js`: VCE search UI.
- `src/components/ToastProvider.js`: app-wide toast notifications.
- `src/components/ErrorBoundary.js`: top-level runtime failure UI.
- `src/utils/validation.js`, `src/utils/security.js`, `src/utils/rateLimitUtils.js`: validation, sanitization, and rate-limit utilities.
- `src/utils/debug.js`, `src/utils/logger.js`, `src/utils/analytics.js`: diagnostic and analytics helpers.
- `src/services/notificationService.js`: browser and in-app notification handling.
- `src/services/themeService.js`, `src/services/colorService.js`, `src/components/ColorsPopup.js`: theme and subject-color handling.
- `src/styles/`: global, component, theme, and planner styles.

## Data and persistence

- Auth uses Firebase compat SDK scripts loaded from `public/index.html`.
- Firebase config is available both through `window.firebaseConfig` and `src/firebase-config.js`.
- User profile/admin data lives under Firestore `users`.
- Timetable data lives under Firestore `timetables/{userId}`.
- Firestore templates live under `timetables/{userId}/templates`.
- Local fallback data uses localStorage keys such as `timetable-data`, `timetable-templates`, `timetable-settings`, `preferred-theme`, `sidebar-open`, `academicPlannerTasks`, and `recent-searches`.
- Academic Planner tasks are currently stored locally in `academicPlannerTasks`; they are not persisted through `FirestoreTimetableService`.

## Build and run

- Install dependencies: `npm install`
- Development server: `npm start`
- Dev server port: `3001`
- Production build: `npm run build`
- Optional HTML fixer script: `npm run postbuild`
- Vercel build script: `npm run vercel-build`
- Build verification script: `npm run verify-build`
- Firebase deploy: `npm run deploy`
- GitHub Pages deploy: `npm run deploy:github`
- Vercel deploy: `npm run deploy:vercel`

Important build detail: `package.json` currently defines `build` as `webpack --mode production` and `postbuild` separately. Unlike the older `Premium-Timetable` clone, the production build script does not automatically chain `npm run postbuild`.

## Deployment shape

The repo includes Firebase, GitHub Pages, and Vercel deployment material:

- `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`
- `vercel.json`, `vercel.json.secure`, `.vercelignore`
- `scripts/deployment/`
- `scripts/configs/`
- `scripts/build/fix-html-on-build.js`
- `public/_redirects`
- `public/path-fix.js`, `public/vercel-path-fix.js`

`webpack.config.js` builds a single `bundle.js` with `splitChunks: false`, copies deployment helper scripts into `build/`, and keeps Firebase auth on the compat scripts loaded in HTML instead of lazy Firebase chunks.

## Current repo gotchas

- Treat committed Firebase/API/search config and any credential-like strings as sensitive. Do not paste keys or secret values into docs, issues, or chat output.
- The active app is in `src/`. Root HTML files, `backup/`, `cleanup-backup/`, `parser-backups/`, and `aiparser-backups/` are historical/debug material unless a task specifically points to them.
- `Timetable.js` and `AcademicPlanner.js` remain large orchestration components. Prefer targeted edits or extracting small components over broad rewrites.
- `AppContent.js` includes explicit scroll-lock recovery for stale modal/focus/search classes. Be careful when changing modal body-lock behavior.
- `authService.js` deliberately uses Firebase compat SDK from `window.firebase`; changing this can reintroduce startup/build chunk failures.
- `scripts/build/fix-html-on-build.js`, `public/index.html`, and webpack copy rules have history around duplicate helper scripts and production startup issues. Inspect generated `build/index.html` if the app loads blank or gets stuck.
- `package.json` repository metadata still points at `Premium-Timetable`; the actual cloned repo here is `JZ1324/Pro-timetable`.

## Existing project docs worth reading

- `SECURITY_AUDIT_2026.md`: security audit and risk list.
- `SECURITY.md`: security policy and contributor rules.
- `IMPLEMENTATION_GUIDE.md`: step-by-step security hardening tasks.
- `COMPLETION_SUMMARY.md`: summary of completed security/UI work.
- `UI_UPGRADE_STRATEGY.md`: UI/UX roadmap.
- `docs/INDEX.md`: documentation index.
