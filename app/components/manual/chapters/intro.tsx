import type { Language } from "~/types/settings";
import { prose } from "../prose";

export function IntroChapter({ lang }: { lang: Language }) {
  if (lang === "ja") return <IntroJa />;
  return <IntroEn />;
}

function IntroEn() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-50">What is GemiHub?</h1>
      <figure className="mb-8 overflow-hidden rounded-xl border border-gray-200 shadow dark:border-gray-800">
        <img src="/images/cap.png" alt="GemiHub main screen" className="w-full" loading="lazy" />
      </figure>
      <div className={prose}>
        <p>
          GemiHub is an AI-powered workspace that integrates Google Gemini with Google Drive. It combines an AI chat assistant, a file editor, visual workflow automation, and meaning-based search (RAG) — all in a single browser-based IDE.
        </p>

        <h2>Key Features</h2>
        <ul>
          <li><strong>AI Chat</strong> — Converse with Gemini AI that can read your files, search the web, generate images, and call external tools automatically.</li>
          <li><strong>File Editor</strong> — Edit Markdown files with WYSIWYG, Preview, and Raw modes. Built-in diff view and edit history.</li>
          <li><strong>Visual Workflows</strong> — Build automation with a drag-and-drop editor. 24 node types including AI prompts, Drive operations, HTTP requests, and interactive prompts.</li>
          <li><strong>Smart Search</strong> — Search your files by keyword (Local/Drive) or by meaning (RAG).</li>
          <li><strong>Offline-First</strong> — All files are cached in your browser. Edit offline, then sync changes to Drive when ready.</li>
          <li><strong>Encryption</strong> — Optional client-side RSA+AES encryption for sensitive files, chat history, and workflow logs.</li>
          <li><strong>Plugin System</strong> — Extend the app with plugins installed from GitHub.</li>
          <li><strong>MCP Integration</strong> — Connect external tools via the Model Context Protocol.</li>
          <li><strong>Self-Hostable</strong> — No external database. Everything is stored in your own Google Drive.</li>
        </ul>

        <h2>Architecture</h2>
        <p>
          GemiHub is a web application built with React and React Router (SSR). All user data — files, chat history, workflows, settings — is stored in a dedicated <code>gemihub/</code> folder on the user&apos;s Google Drive. There is no external database.
        </p>
        <p>
          The browser uses IndexedDB for local caching. You can work entirely offline and sync changes to Drive with a manual Push to Drive / Pull to Local mechanism.
        </p>

        <h2>Technology Stack</h2>
        <ul>
          <li><strong>AI</strong> — Google Gemini API (chat, function calling, image generation, RAG)</li>
          <li><strong>Storage</strong> — Google Drive API (all data in user&apos;s own Drive)</li>
          <li><strong>Frontend</strong> — React 19, React Router 7, Tailwind CSS v4</li>
          <li><strong>Hosting</strong> — Google Cloud Run (or self-hosted)</li>
        </ul>
      </div>
    </>
  );
}

function IntroJa() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-50">GemiHubとは</h1>
      <figure className="mb-8 overflow-hidden rounded-xl border border-gray-200 shadow dark:border-gray-800">
        <img src="/images/cap.png" alt="GemiHub メイン画面" className="w-full" loading="lazy" />
      </figure>
      <div className={prose}>
        <p>
          GemiHubは、Google GeminiとGoogle Driveを統合したAIワークスペースです。AIチャット、ファイルエディタ、ビジュアルワークフロー自動化、意味検索(RAG)を、ひとつのブラウザベースIDEに統合しています。
        </p>

        <h2>主な機能</h2>
        <ul>
          <li><strong>AIチャット</strong> — ファイルを読み、Webを検索し、画像を生成し、外部ツールを自動で呼び出すGemini AIとの対話。</li>
          <li><strong>ファイルエディタ</strong> — WYSIWYG、プレビュー、Rawモードでのマークダウン編集。差分表示と編集履歴も内蔵。</li>
          <li><strong>ビジュアルワークフロー</strong> — ドラッグ＆ドロップで自動化を構築。AIプロンプト、Drive操作、HTTPリクエスト、対話型プロンプトなど24種のノードタイプ。</li>
          <li><strong>スマート検索</strong> — キーワード検索（ローカル/Drive）と意味検索(RAG)。</li>
          <li><strong>オフラインファースト</strong> — すべてのファイルがブラウザにキャッシュ。オフラインで編集し、準備ができたらドライブ反映。</li>
          <li><strong>暗号化</strong> — クライアントサイドのRSA+AES暗号化で、ファイル、チャット履歴、ワークフローログを保護。</li>
          <li><strong>プラグインシステム</strong> — GitHubからインストール可能なプラグインでアプリを拡張。</li>
          <li><strong>MCP連携</strong> — Model Context Protocol経由で外部ツールを接続。</li>
          <li><strong>セルフホスト対応</strong> — 外部データベース不要。すべてのデータはユーザー自身のGoogle Driveに保存。</li>
        </ul>

        <h2>アーキテクチャ</h2>
        <p>
          GemiHubは、ReactとReact Router（SSR）で構築されたWebアプリケーションです。ファイル、チャット履歴、ワークフロー、設定などすべてのユーザーデータは、ユーザーのGoogle Drive内の<code>gemihub/</code>フォルダに保存されます。外部データベースはありません。
        </p>
        <p>
          ブラウザはIndexedDBをローカルキャッシュとして使用します。完全にオフラインで作業し、手動のドライブ反映 / ローカル反映でDriveと変更を同期できます。
        </p>

        <h2>技術スタック</h2>
        <ul>
          <li><strong>AI</strong> — Google Gemini API（チャット、ファンクションコール、画像生成、RAG）</li>
          <li><strong>ストレージ</strong> — Google Drive API（すべてのデータをユーザー自身のDriveに保存）</li>
          <li><strong>フロントエンド</strong> — React 19、React Router 7、Tailwind CSS v4</li>
          <li><strong>ホスティング</strong> — Google Cloud Run（またはセルフホスト）</li>
        </ul>
      </div>
    </>
  );
}
