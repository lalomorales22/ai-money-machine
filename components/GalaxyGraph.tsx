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
  
  // Refs to persist simulation and data across renders without re-initializing
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  
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

  // Initialize Graph (Run Once)
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Setup SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear initial if any

    // Defs (Glows/Arrows)
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

    const markerColors: Record<string, string> = {
      'Investment': '#39ff14',
      'Services': '#00ffff',
      'Hardware': '#ff00ff'
    };
    
    Object.entries(markerColors).forEach(([type, color]) => {
      svg.append("defs").append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color);
    });

    // Main Group with Zoom
    const g = svg.append("g");
    gRef.current = g;
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Initialize Simulation
    simulationRef.current = d3.forceSimulation<Node>()
      .force("link", d3.forceLink<Node, Link>().id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collide", d3.forceCollide().radius(d => (d.val || 20) + 15).iterations(2));

    // Cleanup
    return () => {
      simulationRef.current?.stop();
    };
  }, []); 

  // Update Data (Run on data/dim change)
  useEffect(() => {
    if (!simulationRef.current || !gRef.current || !data.nodes.length) return;
    
    const simulation = simulationRef.current;
    const g = gRef.current;
    const { width, height } = dimensions;

    // Center force update
    simulation.force("center", d3.forceCenter(width / 2, height / 2));

    // --- DATA MERGING STRATEGY ---
    // 1. Get current nodes from simulation to preserve positions
    // We cast to [string, Node] to ensure the Map values are correctly typed as Node
    const currentNodesMap = new Map(simulation.nodes().map(n => [n.id, n] as [string, Node]));

    // 2. Map new data to simulation nodes, preserving state (x,y,vx,vy)
    const newSimulationNodes = data.nodes.map(d => {
      const existing = currentNodesMap.get(d.id);
      if (existing) {
        // Preserve physics state
        return { 
          ...d, 
          x: existing.x, 
          y: existing.y, 
          vx: existing.vx, 
          vy: existing.vy, 
          fx: existing.fx, 
          fy: existing.fy 
        };
      } else {
        // New Node: Spawn on outer rim
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.max(width, height); // Far out
        return { 
          ...d, 
          x: (width / 2) + radius * Math.cos(angle), 
          y: (height / 2) + radius * Math.sin(angle) 
        };
      }
    });

    // 3. Prepare Links (Must resolve back to string IDs for re-binding)
    const newSimulationLinks = data.links.map(d => ({
      ...d,
      source: typeof d.source === 'object' ? (d.source as Node).id : d.source,
      target: typeof d.target === 'object' ? (d.target as Node).id : d.target
    }));

    // --- UPDATE SIMULATION DATA ---
    simulation.nodes(newSimulationNodes);
    (simulation.force("link") as d3.ForceLink<Node, Link>).links(newSimulationLinks);

    // --- RENDERING (JOIN PATTERN) ---
    
    // LINKS
    const link = g.selectAll<SVGLineElement, Link>(".link")
      .data(newSimulationLinks, (d: any) => `${d.source.id || d.source}-${d.target.id || d.target}`);

    const linkEnter = link.enter().insert("line", ".node") // Insert before nodes
      .attr("class", "link")
      .attr("stroke-opacity", 0.6);
      
    const linkMerge = linkEnter.merge(link);
    
    // Update link attributes
    const colorMap: any = { [FlowType.INVESTMENT]: '#39ff14', [FlowType.SERVICES]: '#00ffff', [FlowType.HARDWARE]: '#ff00ff' };
    
    linkMerge
      .attr("stroke-width", d => Math.sqrt(d.value) * 2)
      .attr("stroke", d => colorMap[d.type])
      .attr("marker-end", d => `url(#arrow-${d.type})`)
      .attr("filter", d => {
        if (d.type === FlowType.INVESTMENT) return "url(#glow-green)";
        if (d.type === FlowType.SERVICES) return "url(#glow-blue)";
        return "url(#glow-pink)";
      });

    link.exit().remove();

    // NODES
    const node = g.selectAll<SVGGElement, Node>(".node")
      .data(newSimulationNodes, d => d.id);

    const nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          // Sticky drag: Do NOT reset fx/fy to null. Node stays where placed.
        }));

    // Add Circle
    nodeEnter.append("circle")
      .attr("r", 0) // Animate in from 0
      .transition().duration(750)
      .attr("r", d => d.val);

    // Add Text Labels
    nodeEnter.append("text")
      .attr("class", "ticker-label")
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-family", "monospace")
      .attr("font-weight", "bold")
      .style("pointer-events", "none");
      
    nodeEnter.append("text")
      .attr("class", "name-label")
      .attr("text-anchor", "middle")
      .attr("fill", "#888")
      .attr("font-size", "10px")
      .style("pointer-events", "none");

    const nodeMerge = nodeEnter.merge(node);

    // Update Node Attributes (Color/Size can change with sentiment)
    nodeMerge.select("circle")
      .attr("r", d => d.val)
      .attr("stroke", d => {
        if (d.group === 'Central') return '#ffffff';
        if (d.group === 'Satellite') return '#cccccc';
        return '#999999';
      })
      .attr("fill", "#050505")
      .attr("stroke-width", 3)
      .on("click", (event, d) => {
         event.stopPropagation();
         const orig = data.nodes.find(n => n.id === d.id);
         if (orig) onNodeClick(orig);
      });

    nodeMerge.select(".ticker-label")
       .text(d => d.ticker)
       .attr("font-size", d => d.group === 'Central' ? "12px" : "10px");

    nodeMerge.select(".name-label")
       .text(d => d.id)
       .attr("dy", d => d.val + 15);

    node.exit().transition().duration(500).attr("opacity", 0).remove();

    // Restart simulation gently to accommodate new links/values, 
    // but low alpha prevents "exploding" graph.
    simulation.on("tick", () => {
      linkMerge
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      nodeMerge
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    simulation.alpha(0.1).restart();

  }, [data, dimensions, onNodeClick]); // Re-run on data change

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