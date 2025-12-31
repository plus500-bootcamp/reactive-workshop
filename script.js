import { BehaviorSubject, combineLatest, fromEvent } from 'https://cdn.jsdelivr.net/npm/rxjs@7.8.1/+esm'
import { map } from 'https://cdn.jsdelivr.net/npm/rxjs@7.8.1/operators/+esm'

// --- State Streams ---
const taskSubject$ = new BehaviorSubject([])
const filterSubject$ = new BehaviorSubject({ status: 'all', priority: 'all' })

// דגל לבקרת רינדור - כדי למנוע רינדור כפול בהוספה ידנית
let skipNextRender = false

// --- Combined Stream ---
const filteredTasks$ = combineLatest([taskSubject$, filterSubject$])
    .pipe(map(([tasks, filter]) => applyFilters(tasks, filter)))

// --- Subscription ---
filteredTasks$.subscribe(tasks => {
    // הטריק: אם הוספנו משימה ידנית, אנחנו מדלגים על הרינדור הכבד פעם אחת
    if (skipNextRender) {
        skipNextRender = false
        return
    }
    renderFullList(tasks)
})

// --- Initialization ---
async function initTasks() {
    try {
        const response = await fetch('tasks.json')
        const tasks = await response.json()
        taskSubject$.next(tasks)
    } catch (error) {
        console.log('Starting with empty list')
        taskSubject$.next([])
    }
}
initTasks()

// --- Logic: Add Task (Optimized) ---
function setupFormListener() {
    const form = document.querySelector('.add-task-form')
    const taskInput = document.getElementById('taskInput')
    const prioritySelect = document.getElementById('prioritySelect')
    const taskList = document.querySelector('.task-list')

    fromEvent(form, 'submit').subscribe(e => {
        e.preventDefault()
        const text = taskInput.value.trim()
        if (!text) return

        const newTask = {
            id: Date.now().toString(),
            text: text,
            priority: prioritySelect.value,
            completed: false,
            createdAt: Date.now()
        }

        // 1. DOM Manipulation (Instant & Efficient)
        // אנחנו יוצרים ומוסיפים את האלמנט ישירות, בלי למחוק את כל הרשימה
        const newTaskElement = createTaskElement(newTask)

        // בודקים אם הפילטר הנוכחי מאפשר להציג את המשימה
        const currentFilter = filterSubject$.value
        const shouldShow = applyFilters([newTask], currentFilter).length > 0

        if (shouldShow) {
            // הוספה לראש הרשימה
            taskList.prepend(newTaskElement)

            // טיפול במצב של "רשימה ריקה"
            const emptyState = taskList.querySelector('.empty-state')
            if (emptyState) emptyState.remove()
        }

        // 2. State Update
        // אנחנו חייבים לעדכן את ה-State, אבל מסמנים לדלג על הרינדור הבא
        // כי כבר עדכנו את ה-DOM בעצמנו
        skipNextRender = true
        taskSubject$.next([newTask, ...taskSubject$.value])

        form.reset()
        taskInput.focus()
    })
}

// --- Logic: Create Single Element (The DOM Builder) ---
function createTaskElement(task) {
    const li = document.createElement('li')
    li.className = 'task-item'
    li.dataset.priority = task.priority

    li.innerHTML = `
        <input 
            type="checkbox" 
            id="task-${task.id}" 
            class="task-checkbox"
            ${task.completed ? 'checked' : ''}
        />
        <label for="task-${task.id}" class="task-label">
            <span class="task-text">${escapeHtml(task.text)}</span>
            <span class="priority-badge" data-priority="${task.priority}">
                ${task.priority}
            </span>
        </label>
    `

    // Optimization: Attach listener directly to the specific element
    // במקום לחפש את כל הצ'קבוקסים כל פעם מחדש
    const checkbox = li.querySelector('.task-checkbox')
    const taskText = li.querySelector('.task-text')

    // סטיילינג ראשוני
    updateTextStyle(taskText, task.completed)

    fromEvent(checkbox, 'change').subscribe(() => {
        const isCompleted = checkbox.checked

        // 1. Visual Update (Immediate)
        updateTextStyle(taskText, isCompleted)

        // 2. State Update
        const allTasks = taskSubject$.value
        const updatedTasks = allTasks.map(t =>
            t.id === task.id ? { ...t, completed: isCompleted } : t
        )

        // אם אנחנו בפילטר שמסתיר משימות שבוצעו - נצטרך רינדור מלא
        // אחרת - נדלג על רינדור
        if (filterSubject$.value.status === 'uncompleted') {
            taskSubject$.next(updatedTasks) // יגרום לרינדור והמשימה תיעלם
        } else {
            skipNextRender = true // רק מעדכנים מידע, לא נוגעים ב-DOM
            taskSubject$.next(updatedTasks)
        }
    })

    return li
}

// --- Logic: Render Full List (Bulk) ---
function renderFullList(tasks) {
    const taskList = document.querySelector('.task-list')
    taskList.innerHTML = '' // Reset DOM

    if (tasks.length === 0) {
        taskList.innerHTML = `<li class="empty-state">No tasks to display</li>`
        return
    }

    // שימוש ב-Fragment לביצועים טובים יותר
    const fragment = document.createDocumentFragment()
    tasks.forEach(task => {
        fragment.appendChild(createTaskElement(task))
    })
    taskList.appendChild(fragment)
}

// --- Helper Functions ---
function updateTextStyle(element, isCompleted) {
    if (isCompleted) {
        element.style.textDecoration = 'line-through'
        element.style.color = '#999'
        element.style.opacity = '0.6'
    } else {
        element.style.textDecoration = 'none'
        element.style.color = '#333'
        element.style.opacity = '1'
    }
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

function applyFilters(tasks, filter) {
    return tasks.filter(task => {
        if (filter.status === 'uncompleted' && task.completed) return false
        if (filter.priority !== 'all' && task.priority !== filter.priority) return false
        return true
    })
}

function setupFilterListeners() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        fromEvent(btn, 'click').subscribe(() => {
            filterSubject$.next({ ...filterSubject$.value, status: btn.dataset.status })
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
        })
    })

    const priorityFilter = document.getElementById('priorityFilter')
    fromEvent(priorityFilter, 'change').subscribe(() => {
        filterSubject$.next({ ...filterSubject$.value, priority: priorityFilter.value })
    })
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    setupFormListener()
    setupFilterListeners()
})