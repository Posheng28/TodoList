"use client";
import { signInWithGoogle } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) router.replace("/today");
    }, [user, router]);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-icon">✅</div>
                <h1 className="login-title">Todo List</h1>
                <p className="login-subtitle">跨裝置同步，隨時隨地掌握你的任務</p>
                <button className="google-btn" onClick={handleLogin} disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                    {loading ? "登入中..." : "以 Google 帳號登入"}
                </button>
            </div>
        </div>
    );
}
