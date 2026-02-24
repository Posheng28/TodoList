"use client";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logOut } from "@/lib/auth";
import { addProject, deleteProject } from "@/lib/firestore";
import Link from "next/link";

const NAV = [
    { href: "/today", icon: "📋", label: "今日任務" },
    { href: "/calendar", icon: "📅", label: "行事曆" },
    { href: "/all", icon: "📂", label: "所有任務" },
    { href: "/routines", icon: "🔁", label: "Routine" },
];

export default function AppLayout({ children }) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const workspace = useWorkspace();
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectEmoji, setNewProjectEmoji] = useState("📁");

    useEffect(() => {
        if (user === null) router.replace("/login");
    }, [user, router]);

    if (!user || !workspace) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
            </div>
        );
    }

    const { projects, activeProjectId, activeProject, isPersonal, switchToPersonal, switchToProject } = workspace;

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        await addProject(user.uid, { name: newProjectName.trim(), emoji: newProjectEmoji });
        setNewProjectName("");
        setNewProjectEmoji("📁");
        setShowProjectForm(false);
    };

    const handleDeleteProject = async (e, p) => {
        e.stopPropagation();
        if (confirm(`確定要刪除專案「${p.name}」？（任務資料將一併刪除）`)) {
            if (activeProjectId === p.id) switchToPersonal();
            await deleteProject(user.uid, p.id);
        }
    };

    const EMOJIS = ["📁", "🚀", "🎮", "🎓", "💼", "🏠", "🎨", "🔬", "✈️", "🤖"];

    return (
        <div className="app-layout">
            {/* Sidebar (desktop) */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <span>✅</span> Todo List
                </div>

                {/* Workspace Switcher */}
                <div className="workspace-switcher">
                    <div className="workspace-label">工作空間</div>
                    <button
                        className={`workspace-btn${isPersonal ? " active" : ""}`}
                        onClick={switchToPersonal}
                    >
                        <span className="workspace-icon">👤</span> 個人
                    </button>
                    {projects.map((p) => (
                        <button
                            key={p.id}
                            className={`workspace-btn${activeProjectId === p.id ? " active" : ""}`}
                            onClick={() => switchToProject(p.id)}
                        >
                            <span className="workspace-icon">{p.emoji || "📁"}</span>
                            <span className="workspace-name">{p.name}</span>
                            <span className="workspace-delete" onClick={(e) => handleDeleteProject(e, p)} title="刪除專案">✕</span>
                        </button>
                    ))}
                    {showProjectForm ? (
                        <form onSubmit={handleAddProject} className="workspace-form">
                            <div className="emoji-picker-row">
                                {EMOJIS.map((e) => (
                                    <button key={e} type="button" className={`emoji-btn${newProjectEmoji === e ? " selected" : ""}`} onClick={() => setNewProjectEmoji(e)}>{e}</button>
                                ))}
                            </div>
                            <input
                                className="workspace-input"
                                placeholder="專案名稱..."
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                autoFocus
                            />
                            <div style={{ display: "flex", gap: 4 }}>
                                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>建立</button>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowProjectForm(false)}>取消</button>
                            </div>
                        </form>
                    ) : (
                        <button className="workspace-add-btn" onClick={() => setShowProjectForm(true)}>
                            ＋ 新增專案
                        </button>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {NAV.map((n) => (
                        <Link
                            key={n.href}
                            href={n.href}
                            className={`nav-item${pathname === n.href ? " active" : ""}`}
                        >
                            <span className="nav-icon">{n.icon}</span>
                            {n.label}
                        </Link>
                    ))}
                </nav>
                <div className="sidebar-user">
                    {user.photoURL && (
                        <img src={user.photoURL} alt="avatar" className="user-avatar" />
                    )}
                    <div className="user-info">
                        <div className="user-name">{user.displayName}</div>
                        <div className="user-email">{user.email}</div>
                    </div>
                    <button className="logout-btn" onClick={logOut} title="登出">⏏</button>
                </div>
            </aside>

            {/* Main */}
            <main className="main-content">
                {activeProject && (
                    <div className="project-banner">
                        <span className="project-banner-emoji">{activeProject.emoji}</span>
                        <span className="project-banner-name">{activeProject.name}</span>
                        <button className="btn btn-ghost btn-sm" onClick={switchToPersonal}>← 回到個人</button>
                    </div>
                )}
                {children}
            </main>

            {/* Bottom nav (mobile) */}
            <nav className="bottom-nav">
                {NAV.map((n) => (
                    <Link
                        key={n.href}
                        href={n.href}
                        className={`bottom-nav-item${pathname === n.href ? " active" : ""}`}
                    >
                        <span className="nav-icon">{n.icon}</span>
                        {n.label}
                    </Link>
                ))}
                <Link
                    href="/projects"
                    className={`bottom-nav-item${pathname === "/projects" ? " active" : ""}`}
                >
                    <span className="nav-icon">📂</span>
                    專案
                </Link>
            </nav>
        </div>
    );
}
