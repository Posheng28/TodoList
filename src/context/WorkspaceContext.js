"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { subscribeProjects } from "@/lib/firestore";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    // null = personal workspace, string = project ID
    const [activeProjectId, setActiveProjectId] = useState(null);

    useEffect(() => {
        if (!user) return;
        return subscribeProjects(user.uid, setProjects);
    }, [user]);

    const activeProject = activeProjectId
        ? projects.find((p) => p.id === activeProjectId) || null
        : null;

    const switchToPersonal = () => setActiveProjectId(null);
    const switchToProject = (id) => setActiveProjectId(id);

    return (
        <WorkspaceContext.Provider value={{
            projects,
            activeProjectId,
            activeProject,
            isPersonal: activeProjectId === null,
            switchToPersonal,
            switchToProject,
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    return useContext(WorkspaceContext);
}
