"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { subscribeRoutines, updateRoutine, deleteRoutine } from "@/lib/firestore";
import AddRoutineModal from "@/components/AddRoutineModal";

const DAY_LABELS = { mon: "週一", tue: "週二", wed: "週三", thu: "週四", fri: "週五", sat: "週六", sun: "週日" };
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function RoutinesPage() {
    const { user } = useAuth();
    const { activeProjectId } = useWorkspace();
    const [routines, setRoutines] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editRoutine, setEditRoutine] = useState(null);

    useEffect(() => {
        if (!user) return;
        setRoutines([]);
        return subscribeRoutines(user.uid, setRoutines, activeProjectId);
    }, [user, activeProjectId]);

    const toggleActive = (r) => updateRoutine(user.uid, r.id, { active: !r.active }, activeProjectId);
    const remove = (r) => {
        if (confirm(`確定要刪除「${r.title}」？`)) deleteRoutine(user.uid, r.id, activeProjectId);
    };

    const sortedDays = (days) => DAY_ORDER.filter((d) => (days || []).includes(d));

    const getModeLabel = (r) => {
        if (r.mode === "interval" || r.intervalDays) {
            return `🔄 每 ${r.intervalDays} 天一次`;
        }
        return "📅 固定星期";
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Daily Routine</h1>
                    <p className="page-subtitle">設定每日重複任務，自動加入今日清單</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditRoutine(null); setShowModal(true); }}>
                    ＋ 新增 Routine
                </button>
            </div>

            {routines.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🔁</div>
                    <p>還沒有 Routine，點右上角新增一個！</p>
                    <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                        設定後，每天系統會自動把 Routine 加入今日任務
                    </p>
                </div>
            )}

            <div className="routine-grid">
                {routines.map((r) => (
                    <div key={r.id} className="routine-card" style={{ opacity: r.active ? 1 : 0.5 }}>
                        <div className="routine-header">
                            <div>
                                <div className="routine-title">{r.title}</div>
                                {r.description && <div className="routine-desc">{r.description}</div>}
                            </div>
                            <div className="routine-toggle-wrap">
                                <label className="toggle" title={r.active ? "停用" : "啟用"}>
                                    <input type="checkbox" checked={r.active} onChange={() => toggleActive(r)} />
                                    <span className="toggle-slider" />
                                </label>
                            </div>
                        </div>

                        <div style={{ fontSize: 12, color: "var(--accent-light)", marginBottom: 6, fontWeight: 600 }}>
                            {getModeLabel(r)}
                        </div>

                        {(r.mode === "weekly" || (!r.mode && r.days?.length > 0)) && (
                            <div className="routine-days">
                                {sortedDays(r.days).map((d) => (
                                    <span key={d} className="routine-day-chip">{DAY_LABELS[d]}</span>
                                ))}
                            </div>
                        )}

                        {(r.mode === "interval" || r.intervalDays) && (
                            <div className="routine-days">
                                <span className="routine-day-chip">每 {r.intervalDays} 天</span>
                                {r.startDate && (
                                    <span className="routine-day-chip" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
                                        起始 {(r.startDate?.toDate ? r.startDate.toDate() : new Date(r.startDate)).toLocaleDateString("zh-TW", { month: "short", day: "numeric" })}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="routine-meta">
                            <span>🕐 {r.time}</span>
                            <span>{r.active ? "✅ 啟用中" : "⏸ 已停用"}</span>
                        </div>

                        <div className="divider" style={{ margin: "12px 0" }} />

                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ flex: 1 }}
                                onClick={() => { setEditRoutine(r); setShowModal(true); }}
                            >
                                ✏️ 編輯
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => remove(r)}>
                                🗑 刪除
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button className="fab" onClick={() => { setEditRoutine(null); setShowModal(true); }}>＋</button>

            {showModal && (
                <AddRoutineModal onClose={() => setShowModal(false)} editRoutine={editRoutine} />
            )}
        </>
    );
}
