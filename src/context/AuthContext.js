"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange } from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(undefined); // undefined = loading

    useEffect(() => {
        const unsub = onAuthChange((u) => setUser(u));
        return unsub;
    }, []);

    return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
