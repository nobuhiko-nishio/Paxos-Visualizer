import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

// --- Types ---
type Value = string;
type Mode = "P1" | "P2" | "P2b" | "P2c";
type LogType = "info" | "success" | "error" | "warning";
type Phase = "prepare" | "accept" | "done";

interface NodeState {
  id: string;
  type: "proposer" | "acceptor";
  value: Value | null; 
  isAccepted: boolean;
  promisedN: number;
  acceptedN: number; 
  acceptedInfos: { n: number; info: string }[];
  phase: Phase; 
  chosenValue: Value | null;
  acceptedCount: number; // Proposerが受け取ったAccept承諾の数
  rejectedCount: number; // Proposerが受け取ったAccept拒否の数
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
  type: "prepare" | "accept" | "promise" | "accepted";
}

const defaultNodes: NodeState[] = [
  { id: "p1", type: "proposer", value: null, isAccepted: false, promisedN: 0, acceptedN: 0, acceptedInfos: [], phase: "prepare", chosenValue: null, acceptedCount: 0, rejectedCount: 0 },
  { id: "p2", type: "proposer", value: null, isAccepted: false, promisedN: 0, acceptedN: 0, acceptedInfos: [], phase: "prepare", chosenValue: null, acceptedCount: 0, rejectedCount: 0 },
  { id: "p3", type: "proposer", value: null, isAccepted: false, promisedN: 0, acceptedN: 0, acceptedInfos: [], phase: "prepare", chosenValue: null, acceptedCount: 0, rejectedCount: 0 },
  { id: "a1", type: "acceptor", value: null, isAccepted: false, promisedN: 0, acceptedN: 0, acceptedInfos: [], phase: "prepare", chosenValue: null, acceptedCount: 0, rejectedCount: 0 },
  { id: "a2", type: "acceptor", value: null, isAccepted: false, promisedN: 0, acceptedN: 0, acceptedInfos: [], phase: "prepare", chosenValue: null, acceptedCount: 0, rejectedCount: 0 },
  { id: "a3", type: "acceptor", value: null, isAccepted: false, promisedN: 0, acceptedN: 0, acceptedInfos: [], phase: "prepare", chosenValue: null, acceptedCount: 0, rejectedCount: 0 },
  { id: "a4", type: "acceptor", value: null, isAccepted: false, promisedN: 0, acceptedN: 0, acceptedInfos: [], phase: "prepare", chosenValue: null, acceptedCount: 0, rejectedCount: 0 },
  { id: "a5", type: "acceptor", value: null, isAccepted: false, promisedN: 0, acceptedN: 0, acceptedInfos: [], phase: "prepare", chosenValue: null, acceptedCount: 0, rejectedCount: 0 },
];

const NodeComponent = ({ node, x, y, mode }: { node: NodeState; x: number; y: number; mode: Mode }) => {
  const isProposer = node.type === "proposer";
  
  // Status text logic
  let statusText = "";
  if (isProposer) {
      statusText = node.acceptedInfos.length > 0 
        ? `Infos: ${node.acceptedInfos.map(i => i.info).join(", ")}` 
        : "Waiting";
   } else {
       if (mode === "P2c") {
           if (node.isAccepted && node.value) {
               statusText = `Accepted: N=${node.acceptedN}, Val=${node.value}`;
           } else if (node.promisedN > 0) {
               statusText = `Promised: ${node.promisedN}`;
           } else {
               statusText = "Idle";
           }
       } else {
          // P1, P2, P2b
          if (node.value) {
              statusText = `Val: ${node.value}`;
          } else if (node.promisedN > 0) {
              statusText = `Promised: ${node.promisedN}`;
          } else {
              statusText = "Idle";
          }
      }
  }

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
      <div className={`mt-1 text-[10px] font-mono px-2 py-0.5 rounded text-center whitespace-normal min-w-[120px] max-w-[200px] ${
        node.isAccepted ? "bg-yellow-600 text-white" : "bg-black/50 text-slate-300"
      }`}>
        {statusText}
      </div>
       {/* Phase display for Proposer */}
       {isProposer && mode === "P2c" && (
         <div className={`mt-1 text-[8px] font-mono px-1 rounded ${
           node.phase === "done" ? "text-gray-400 bg-gray-900/50" : 
           node.phase === "accept" ? "text-pink-400 bg-pink-900/50" : "text-cyan-400 bg-cyan-900/50"
         }`}>
           Phase: {node.phase}
         </div>
       )}
    </div>
  );
};

const MessageParticle = ({ msg, startX, startY, endX, endY, onArrival, mode }: { msg: MessageAnimation; startX: number; startY: number; endX: number; endY: number; onArrival: (msg: MessageAnimation) => void; mode: Mode }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          setTimeout(() => onArrival(msg), 0);
          return 1;
        }
        return p + 0.02;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [msg, onArrival]);

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
  const [nodes, setNodes] = useState<NodeState[]>(defaultNodes);
  const [messages, setMessages] = useState<MessageAnimation[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("all");
  const [canStep, setCanStep] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [lastProposalNumbers, setLastProposalNumbers] = useState<{ [key: string]: number }>({ p1: 0, p2: 0, p3: 0 });
  const [networkFault, setNetworkFault] = useState(false);
  const [proposerGap, setProposerGap] = useState(400);

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

  const sendMessage = (fromId: string, toId: string, value: string, delay: number, proposalN: number, type: "prepare" | "accept" | "promise" | "accepted") => {
    const msgId = Math.random().toString(36).substring(7);
    setTimeout(() => {
      if (networkFault && Math.random() < 0.2) {
        addLog(`${fromId} -> ${toId}: [DROPPED] ${value} (N=${proposalN})`, "error", "all");
        return;
      }
      setMessages((prev) => [...prev, { id: msgId, fromId, toId, value, proposalN, type }]);
      addLog(`${fromId} -> ${toId}: ${value} (N=${proposalN})`, "info", "all");
    }, delay);
  };

  const addLog = (message: string, type: LogType = "info", targetNodeId?: string) => {
    let formattedMessage = message;
    const arrowMatch = message.match(/^(\w+)\s*->\s*(\w+):(.*)$/);
    if (arrowMatch) {
        const from = arrowMatch[1];
        const to = arrowMatch[2];
        const rest = arrowMatch[3];
        const padding = "                          "; // 26 spaces
        if (targetNodeId === from) {
            formattedMessage = `${from} ->${padding}${to}:${rest}`;
        } else if (targetNodeId === to) {
            formattedMessage = `${from}${padding}-> ${to}:${rest}`;
        }
    }
    setLogs((prev) => [{ timestamp: new Date().toLocaleTimeString(), message: formattedMessage, targetNodeId, type }, ...prev].slice(0, 150));
  };

  const step = async () => {
    if (!canStep) return;
    setMessages([]);
    
    addLog(`Step executed (Mode: ${mode})...`, "info");
    
    let nextProposalMap: { [key: string]: number };
    const maxLastN = Math.max(0, ...Object.values(lastProposalNumbers));

    if (mode === "P2c") {
      nextProposalMap = { ...lastProposalNumbers };
      
      const actions = nodes.map(node => {
        if (node.type !== "proposer") return null;
        if (node.phase === "done") return null;
        
        let proposalN = nextProposalMap[node.id];
        let val = "";
        let msgType: "prepare" | "accept";
        let clearInfos = false;

        if (node.phase === "prepare") {
            // Retry or Start
            proposalN = maxLastN + 1 + Math.floor(Math.random() * 20);
            nextProposalMap[node.id] = proposalN;
            val = "Prepare";
            msgType = "prepare";
            clearInfos = true;
        } else if (node.phase === "accept") {
            val = node.chosenValue || ({ "p1": "A", "p2": "B", "p3": "C" } as any)[node.id] || "X";
            msgType = "accept";
        }

        return { id: node.id, val, proposalN, msgType, clearInfos };
      }).filter(Boolean);
      
      // Update state for clearing infos
      if (actions.some(a => a.clearInfos)) {
          setNodes(prev => prev.map(n => {
              const action = actions.find(a => a.id === n.id);
              if (action?.clearInfos) {
                  return { ...n, acceptedInfos: [], acceptedCount: 0, rejectedCount: 0 };
              }
              return n;
          }));
      }
      
      // Update proposal numbers state
      setLastProposalNumbers(nextProposalMap);
      
      // Send messages
      actions.forEach((action: any, idx) => {
        const actualTargets = shuffle(["a1", "a2", "a3", "a4", "a5"]);
        const baseDelay = 500 + (idx * proposerGap); 
        actualTargets.forEach((target, i) => {
            sendMessage(action.id, target, action.val, baseDelay + i * 200, action.proposalN, action.msgType);
        });
      });

    } else {
      const n1 = maxLastN + 1 + Math.floor(Math.random() * 50);
      const n2 = n1 + 1 + Math.floor(Math.random() * 50);
      const n3 = n2 + 1 + Math.floor(Math.random() * 50);
      const uniqueNumbers = [n1, n2, n3].sort(() => Math.random() - 0.5);
      
      nextProposalMap = {
        "p1": uniqueNumbers[0],
        "p2": uniqueNumbers[1],
        "p3": uniqueNumbers[2],
      };
      
      setLastProposalNumbers(nextProposalMap);

      setTimeout(() => {
        addLog("Proposers starting broadcasts...", "info");
        const proposerOrder = shuffle(["p1", "p2", "p3"]);
        
        const targetMap: { [key: string]: string[] } = {
          "p1": shuffle(["a1", "a2", "a3", "a4", "a5"]),
          "p2": shuffle(["a1", "a2", "a3", "a4", "a5"]),
          "p3": shuffle(["a1", "a2", "a3", "a4", "a5"]),
        };
        const valueMap: { [key: string]: string } = {
          "p1": "A",
          "p2": "B",
          "p3": "C"
        };

        proposerOrder.forEach((pId, idx) => {
          const targets = targetMap[pId];
          const val = mode === "P2c" ? "Prepare" : (valueMap[pId] || "X");
        const baseDelay = 500 + (idx * proposerGap); 

          targets.forEach((target, i) => {
            const proposalN = mode === "P1" ? 0 : nextProposalMap[pId];
            sendMessage(pId, target, val, baseDelay + i * 200, proposalN, mode === "P2c" ? "prepare" : "prepare");
          });
        });
      }, 200);
    }

    setCanReset(true);
    if (mode === "P1") {
      setCanStep(false);
    }
  };

  const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);

  const reset = () => {
    if (!canReset) return;
    setNodes(defaultNodes);
    setMessages([]);
    setLogs([]);
    setCurrentTab("all");
    setCanStep(true);
    setCanReset(false);
    setLastProposalNumbers({ p1: 0, p2: 0, p3: 0 });
    addLog("System Reset.", "info");
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden select-none">
      <div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-700 z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-400">Paxos Visualizer</h1>
          <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
            <button 
              onClick={() => { setMode("P1"); reset(); }}
              className={`px-3 py-0.5 rounded text-xs font-bold transition-all ${mode === "P1" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              P1 (Basic)
            </button>
            <button 
              onClick={() => { setMode("P2"); reset(); }}
              className={`px-3 py-0.5 rounded text-xs font-bold transition-all ${mode === "P2" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              P2 (Numbered)
            </button>
            <button 
              onClick={() => { setMode("P2b"); reset(); }}
              className={`px-3 py-0.5 rounded text-xs font-bold transition-all ${mode === "P2b" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              P2b (Acceptor Info)
            </button>
            <button 
              onClick={() => { setMode("P2c"); reset(); }}
              className={`px-3 py-0.5 rounded text-xs font-bold transition-all ${mode === "P2c" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              P2c (Promise)
            </button>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={step}
            disabled={!canStep}
            className={`px-6 py-2 rounded text-white font-bold transition-all transform hover:scale-105 active:scale-95 ${canStep ? "bg-green-600 hover:bg-green-500" : "bg-gray-600 opacity-50 cursor-not-allowed"}`}
            >
            Step
            </button>
            <button 
            onClick={reset}
            disabled={!canReset}
            className={`px-4 py-2 rounded text-white font-bold transition-all transform hover:scale-105 active:scale-95 ${canReset ? "bg-red-600 hover:bg-red-500" : "bg-gray-600 opacity-50 cursor-not-allowed"}`}
            >
            Reset
            </button>
            <button 
            onClick={() => setProposerGap(proposerGap === 100 ? 400 : 100)}
            className={`px-4 py-2 rounded text-white font-bold transition-all transform hover:scale-105 active:scale-95 ${proposerGap === 100 ? "bg-red-600 hover:bg-red-500" : "bg-green-700 hover:bg-green-600"}`}
            >
            Conflict: {proposerGap === 100 ? "High" : "Low"}
            </button>
            <button 
            onClick={() => setNetworkFault(!networkFault)}
            className={`px-4 py-2 rounded text-white font-bold transition-all transform hover:scale-105 active:scale-95 ${networkFault ? "bg-orange-600 hover:bg-orange-500" : "bg-slate-600 hover:bg-slate-500"}`}
            >
            Network Fault: {networkFault ? "ON" : "OFF"}
            </button>
        </div>
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
              onArrival={(arrivingMsg) => {
                setNodes(prevNodes => {
                  const targetNode = prevNodes.find(n => n.id === arrivingMsg.toId);
                  if (!targetNode) return prevNodes;

                  if (targetNode.type === "acceptor") {
                    if (mode === "P1") {
                      if (!targetNode.value) {
                        addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: ${arrivingMsg.value}`, "success", targetNode.id);
                        return prevNodes.map(n => n.id === targetNode.id ? { ...n, value: arrivingMsg.value, isAccepted: true } : n);
                      } else {
                        addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: (Already has value: ${targetNode.value})`, "info", targetNode.id);
                      }
                    } else if (mode === "P2") {
                      if (arrivingMsg.proposalN > targetNode.promisedN) {
                        addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: ${arrivingMsg.value} (N=${arrivingMsg.proposalN})`, "success", targetNode.id);
                        return prevNodes.map(n => n.id === targetNode.id ? { ...n, promisedN: arrivingMsg.proposalN, value: arrivingMsg.value, isAccepted: true } : n);
                      } else {
                        addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: (Rejected: N=${arrivingMsg.proposalN})`, "error", "all");
                      }
                    } else if (mode === "P2b") {
                      if (arrivingMsg.proposalN > targetNode.promisedN) {
                        addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: ${arrivingMsg.value} (N=${arrivingMsg.proposalN})`, "success", "all");
                        const updatedNodes = prevNodes.map(n => n.id === targetNode.id ? { ...n, promisedN: arrivingMsg.proposalN, value: arrivingMsg.value, isAccepted: true } : n);
                        
                        const replyMsgId = Math.random().toString(36).substring(7);
                        const replyMsg = { id: replyMsgId, fromId: targetNode.id, toId: arrivingMsg.fromId, value: `OK:${arrivingMsg.value}`, proposalN: arrivingMsg.proposalN, type: "promise" as const };
                        setMessages(prev => [...prev, replyMsg]);
                        addLog(`${targetNode.id} -> ${arrivingMsg.fromId}: OK:${arrivingMsg.value} (N=${arrivingMsg.proposalN})`, "warning", "all");
                        return updatedNodes;
                      } else {
                        addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: (Rejected: N=${arrivingMsg.proposalN})`, "error", "all");
                      }
                    } else if (mode === "P2c") {
                      if (arrivingMsg.type === "prepare") {
                        if (arrivingMsg.proposalN > targetNode.promisedN) {
                          addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: Prepare (N=${arrivingMsg.proposalN})`, "success", "all");
                          const updatedNodes = prevNodes.map(n => n.id === targetNode.id ? { ...n, promisedN: arrivingMsg.proposalN } : n);
                          
                          const replyValue = targetNode.acceptedN > 0 ? `Promise:${targetNode.value}:${targetNode.acceptedN}` : (targetNode.value ? `Promise:${targetNode.value}:0` : "Promise");
                          const replyMsgId = Math.random().toString(36).substring(7);
                          const replyMsg = { id: replyMsgId, fromId: targetNode.id, toId: arrivingMsg.fromId, value: replyValue, proposalN: arrivingMsg.proposalN, type: "promise" as const };
                          setMessages(prev => [...prev, replyMsg]);
                          addLog(`${targetNode.id} -> ${arrivingMsg.fromId}: ${replyValue} (N=${arrivingMsg.proposalN})`, "warning", "all");
                          return updatedNodes;
                        } else {
                          addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: (Rejected: N=${arrivingMsg.proposalN})`, "error", "all");
                        }
                      } else if (arrivingMsg.type === "accept") {
                        if (arrivingMsg.proposalN >= targetNode.promisedN) {
                          addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: Accept (N=${arrivingMsg.proposalN})`, "success", "all");
                          const updatedNodes = prevNodes.map(n => n.id === targetNode.id ? { ...n, value: arrivingMsg.value, isAccepted: true, acceptedN: arrivingMsg.proposalN } : n);
                          
                          const replyMsgId = Math.random().toString(36).substring(7);
                          const replyMsg = { id: replyMsgId, fromId: targetNode.id, toId: arrivingMsg.fromId, value: `Accepted:${arrivingMsg.value}`, proposalN: arrivingMsg.proposalN, type: "accepted" as const };
                          setMessages(prev => [...prev, replyMsg]);
                          addLog(`${targetNode.id} -> ${arrivingMsg.fromId}: Accepted:${arrivingMsg.value} (N=${arrivingMsg.proposalN})`, "warning", "all");
                          return updatedNodes;
                        } else {
                          addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: (Rejected: N=${arrivingMsg.proposalN})`, "error", "all");
                          
                          // Send reject message back to proposer
                          const rejectMsgId = Math.random().toString(36).substring(7);
                          const rejectMsg = { id: rejectMsgId, fromId: targetNode.id, toId: arrivingMsg.fromId, value: `Rejected:${arrivingMsg.proposalN}`, proposalN: arrivingMsg.proposalN, type: "accepted" as const };
                          setMessages(prev => [...prev, rejectMsg]);
                          addLog(`${targetNode.id} -> ${arrivingMsg.fromId}: Rejected:${arrivingMsg.proposalN} (N=${arrivingMsg.proposalN})`, "error", "all");
                        }
                      }
                    }
                  } else if (targetNode.type === "proposer") {
                    if (mode === "P2b" && arrivingMsg.value.startsWith("OK:")) {
                      const info = arrivingMsg.value.replace("OK:", "");
                      const n = arrivingMsg.proposalN;
                      return prevNodes.map(node => {
                        if (node.id === targetNode.id) {
                          const currentMaxN = node.acceptedInfos.length > 0 ? Math.max(...node.acceptedInfos.map(i => i.n)) : 0;
                          if (n < currentMaxN) return node;
                          if (n > currentMaxN) return { ...node, acceptedInfos: [{ n, info }] };
                          return { ...node, acceptedInfos: [...node.acceptedInfos, { n, info }] };
                        }
                        return node;
                      });
                     } else if (mode === "P2c") {
                       if (arrivingMsg.type === "promise") {
                         const prepareN = arrivingMsg.proposalN;
                         let info = `P(${prepareN})`;
                         let promisedValue = null;
                         let acceptedN = 0;
                         if (arrivingMsg.value.startsWith("Promise:")) {
                           const parts = arrivingMsg.value.split(":");
                           promisedValue = parts[1];
                           acceptedN = parts[2] ? parseInt(parts[2]) : 0;
                           info = `P(${prepareN}):${promisedValue}(N=${acceptedN})`;
                         }

                          return prevNodes.map(node => {
                            if (node.id === targetNode.id) {
                              const currentMaxAcceptedN = node.acceptedInfos.length > 0 ? Math.max(...node.acceptedInfos.map(i => i.n)) : 0;
                              let updatedInfos = node.acceptedInfos;
                              let currentChosen = node.chosenValue;
                              let currentHighestN = node.acceptedInfos.length > 0 ? Math.max(...node.acceptedInfos.map(i => i.n)) : 0;
                              
                               if (acceptedN > currentHighestN) {
                                 currentChosen = promisedValue;
                               }
                               updatedInfos = [...node.acceptedInfos, { n: acceptedN, info }];
                              
                              let newPhase = node.phase;
                              if (node.phase === "prepare" && updatedInfos.length >= 3) {
                                  newPhase = "accept";
                                  addLog(`${node.id} transitioned to Accept phase (chosenValue: ${currentChosen || "own value"})`, "success", node.id);
                              }
                              
                               return { ...node, acceptedInfos: updatedInfos, chosenValue: currentChosen, phase: newPhase, acceptedCount: newPhase === "accept" ? 0 : node.acceptedCount, rejectedCount: newPhase === "accept" ? 0 : node.rejectedCount };
                            }
                            return node;
                          });
                        } else if (arrivingMsg.type === "accepted") {
                          if (arrivingMsg.value.startsWith("Rejected:")) {
                            // Proposer received rejection for its accept request
                            addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: ${arrivingMsg.value}`, "error", targetNode.id);
                            return prevNodes.map(node => {
                              if (node.id === targetNode.id && node.phase === "accept") {
                                const newRejectedCount = node.rejectedCount + 1;
                                if (newRejectedCount >= 3) {
                                  addLog(`${node.id} rejected by majority (${newRejectedCount}/3), transitioning back to Prepare phase`, "error", node.id);
                                  return { ...node, phase: "prepare", acceptedInfos: [], acceptedCount: 0, rejectedCount: 0 };
                                }
                                addLog(`${node.id} rejected (${newRejectedCount}/3 so far), waiting for more responses`, "warning", node.id);
                                return { ...node, rejectedCount: newRejectedCount };
                              }
                              return node;
                            });
                         } else {
                           addLog(`${arrivingMsg.fromId} -> ${targetNode.id}: ${arrivingMsg.value} collected`, "success", targetNode.id);
                           return prevNodes.map(node => {
                             if (node.id === targetNode.id) {
                               const newCount = node.acceptedCount + 1;
                               let newPhase = node.phase;
                               if (node.phase === "accept" && newCount >= 3) {
                                   newPhase = "done";
                                   addLog(`${node.id} transitioned to Done phase`, "success", node.id);
                               }
                               const updatedNode = { ...node, acceptedCount: newCount, phase: newPhase };
                               
                               // Check if all proposers are done
                               setTimeout(() => {
                                 setNodes(currentNodes => {
                                   const allProposersDone = currentNodes.filter(n => n.type === "proposer").every(n => n.phase === "done");
                                   if (allProposersDone) {
                                     setCanStep(false);
                                     addLog("All proposers reached Done phase. Simulation complete.", "success");
                                   }
                                   return currentNodes;
                                 });
                               }, 0);
                               
                               return updatedNode;
                             }
                             return node;
                           });
                         }
                      }
                    }
                  }
                  return prevNodes;
                });
                setMessages((prev) => prev.filter((m) => m.id !== arrivingMsg.id));
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
          {logs.filter(log => currentTab === "all" || log.targetNodeId === currentTab || log.message.includes(currentTab)).map((log, i) => (
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
