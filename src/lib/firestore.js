import {
    collection, doc, addDoc, updateDoc, deleteDoc,
    onSnapshot, query, orderBy, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Path Helpers ─────────────────────────────────────────────────────────────
// Personal: users/{userId}/todos, users/{userId}/routines
// Project:  users/{userId}/projects/{projectId}/todos, .../routines

function todosCol(userId, projectId) {
    if (projectId) return collection(db, "users", userId, "projects", projectId, "todos");
    return collection(db, "users", userId, "todos");
}

function todoDoc(userId, todoId, projectId) {
    if (projectId) return doc(db, "users", userId, "projects", projectId, "todos", todoId);
    return doc(db, "users", userId, "todos", todoId);
}

function routinesCol(userId, projectId) {
    if (projectId) return collection(db, "users", userId, "projects", projectId, "routines");
    return collection(db, "users", userId, "routines");
}

function routineDoc(userId, routineId, projectId) {
    if (projectId) return doc(db, "users", userId, "projects", projectId, "routines", routineId);
    return doc(db, "users", userId, "routines", routineId);
}

// ─── Todos ───────────────────────────────────────────────────────────────────

export function subscribeTodos(userId, callback, projectId = null) {
    const q = query(todosCol(userId, projectId), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
        const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(todos);
    });
}

export async function addTodo(userId, data, projectId = null) {
    return addDoc(todosCol(userId, projectId), {
        title: data.title,
        description: data.description || "",
        completed: false,
        dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
        priority: data.priority || "medium",
        tags: data.tags || [],
        isRoutineGenerated: data.isRoutineGenerated || false,
        routineId: data.routineId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export async function updateTodo(userId, todoId, data, projectId = null) {
    const updateData = { ...data, updatedAt: serverTimestamp() };
    if (data.dueDate !== undefined && data.dueDate !== null && !(data.dueDate instanceof Timestamp)) {
        updateData.dueDate = Timestamp.fromDate(new Date(data.dueDate));
    }
    return updateDoc(todoDoc(userId, todoId, projectId), updateData);
}

export async function deleteTodo(userId, todoId, projectId = null) {
    return deleteDoc(todoDoc(userId, todoId, projectId));
}

// ─── Routines ─────────────────────────────────────────────────────────────────

export function subscribeRoutines(userId, callback, projectId = null) {
    const q = query(routinesCol(userId, projectId), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
        const routines = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(routines);
    });
}

export async function addRoutine(userId, data, projectId = null) {
    const docData = {
        title: data.title,
        description: data.description || "",
        mode: data.mode || "weekly",
        days: data.days || [],
        intervalDays: data.intervalDays || null,
        startDate: data.startDate ? Timestamp.fromDate(new Date(data.startDate)) : Timestamp.now(),
        time: data.time || "08:00",
        active: true,
        createdAt: serverTimestamp(),
    };
    return addDoc(routinesCol(userId, projectId), docData);
}

export async function updateRoutine(userId, routineId, data, projectId = null) {
    const updateData = { ...data };
    if (data.startDate && !(data.startDate instanceof Timestamp)) {
        updateData.startDate = Timestamp.fromDate(new Date(data.startDate));
    }
    return updateDoc(routineDoc(userId, routineId, projectId), updateData);
}

export async function deleteRoutine(userId, routineId, projectId = null) {
    return deleteDoc(routineDoc(userId, routineId, projectId));
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function subscribeProjects(userId, callback) {
    const q = query(
        collection(db, "users", userId, "projects"),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
        const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(projects);
    });
}

export async function addProject(userId, data) {
    return addDoc(collection(db, "users", userId, "projects"), {
        name: data.name,
        emoji: data.emoji || "📁",
        color: data.color || "#7c6ff7",
        description: data.description || "",
        createdAt: serverTimestamp(),
    });
}

export async function updateProject(userId, projectId, data) {
    return updateDoc(doc(db, "users", userId, "projects", projectId), data);
}

export async function deleteProject(userId, projectId) {
    return deleteDoc(doc(db, "users", userId, "projects", projectId));
}

// ─── Routine Helpers ───────────────────────────────────────────────────────────

const DAY_MAP = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

export function isRoutineDueOn(routine, date) {
    if (!routine.active) return false;
    const d = new Date(date);

    if (routine.mode === "interval" || routine.intervalDays) {
        const intervalDays = routine.intervalDays || 1;
        const start = routine.startDate?.toDate ? routine.startDate.toDate() : new Date(routine.startDate);
        start.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        if (d < start) return false;
        const diffMs = d.getTime() - start.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return diffDays % intervalDays === 0;
    }

    // weekly mode
    const dayKey = DAY_MAP[d.getDay()];
    return (routine.days || []).includes(dayKey);
}

// ─── Date Range Helper ────────────────────────────────────────────────────────

/**
 * Check if a todo should appear on a given date.
 * - No dueDate: only show on createdAt date
 * - Has dueDate: show on ALL days from createdAt to dueDate (inclusive)
 */
export function isTodoVisibleOn(todo, date) {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const targetStr = target.toDateString();

    const createdDate = todo.createdAt?.toDate ? todo.createdAt.toDate() : null;
    const dueDate = todo.dueDate?.toDate ? todo.dueDate.toDate() : null;

    if (dueDate) {
        // Show on all days from today (or created date) to due date
        const dueNorm = new Date(dueDate);
        dueNorm.setHours(0, 0, 0, 0);

        // If created date exists, show from created date to due date
        if (createdDate) {
            const createdNorm = new Date(createdDate);
            createdNorm.setHours(0, 0, 0, 0);
            return target >= createdNorm && target <= dueNorm;
        }
        // No created date? Just show on due date
        return targetStr === dueNorm.toDateString();
    }

    // No due date: only show on created date
    if (createdDate) {
        return createdDate.toDateString() === targetStr;
    }

    return false;
}
