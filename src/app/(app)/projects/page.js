"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { addProject, deleteProject } from "@/lib/firestore";
import { useRouter } from "next/navigation";

const EMOJIS = ["📁", "🚀", "🎮", "🎓", "💼", "🏠", "🎨", "🔬", "✈️", "🤖"];

export default function ProjectsPage() {
    const { user } = useAuth();
    const { projects, activeProjectId, switchToPersonal, switchToProject } = useWorkspace();
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("📁");

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const docRef = await addProject(user.uid, { name: name.trim(), emoji });
        setName("");
        setEmoji("📁");
        setShowForm(false);
        switchToProject(docRef.id);
        router.push("/today");
    };

    const handleDelete = async (p) => {
        if (confirm(`確定要刪除專案「${p.name}」？`)) {
            if (activeProjectId === p.id) switchToPersonal();
            await deleteProject(user.uid, p.id);
        }
    };

    const selectProject = (p) => {
        switchToProject(p.id);
        router.push("/today");
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">專案管理</h1>
                    <p className="page-subtitle">建立專案，分組管理任務</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    ＋ 新增專案
                </button>
            </div>

            {/* Personal */}
            <div
                className={`project-card${activeProjectId === null ? " active" : ""}`}
                onClick={() => { switchToPersonal(); router.push("/today"); }}
            >
                <span className="project-card-emoji">👤</span>
                <div className="project-card-body">
                    <div className="project-card-name">個人空間</div>
                    <div className="project-card-desc">個人的任務與 Routine</div>
                </div>
                {activeProjectId === null && <span className="project-active-badge">目前使用中</span>}
            </div>

            {/* Projects */}
            {projects.map((p) => (
                <div
                    key={p.id}
                    className={`project-card${activeProjectId === p.id ? " active" : ""}`}
                    onClick={() => selectProject(p)}
                >
                    <span className="project-card-emoji">{p.emoji || "📁"}</span>
                    <div className="project-card-body">
                        <div className="project-card-name">{p.name}</div>
                        {p.description && <div className="project-card-desc">{p.description}</div>}
                    </div>
                    {activeProjectId === p.id && <span className="project-active-badge">使用中</span>}
                    <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                        title="刪除"
                    >
                        🗑
                    </button>
                </div>
            ))}

            {projects.length === 0 && !showForm && (
                <div className="empty-state" style={{ padding: 40 }}>
                    <div className="empty-icon">📂</div>
                    <p>還沒有專案，點右上角建立一個！</p>
                    <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                        每個專案有獨立的任務清單與 Routine
                    </p>
                </div>
            )}

            {showForm && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">新增專案</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="form-group">
                                <label className="form-label">圖示</label>
                                <div className="emoji-picker-row">
                                    {EMOJIS.map((e) => (
                                        <button key={e} type="button" className={`emoji-btn${emoji === e ? " selected" : ""}`} onClick={() => setEmoji(e)}>{e}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">專案名稱 *</label>
                                <input className="form-input" placeholder="例：無人機社團" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>取消</button>
                                <button type="submit" className="btn btn-primary" disabled={!name.trim()}>建立</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <button className="fab" onClick={() => setShowForm(true)}>＋</button>
        </>
    );
}
