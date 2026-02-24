"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { subscribeTodos, subscribeRoutines, addTodo, isRoutineDueOn, isTodoVisibleOn } from "@/lib/firestore";
import TodoItem from "@/components/TodoItem";
import AddTodoModal from "@/components/AddTodoModal";

export default function TodayPage() {
    const { user } = useAuth();
    const { activeProjectId } = useWorkspace();
    const [todos, setTodos] = useState([]);
    const [routines, setRoutines] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editTodo, setEditTodo] = useState(null);
    const [generatedIds, setGeneratedIds] = useState(new Set());

    useEffect(() => {
        if (!user) return;
        setTodos([]);
        setRoutines([]);
        setGeneratedIds(new Set());
        const unsubT = subscribeTodos(user.uid, setTodos, activeProjectId);
        const unsubR = subscribeRoutines(user.uid, setRoutines, activeProjectId);
        return () => { unsubT(); unsubR(); };
    }, [user, activeProjectId]);

    // Auto-generate today's routines
    useEffect(() => {
        if (!user || routines.length === 0) return;
        const today = new Date();
        const todayStr = today.toDateString();

        routines.forEach((r) => {
            if (!isRoutineDueOn(r, today)) return;
            if (generatedIds.has(r.id)) return;
            const alreadyAdded = todos.some(
                (t) => t.routineId === r.id && t.createdAt?.toDate &&
                    t.createdAt.toDate().toDateString() === todayStr
            );
            if (!alreadyAdded) {
                setGeneratedIds((s) => new Set(s).add(r.id));
                addTodo(user.uid, {
                    title: r.title,
                    description: r.description,
                    priority: "medium",
                    dueDate: today.toISOString().split("T")[0],
                    isRoutineGenerated: true,
                    routineId: r.id,
                }, activeProjectId);
            }
        });
    }, [routines, todos, user, generatedIds, activeProjectId]);

    // Filter to today's tasks using isTodoVisibleOn
    const todayTodos = useMemo(() => {
        const today = new Date();
        return todos.filter((t) => isTodoVisibleOn(t, today));
    }, [todos]);

    const pending = todayTodos.filter((t) => !t.completed);
    const done = todayTodos.filter((t) => t.completed);
    const progress = todayTodos.length > 0 ? Math.round((done.length / todayTodos.length) * 100) : 0;

    const todayLabel = new Date().toLocaleDateString("zh-TW", {
        weekday: "long", month: "long", day: "numeric",
    });

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">今日任務</h1>
                    <p className="page-subtitle">{todayLabel}</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditTodo(null); setShowModal(true); }}>
                    ＋ 新增任務
                </button>
            </div>

            {/* Stats */}
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-value">{todayTodos.length}</div>
                    <div className="stat-label">今日任務</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: "var(--success)" }}>{done.length}</div>
                    <div className="stat-label">已完成</div>
                </div>
                <div className="stat-card">
                    <div className={`stat-value${pending.length > 0 ? " stat-pending" : ""}`}>{pending.length}</div>
                    <div className="stat-label">待處理 {pending.length > 0 && "⚠"}</div>
                </div>
            </div>

            {/* Progress */}
            {todayTodos.length > 0 && (
                <div className="progress-wrap">
                    <div className="progress-label">
                        <span>今日進度</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* Pending */}
            {pending.length > 0 && (
                <>
                    <div className="todo-section-title" style={{ color: "var(--danger)" }}>⚠ 待完成 ({pending.length})</div>
                    <div className="todo-list">
                        {pending.map((t) => (
                            <TodoItem key={t.id} todo={t} onEdit={(td) => { setEditTodo(td); setShowModal(true); }} />
                        ))}
                    </div>
                </>
            )}

            {/* Done */}
            {done.length > 0 && (
                <>
                    <div className="todo-section-title">✅ 已完成 ({done.length})</div>
                    <div className="todo-list">
                        {done.map((t) => (
                            <TodoItem key={t.id} todo={t} onEdit={(td) => { setEditTodo(td); setShowModal(true); }} />
                        ))}
                    </div>
                </>
            )}

            {/* Empty */}
            {todayTodos.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🎉</div>
                    <p>今天沒有任務，點右上角新增一個吧！</p>
                </div>
            )}

            <button className="fab" onClick={() => { setEditTodo(null); setShowModal(true); }}>＋</button>

            {showModal && (
                <AddTodoModal onClose={() => setShowModal(false)} editTodo={editTodo} />
            )}
        </>
    );
}
