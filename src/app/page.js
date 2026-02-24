"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; // loading
    if (user) router.replace("/today");
    else router.replace("/login");
  }, [user, router]);

  return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );
}
