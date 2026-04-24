/**
 * Modern To-Do Manager
 * 
 * Concepts demonstrated:
 * 1. IIFE & Closures: Encapsulating state and preventing global scope pollution.
 * 2. Arrays & Objects: Managing task data state recursively.
 * 3. DOM Manipulation: Dynamic rendering and updating element states.
 * 4. Event Handling: Form submissions, click events, filter toggling via Event Delegation.
 * 5. LocalStorage: Persisting the application state across reloads.
 */

const TodoApp = (function() {
    // ---- STATE MANAGEMENT ----
    
    // We store tasks in an array of objects.
    // Each object structure: { id: number, text: string, completed: boolean }
    let tasks = [];
    let currentFilter = 'all'; // 'all', 'pending', 'completed'
    
    // ---- DOM ELEMENTS ----
    const DOM = {
        form: document.getElementById('task-form'),
        input: document.getElementById('task-input'),
        taskList: document.getElementById('task-list'),
        filters: document.querySelectorAll('.filter-btn'),
        emptyState: document.getElementById('empty-state'),
        taskStats: document.getElementById('task-stats')
    };

    // ---- LOCAL STORAGE HANDLING ----
    
    /**
     * Loads tasks from LocalStorage, wrapped in try-catch for error handling
     */
    const loadTasks = () => {
        try {
            const savedTasks = localStorage.getItem('todo_tasks');
            if (savedTasks) {
                tasks = JSON.parse(savedTasks);
            }
        } catch (error) {
            console.error("Error reading from LocalStorage:", error);
            tasks = [];
        }
    };

    /**
     * Saves current tasks array to LocalStorage
     */
    const saveTasks = () => {
        try {
            localStorage.setItem('todo_tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error("Error writing to LocalStorage:", error);
            alert("Failed to save tasks due to local storage limits or settings.");
        }
    };

    // ---- CORE LOGIC (Add, Update, Toggle, Delete, Filter) ----

    /**
     * Adds a new task to the array
     * @param {string} text - The task description
     */
    const addTask = (text) => {
        const newTask = {
            id: Date.now(), // Generate a unique ID based on timestamp
            text: text.trim(),
            completed: false
        };
        tasks.push(newTask);
        saveTasks();
        render();
    };

    /**
     * Toggles the completed status of a task
     * @param {number} id - Task ID
     */
    const toggleTask = (id) => {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        render();
    };

    /**
     * Deletes a task from the array
     * @param {number} id - Task ID
     */
    const deleteTask = (id) => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        render();
    };

    /**
     * Updates the text of an existing task
     * @param {number} id - Task ID
     * @param {string} newText - New description
     */
    const updateTask = (id, newText) => {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, text: newText.trim() };
            }
            return task;
        });
        saveTasks();
        render();
    };

    /**
     * Sets the active filter and triggers re-render
     * @param {string} filterType - 'all', 'pending', or 'completed'
     */
    const setFilter = (filterType) => {
        currentFilter = filterType;
        
        // Update UI filter buttons state
        DOM.filters.forEach(btn => {
            if (btn.dataset.filter === filterType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        render();
    };

    // ---- RENDERING LOGIC ----

    /**
     * Gets tasks filtered by active filter
     */
    const getFilteredTasks = () => {
        switch (currentFilter) {
            case 'pending':
                return tasks.filter(task => !task.completed);
            case 'completed':
                return tasks.filter(task => task.completed);
            default:
                return tasks; // 'all'
        }
    };

    /**
     * Updates the text showing how many tasks are remaining
     */
    const updateStats = () => {
        const pendingCount = tasks.filter(task => !task.completed).length;
        DOM.taskStats.textContent = `${pendingCount} task${pendingCount !== 1 ? 's' : ''} remaining`;
    };

    /**
     * Main render function - maps tasks to DOM elements
     */
    const render = () => {
        const filteredTasks = getFilteredTasks();

        // Clear existing list
        DOM.taskList.innerHTML = '';

        // Handle Empty State
        if (filteredTasks.length === 0) {
            DOM.emptyState.classList.remove('hidden');
        } else {
            DOM.emptyState.classList.add('hidden');
            
            // Build the DOM efficiently using fragments or direct append
            filteredTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.dataset.id = task.id; // Store ID on element for event delegation
                
                // Construct inner HTML
                li.innerHTML = `
                    <label class="task-checkbox-container" aria-label="Toggle Completion">
                        <input type="checkbox" class="toggle-checkbox" ${task.completed ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>
                    <span class="task-text">${escapeHTML(task.text)}</span>
                    <button class="action-btn edit-btn" aria-label="Edit Task">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="action-btn delete-btn" aria-label="Delete Task">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                `;
                
                DOM.taskList.appendChild(li);
            });
        }

        updateStats();
    };

    // ---- UTIL FUNCTIONS ----
    
    /**
     * Prevents XSS attacks when injecting innerHTML
     */
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    /**
     * Turns a task item into edit mode
     */
    const enableEditMode = (liItem, task) => {
        const textSpan = liItem.querySelector('.task-text');
        
        // Create an input replacing the text span
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = task.text;
        
        // Replace span with input
        textSpan.replaceWith(input);
        input.focus();

        // Handle saving by Enter key or blurring focus
        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== task.text) {
                updateTask(task.id, newText);
            } else if (!newText) {
                deleteTask(task.id); // If empty, consider it deleted
            } else {
                render(); // Value unchanged, just re-render to exit edit mode
            }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            }
        });
    };

    // ---- EVENT LISTENERS ----
    
    const bindEvents = () => {
        // 1. Adding a Task
        DOM.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = DOM.input.value;
            if (text.trim() !== '') {
                addTask(text);
                DOM.input.value = ''; // Reset input
            }
        });

        // 2. Click Delegation on the Task List
        DOM.taskList.addEventListener('click', (e) => {
            const item = e.target.closest('.task-item');
            if (!item) return;

            const taskId = Number(item.dataset.id);
            
            // Delete button clicked
            if (e.target.closest('.delete-btn')) {
                deleteTask(taskId);
            } 
            // Edit button clicked
            else if (e.target.closest('.edit-btn')) {
                const task = tasks.find(t => t.id === taskId);
                if (task) enableEditMode(item, task);
            }
            // Checkbox clicked
            else if (e.target.closest('.task-checkbox-container')) {
                // Must ensure we only trigger on the actual underlying input change
                // to avoid double triggers when clicking the label.
                const checkbox = e.target.closest('input[type="checkbox"]');
                if (checkbox) {
                    toggleTask(taskId);
                }
            }
        });

        // 3. Filter buttons logic
        DOM.filters.forEach(btn => {
            btn.addEventListener('click', () => {
                setFilter(btn.dataset.filter);
            });
        });
    };

    // ---- INITIALIZATION ----
    
    const init = () => {
        loadTasks();
        bindEvents();
        render();
        console.log("Modern ToDo Manager initialized successfully.");
    };

    // Return the init function to start the app
    // Demonstration of module pattern taking advantage of closure
    return {
        init
    };

})();

// Boot up the application when DOM is ready
document.addEventListener('DOMContentLoaded', TodoApp.init);
