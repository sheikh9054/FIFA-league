"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register" | "guest">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let result;
      if (mode === "guest") {
        result = await api.auth.guest(guestName || undefined);
      } else if (mode === "register") {
        result = await api.auth.register(email, password, name);
      } else {
        result = await api.auth.login(email, password);
      }
      setAuth(result.token, result.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-champions-dark p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple font-black text-xl">
              FC
            </div>
            <CardTitle className="text-2xl">
              {mode === "guest" ? "Guest Access" : mode === "register" ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {mode === "guest"
                ? "Play as guest — perfect for friends"
                : "Manage your FIFA 25 local league"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "guest" ? (
                <Input
                  placeholder="Your gamer tag (optional)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              ) : (
                <>
                  {mode === "register" && (
                    <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                  )}
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : mode === "guest" ? "Continue as Guest" : mode === "register" ? "Register" : "Login"}
              </Button>
            </form>

            <div className="mt-4 flex flex-col gap-2 text-center text-sm">
              {mode !== "login" && (
                <button className="text-neon-blue hover:underline" onClick={() => setMode("login")}>
                  Already have an account?
                </button>
              )}
              {mode !== "register" && (
                <button className="text-muted-foreground hover:text-foreground" onClick={() => setMode("register")}>
                  Create account
                </button>
              )}
              {mode !== "guest" && (
                <button className="text-muted-foreground hover:text-foreground" onClick={() => setMode("guest")}>
                  Continue as Guest
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Demo admin: admin@fifaleague.local / admin123
            </p>

            <Link href="/dashboard" className="mt-4 block text-center text-sm text-neon-blue hover:underline">
              Skip to dashboard →
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
