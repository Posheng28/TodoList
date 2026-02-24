"use client";
import { useState, useEffect } from "react";
import { addTodo, updateTodo } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_LABELS = { low: "🟢 低", medium: "🟡 中", high: "🔴 高" };

export default function AddTodoModal({ onClose, editTodo = null, defaultDueDate = "" }) {
    const { user } = useAuth();
    const { activeProjectId } = useWorkspace();
    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "medium",
        dueDate: defaultDueDate || "",
        tags: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editTodo) {
            const due = editTodo.dueDate?.toDate
                ? editTodo.dueDate.toDate().toISOString().split("T")[0]
                : editTodo.dueDate || "";
            setForm({
                title: editTodo.title || "",
                description: editTodo.description || "",
                priority: editTodo.priority || "medium",
                dueDate: due,
                tags: (editTodo.tags || []).join(", "),
            });
        }
    }, [editTodo]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        const data = {
            title: form.title.trim(),
            description: form.description.trim(),
            priority: form.priority,
            dueDate: form.dueDate ? new Date(form.dueDate) : null,
            tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        };
        try {
            if (editTodo) {
                await updateTodo(user.uid, editTodo.id, data, activeProjectId);
            } else {
                await addTodo(user.uid, data, activeProjectId);
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
                    <h2 className="modal-title">{editTodo ? "編輯任務" : "新增任務"}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">任務標題 *</label>
                        <input
                            className="form-input"
                            placeholder="要做什麼？"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">說明（選填）</label>
                        <textarea
                            className="form-textarea"
                            placeholder="補充說明..."
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                        />
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">優先級</label>
                            <select
                                className="form-select"
                                value={form.priority}
                                onChange={(e) => set("priority", e.target.value)}
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">截止日期</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.dueDate}
                                onChange={(e) => set("dueDate", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">標籤（逗號分隔）</label>
                        <input
                            className="form-input"
                            placeholder="工作, 個人, 健康..."
                            value={form.tags}
                            onChange={(e) => set("tags", e.target.value)}
                        />
                    </div>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? "儲存中..." : editTodo ? "更新" : "新增"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
