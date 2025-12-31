import { BehaviorSubject, fromEvent } from 'https://cdn.jsdelivr.net/npm/rxjs@7.8.1/+esm';
import { map, share, tap } from 'https://cdn.jsdelivr.net/npm/rxjs@7.8.1/operators/+esm';

// --- 1. המחסן (State) ---
const taskSubject$ = new BehaviorSubject([]);

// --- 2. אתחול (טעינה ראשונית) ---
async function init() {
    try {
        const res = await fetch('tasks.json');
        const data = await res.json();
        // שמירת המידע
        taskSubject$.next(data);
        // רינדור ראשוני (חד פעמי)
        renderInitialList(data);
    } catch (e) {
        console.log('Starting with empty list');
    }
}
init();

// --- 3. הצינור הישיר להוספת משימה (Add Task Pipe) ---
const form = document.querySelector('.add-task-form');
const input = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const list = document.querySelector('.task-list');

// יצירת Stream של משימות חדשות מתוך הטופס
const newTask$ = fromEvent(form, 'submit').pipe(
    // א. מניעת רענון דף
    tap(e => e.preventDefault()),

    // ב. חילוץ הטקסט
    map(() => input.value.trim()),

    // ג. ולידציה - עצירה אם אין טקסט
    tap(text => { if (!text) throw 'Empty'; }),

    // ד. יצירת אובייקט המשימה
    map(text => ({
        id: Date.now().toString(),
        text: text,
        priority: prioritySelect.value,
        completed: false
    })),

    // ה. ניקוי שדה הקלט
    tap(() => input.value = ''),

    // ו. שיתוף הזרם
    share()
);

// מנוי 1: עדכון ה-DOM (אופטימיזציה - Prepend)
newTask$.subscribe({
    next: (task) => {
        const el = createTaskElement(task);
        list.prepend(el); // הוספה לראש הרשימה
    },
    error: () => {} // התעלמות משגיאות
});

// מנוי 2: עדכון הזיכרון (Store)
newTask$.subscribe({
    next: (task) => {
        const currentTasks = taskSubject$.getValue();
        taskSubject$.next([task, ...currentTasks]);
    }
});


// --- פונקציות עזר (Helpers) ---

function renderInitialList(tasks) {
    list.innerHTML = '';
    const fragment = document.createDocumentFragment();
    tasks.forEach(task => fragment.appendChild(createTaskElement(task)));
    list.appendChild(fragment);
}

// יצירת אלמנט משימה
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.priority = task.priority;

    // בניית ה-HTML בצורה ישירה
    li.innerHTML = `
        <input 
            type="checkbox" 
            id="task-${task.id}" 
            class="task-checkbox" 
            ${task.completed ? 'checked' : ''}
        >
        <label for="task-${task.id}" class="task-label">
            <span class="task-text ${task.completed ? 'done' : ''}">
                ${task.text}
            </span>
            <span class="priority-badge" data-priority="${task.priority}">
                ${task.priority}
            </span>
        </label>
    `;

    // לוגיקת הצ'קבוקס
    const checkbox = li.querySelector('.task-checkbox');
    fromEvent(checkbox, 'change').subscribe(() => {
        const isChecked = checkbox.checked;

        // 1. עדכון ויזואלי (DOM)
        const textSpan = li.querySelector('.task-text');
        if (isChecked) {
            textSpan.classList.add('done');
        } else {
            textSpan.classList.remove('done');
        }

        // 2. עדכון המידע בזיכרון (Store)
        const all = taskSubject$.getValue();
        const updated = all.map(t =>
            t.id === task.id ? {...t, completed: isChecked} : t
        );
        taskSubject$.next(updated);
    });

    return li;
}