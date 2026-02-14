const path = require("path");

const cors = require("cors");
const express = require("express");

const app = express();

// ===== CORS =====
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

// ===== Parse JSON =====
app.use(express.json());
app.use(express.static("public"));

// ===== Dummy Data =====
let todos = [
  {
    id: 1,
    name: "Sample Todo",
    completed: false,
    reminderAt: null
  }
];

// ===== Home Route =====
app.get("/", (req, res) => {
  res.send("🚀 My To-Do List API is Running Successfully on Render!");
});

// ===== Routes =====

// GET all todos
app.get("/todos", (req, res) => {
  res.json(todos);
});

// GET todo by ID
app.get("/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  res.json(todo);
});

// POST add new todo
app.post("/todos", (req, res) => {
  const { name, completed, reminderAt } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Missing todo name in request body" });
  }

  const newTodo = {
    id: todos.length ? todos[todos.length - 1].id + 1 : 1,
    name,
    completed: completed || false,
    reminderAt: reminderAt || null
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// PUT update todo
app.put("/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Todo not found" });
  }

  todos[index] = { ...todos[index], ...req.body };
  res.json(todos[index]);
});

// DELETE todo
app.delete("/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const exists = todos.some(t => t.id === id);

  if (!exists) {
    return res.status(404).json({ message: "Todo not found" });
  }

  todos = todos.filter(t => t.id !== id);
  res.status(204).send();
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
