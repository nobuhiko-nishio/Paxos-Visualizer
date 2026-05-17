export type Value = string;

/**
 * 提案番号の構造。
 * counter: プロポーザーが自身の操作ごとにインクリメントする値。
 * nodeId: タイブレーカーとして使用される一意のID。
 */
export interface ProposalID {
  counter: number;
  nodeId: string;
}

/**
 * 提案番号の比較ロジック。
 * 返り値: 1 (a > b), -1 (a < b), 0 (a == b)
 */
export function compareProposalID(a: ProposalID, b: ProposalID): number {
  if (a.counter !== b.counter) {
    return a.counter > b.counter ? 1 : -1;
  }
  if (a.nodeId !== b.nodeId) {
    return a.nodeId > b.nodeId ? 1 : -1;
  }
  return 0;
}

export interface Proposal {
  value: Value;
  id: ProposalID;
}

export interface AlgorithmConfig {
  useProposalId: boolean;
}

export abstract class Node {
  constructor(public id: string) {}
}

/**
 * Acceptor: 提案を受け入れる役割。
 */
export class Acceptor extends Node {
  private acceptedProposal: Proposal | null = null;
  // 自身が約束（Promise）した最新の提案番号を保持
  private promisedId: ProposalID | null = null;

  constructor(id: string) {
    super(id);
  }

  /**
   * 提案の受け入れ試行。
   * 提案番号による優先順位付け（Promise）を適用。
   */
  accept(proposal: Proposal, config: AlgorithmConfig): boolean {
    if (config.useProposalId) {
      // 自身が約束した番号より低い提案は拒否する（Paxosの基本）
      if (this.promisedId && compareProposalID(proposal.id, this.promisedId) < 0) {
        console.log(`[${this.id}] Rejected: Proposal ID ${JSON.stringify(proposal.id)} is older than promised ${JSON.stringify(this.promisedId)}`);
        return false;
      }
      // 提案番号を更新（Promise）
      this.promisedId = proposal.id;
    }

    console.log(`[${this.id}] Accept value: ${proposal.value} (ID: ${JSON.stringify(proposal.id)})`);
    this.acceptedProposal = proposal;
    return true;
  }

  getAcceptedValue(): Value | null {
    return this.acceptedProposal?.value || null;
  }
}

/**
 * Proposer: 提案を行う役割。
 */
export class Proposer extends Node {
  private counter: number = 0;

  constructor(id: string) {
    super(id);
  }

  /**
   * 提案番号の生成。
   */
  private nextProposalID(): ProposalID {
    this.counter++;
    return { counter: this.counter, nodeId: this.id };
  }

  async propose(value: Value, acceptors: Acceptor[], config: AlgorithmConfig): Promise<boolean> {
    const proposal: Proposal = { 
      value, 
      id: config.useProposalId ? this.nextProposalID() : { counter: 0, nodeId: this.id }
    };

    console.log(`[${this.id}] Proposing value: ${value} (ID: ${JSON.stringify(proposal.id)})`);
    
    let successCount = 0;
    for (const acceptor of acceptors) {
      if (acceptor.accept(proposal, config)) {
        successCount++;
      }
    }

    return successCount > Math.floor(acceptors.length / 2);
  }
}

/**
 * ScenarioEngine: シナリオベースの制御を行うエンジン。
 */
export class ScenarioEngine {
  constructor(private config: AlgorithmConfig) {}

  async executeAction(action: () => Promise<void> | void) {
    await action();
  }

  getConfig(): AlgorithmConfig {
    return this.config;
  }
}
