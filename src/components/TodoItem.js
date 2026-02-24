"use client";
import { useState } from "react";
import { updateTodo, deleteTodo } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function TodoItem({ todo, onEdit }) {
    const { user } = useAuth();
    const { activeProjectId } = useWorkspace();
    const [deleting, setDeleting] = useState(false);

    const toggle = () =>
        updateTodo(user.uid, todo.id, { completed: !todo.completed }, activeProjectId);

    const remove = async () => {
        setDeleting(true);
        await deleteTodo(user.uid, todo.id, activeProjectId);
    };

    const priorityClass = todo.priority || "medium";
    const isUncompleted = !todo.completed;

    const dueLabel = () => {
        if (!todo.dueDate) return null;
        const d = todo.dueDate.toDate ? todo.dueDate.toDate() : new Date(todo.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = d < today && !todo.completed;
        return (
            <span className={`due-date${isOverdue ? " overdue" : ""}`}>
                📅 {d.toLocaleDateString("zh-TW", { month: "short", day: "numeric" })}
                {isOverdue ? " ⚠ 已過期" : ""}
            </span>
        );
    };

    if (deleting) return null;

    return (
        <div className={`todo-item${todo.completed ? " completed" : ""}${isUncompleted ? " uncompleted" : ""} priority-${priorityClass}`}>
            <div
                className={`todo-checkbox${todo.completed ? " checked" : ""}`}
                onClick={toggle}
            >
                {todo.completed && <span style={{ color: "white", fontSize: 11 }}>✓</span>}
            </div>

            <div className="todo-body">
                <div className="todo-title">
                    {isUncompleted && <span className="uncompleted-dot">●</span>}
                    {todo.title}
                </div>
                {todo.description && <div className="todo-desc">{todo.description}</div>}
                <div className="todo-meta">
                    <span className={`priority-badge ${priorityClass}`}>
                        {priorityClass === "high" ? "🔴 高" : priorityClass === "low" ? "🟢 低" : "🟡 中"}
                    </span>
                    {dueLabel()}
                    {todo.isRoutineGenerated && (
                        <span className="tag">🔁 Routine</span>
                    )}
                    {(todo.tags || []).map((t) => (
                        <span key={t} className="tag">{t}</span>
                    ))}
                </div>
            </div>

            <div className="todo-actions">
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(todo)} title="編輯">✏️</button>
                <button className="btn btn-danger btn-icon btn-sm" onClick={remove} title="刪除">🗑</button>
            </div>
        </div>
    );
}
