import { BehaviorSubject, combineLatest, fromEvent } from 'https://cdn.jsdelivr.net/npm/rxjs@7.8.1/+esm'
import { map } from 'https://cdn.jsdelivr.net/npm/rxjs@7.8.1/operators/+esm'

// State streams (data lost on refresh)
const taskSubject$ = new BehaviorSubject([])
const filterSubject$ = new BehaviorSubject({
    status: 'all',
    priority: 'all'
})

// Combined filtered view
const filteredTasks$ = combineLatest([taskSubject$, filterSubject$])
    .pipe(map(([tasks, filter]) => applyFilters(tasks, filter)))

// Auto-render on any state change
filteredTasks$.subscribe(renderTasks)

// Load initial data from JSON
async function initTasks() {
    try {
        const response = await fetch('tasks.json')
        const tasks = await response.json()
        taskSubject$.next(tasks)
    } catch (error) {
        console.log('No tasks.json found, starting with empty list')
        taskSubject$.next([])
    }
}

// Initialize on page load
initTasks()

// Add task - instant reactivity
function setupFormListener() {
    const form = document.querySelector('.add-task-form')
    const taskInput = document.getElementById('taskInput')
    const prioritySelect = document.getElementById('prioritySelect')

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

        // Add to in-memory state → instant UI update
        taskSubject$.next([...taskSubject$.value, newTask])

        form.reset()
        taskInput.focus()
    })
}

// Reactive filters
function setupFilterListeners() {
    // Status filter buttons (All / Uncompleted)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        fromEvent(btn, 'click').subscribe(() => {
            filterSubject$.next({
                ...filterSubject$.value,
                status: btn.dataset.status
            })

            // Update active button
            document.querySelectorAll('.filter-btn')
                .forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
        })
    })

    // Priority filter dropdown
    const priorityFilter = document.getElementById('priorityFilter')
    fromEvent(priorityFilter, 'change').subscribe(() => {
        filterSubject$.next({
            ...filterSubject$.value,
            priority: priorityFilter.value
        })
    })
}

// Filter logic
function applyFilters(tasks, filter) {
    return tasks.filter(task => {
        // Status filter
        if (filter.status === 'uncompleted' && task.completed) {
            return false
        }

        // Priority filter
        if (filter.priority !== 'all' && task.priority !== filter.priority) {
            return false
        }

        return true
    })
}

// Render function
function renderTasks(tasks) {
    const taskList = document.querySelector('.task-list')

    if (tasks.length === 0) {
        taskList.innerHTML = `
      <li class="empty-state">No tasks to display</li>
    `
        return
    }

    taskList.innerHTML = tasks.map(task => `
    <li class="task-item" data-priority="${task.priority}">
      <input 
        type="checkbox" 
        id="task-${task.id}" 
        class="task-checkbox"
        ${task.completed ? 'checked' : ''}
        data-task-id="${task.id}"
      />
      <label for="task-${task.id}" class="task-label">
        <span class="task-text">${escapeHtml(task.text)}</span>
        <span class="priority-badge" data-priority="${task.priority}">
          ${task.priority}
        </span>
      </label>
    </li>
  `).join('')

    // Attach checkbox listeners after rendering
    attachCheckboxListeners()
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// Checkbox toggle - reactive
function attachCheckboxListeners() {
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        fromEvent(checkbox, 'change').subscribe(() => {
            const taskId = checkbox.dataset.taskId
            const isCompleted = checkbox.checked

            // Update state
            const updatedTasks = taskSubject$.value.map(task =>
                task.id === taskId
                    ? { ...task, completed: isCompleted }
                    : task
            )

            const currentFilter = filterSubject$.value

            // If filtering is active, trigger re-render to apply filter
            if (currentFilter.status === 'uncompleted') {
                taskSubject$.next(updatedTasks)
            } else {
                // No filter active - just update visual state without re-render
                taskSubject$.value.splice(0, taskSubject$.value.length, ...updatedTasks)

                const taskText = checkbox.nextElementSibling.querySelector('.task-text')
                if (taskText) {
                    if (isCompleted) {
                        taskText.style.textDecoration = 'line-through'
                        taskText.style.color = '#999'
                        taskText.style.opacity = '0.6'
                    } else {
                        taskText.style.textDecoration = 'none'
                        taskText.style.color = '#333'
                        taskText.style.opacity = '1'
                    }
                }
            }
        })
    })
}

// Initialize all listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupFormListener()
    setupFilterListeners()
})

