import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

// --- Types ---
type Value = string;
type Mode = "P1" | "P2" | "P2b";
type LogType = "info" | "success" | "error" | "warning";

interface NodeState {
  id: string;
  type: "proposer" | "acceptor";
  value: Value | null; 
  isAccepted: boolean;
  promisedN: number;
  acceptedInfos: string[];
}

interface LogEntry {
  timestamp: string;
  message: string;
  targetNodeId?: string; 
  type: LogType;
}

interface MessageAnimation {
  id: string;
  fromId: string;
  toId: string;
  value: string;
  proposalN: number; 
}

const NodeComponent = ({ node, x, y, mode }: { node: NodeState; x: number; y: number; mode: Mode }) => {
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
      <div className={`mt-1 text-[10px] font-mono px-2 py-0.5 rounded text-center w-24 truncate ${
        node.isAccepted ? "bg-yellow-600 text-white" : "bg-black/50 text-slate-300"
      }`}>
        {node.value ? `Val: ${node.value}` : "Empty"}
      </div>
       {!isProposer && mode === "P2" && node.promisedN > 0 && (
         <div className="text-[8px] text-red-400 font-mono mt-1">Promise: {node.promisedN}</div>
       )}
       {!isProposer && mode === "P2b" && node.promisedN > 0 && (
         <div className="text-[8px] text-orange-400 font-mono mt-1">Accepted: {node.promisedN}</div>
       )}
       {isProposer && mode === "P2b" && node.acceptedInfos.length > 0 && (
         <div className="mt-1 text-[8px] text-cyan-400 font-mono bg-cyan-900/50 px-1 rounded">
           Infos: {node.acceptedInfos.join(", ")}
         </div>
       )}
    </div>
  );
};

const MessageParticle = ({ msg, startX, startY, endX, endY, onArrival, mode }: { msg: MessageAnimation; startX: number; startY: number; endX: number; endY: number; onArrival: (id: string) => void; mode: Mode }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
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
      {mode === "P2" && (
        <div className="absolute -bottom-4 text-[8px] text-white whitespace-nowrap">N={msg.proposalN}</div>
      )}
    </div>
  );
};

const App = () => {
  const [mode, setMode] = useState<Mode>("P1");
  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [messages, setMessages] = useState<MessageAnimation[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("all");

  // Re-defining the state to be clean
  const [currentTab, setCurrentTab] = useState<string>("all");

  const getPosition = (id: string) => {
    if (id === "p1") return { x: 400, y: 150 };
    if (id === "p2") return { x: 200, y: 250 };
    if (id === "p3") return {x: 600, y: 250 };
    if (id.startsWith("a")) {
        const parts = id.split("");
        const num = parseInt(parts[1]);
        const xBase = 200 + (num - 1) * 100;
        const yBase = num % 2 === 0 ? 550 : 450;
        return { x: xBase, y: yBase };
    }
    return { x: 400, y: 350 };
  };

  const addLog = (message: string, type: LogType = "info", targetNodeId?: string) => {
    setLogs((prev) => [{ timestamp: new Date().toLocaleTimeString(), message, targetNodeId, type }, ...prev].slice(0, 50));
  };

  const sendMessage = (fromId: string, toId: string, value: string, delay: number, proposalN: number) => {
    const msgId = Math.random().toString(36).substring(7);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: msgId, fromId, toId, value, proposalN }]);
      addLog(`${fromId} -> ${toId}: ${value} (N=${proposalN})`, "info", toId);
    }, delay);
  };

  const runScenario = async () => {
    setNodes([
      { id: "p1", type: "proposer", value: null, isAccepted: false, promisedN: 0, acceptedInfos: [] },
      { id: "p2", type: "proposer", value: null, isAccepted: false, promisedN: 0, acceptedInfos: [] },
      { id: "p3", type: "proposer", value: null, isAccepted: false, promisedN: 0, acceptedInfos: [] },
      { id: "a1", type: "acceptor", value: null, isAccepted: false, promisedN: 0, acceptedInfos: [] },
      { id: "a2", type: "acceptor", value: null, isAccepted: false, promisedN: 0, acceptedInfos: [] },
      { id: "a3", type: "acceptor", value: null, isAccepted: false, promisedN: 0, acceptedInfos: [] },
      { id: "a4", type: "acceptor", value: null, isAccepted: false, promisedN: 0, acceptedInfos: [] },
      { id: "a5", type: "acceptor", value: null, isAccepted: false, promisedN: 0, acceptedInfos: [] },
    ]);
    setMessages([]);
    setLogs([]);
    setCurrentTab("all");

    addLog(`Starting Scenario (Mode: ${mode})...`, "info");
    
    const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);

    setTimeout(() => {
      addLog("Proposers starting broadcasts...", "info");
      const proposerOrder = shuffle(["p1", "p2", "p3"]);
      
      const targetsP1 = shuffle(["a1", "a2", "a3", "a4", "a5"]);
      const targetsP2 = shuffle(["a1", "a2", "a3", "a4", "a5"]);
      const targetsP3 = shuffle(["a1", "a2", "a3", "a4", "a5"]);

      const allTargets = [targetsP1, targetsP2, targetsP3];
      // 提案値のマップを定義（Proposer IDに紐付け）
      const valueMap: { [key: string]: string } = {
        "p1": "A",
        "p2": "B",
        "p3": "C"
      };

      proposerOrder.forEach((pId, idx) => {
        const targets = allTargets[idx];
        const val = valueMap[pId] || "X"; // 念のためのフォールバック
        const baseDelay = 1000 + (idx * 500); 

        targets.forEach((target, i) => {
          // P1の場合は提案番号を0にする。P2の場合は大きな値を生成する。
          const proposalN = mode === "P1" ? 0 : (1 << 16) | (idx + 1);
          sendMessage(pId, target, val, baseDelay + i * 800, proposalN);
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
            <button 
              onClick={() => { setMode("P2b"); setNodes([...nodes]); }}
              className={`px-3 py-0.5 rounded text-xs font-bold transition-all ${mode === "P2b" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              P2b (Acceptor Info)
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
          return <NodeComponent key={node.id} node={node} x={pos.x} y={pos.y} mode={mode} />;
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
          const arrivingMsg = messages.find(m => m.id === msg.id);
          if (arrivingMsg) {
            const targetNode = nodes.find(n => n.id === arrivingMsg.toId);
            if (targetNode && targetNode.type === "acceptor") {
              if (mode === "P1") {
                // P1: 提案番号の概念なし。Emptyなノードのみ、届いた値を書き換える（上書き禁止）。
                if (!targetNode.value) {
                  addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: ${arrivingMsg.value}`, "success", targetNode.id);
                  setNodes(prevNodes => prevNodes.map(n => {
                    if (n.id === targetNode.id) {
                      return { ...n, value: arrivingMsg.value, isAccepted: true };
                    }
                    return n;
                  }));
                } else {
                  addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: (Already has value: ${targetNode.value})`, "info", targetNode.id);
                }
              } else if (mode === "P2") {
                // P2: 提案番号による比較。
                if (arrivingMsg.proposalN > targetNode.promisedN) {
                  addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: ${arrivingMsg.value} (N=${arrivingMsg.proposalN})`, "success", targetNode.id);
                  setNodes(prevNodes => prevNodes.map(n => {
                    if (n.id === targetNode.id) {
                      return { ...n, promisedN: arrivingMsg.proposalN, value: arrivingMsg.value, isAccepted: true };
                    }
                    return n;
                  }));
                } else {
                  addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: (Rejected: N=${arrivingMsg.proposalN})`, "error", targetNode.id);
                }
              } else if (mode === "P2b") {
                // P2b: Acceptor Info mode. 提案番号による比較を行い、承諾時にProposerへ返信する。
                if (arrivingMsg.proposalN > targetNode.promisedN) {
                  addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: ${arrivingMsg.value} (N=${arrivingMsg.proposalN})`, "success", targetNode.id);
                  setNodes(prevNodes => prevNodes.map(n => {
                    if (n.id === targetNode.id) {
                      return { ...n, promisedN: arrivingMsg.proposalN, value: arrivingMsg.value, isAccepted: true };
                    }
                    return n;
                  }));
                  // Proposerへ受理情報を返信
                  const replyMsgId = Math.random().toString(36).substring(7);
                  setMessages(prev => [...prev, { id: replyMsgId, fromId: targetNode.id, toId: arrivingMsg.fromId, value: `OK:${arrivingMsg.value}`, proposalN: arrivingMsg.proposalN }]);
                  addLog(`${targetNode.id} -> ${arrivingMsg.fromId}: OK:${arrivingMsg.value} (N=${arrivingMsg.proposalN})`, "warning", arrivingMsg.fromId);
                } else {
                  addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: (Rejected: N=${arrivingMsg.proposalN})`, "error", targetNode.id);
                }
              }
            } else if (targetNode && targetNode.type === "proposer") {
              // Proposerが返信メッセージを受け取った場合の処理
              if (mode === "P2b" && arrivingMsg.value.startsWith("OK:")) {
                const info = arrivingMsg.value.replace("OK:", "");
                addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: ${info} collected`, "success", targetNode.id);
                setNodes(prevNodes => prevNodes.map(n => {
                  if (n.id === targetNode.id) {
                    return { ...n, acceptedInfos: [...n.acceptedInfos, info] };
                  }
                  return n;
                }));
              }
            }
          }
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        }}
             />
          );
        })}
      </div>

      <div className="absolute bottom-4 right-4 w-80 h-64 bg-black/70 border border-slate-700 rounded-lg overflow-hidden z-20 shadow-2xl flex flex-col">
        <div className="flex bg-slate-800 border-b border-slate-700 text-[10px] font-bold">
          <button 
            onClick={() => setCurrentTab("all")}
            className={`flex-1 py-1 px-2 transition-colors ${currentTab === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            All
          </button>
          {nodes.filter(n => n.type === "proposer").map(n => (
            <button 
              key={n.id}
              onClick={() => setCurrentTab(n.id)}
              className={`flex-1 py-1 px-2 transition-colors ${currentTab === n.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              {n.id.toUpperCase()}
            </button>
          ))}
          {nodes.filter(n => n.type === "acceptor").map(n => (
            <button 
              key={n.id}
              onClick={() => setCurrentTab(n.id)}
              className={`flex-1 py-1 px-2 transition-colors ${currentTab === n.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              {n.id.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px]">
          {logs.filter(log => currentTab === "all" || log.targetNodeId === currentTab).map((log, i) => (
            <div key={i} className={`mb-1 border-l-2 pl-2 ${
              log.type === "success" ? "border-green-500 text-green-400" : 
              log.type === "error" ? "border-red-500 text-red-400" : 
              log.type === "warning" ? "border-yellow-500 text-yellow-400" : 
              "border-blue-500 text-slate-300"
            }`}>
              <span className="opacity-50 mr-1">[{log.timestamp}]</span> {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
