"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { subscribeTodos, subscribeRoutines, isRoutineDueOn, isTodoVisibleOn } from "@/lib/firestore";
import TodoItem from "@/components/TodoItem";
import AddTodoModal from "@/components/AddTodoModal";

export default function CalendarPage() {
    const { user } = useAuth();
    const { activeProjectId } = useWorkspace();
    const [todos, setTodos] = useState([]);
    const [routines, setRoutines] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editTodo, setEditTodo] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    });

    useEffect(() => {
        if (!user) return;
        setTodos([]);
        setRoutines([]);
        const unsubT = subscribeTodos(user.uid, setTodos, activeProjectId);
        const unsubR = subscribeRoutines(user.uid, setRoutines, activeProjectId);
        return () => { unsubT(); unsubR(); };
    }, [user, activeProjectId]);

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPad = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startPad; i++) {
            const d = new Date(year, month, -startPad + i + 1);
            days.push({ date: d, inMonth: false });
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), inMonth: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), inMonth: false });
        }
        return days;
    }, [currentMonth]);

    // Count tasks per day using isTodoVisibleOn
    const dayTaskCounts = useMemo(() => {
        const counts = {};
        calendarDays.forEach(({ date }) => {
            const key = date.toDateString();
            let count = 0;
            todos.forEach((t) => {
                if (isTodoVisibleOn(t, date)) count++;
            });
            routines.forEach((r) => {
                if (isRoutineDueOn(r, date)) count++;
            });
            counts[key] = count;
        });
        return counts;
    }, [calendarDays, todos, routines]);

    // Unfinished task days (has uncompleted tasks)
    const dayHasUnfinished = useMemo(() => {
        const unfinished = {};
        calendarDays.forEach(({ date }) => {
            const key = date.toDateString();
            unfinished[key] = todos.some((t) => isTodoVisibleOn(t, date) && !t.completed);
        });
        return unfinished;
    }, [calendarDays, todos]);

    // Tasks for selected date
    const selectedDateStr = selectedDate.toDateString();
    const selectedTodos = useMemo(() => {
        return todos.filter((t) => isTodoVisibleOn(t, selectedDate));
    }, [todos, selectedDateStr]);

    const selectedRoutines = useMemo(() => {
        return routines.filter((r) => isRoutineDueOn(r, selectedDate));
    }, [routines, selectedDate]);

    const prevMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    const goToday = () => {
        const now = new Date();
        setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        now.setHours(0, 0, 0, 0);
        setSelectedDate(now);
    };

    const todayStr = new Date().toDateString();
    const isToday = (d) => d.toDateString() === todayStr;
    const isSelected = (d) => d.toDateString() === selectedDateStr;

    const monthLabel = currentMonth.toLocaleDateString("zh-TW", { year: "numeric", month: "long" });

    const selectedLabel = selectedDate.toLocaleDateString("zh-TW", {
        weekday: "long", month: "long", day: "numeric",
    });

    const hasUncompleted = selectedTodos.some((t) => !t.completed);

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">📅 行事曆</h1>
                    <p className="page-subtitle">瀏覽及管理未來任務</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditTodo(null); setShowModal(true); }}>
                    ＋ 新增任務
                </button>
            </div>

            {/* Calendar */}
            <div className="calendar-container">
                <div className="calendar-nav">
                    <button className="btn btn-ghost btn-sm" onClick={prevMonth}>◀</button>
                    <span className="calendar-month-label">{monthLabel}</span>
                    <button className="btn btn-ghost btn-sm" onClick={nextMonth}>▶</button>
                    <button className="btn btn-ghost btn-sm" onClick={goToday} style={{ marginLeft: 8 }}>今天</button>
                </div>

                <div className="calendar-grid">
                    {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                        <div key={d} className="calendar-weekday">{d}</div>
                    ))}
                    {calendarDays.map(({ date, inMonth }, i) => {
                        const count = dayTaskCounts[date.toDateString()] || 0;
                        const unfinished = dayHasUnfinished[date.toDateString()];
                        return (
                            <button
                                key={i}
                                className={`calendar-day${!inMonth ? " out-of-month" : ""}${isToday(date) ? " today" : ""}${isSelected(date) ? " selected" : ""}${unfinished ? " has-unfinished" : ""}`}
                                onClick={() => setSelectedDate(new Date(date))}
                            >
                                <span className="calendar-day-num">{date.getDate()}</span>
                                {count > 0 && (
                                    <div className="calendar-dots">
                                        {count <= 3
                                            ? Array(count).fill(0).map((_, j) => <span key={j} className={`calendar-dot${unfinished ? " unfinished" : ""}`} />)
                                            : <span className={`calendar-count${unfinished ? " unfinished" : ""}`}>{count}</span>
                                        }
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected day tasks */}
            <div style={{ marginTop: 28 }}>
                <div className="page-header" style={{ marginBottom: 16 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                            {selectedLabel}
                            {isToday(selectedDate) && <span className="tag" style={{ marginLeft: 8, background: "var(--accent-glow)", color: "var(--accent-light)" }}>今天</span>}
                        </h2>
                        <p className="page-subtitle">
                            {selectedTodos.length} 個任務 · {selectedRoutines.length} 個 Routine
                            {hasUncompleted && <span style={{ color: "var(--danger)", marginLeft: 8 }}>⚠ 有未完成</span>}
                        </p>
                    </div>
                </div>

                {selectedRoutines.length > 0 && (
                    <>
                        <div className="todo-section-title">🔁 Routine ({selectedRoutines.length})</div>
                        <div className="todo-list">
                            {selectedRoutines.map((r) => (
                                <div key={r.id} className="todo-item uncompleted">
                                    <div className="todo-checkbox" style={{ borderColor: "var(--accent)" }}>
                                        <span style={{ fontSize: 11 }}>🔁</span>
                                    </div>
                                    <div className="todo-body">
                                        <div className="todo-title">{r.title}</div>
                                        {r.description && <div className="todo-desc">{r.description}</div>}
                                        <div className="todo-meta">
                                            <span className="tag">🕐 {r.time}</span>
                                            {r.mode === "interval" && <span className="tag">每 {r.intervalDays} 天</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {selectedTodos.length > 0 && (
                    <>
                        <div className="todo-section-title">📋 任務 ({selectedTodos.length})</div>
                        <div className="todo-list">
                            {selectedTodos.map((t) => (
                                <TodoItem key={t.id} todo={t} onEdit={(td) => { setEditTodo(td); setShowModal(true); }} />
                            ))}
                        </div>
                    </>
                )}

                {selectedTodos.length === 0 && selectedRoutines.length === 0 && (
                    <div className="empty-state" style={{ padding: 40 }}>
                        <div className="empty-icon">📭</div>
                        <p>這天沒有任何任務或 Routine</p>
                    </div>
                )}
            </div>

            <button className="fab" onClick={() => { setEditTodo(null); setShowModal(true); }}>＋</button>

            {showModal && (
                <AddTodoModal
                    onClose={() => setShowModal(false)}
                    editTodo={editTodo}
                    defaultDueDate={selectedDate.toISOString().split("T")[0]}
                />
            )}
        </>
    );
}
