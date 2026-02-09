import { LogIn, MessageSquare, Search, Puzzle, GitBranch, Shield, User, HardDrive, Lock, ServerCog, Github, Globe, Sparkles, Zap, BookOpen } from "lucide-react";
import type { ComponentType } from "react";
import { useLocation } from "react-router";
import type { Language } from "~/types/settings";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";

interface Feature {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}

interface Screenshot {
  src: string;
  alt: string;
}

interface DataCard {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}

interface LpStrings {
  tagline: string;
  description: string;
  signIn: string;
  features: Feature[];
  screenshotsTitle: string;
  screenshots: Screenshot[];
  dataUsageTitle: string;
  dataUsageIntro: string;
  dataCards: DataCard[];
  dataUsageLearnMore: string;
  privacyPolicy: string;
  ctaReady: string;
  footerTerms: string;
  footerPolicy: string;
  footerContact: string;
}

const en: LpStrings = {
  tagline: "Your AI secretary, powered by Gemini and your own Google Drive",
  description: "AI chat with streaming & function calling, visual workflow builder, Drive file management, and offline-first caching — all self-hostable.",
  signIn: "Sign in with Google",
  features: [
    { icon: MessageSquare, title: "AI Chat", description: "Streaming responses with function calling, Google Search integration, and conversation history saved to Drive." },
    { icon: Search, title: "RAG & File Search", description: "Retrieval-augmented generation powered by your own Google Drive files for contextual AI answers." },
    { icon: Puzzle, title: "MCP & Plugins", description: "Extend capabilities with Model Context Protocol servers and a plugin system installable from GitHub." },
    { icon: GitBranch, title: "Workflow Automation", description: "Build and execute AI-powered workflows visually with 20+ node types including Drive, HTTP, and MCP integrations." },
    { icon: Sparkles, title: "AI Workflow Generation", description: "Describe what you want in natural language and the AI generates a complete workflow for you, with streaming preview and diff view." },
    { icon: Globe, title: "One-Click Web Publishing", description: "Publish any Drive file as a public web page instantly. Share documents, notes, or reports with a single click — no separate hosting needed." },
    { icon: Zap, title: "Fast Offline Editing", description: "Files are cached locally in your browser for instant loading and smooth editing. Push/pull sync keeps everything up to date with your Drive." },
    { icon: Shield, title: "Your Data, Your Control", description: "All data stored in your Google Drive — no external database. Self-hostable with optional encryption." },
  ],
  screenshotsTitle: "See It in Action",
  screenshots: [
    { src: "/images/cap.png", alt: "IDE with AI Chat & Drive File Management" },
    { src: "/images/visual_workflow.png", alt: "Visual Workflow Builder" },
    { src: "/images/workflow_execution.png", alt: "Workflow Execution" },
  ],
  dataUsageTitle: "How We Use Your Data",
  dataUsageIntro: "GemiHub uses Google OAuth to authenticate you. Here is exactly what we access and why:",
  dataCards: [
    { icon: User, title: "Google Account Info", description: "Your name and email address are used solely for sign-in and display within the app." },
    { icon: HardDrive, title: "Google Drive Access", description: "GemiHub reads and writes files in a dedicated \"GeminiHub\" folder in your Google Drive to store chat history, workflows, and settings. It does not access files outside this folder unless you explicitly select them." },
    { icon: Lock, title: "No Third-Party Sharing", description: "Your data is never sold, shared with, or transferred to any third party. All data remains in your own Google Drive." },
    { icon: ServerCog, title: "Full Portability", description: "GemiHub has no database — everything lives in your Google Drive. If this service ever shuts down, simply run your own instance locally or in the cloud and all your data, chat history, workflows, and settings are instantly available, exactly as you left them." },
  ],
  dataUsageLearnMore: "Learn more in our",
  privacyPolicy: "Privacy Policy",
  ctaReady: "Ready to get started?",
  footerTerms: "Terms of Service",
  footerPolicy: "Privacy Policy",
  footerContact: "Contact",
};

const ja: LpStrings = {
  tagline: "Geminiとあなた自身のGoogle Driveで動く、AIセクレタリー",
  description: "ストリーミング対応AIチャット、ビジュアルワークフロービルダー、Driveファイル管理、オフラインキャッシュ — すべてセルフホスト可能。",
  signIn: "Googleでサインイン",
  features: [
    { icon: MessageSquare, title: "AIチャット", description: "ストリーミング応答、ファンクションコール、Google検索連携、会話履歴のDrive保存に対応。" },
    { icon: Search, title: "RAG・ファイル検索", description: "Google Driveのファイルを活用した検索拡張生成で、文脈に沿ったAI回答を取得。" },
    { icon: Puzzle, title: "MCP・プラグイン", description: "Model Context Protocolサーバーと、GitHubからインストール可能なプラグインシステムで機能を拡張。" },
    { icon: GitBranch, title: "ワークフロー自動化", description: "Drive、HTTP、MCP連携を含む20以上のノードタイプで、AIワークフローをビジュアルに構築・実行。" },
    { icon: Sparkles, title: "AIワークフロー生成", description: "自然言語で説明するだけでAIがワークフローを自動生成。ストリーミングプレビューと差分表示で確認できます。" },
    { icon: Globe, title: "ワンクリックWeb公開", description: "DriveファイルをワンクリックでWebページとして公開。ドキュメントやノートを別途ホスティングなしで即座に共有できます。" },
    { icon: Zap, title: "高速オフライン編集", description: "ファイルはブラウザにキャッシュされ、瞬時に読み込み・快適に編集。プッシュ/プル同期でDriveと常に最新の状態を保ちます。" },
    { icon: Shield, title: "データは自分の手に", description: "すべてのデータはGoogle Driveに保存 — 外部データベースは不要。暗号化オプション付きでセルフホスト可能。" },
  ],
  screenshotsTitle: "動作イメージ",
  screenshots: [
    { src: "/images/cap.png", alt: "AIチャット＆Driveファイル管理" },
    { src: "/images/visual_workflow.png", alt: "ビジュアルワークフロービルダー" },
    { src: "/images/workflow_execution.png", alt: "ワークフロー実行" },
  ],
  dataUsageTitle: "データの取り扱いについて",
  dataUsageIntro: "GemiHubはGoogle OAuthで認証を行います。アクセスするデータとその目的は以下の通りです：",
  dataCards: [
    { icon: User, title: "Googleアカウント情報", description: "名前とメールアドレスは、ログインとアプリ内の表示にのみ使用します。" },
    { icon: HardDrive, title: "Google Driveへのアクセス", description: "Google Drive内の専用フォルダ「GeminiHub」にチャット履歴、ワークフロー、設定を保存します。明示的に選択しない限り、このフォルダ外のファイルにはアクセスしません。" },
    { icon: Lock, title: "第三者への共有なし", description: "データの販売や第三者への共有・転送は一切行いません。すべてのデータはご自身のGoogle Driveに保存されます。" },
    { icon: ServerCog, title: "完全なポータビリティ", description: "GemiHubにデータベースはありません。すべてのデータはGoogle Driveに保存されます。万が一このサービスが停止しても、ローカルやクラウドで自分のインスタンスを立ち上げるだけで、チャット履歴・ワークフロー・設定がそのまま復元されます。" },
  ],
  dataUsageLearnMore: "詳しくは",
  privacyPolicy: "プライバシーポリシー",
  ctaReady: "さあ、始めましょう",
  footerTerms: "利用規約",
  footerPolicy: "プライバシーポリシー",
  footerContact: "お問い合わせ",
};

export default function LandingPage() {
  const { pathname } = useLocation();
  const lang: Language = pathname.endsWith("/ja") ? "ja" : "en";
  const s = lang === "ja" ? ja : en;
  const jaPrefix = lang === "ja" ? "/ja" : "";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Language switcher */}
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher lang={lang} basePath="/lp" />
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center px-4 pb-16 pt-20 text-center sm:pt-28">
        <img
          src="/icons/icon-192x192.png"
          alt="GemiHub"
          width={80}
          height={80}
          className="mb-6 rounded-2xl shadow-lg"
        />
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl">
          GemiHub
        </h1>
        <p className="mx-auto mb-3 max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
          {s.tagline}
        </p>
        <p className="mx-auto mb-10 max-w-2xl text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          {s.description}
        </p>
        <a
          href="/auth/google"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-lg font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
        >
          <LogIn size={22} />
          {s.signIn}
        </a>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {s.features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <Icon size={28} className="mb-3 text-blue-600 dark:text-blue-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 dark:text-gray-50 sm:text-3xl">
          {s.screenshotsTitle}
        </h2>
        <div className="space-y-10">
          {s.screenshots.map(({ src, alt }) => (
            <figure key={src} className="overflow-hidden rounded-xl border border-gray-200 shadow-lg dark:border-gray-800">
              <img
                src={src}
                alt={alt}
                className="w-full"
                loading="lazy"
              />
              <figcaption className="bg-gray-50 px-4 py-2.5 text-center text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-400">
                {alt}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Data Usage */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-gray-50 sm:text-3xl">
          {s.dataUsageTitle}
        </h2>
        <p className="mb-8 text-center text-sm text-gray-600 dark:text-gray-400">
          {s.dataUsageIntro}
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {s.dataCards.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
              <Icon size={24} className="mb-2 text-green-600 dark:text-green-400" />
              <h3 className="mb-1.5 text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {s.dataUsageLearnMore}{" "}
          <a href={`/policy${jaPrefix}`} className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400">
            {s.privacyPolicy}
          </a>
        </p>
      </section>

      {/* Footer CTA */}
      <section className="flex flex-col items-center border-t border-gray-200 px-4 py-16 dark:border-gray-800">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-50">
          {s.ctaReady}
        </h2>
        <a
          href="/auth/google"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-lg font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
        >
          <LogIn size={22} />
          {s.signIn}
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-4 py-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex gap-6">
            <a href={`/terms${jaPrefix}`} className="hover:text-gray-700 hover:underline dark:hover:text-gray-200">
              {s.footerTerms}
            </a>
            <a href={`/policy${jaPrefix}`} className="hover:text-gray-700 hover:underline dark:hover:text-gray-200">
              {s.footerPolicy}
            </a>
            <a href="https://github.com/takeshy/gemihub" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-gray-700 hover:underline dark:hover:text-gray-200">
              <Github size={14} />
              GitHub
            </a>
            <a href={`https://github.com/takeshy/gemihub/blob/main/${lang === "ja" ? "README_ja.md" : "README.md"}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-gray-700 hover:underline dark:hover:text-gray-200">
              <BookOpen size={14} />
              README
            </a>
            <a href="mailto:takeshy.work@gmail.com" className="hover:text-gray-700 hover:underline dark:hover:text-gray-200">
              {s.footerContact}
            </a>
          </div>
          <p>&copy; {new Date().getFullYear()} <a href="https://takeshy.work" className="hover:text-gray-700 hover:underline dark:hover:text-gray-200">takeshy.work</a></p>
        </div>
      </footer>
    </div>
  );
}
