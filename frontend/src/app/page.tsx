"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Zap, Users, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Trophy, title: "Live Standings", desc: "Real-time league table with Champions League styling" },
  { icon: Zap, title: "ELO System", desc: "Advanced ratings with upset bonuses and history graphs" },
  { icon: Users, title: "Player Profiles", desc: "Full stats, form streaks, and match history" },
  { icon: BarChart3, title: "Analytics", desc: "Top scorers, clean sheets, win streaks & more" },
  { icon: Shield, title: "Admin Panel", desc: "Manage players, fixtures, and export data" },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-pitch-lines opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-champions-dark/50 to-champions-dark" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple font-black">
            FC
          </div>
          <span className="font-display text-xl font-bold">FIFA 25 League</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="secondary">Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Enter League</Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-neon-blue">
            EA Sports FC • Local Esports Platform
          </p>
          <h1 className="font-display text-5xl font-black leading-tight sm:text-7xl">
            <span className="neon-text">Champions</span>
            <br />
            League Manager
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Run your FIFA 25 friend league like a pro. Live standings, ELO ratings,
            friendly matches, tournaments, and realtime updates.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg">Open Dashboard</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Guest / Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-card"
            >
              <f.icon className="mb-3 h-8 w-8 text-neon-blue" />
              <h3 className="font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-muted-foreground">
        FIFA 25 Local League Platform • Built for friends, scales to cloud
      </footer>
    </div>
  );
}
