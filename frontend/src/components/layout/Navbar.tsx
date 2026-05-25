"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Trophy, Users, Swords, Calendar,
  BarChart3, Shield, Heart, Menu, X, Sun, Moon, LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/standings", label: "Standings", icon: Trophy },
  { href: "/players", label: "Players", icon: Users },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/friendlies", label: "Friendlies", icon: Heart },
  { href: "/fixtures", label: "Fixtures", icon: Calendar },
  { href: "/stats", label: "Analytics", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, theme, setTheme, clearAuth } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple font-black text-sm">
              FC
            </div>
            <span className="hidden font-bold sm:block">
              <span className="neon-text">FIFA 25</span> League
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      active
                        ? "bg-neon-blue/20 text-neon-blue"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="btn-ghost p-2"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm text-muted-foreground">{user.name}</span>
                <Button variant="ghost" size="sm" onClick={clearAuth}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
            )}
            <button className="btn-ghost p-2 lg:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-0 top-16 z-40 glass border-b border-white/10 p-4 lg:hidden"
        >
          <nav className="flex flex-col gap-1">
            {navItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium",
                    pathname === item.href ? "bg-neon-blue/20 text-neon-blue" : "hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
          </nav>
        </motion.div>
      )}
    </>
  );
}
