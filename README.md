# 📋 Reactive TaskMaster

A fully reactive task management application built with **RxJS** and **pure JavaScript**.

## 🎯 Project Description

TaskMaster is a modern, responsive To-Do List application demonstrating **reactive programming** principles using RxJS. The app features instant UI updates, real-time filtering, and clean declarative code with zero build tools required.

## ✨ Key Features

### Reactive State Management

- ✅ **RxJS BehaviorSubjects** for reactive state
- ✅ **combineLatest** for merging task and filter streams
- ✅ **Instant reactivity** - tasks appear immediately on add
- ✅ **Smart rendering** - checkbox toggles are filter-aware (optimized when not filtering)
- ✅ **In-memory state** - data resets from JSON on refresh

### Real-Time Filtering

- ✅ **Status Filter**: Show all tasks or only uncompleted
- ✅ **Priority Filter**: Filter by High/Medium/Low priority
- ✅ **Reactive updates** - filter changes trigger instant re-render
- ✅ **Combined filters** - status and priority work together

### Task Management

- ✅ **Add tasks** with priority selection
- ✅ **Toggle completion** with checkbox
- ✅ **Dynamic rendering** from tasks.json
- ✅ **No hardcoded tasks** - all tasks user-generated or from JSON

### Modern UX

- ✅ **Sticky header** - filters always accessible
- ✅ **Priority badges** - visual indicators (High/Medium/Low)
- ✅ **Completed styling** - strikethrough and faded text
- ✅ **Smooth animations** - slide-in effects
- ✅ **Responsive design** - works on all screen sizes

## 🔧 RxJS Patterns Used

### BehaviorSubject

Holds current state of tasks and filters with initial values:

```javascript
const taskSubject$ = new BehaviorSubject([]);
const filterSubject$ = new BehaviorSubject({ status: "all", priority: "all" });
```

### combineLatest

Merges task and filter streams for reactive filtering:

```javascript
const filteredTasks$ = combineLatest([taskSubject$, filterSubject$]).pipe(
  map(([tasks, filter]) => applyFilters(tasks, filter))
);
```

### fromEvent

Converts DOM events to observables:

```javascript
fromEvent(form, "submit").subscribe((e) => {
  // Add task logic
});
```

## 🚀 Running the Application

Since the app uses ES6 modules (RxJS from CDN), you need to serve it via HTTP:

### Option 1: Python Server (Recommended)

```bash
cd /path/to/reactive-programming
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Option 2: PHP Server

```bash
php -S localhost:8000
```

### Option 3: VS Code Live Server

Use the Live Server extension if installed.

**Note**: Opening `index.html` directly with `file://` protocol won't work due to CORS restrictions on ES modules.

## 📂 File Structure

```
reactive-programming/
├── index.html      # HTML structure with filter controls
├── style.css       # Styling including filter buttons
├── script.js       # RxJS reactive logic (~160 lines)
├── tasks.json      # Initial tasks data
└── README.md       # This documentation
```

## 🎨 Design

### Colors

- Page background: Purple-blue gradient (#667eea)
- Container: White full-screen
- Primary button: #667eea (blue-purple)
- High priority: #c33 (red)
- Medium priority: #d97706 (orange)
- Low priority: #0369a1 (blue)

### Responsive Design

- **Desktop (>480px)**: Form in single row, side-by-side filters
- **Mobile (≤480px)**: Stacked form fields and filters

## 🎓 Technologies

- **RxJS 7.8.1**: Reactive programming library (loaded from CDN)
- **Pure JavaScript (ES6+)**: No frameworks, no build tools
- **HTML5**: Semantic structure
- **CSS3**: Flexbox, animations, transitions
- **ES6 Modules**: Native browser module support

## 📊 Data Flow

1. **Page Load**: Fetch `tasks.json` → populate `taskSubject$`
2. **Add Task**: User submits → `taskSubject$.next()` → instant render
3. **Toggle Checkbox**:
   - On "All" filter → direct DOM manipulation (no re-render)
   - On "Uncompleted" filter → re-render (task disappears when completed)
4. **Change Filter**: `filterSubject$.next()` → filtered view re-renders
5. **Page Refresh**: State resets to `tasks.json` (in-memory only)

## ✅ Zero Configuration

- ✅ No Node.js required
- ✅ No npm install
- ✅ No build step
- ✅ No TypeScript compilation
- ✅ No bundler (webpack, vite, etc.)
- ✅ Just open in browser with a simple HTTP server

## 🎯 Code Quality

- **Clean**: ~190 lines of focused, readable JavaScript
- **Declarative**: RxJS streams clearly show data flow
- **Type-safe**: JSDoc comments for IDE support
- **Smart**: Filter-aware rendering (optimized when "All", reactive when filtering)
- **Reactive**: State changes automatically update UI
