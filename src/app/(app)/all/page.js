"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { subscribeTodos } from "@/lib/firestore";
import TodoItem from "@/components/TodoItem";
import AddTodoModal from "@/components/AddTodoModal";

export default function AllTasksPage() {
    const { user } = useAuth();
    const { activeProjectId } = useWorkspace();
    const [todos, setTodos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editTodo, setEditTodo] = useState(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        if (!user) return;
        setTodos([]);
        return subscribeTodos(user.uid, setTodos, activeProjectId);
    }, [user, activeProjectId]);

    const filtered = useMemo(() => {
        let list = todos;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (t) => t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q)
            );
        }
        switch (filter) {
            case "pending":
                return list.filter((t) => !t.completed);
            case "completed":
                return list.filter((t) => t.completed);
            case "high":
                return list.filter((t) => t.priority === "high");
            case "low":
                return list.filter((t) => t.priority === "low");
            default:
                return list;
        }
    }, [todos, search, filter]);

    const FILTERS = [
        { key: "all", label: "全部" },
        { key: "pending", label: "待處理" },
        { key: "completed", label: "已完成" },
        { key: "high", label: "高優先" },
        { key: "low", label: "低優先" },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">所有任務</h1>
                    <p className="page-subtitle">共 {todos.length} 項</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditTodo(null); setShowModal(true); }}>
                    ＋ 新增任務
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 16 }}>
                <input
                    className="form-input"
                    placeholder="🔍 搜尋任務..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {filtered.length > 0 ? (
                <div className="todo-list">
                    {filtered.map((t) => (
                        <TodoItem key={t.id} todo={t} onEdit={(td) => { setEditTodo(td); setShowModal(true); }} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">{search ? "🔍" : "📭"}</div>
                    <p>{search ? "找不到符合的任務" : "還沒有任何任務"}</p>
                </div>
            )}

            <button className="fab" onClick={() => { setEditTodo(null); setShowModal(true); }}>＋</button>

            {showModal && (
                <AddTodoModal onClose={() => setShowModal(false)} editTodo={editTodo} />
            )}
        </>
    );
}
