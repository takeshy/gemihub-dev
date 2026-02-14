import type { Language } from "~/types/settings";
import { prose } from "../prose";

export function RagChapter({ lang }: { lang: Language }) {
  if (lang === "ja") return <RagJa />;
  return <RagEn />;
}

function RagEn() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-50">RAG (Retrieval-Augmented Generation)</h1>
      <figure className="mb-8 overflow-hidden rounded-xl border border-gray-200 shadow dark:border-gray-800">
        <img src="/images/chat_rag.png" alt="RAG in chat" className="w-full" loading="lazy" />
      </figure>
      <div className={prose}>
        <p>
          RAG allows the AI to search your documents by meaning and generate answers based on the relevant content. Your files are indexed in a Gemini File Search store, enabling meaning-based search (RAG) that goes beyond keyword matching.
        </p>

        <h2>Setting Up RAG</h2>
        <figure className="my-4 overflow-hidden rounded-xl border border-gray-200 shadow dark:border-gray-800">
          <img src="/images/setting_rag.png" alt="RAG settings" className="w-full" loading="lazy" />
        </figure>
        <ol>
          <li>Go to <strong>Settings &gt; RAG</strong>.</li>
          <li>Click <strong>Add Setting</strong> to create a new RAG configuration.</li>
          <li>Choose the type:
            <ul>
              <li><strong>Internal</strong> — Automatically syncs files from specified Drive folders.</li>
              <li><strong>External</strong> — Connect to pre-existing Gemini File Search store IDs.</li>
            </ul>
          </li>
          <li>For Internal type, specify target folders and optional exclude patterns.</li>
          <li>Click <strong>Sync</strong> to start indexing your files.</li>
        </ol>

        <h2>Auto RAG Registration</h2>
        <p>
          Enable <strong>Auto RAG Registration</strong> to automatically register eligible files when you sync changes to Drive (Push to Drive). You can choose between registering all files or customizing which folders to include.
        </p>
        <p>
          System-generated files, chat history, workflow history, and encrypted files are automatically excluded.
        </p>

        <h2>Using RAG in Chat</h2>
        <p>
          When RAG stores are configured, the AI can use File Search as a tool during chat conversations. The AI automatically searches your indexed documents to find relevant information and generate informed answers.
        </p>

        <h2>RAG Search Panel</h2>
        <p>
          When the default <code>gemihub</code> RAG store is configured, a RAG tab appears in the search panel (<kbd>Ctrl+Shift+F</kbd>). Enter a question in natural language to get meaning-based search results and an AI-generated answer.
        </p>

        <h2>Top-K Setting</h2>
        <p>
          The <strong>Top-K</strong> setting controls how many document chunks are retrieved per query (1–20). Higher values provide more context but use more tokens.
        </p>

        <h2>RAG in Workflows</h2>
        <p>
          Use the <strong>rag-sync</strong> node to sync files to your RAG store during workflow execution. The <strong>command</strong> node can also use RAG as a search tool.
        </p>
      </div>
    </>
  );
}

function RagJa() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-50">RAG（検索拡張生成）</h1>
      <figure className="mb-8 overflow-hidden rounded-xl border border-gray-200 shadow dark:border-gray-800">
        <img src="/images/chat_rag.png" alt="RAGチャット" className="w-full" loading="lazy" />
      </figure>
      <div className={prose}>
        <p>
          RAGにより、AIがドキュメントを意味で検索し、関連する内容に基づいて回答を生成できます。ファイルはGemini File Searchストアにインデックスされ、キーワードの完全一致を超えた意味検索が可能になります。
        </p>

        <h2>RAGのセットアップ</h2>
        <figure className="my-4 overflow-hidden rounded-xl border border-gray-200 shadow dark:border-gray-800">
          <img src="/images/setting_rag.png" alt="RAG設定" className="w-full" loading="lazy" />
        </figure>
        <ol>
          <li><strong>設定 &gt; RAG</strong>に移動。</li>
          <li><strong>設定を追加</strong>をクリックして新しいRAG設定を作成。</li>
          <li>タイプを選択：
            <ul>
              <li><strong>内部</strong> — 指定したDriveフォルダのファイルを自動同期。</li>
              <li><strong>外部</strong> — 既存のGemini File SearchストアIDに接続。</li>
            </ul>
          </li>
          <li>内部タイプの場合、対象フォルダとオプションの除外パターンを指定。</li>
          <li><strong>同期</strong>をクリックしてファイルのインデックスを開始。</li>
        </ol>

        <h2>自動RAG登録</h2>
        <p>
          <strong>自動RAG登録</strong>を有効にすると、ドライブ反映の際に対象ファイルが自動的に登録されます。すべてのファイルを登録するか、含めるフォルダをカスタマイズするかを選択できます。
        </p>
        <p>
          システム生成ファイル、チャット履歴、ワークフロー履歴、暗号化ファイルは自動的に除外されます。
        </p>

        <h2>チャットでのRAG使用</h2>
        <p>
          RAGストアが設定されている場合、AIはチャット中にFile Searchツールを使用できます。AIがインデックス済みドキュメントを自動検索し、関連情報を見つけて情報に基づいた回答を生成します。
        </p>

        <h2>RAG検索パネル</h2>
        <p>
          デフォルトの<code>gemihub</code> RAGストアが設定されている場合、検索パネル（<kbd>Ctrl+Shift+F</kbd>）にRAGタブが表示されます。自然言語で質問を入力すると、意味検索の結果とAI生成の回答が得られます。
        </p>

        <h2>Top-K設定</h2>
        <p>
          <strong>Top-K</strong>設定は、1回のクエリで取得するドキュメントチャンク数（1〜20）を制御します。値が大きいほどコンテキストが豊富になりますが、トークン消費が増えます。
        </p>

        <h2>ワークフローでのRAG</h2>
        <p>
          ワークフロー実行中に<strong>rag-sync</strong>ノードでRAGストアにファイルを同期できます。<strong>command</strong>ノードもRAGを検索ツールとして使用できます。
        </p>
      </div>
    </>
  );
}
