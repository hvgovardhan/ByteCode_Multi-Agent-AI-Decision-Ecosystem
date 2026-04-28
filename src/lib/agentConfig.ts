import type { AgentRole } from "@/types/debate";

export interface AgentConfig {
  role: AgentRole;
  label: string;
  emoji: string;
  color: string;        // Tailwind border/ring color
  bgColor: string;      // Tailwind bg color (muted)
  textColor: string;    // Tailwind text color
  description: string;
}

export const AGENT_CONFIGS: Record<AgentRole, AgentConfig> = {
  economy: {
    role: "economy",
    label: "Economy Agent",
    emoji: "📈",
    color: "border-emerald-500",
    bgColor: "bg-emerald-950/40",
    textColor: "text-emerald-400",
    description: "Analyzes economic impact, GDP, jobs, and financial viability",
  },
  environment: {
    role: "environment",
    label: "Environment Agent",
    emoji: "🌿",
    color: "border-green-500",
    bgColor: "bg-green-950/40",
    textColor: "text-green-400",
    description: "Evaluates carbon footprint, sustainability, and ecological impact",
  },
  citizen: {
    role: "citizen",
    label: "Citizen Agent",
    emoji: "👥",
    color: "border-blue-500",
    bgColor: "bg-blue-950/40",
    textColor: "text-blue-400",
    description: "Represents public satisfaction, accessibility, and quality of life",
  },
  cost: {
    role: "cost",
    label: "Cost Agent",
    emoji: "💰",
    color: "border-yellow-500",
    bgColor: "bg-yellow-950/40",
    textColor: "text-yellow-400",
    description: "Scrutinizes budget, ROI, maintenance costs, and fiscal risk",
  },
  moderator: {
    role: "moderator",
    label: "Moderator",
    emoji: "⚖️",
    color: "border-purple-500",
    bgColor: "bg-purple-950/40",
    textColor: "text-purple-400",
    description: "Synthesizes all arguments and delivers the final verdict",
  },
};

export const DEBATE_AGENTS: AgentRole[] = ["economy", "environment", "citizen", "cost"];
