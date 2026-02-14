import type { Language } from "~/types/settings";
import { prose } from "../prose";

export function SetupChapter({ lang }: { lang: Language }) {
  if (lang === "ja") return <SetupJa />;
  return <SetupEn />;
}

function SetupEn() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-50">Initial Setup</h1>
      <figure className="mb-8 overflow-hidden rounded-xl border border-gray-200 shadow dark:border-gray-800">
        <img src="/images/setting_general.png" alt="Settings - General tab" className="w-full" loading="lazy" />
      </figure>
      <div className={prose}>
        <h2>1. Sign In</h2>
        <p>
          Visit the GemiHub landing page and click <strong>&quot;Sign in with Google&quot;</strong>. GemiHub will request permission to access your Google Drive (scoped to a <code>gemihub/</code> folder).
        </p>

        <h2>2. Configure Gemini API Key</h2>
        <p>
          After signing in, go to <strong>Settings &gt; General</strong>. Enter your Gemini API key in the <strong>API Key</strong> field. Without this key, AI features (chat, workflow AI nodes, RAG search) will not work.
        </p>
        <p>To get a Gemini API key:</p>
        <ol>
          <li>Go to <a href="https://aistudio.google.com/apikey" className="text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.</li>
          <li>Create a new API key or use an existing one.</li>
          <li>Copy the key and paste it into GemiHub Settings.</li>
        </ol>

        <h2>3. API Plan</h2>
        <p>
          Select your API plan (<strong>Free</strong> or <strong>Paid</strong>). This determines which Gemini models are available. Paid plan users have access to more capable models.
        </p>

        <h2>4. Set a Password</h2>
        <p>
          Set a password in the <strong>API Key &amp; Password</strong> section (minimum 8 characters). The password is used to encrypt your API key and enable file encryption features. All encryption is client-side — GemiHub never sends your password to any server.
        </p>

        <h2>5. First Sync</h2>
        <p>
          After configuration, GemiHub will automatically create the <code>gemihub/</code> folder on your Drive and save your settings. Use <strong>Push to Drive</strong> to upload local changes and <strong>Pull to Local</strong> to download files from Drive.
        </p>

        <h2>6. Language &amp; Theme</h2>
        <p>
          In Settings &gt; General, you can change the interface language (English / Japanese) and the color theme (Light / Dark / System).
        </p>
      </div>
    </>
  );
}

function SetupJa() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-50">初期セットアップ</h1>
      <figure className="mb-8 overflow-hidden rounded-xl border border-gray-200 shadow dark:border-gray-800">
        <img src="/images/setting_general.png" alt="設定 - 一般タブ" className="w-full" loading="lazy" />
      </figure>
      <div className={prose}>
        <h2>1. サインイン</h2>
        <p>
          GemiHubのランディングページにアクセスし、<strong>「Googleでサインイン」</strong>をクリックします。GemiHubはGoogle Drive（<code>gemihub/</code>フォルダにスコープ）へのアクセス許可を要求します。
        </p>

        <h2>2. Gemini APIキーの設定</h2>
        <p>
          サインイン後、<strong>設定 &gt; 一般</strong>に移動します。<strong>APIキー</strong>フィールドにGemini APIキーを入力してください。このキーがないと、AI機能（チャット、ワークフローAIノード、RAG検索）は動作しません。
        </p>
        <p>Gemini APIキーの取得方法：</p>
        <ol>
          <li><a href="https://aistudio.google.com/apikey" className="text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer">Google AI Studio</a>にアクセス。</li>
          <li>新しいAPIキーを作成するか、既存のキーを使用。</li>
          <li>キーをコピーしてGemiHubの設定に貼り付け。</li>
        </ol>

        <h2>3. APIプラン</h2>
        <p>
          APIプラン（<strong>無料</strong>または<strong>有料</strong>）を選択します。利用可能なGeminiモデルが決まります。有料プランではより高性能なモデルが利用可能です。
        </p>

        <h2>4. パスワードの設定</h2>
        <p>
          <strong>APIキー &amp; パスワード</strong>セクションでパスワードを設定します（8文字以上）。パスワードはAPIキーの暗号化とファイル暗号化機能に使用されます。すべての暗号化はクライアントサイドで行われ、パスワードがサーバーに送信されることはありません。
        </p>

        <h2>5. 初回同期</h2>
        <p>
          設定後、GemiHubは自動的にDriveに<code>gemihub/</code>フォルダを作成し、設定を保存します。<strong>ドライブ反映</strong>でローカルの変更をアップロードし、<strong>ローカル反映</strong>でDriveからファイルをダウンロードします。
        </p>

        <h2>6. 言語とテーマ</h2>
        <p>
          設定 &gt; 一般で、インターフェース言語（英語 / 日本語）とカラーテーマ（ライト / ダーク / システム）を変更できます。
        </p>
      </div>
    </>
  );
}
