import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, Node, Link, FlowType } from '../types';

interface GalaxyGraphProps {
  data: GraphData;
  onNodeClick: (node: Node) => void;
  width?: number;
  height?: number;
}

const GalaxyGraph: React.FC<GalaxyGraphProps> = ({ data, onNodeClick, width = 800, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.clientWidth,
          height: wrapperRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const { width, height } = dimensions;

    // --- CRITICAL FIX FOR REACT/D3 INTEROP ---
    // D3 mutates objects. React creates new objects on state change.
    // We must clone the data and ensure links use String IDs initially so D3 can re-bind them to the NEW nodes.
    
    const simulationNodes = data.nodes.map(d => ({ ...d }));
    
    const simulationLinks = data.links.map(d => ({
      ...d,
      // Reset source/target to string IDs if they have become objects from previous D3 runs
      source: typeof d.source === 'object' ? (d.source as any).id : d.source,
      target: typeof d.target === 'object' ? (d.target as any).id : d.target
    }));
    // -----------------------------------------

    // Define colors
    const colors = {
      [FlowType.INVESTMENT]: '#39ff14', // Neon Green
      [FlowType.SERVICES]: '#00ffff',   // Neon Blue
      [FlowType.HARDWARE]: '#ff00ff',   // Neon Pink
      nodeCentral: '#ffffff',
      nodeSat: '#cccccc',
      nodeOuter: '#999999'
    };

    // Zoom behavior
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);

    // Simulation setup
    const simulation = d3.forceSimulation<Node>(simulationNodes)
      .force("link", d3.forceLink<Node, Link>(simulationLinks).id(d => d.id).distance(180)) // Increased distance
      .force("charge", d3.forceManyBody().strength(-500)) // Increased repulsion
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => (d as Node).val + 20));

    // Glow Filters
    const defs = svg.append("defs");
    ['green', 'blue', 'pink'].forEach(color => {
      const filter = defs.append("filter")
        .attr("id", `glow-${color}`);
      filter.append("feGaussianBlur")
        .attr("stdDeviation", "2.5")
        .attr("result", "coloredBlur");
      const merge = filter.append("feMerge");
      merge.append("feMergeNode").attr("in", "coloredBlur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Arrow markers
    const markerColors = {
      'Investment': '#39ff14',
      'Services': '#00ffff',
      'Hardware': '#ff00ff'
    };
    
    Object.entries(markerColors).forEach(([type, color]) => {
      svg.append("defs").append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28) // Pushed back slightly to sit on edge of circle
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color);
    });

    // Links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(simulationLinks)
      .enter().append("line")
      .attr("stroke-width", d => Math.sqrt(d.value) * 2)
      .attr("stroke", d => colors[d.type])
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", d => `url(#arrow-${d.type})`)
      .attr("filter", d => {
        if (d.type === FlowType.INVESTMENT) return "url(#glow-green)";
        if (d.type === FlowType.SERVICES) return "url(#glow-blue)";
        return "url(#glow-pink)";
      });

    // Nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(simulationNodes)
      .enter().append("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Circles
    node.append("circle")
      .attr("r", d => d.val)
      .attr("fill", "#050505")
      .attr("stroke", d => {
        if (d.group === 'Central') return colors.nodeCentral;
        if (d.group === 'Satellite') return colors.nodeSat;
        return colors.nodeOuter;
      })
      .attr("stroke-width", 3)
      .on("click", (event, d) => {
        event.stopPropagation();
        // Find the original node object from the prop data to return, 
        // as the d3 node is a clone
        const originalNode = data.nodes.find(n => n.id === d.id);
        if (originalNode) onNodeClick(originalNode);
      });

    // Node Labels (Ticker)
    node.append("text")
      .text(d => d.ticker)
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", d => d.group === 'Central' ? "12px" : "10px")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold")
      .style("pointer-events", "none");
    
    // Node Name Labels (below)
    node.append("text")
      .text(d => d.id)
      .attr("dy", d => d.val + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#888")
      .attr("font-size", "10px")
      .style("pointer-events", "none");

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, dimensions, onNodeClick]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-obsidian border border-gray-800 rounded-lg overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-neon-blue font-mono text-sm tracking-widest uppercase mb-1">Galaxy View</h2>
        <div className="flex gap-4 text-xs font-mono text-gray-400">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-green"></span> Investment</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-blue"></span> Services</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-pink"></span> Hardware</span>
        </div>
      </div>
      <svg ref={svgRef} width="100%" height="100%" className="cursor-grab active:cursor-grabbing"></svg>
    </div>
  );
};

export default GalaxyGraph;