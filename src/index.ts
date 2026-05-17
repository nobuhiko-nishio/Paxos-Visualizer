import { Acceptor, Proposer, ScenarioEngine } from "./paxos";

async function runDynamicCompetitionScenario() {
  console.log("--- Scenario: Dynamic Competition (The Race for Consensus) ---");

  const config = { useProposalId: true };
  const engine = new ScenarioEngine(config);

  // 5つのAcceptorを用意 (過半数は3人)
  const acceptors = [
    new Acceptor("a1"), new Acceptor("a2"), new Acceptor("a3"),
    new Acceptor("a4"), new Acceptor("a5")
  ];

  const p1 = new Proposer("p1");
  const p2 = new Proposer("p2");
  const p3 = new Proposer("p3");

  console.log("\n[Step 1] p1 starts proposing 'A' (Targeting a1, a2, a3)");
  await engine.executeAction(() => p1.propose("A", [acceptors[0], acceptors[1], acceptors[2]], config));

  console.log("\n[Step 2] p2 starts proposing 'B' (Targeting a3, a4, a5) - Interruption!");
  // p2の提案がp1の提案を上書きする
  await engine.executeAction(() => p2.propose("B", [acceptors[2], acceptors[3], acceptors[4]], config));

  console.log("\n[Step 3] p3 starts proposing 'C' (Targeting a1, a2, a4) - The Final Race!");
  // p3の提案がp2の提案を上書きする
  await engine.executeAction(() => p3.propose("C", [acceptors[0], acceptors[1], acceptors[3]], config));

  console.log("\n--- Final State ---");
  acceptors.forEach(a => {
    console.log(`Node ${a.id} accepted value: ${a.getAcceptedValue()}`);
  });

  const finalValues = acceptors.map(a => a.getAcceptedValue()).filter(v => v !== null);
  console.log(`Total accepted values: ${finalValues.length}`);

  if (new Set(finalValues).size === 1) {
    console.log("SUCCESS: Consensus reached on value:", finalValues[0]);
  } else {
    console.log("WARNING: Multiple values in acceptors (Inconsistent state).");
  }

  console.log("--- End of Scenario ---");
}

runDynamicCompetitionScenario().catch(console.error);
