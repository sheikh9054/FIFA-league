"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: "blue" | "purple" | "green" | "gold";
  delay?: number;
}

const colors = {
  blue: "from-neon-blue/20 to-transparent text-neon-blue",
  purple: "from-neon-purple/20 to-transparent text-neon-purple",
  green: "from-neon-green/20 to-transparent text-neon-green",
  gold: "from-neon-gold/20 to-transparent text-neon-gold",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = "blue", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="stat-card"
    >
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          {trend && <p className="mt-2 text-xs font-medium text-neon-green">{trend}</p>}
        </div>
        <div className={cn("rounded-xl bg-gradient-to-br p-3", colors[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}
