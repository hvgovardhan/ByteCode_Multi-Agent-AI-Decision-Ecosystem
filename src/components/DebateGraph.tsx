import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { AGENT_CONFIGS, DEBATE_AGENTS } from "@/lib/agentConfig";
import type { AgentOpinion, AgentRole } from "@/types/debate";

interface DebateGraphProps {
  opinions: AgentOpinion[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: AgentRole;
  label: string;
  emoji: string;
  color: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: AgentRole | GraphNode;
  target: AgentRole | GraphNode;
}

export default function DebateGraph({ opinions }: DebateGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || opinions.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 500;
    const height = 300;

    const nodes: GraphNode[] = [...DEBATE_AGENTS, "moderator" as AgentRole].map(
      (role) => ({
        id: role,
        label: AGENT_CONFIGS[role].label,
        emoji: AGENT_CONFIGS[role].emoji,
        color: AGENT_CONFIGS[role].textColor
          .replace("text-", "")
          .replace("-400", ""),
      })
    );

    const links: GraphLink[] = [];
    opinions.forEach((opinion) => {
      opinion.influenced_by.forEach((source) => {
        links.push({ source, target: opinion.agent });
      });
      // Moderator is influenced by all agents
      if (opinion.agent !== "moderator") {
        links.push({ source: opinion.agent, target: "moderator" });
      }
    });

    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6b7280");

    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#374151")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer");

    node
      .append("circle")
      .attr("r", 24)
      .attr("fill", "#1e293b")
      .attr("stroke", "#334155")
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "18px")
      .text((d) => d.emoji);

    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 36)
      .attr("font-size", "10px")
      .attr("fill", "#94a3b8")
      .text((d) => AGENT_CONFIGS[d.id].label.replace(" Agent", ""));

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      node.attr(
        "transform",
        (d) => `translate(${d.x ?? 0},${d.y ?? 0})`
      );
    });

    return () => {
      simulation.stop();
    };
  }, [opinions]);

  if (opinions.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
        Argument Influence Graph
      </p>
      <svg
        ref={svgRef}
        className="w-full"
        height={300}
        aria-label="Argument influence graph showing connections between agents"
      />
    </div>
  );
}
