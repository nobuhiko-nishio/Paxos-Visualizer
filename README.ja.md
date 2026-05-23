# Paxos Visualizer

Paxos合意アルゴリズムのインタラクティブ可視化ツール。3つのProposerと5つのAcceptorがアニメーションメッセージを介して通信し、4段階のプロトコルバリアントを順に学習できます。

<img width="1464" height="1074" alt="スクリーンショット 2026-05-23 18 22 23" src="https://github.com/user-attachments/assets/648c271a-9b38-45af-8721-17001cd757fe" />

## 起動方法

```sh
bun install    # （必要な場合）
bun ./index.ts # HMR付き開発サーバー起動
```

Bunが表示するURL（デフォルトでは `http://localhost:3000`）を開いてください。

## 4つのモード

アプリは4つのモードを段階的に進みます。各モードは前のモードを拡張する形で設計されています。

### P1 (Basic)

最も単純な「先着順」レジスタプロトコル。提案番号は使用しません。Acceptorは最初に受け取った値だけを受け入れ、以降の提案はすべて無視します。最も早く到着したメッセージが全局的に勝ちます。

### P2 (Numbered)

単調増加する一意の提案番号を導入。Acceptorは受信したNが現在の `promisedN` より大きい場合のみ受け入れます。後から到着した低い番号の提案は拒否されます。

### P2b (Acceptor Info)

P2と同じ番号付き提案方式に加え、Acceptorが提案者にPromise応答（`OK:{value}`）を返信します。Proposerは収集した応答を自身の情報パネルに表示します。

### P2c (Promise)

完全な2フェーズPaxosプロトコル（Prepare + Accept）。Proposerはステップをまたいで状態を保持し、フェーズ間を遷移し、P2c不変条件（より高い提案番号を持つ以前に承認された値を採用する）を実装します。

**フェーズの流れ:**
1. **Prepare** — Proposerが `Prepare(N)` を全Acceptorにブロードキャスト。Acceptorは `Promise`（以前に承認した値とそのNを含む場合あり）で応答。
2. **prepare → accept** — Promise応答を3件収集すると、ProposerはAcceptフェーズに移行。最高NのPromiseが値を保持していればその値を採用し、なければ自身のデフォルト値（A/B/C）を使用。
3. **Accept** — Proposerが `Accept(value, N)` を全Acceptorにブロードキャスト。Acceptorは `N >= promisedN` なら承認、そうでなければ拒否。
4. **accept → done** — Accepted応答を3件収集するとProposerは完了。
5. **accept → prepare** — Rejected応答を3件収集するとProposerはPrepareに戻り、より高いNで再試行。

## 操作一覧

| 操作 | 説明 |
|------|------|
| **P1 / P2 / P2b / P2c** | モード切替（状態はリセットされます） |
| **Step** | メッセージブロードキャストを1ラウンド実行 |
| **Reset** | 全ノード・ログ・提案番号をリセット |
| **Conflict** | Proposer間の間隔を100ms（High）／400ms（Low）で切替 |
| **Network Fault** | ONにすると20%のメッセージがランダムに消失 |

## ノードの見方

### Proposer（青枠）
- `Infos: ...` に収集したPromise/Acceptedメッセージを表示
- P2cモードでは現在の `Phase: prepare / accept / done` を表示

### Acceptor
- **緑枠** — 未承諾（値もPromiseもなし）
- **黄枠** — 値を受け入れ済み
- `Promised: {N}` または `Val: {value}` または `Accepted: N={n}, Val={value}` を表示

## ログパネル（右下）

イベントログは色分け表示されます：

| 色 | 意味 |
|----|------|
| 青 | 情報（ステップ実行、メッセージ送信） |
| 緑 | 成功（承認、フェーズ遷移、完了） |
| 赤 | エラー（拒否、メッセージ消失、フォールバック） |
| 黄 | 警告（Promise/Accepted応答） |

タブボタンで特定のノードに関連するメッセージのみにフィルタリングできます。

## メッセージタイミングモデル

Step押下時、全Proposerが同時にオフセット付きでブロードキャストします：

- **先頭Proposer**: `500ms` から開始
- **後続Proposer**: `+ proposerGap`（100ms: High / 400ms: Low）
- **同一Proposer内の各ターゲット**: `+ 200ms` 間隔

メッセージのアニメーションは送信元から送信先まで約2.5秒かかります。

## アーキテクチャ

可視化ツール（`frontend.tsx`）は可視化表示に最適化された独自のPaxosロジックをReact状態内に実装しています。一方、コアライブラリ（`src/paxos.ts`）はクラスベースのPaxos実装を提供し、コンソールスクリプト（`src/index.ts`）から利用されます。両者は独立したコードベースで、プロジェクトフォルダを共有しているだけです。
