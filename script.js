
"use strict";

const STORAGE_KEY = "mini-task-manager-tasks";

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");
const remainingCount = document.getElementById("remaining-count");

// Load saved tasks
function loadTasks() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(saved)) return [];

        return saved.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean"
        );
    } catch (error) {
        console.error("Failed to load tasks:", error);
        return [];
    }
}

let tasks = loadTasks();

// Save tasks
function saveTasks() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(tasks)
        );
    } catch (error) {
        console.error("Failed to save tasks:", error);
    }
}

// Update statistics
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(
        task => task.completed
    ).length;

    totalCount.textContent = total;
    completedCount.textContent = completed;
    remainingCount.textContent = total - completed;
}

// Render tasks
function renderTasks() {
    taskList.replaceChildren();

    tasks.forEach(task => {
        const li = document.createElement("li");

        if (task.completed) {
            li.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.text} as completed`
        );

        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });

        const span = document.createElement("span");
        span.textContent = task.text;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.setAttribute(
            "aria-label",
            `Delete ${task.text}`
        );

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        li.append(checkbox, span, deleteButton);
        taskList.appendChild(li);
    });

    updateStatistics();
}

// Add a new task
function addTask(text) {
    const cleanText = text.trim();

    if (!cleanText) return;

    const task = {
        id: crypto.randomUUID(),
        text: cleanText,
        completed: false
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
}

// Toggle task completion
function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, completed: !task.completed }
            : task
    );

    saveTasks();
    renderTasks();
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);

    saveTasks();
    renderTasks();
}

// Handle form submission
taskForm.addEventListener("submit", event => {
    event.preventDefault();

    addTask(taskInput.value);

    taskInput.value = "";
    taskInput.focus();
});

// Initial render
renderTasks();
