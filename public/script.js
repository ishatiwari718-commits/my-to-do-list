// ===== Select DOM Elements =====
const todocontainer = document.querySelector(".todo-container");
const inputTodo = document.getElementById("input-todo");
const reminderHours = document.getElementById("reminder-hours");
const reminderMinutes = document.getElementById("reminder-minutes");
const addTodo = document.getElementById("add-todo");

const modalBG = document.querySelector(".modal-background");
const closeModal = document.querySelector(".close-modal");
const editTodoName = document.getElementById("edit-todo-name");
const editTodoCompleted = document.getElementById("edit-todo-completed");
const saveTodo = document.getElementById("save-todo");
const editReminderHours = document.getElementById("edit-reminder-hours");
const editReminderMinutes = document.getElementById("edit-reminder-minutes");

const searchTodo = document.getElementById("search-todo");
const sortTodo = document.getElementById("sort-todo");
const markAllBtn = document.getElementById("mark-all");
const markAllPendingBtn = document.getElementById("mark-all-pending");
const delCompletedBtn = document.getElementById("delete-completed");
const clearAllBtn = document.getElementById("clear-all");
const darkModeBtn = document.getElementById("dark-mode-btn");

let todoArray = [];
let currentTodo = null;
// const URL = "http://localhost:3000/todos";
const URL = "https://my-to-do-list-yja3.onrender.com/todos";


// ===== Audio =====
const bell = new Audio("notification.mp3");
document.body.addEventListener(
  "click",
  () => {
    bell.play().then(() => {
      bell.pause();
      bell.currentTime = 0;
    }).catch(() => {});
  },
  { once: true }
);

// ===== API Functions =====
async function get_Todos() {
  try {
    const resp = await fetch(URL);
    return await resp.json();
  } catch (err) {
    console.error("GET error:", err);
    return [];
  }
}

async function addTodoAPI(text, reminderAt) {
  try {
    const body = { name: text, completed: false, reminderAt: reminderAt !== null ? Number(reminderAt) : null };
    const resp = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error("Failed to add todo");
    return await resp.json();
  } catch (err) {
    console.error("ADD TODO error:", err);
    return null;
  }
}

async function del_Todo(todoElem) {
  try {
    await fetch(`${URL}/${todoElem.id}`, { method: "DELETE" });
  } catch (err) {
    console.error("DELETE error:", err);
  }
}

async function edit_Todo(todoElem, updatedData) {
  try {
    await fetch(`${URL}/${todoElem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
  } catch (err) {
    console.error("EDIT error:", err);
  }
}

async function toggleCompleted(todoElem, checked) {
  try {
    // cancel reminder if completed
    if (checked && todoElem.reminderId) clearTimeout(todoElem.reminderId);

    const updated = {
      id: todoElem.id,
      name: todoElem.name,
      completed: checked,
      reminderAt: checked ? null : todoElem.reminderAt
    };

    await edit_Todo(todoElem, updated);
  } catch (err) {
    console.error("TOGGLE error:", err);
  }
}

// ===== Modal Functions =====
function open_modal(todoElem) {
  currentTodo = todoElem;
  editTodoName.value = todoElem.name;
  editTodoCompleted.checked = !!todoElem.completed;

  const ts = todoElem.reminderAt ? Number(todoElem.reminderAt) : null;
  if (ts && !isNaN(ts)) {
    const date = new Date(ts);
    editReminderHours.value = date.getHours();
    editReminderMinutes.value = date.getMinutes();
  } else {
    editReminderHours.value = 0;
    editReminderMinutes.value = 0;
  }

  modalBG.style.display = "flex";
}

closeModal.addEventListener("click", (e) => {
  e.preventDefault();
  modalBG.style.display = "none";
  currentTodo = null;
});

saveTodo.addEventListener("click", async (e) => {
  e.preventDefault();
  if (!currentTodo) return;

  const hours = parseInt(editReminderHours.value) || 0;
  const minutes = parseInt(editReminderMinutes.value) || 0;
  const now = new Date();
  const reminderAt = (hours || minutes)
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes).getTime()
    : null;

  const updatedData = {
    id: currentTodo.id,
    name: editTodoName.value.trim(),
    completed: editTodoCompleted.checked,
    reminderAt: reminderAt !== null ? Number(reminderAt) : null,
  };

  await edit_Todo(currentTodo, updatedData);
  modalBG.style.display = "none";
  currentTodo = null;
  await refreshTodos();
});

function scheduleReminder(todoElem) {
  if (!todoElem.reminderAt || todoElem.completed) return;

  const delay = Number(todoElem.reminderAt) - Date.now();
  if (delay <= 0) return;

  // store timer id
  todoElem.reminderId = setTimeout(async () => {

    // play sound
    if (typeof bell !== "undefined") {
      bell.currentTime = 0;
      bell.play().catch(() => {});
    }

    // notification / alert
    if (Notification.permission === "granted") {
      new Notification("⏰ Reminder", { body: todoElem.name });
    } else {
      alert(`⏰ Reminder: ${todoElem.name}`);
    }

    // --- AUTO COMPLETE ---
    todoElem.completed = true;
    todoElem.reminderAt = null;

    // IMPORTANT: backend update
    await toggleCompleted(todoElem, true);

    // refresh UI
    await refreshTodos();

  }, delay);
}



// ===== Display Todos =====
function display_Todos(todoArr) {
  todocontainer.innerHTML = "";
  todoArr.forEach(todoElem => {
    const todo = document.createElement("div");
    todo.className = "todo";

    const todoInfo = document.createElement("div");
    todoInfo.className = "todo-info";

    const todoBtn = document.createElement("div");
    todoBtn.className = "todo-btn";

    const todoCompleted = document.createElement("input");
    todoCompleted.type = "checkbox";
    todoCompleted.className = "todo-completed";
    todoCompleted.checked = !!todoElem.completed;

    todoCompleted.addEventListener("change", async () => {
  todoElem.completed = todoCompleted.checked;

  // reminder cancel on complete
  if (todoElem.completed && todoElem.reminderAt) {
    clearTimeout(todoElem.reminderId);
    todoElem.reminderAt = null;
  }

  await toggleCompleted(todoElem, todoCompleted.checked);
  await refreshTodos();
});


    const todoName = document.createElement("p");
    todoName.className = "todo-name";
    todoName.textContent = todoElem.name;

    if (todoElem.reminderAt) {
      const date = new Date(Number(todoElem.reminderAt));
      const h = date.getHours().toString().padStart(2, "0");
      const m = date.getMinutes().toString().padStart(2, "0");
      const timeSpan = document.createElement("span");
      timeSpan.className = "reminder-time";
      timeSpan.textContent = ` ⏰ ${h}:${m}`;
      todoName.appendChild(timeSpan);
    }

    const todoEdit = document.createElement("button");
    todoEdit.className = "todo-edit";
    todoEdit.textContent = "Edit";
    todoEdit.addEventListener("click", (e) => {
      e.preventDefault();
      open_modal(todoElem);
    });

    const todoDel = document.createElement("button");
    todoDel.className = "todo-delete";
    todoDel.textContent = "Delete";
    todoDel.addEventListener("click", async (e) => {
      e.preventDefault();
      if (todoElem.reminderId) clearTimeout(todoElem.reminderId);
      await del_Todo(todoElem);
      await refreshTodos();
    });

    todoInfo.appendChild(todoCompleted);
    todoInfo.appendChild(todoName);
    todoBtn.appendChild(todoEdit);
    todoBtn.appendChild(todoDel);
    todo.appendChild(todoInfo);
    todo.appendChild(todoBtn);
    todocontainer.appendChild(todo);

    scheduleReminder(todoElem);
  });
}

// ===== Refresh Todos =====
async function refreshTodos() {
  todoArray = await get_Todos();
  display_Todos(todoArray);
}

// ===== Add Todo =====
async function addNewTodo() {
  try {
    const text = inputTodo.value.trim();
    if (!text) return;

    const hours = parseInt(reminderHours.value) || 0;
    const minutes = parseInt(reminderMinutes.value) || 0;
    const totalMs = (hours * 60 + minutes) * 60 * 1000;
    const reminderAt = totalMs > 0 ? Date.now() + totalMs : null;

    const newTodo = await addTodoAPI(text, reminderAt);
    if (!newTodo) return;

    inputTodo.value = "";
    reminderHours.value = "";
    reminderMinutes.value = "";

    if (newTodo.reminderAt) scheduleReminder(newTodo);
    await refreshTodos();
  } catch (err) {
    console.error("ADD TODO failed:", err);
  }
}

// ===== Search =====
searchTodo.addEventListener("input", () => {
  const query = searchTodo.value.toLowerCase();
  const filtered = todoArray.filter(todo => todo.name.toLowerCase().includes(query));
  display_Todos(filtered);
});

// ===== Sort =====
sortTodo.addEventListener("change", () => {
  let sorted = [...todoArray];
  const option = sortTodo.value;

  if (option === "az") sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (option === "za") sorted.sort((a, b) => b.name.localeCompare(a.name));
  else if (option === "completed") sorted.sort((a, b) => (b.completed === a.completed ? 0 : b.completed ? -1 : 1));
  else if (option === "pending") sorted.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

  display_Todos(sorted);
});

// ===== Buttons =====
markAllBtn.addEventListener("click", async () => {
  await Promise.all(todoArray.filter(t => !t.completed).map(t => toggleCompleted(t, true)));
  await refreshTodos();
});

markAllPendingBtn.addEventListener("click", async () => {
  await Promise.all(todoArray.filter(t => t.completed).map(t => toggleCompleted(t, false)));
  await refreshTodos();
});

// ===== FIXED Delete Completed =====
delCompletedBtn.addEventListener("click", async () => {
  await Promise.all(
    todoArray
      .filter(t => t.completed)
      .map(async t => {
        if (t.reminderId) clearTimeout(t.reminderId); // cancel reminder
        await del_Todo(t);
      })
  );
  await refreshTodos();
});


clearAllBtn.addEventListener("click", async () => {
  await Promise.all(todoArray.map(t => del_Todo(t)));
  await refreshTodos();
});

darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  darkModeBtn.textContent = document.body.classList.contains("dark-mode")
    ? "Light Mode"
    : "Dark Mode";
});

// ===== Event Listeners =====
addTodo.addEventListener("click", (e) => {
  e.preventDefault();
  addNewTodo();
});

inputTodo.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addNewTodo();
  }
});

// ===== Initial Load =====
refreshTodos();
