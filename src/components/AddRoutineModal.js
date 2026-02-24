"use client";
import { useState, useEffect } from "react";
import { addRoutine, updateRoutine } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

const DAYS = [
    { key: "mon", label: "一" },
    { key: "tue", label: "二" },
    { key: "wed", label: "三" },
    { key: "thu", label: "四" },
    { key: "fri", label: "五" },
    { key: "sat", label: "六" },
    { key: "sun", label: "日" },
];

export default function AddRoutineModal({ onClose, editRoutine = null }) {
    const { user } = useAuth();
    const { activeProjectId } = useWorkspace();
    const [form, setForm] = useState({
        title: "",
        description: "",
        mode: "weekly",
        days: [],
        intervalDays: 2,
        startDate: new Date().toISOString().split("T")[0],
        time: "08:00",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editRoutine) {
            const sd = editRoutine.startDate?.toDate
                ? editRoutine.startDate.toDate().toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0];
            setForm({
                title: editRoutine.title || "",
                description: editRoutine.description || "",
                mode: editRoutine.mode || "weekly",
                days: editRoutine.days || [],
                intervalDays: editRoutine.intervalDays || 2,
                startDate: sd,
                time: editRoutine.time || "08:00",
            });
        }
    }, [editRoutine]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const toggleDay = (day) => {
        setForm((f) => ({
            ...f,
            days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
        }));
    };

    const isValid = form.title.trim() && (
        (form.mode === "weekly" && form.days.length > 0) ||
        (form.mode === "interval" && form.intervalDays >= 1)
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;
        setSaving(true);
        try {
            const data = {
                title: form.title.trim(),
                description: form.description.trim(),
                mode: form.mode,
                days: form.mode === "weekly" ? form.days : [],
                intervalDays: form.mode === "interval" ? Number(form.intervalDays) : null,
                startDate: form.mode === "interval" ? form.startDate : null,
                time: form.time,
            };
            if (editRoutine) {
                await updateRoutine(user.uid, editRoutine.id, data, activeProjectId);
            } else {
                await addRoutine(user.uid, data, activeProjectId);
            }
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">{editRoutine ? "編輯 Routine" : "新增 Daily Routine"}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">名稱 *</label>
                        <input className="form-input" placeholder="例：晨跑 30 分鐘" value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
                    </div>

                    <div className="form-group">
                        <label className="form-label">說明（選填）</label>
                        <input className="form-input" placeholder="補充說明..." value={form.description} onChange={(e) => set("description", e.target.value)} />
                    </div>

                    {/* Mode selector */}
                    <div className="form-group">
                        <label className="form-label">重複模式</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                type="button"
                                className={`btn btn-sm ${form.mode === "weekly" ? "btn-primary" : "btn-ghost"}`}
                                onClick={() => set("mode", "weekly")}
                            >
                                📅 固定星期
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${form.mode === "interval" ? "btn-primary" : "btn-ghost"}`}
                                onClick={() => set("mode", "interval")}
                            >
                                🔄 每 N 天一次
                            </button>
                        </div>
                    </div>

                    {form.mode === "weekly" && (
                        <div className="form-group">
                            <label className="form-label">
                                重複日期 *
                                {form.days.length === 0 && <span style={{ color: "var(--danger)", fontWeight: 400 }}>（請至少選一天）</span>}
                            </label>
                            <div className="day-picker">
                                {DAYS.map((d) => (
                                    <button key={d.key} type="button" className={`day-btn${form.days.includes(d.key) ? " selected" : ""}`} onClick={() => toggleDay(d.key)}>
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {form.mode === "interval" && (
                        <>
                            <div className="form-group">
                                <label className="form-label">每幾天一次 *</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>每</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        className="form-input"
                                        style={{ width: 80, textAlign: "center" }}
                                        value={form.intervalDays}
                                        onChange={(e) => set("intervalDays", e.target.value)}
                                    />
                                    <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>天</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">起始日期</label>
                                <input type="date" className="form-input" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label">提醒時間</label>
                        <input type="time" className="form-input" value={form.time} onChange={(e) => set("time", e.target.value)} />
                    </div>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
                        <button type="submit" className="btn btn-primary" disabled={saving || !isValid}>
                            {saving ? "儲存中..." : editRoutine ? "更新" : "新增"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
