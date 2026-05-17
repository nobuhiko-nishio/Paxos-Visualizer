import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

// --- Types ---
type Value = string;
type Mode = "P1" | "P2";

interface NodeState {
  id: string;
  type: "proposer" | "acceptor";
  value: Value | null;
  isAccepted: boolean;
  // P2 specific fields
  promisedN: number; 
}

interface MessageAnimation {
  id: string;
  fromId: string;
  toId: string;
  value: string;
  proposalN?: number; // For P2
}

const NodeComponent = ({ node, x, y }: { node: NodeState; x: number; y: number }) => {
  const isProposer = node.type === "proposer";
  return (
    <div
      className="absolute flex flex-col items-center justify-center transition-all duration-500"
      style={{ left: `${x}px`, top: `${y}px`, transform: "translate(-50%, -50%)" }}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold border-4 ${
          isProposer 
            ? "border-blue-500 bg-blue-900/50" 
            : node.isAccepted 
              ? "border-yellow-400 bg-yellow-900/50" 
              : "border-green-500 bg-green-900/50"
        }`}
      >
        {node.id}
      </div>
      <div className={`mt-1 text-[10px] font-mono px-2 py-0.5 rounded text-center w-20 truncate ${
        node.isAccepted ? "bg-yellow-600 text-white" : "bg-black/50 text-slate-300"
      }`}>
        {node.value ? `Val: ${node.value}` : "Empty"}
      </div>
    </div>
  );
};

const MessageParticle = ({ msg, startX, startY, endX, endY, onArrival }: { msg: MessageAnimation; startX: number; startY: number; endX: number; endY: number; onArrival: (id: string) => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          // Use setTimeout to ensure the state update happens outside of the render cycle
          setTimeout(() => onArrival(msg.id), 0);
          return 1;
        }
        return p + 0.02;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [msg.id, onArrival]);

  const currentX = startX + (endX - startX) * progress;
  const currentY = startY + (endY - startY) * progress;

  return (
    <div
      className="absolute w-8 h-8 bg-yellow-400 rounded-full z-50 shadow-[0_0_15px_yellow] flex items-center justify-center text-xs font-bold text-black"
      style={{ left: `${currentX}px`, top: `${currentY}px`, transform: "translate(-50%, -50%)" }}
    >
      {msg.value}
    </div>
  );
};

const App = () => {
  const [mode, setMode] = useState<Mode>("P1");
  const [nodes, setNodes] = useState<NodeState[]>([
    { id: "p1", type: "proposer", value: null, isAccepted: false, promisedN: 0 },
    { id: "p2", type: "proposer", value: null, isAccepted: false, promisedN: 0 },
    { id: "p3", type: "proposer", value: null, isAccepted: false, promisedN: 0 },
    { id: "a1", type: "acceptor", value: null, isAccepted: false, promisedN: 0 },
    { id: "a2", type: "acceptor", value: null, isAccepted: false, promisedN: 0 },
    { id: "a3", type: "acceptor", value: null, isAccepted: false, promisedN: 0 },
    { id: "a4", type: "acceptor", value: null, isAccepted: false, promisedN: 0 },
    { id: "a5", type: "acceptor", value: null, isAccepted: false, promisedN: 0 },
  ]);

  const [messages, setMessages] = useState<MessageAnimation[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const getPosition = (id: string) => {
    if (id === "p1") return { x: 400, y: 150 };
    if (id === "p2") return { x: 200, y: 250 };
    if (id === "p3") return {x: 600, y: 250 };
    if (id === "a1") return { x: 200, y: 450 };
    if (id === "a2") { return { x: 300, y: 550 }; }
    if (id === "a3") return { x: 400, y: 450 };
    if (id === "a4") { return { x: 500, y: 550 }; }
    if (id === "a5") return { x: 600, y: 450 };
    return { x: 400, y: 350 };
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  };

  const handleMessageArrival = (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  const sendMessage = (fromId: string, toId: string, value: string, delay: number, proposalN?: number) => {
    const msgId = Math.random().toString(36).substring(7);
    
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: msgId, fromId, toId, value, proposalN }]);
      addLog(`${fromId} -> ${toId}: ${value}${proposalN ? ` (N=${proposalN})` : ""}`);

      // The update will happen via onArrival in MessageParticle.
    }, delay);
  };

  const runScenario = async () => {
    setNodes([
      { id: "p1", type: "proposer", value: null, isAccepted: false, promisedN: 0 },
      { id: "p2", type: "proposer", value: null, isAccepted: false, promisedN: 0 },
      { id: "p3", type: "proposer", value: null, isAccepted: false, promisedN: 0 },
      { id: "a1", type: "acceptor", value: null, isAccepted: false, promisedN: 0 },
      { id: "a2", type: "acceptor", value: null, isAccepted: false, promisedN: 0 },
      { id: "a3", type: "acceptor", value: null, isAccepted: false, promisedN: 0 },
      { id: "a4", type: "acceptor", value: null, isAccepted: false, promisedN: 0 },
      { id: "a5", type: "acceptor", value: null, isAccepted: false, promisedN: 0 },
    ]);
    setMessages([]);
    setLogs([]);

    addLog(`Starting Scenario (Mode: ${mode})...`);
    
    const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);

    setTimeout(() => {
      addLog("Proposers starting broadcasts...");
      const proposerOrder = shuffle(["p1", "p2", "p3"]);
      
      const targetsP1 = shuffle(["a1", "a2", "a3", "a4", "a5"]);
      const targetsP2 = shuffle(["a1", "a2", "a3", "a4", "a5"]);
      const targetsP3 = shuffle(["a1", "a2", "a3", "a4", "a5"]);

      const allTargets = [targetsP1, targetsP2, targetsP3];
      const allValues = ["A", "B", "C"];

      proposerOrder.forEach((pId, idx) => {
        const targets = allTargets[idx];
        const val = allValues[idx];
        const baseDelay = 1000 + (idx * 500); 

        targets.forEach((target, i) => {
          sendMessage(pId, target, val, baseDelay + i * 800);
        });
      });
    }, 1000);
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden select-none">
      <div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-700 z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-400">Paxos Visualizer</h1>
          <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
            <button 
              onClick={() => { setMode("P1"); setNodes([...nodes]); }}
              className={`px-3 py-0.5 rounded text-xs font-bold transition-all ${mode === "P1" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              P1 (Basic)
            </button>
            <button 
              onClick={() => { setMode("P2"); setNodes([...nodes]); }}
              className={`px-3 py-0.5 rounded text-xs font-bold transition-all ${mode === "P2" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              P2 (Numbered)
            </button>
          </div>
        </div>
        <button 
          onClick={runScenario}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-all transform hover:scale-105 active:scale-95"
        >
          Run Scenario
        </button>
      </div>

      <div className="w-full h-full relative">
        {nodes.map((node) => {
          const pos = getPosition(node.id);
          return <NodeComponent key={node.id} node={node} x={pos.x} y={pos.y} />;
        })}

        {messages.map((msg) => {
          const startPos = getPosition(msg.fromId);
          const endPos = getPosition(msg.toId);
          return (
            <MessageParticle 
              key={msg.id} 
              msg={msg} 
              startX={startPos.x} 
              startY={startPos.y} 
              endX={endPos.x} 
              endY={endPos.y} 
              onArrival={(id) => {
                // Update node state when message arrives
                setNodes((prev) =>
                  prev.map((n) => 
                    n.id === msg.toId 
                      ? { ...n, value: n.value || msg.value, isAccepted: !n.value } 
                      : n
                  )
                );
                // Remove message from animation list
                setMessages((prev) => prev.filter((m) => m.id !== id));
              }}
            />
          );
        })}
      </div>

      <div className="absolute bottom-4 right-4 w-80 h-64 bg-black/70 border border-slate-700 p-4 rounded-lg overflow-y-auto text-xs font-mono z-20 shadow-2xl">
        <h2 className="text-slate-400 mb-2 border-b border-slate-700 pb-1">Event Log</h2>
        {logs.length === 0 && <div className="text-slate-600 italic">No events recorded...</div>}
        {logs.map((log, i) => (
          <div key={i} className="mb-1 text-slate-300 border-l-2 border-blue-500 pl-2">{log}</div>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 text-slate-500 text-xs bg-black/30 p-2 rounded">
        Click "Run Scenario" to simulate the collision.
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);