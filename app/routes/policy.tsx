import { ArrowLeft } from "lucide-react";

export default function Policy() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main className="mx-auto max-w-3xl px-4 py-16">
        <a
          href="/lp"
          className="mb-8 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={16} />
          Back
        </a>

        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-gray-50">プライバシーポリシー</h1>

        <div className="prose prose-gray max-w-none dark:prose-invert text-gray-700 dark:text-gray-300 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:dark:text-gray-100 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_p]:mb-4 [&_p]:leading-relaxed">
          <p>
            株式会社takeshy.work（以下、「当社」といいます。）は、Gemini Hub（以下、「本サービス」といいます。）におけるお客様の個人情報保護の重要性を認識し、適切な個人情報の取り扱いと保護に努めます。
          </p>

          <h2>1. 個人情報の定義</h2>
          <p>
            本プライバシーポリシーにおいて、個人情報とは、生存する個人に関する情報であって、当該情報に含まれる氏名、メールアドレスその他の記述等により特定の個人を識別することができるものを指します。
          </p>

          <h2>2. 個人情報の収集方法</h2>
          <p>当社は、以下の方法により個人情報を取得します：</p>
          <ul>
            <li>Googleアカウント連携による認証情報（氏名、メールアドレス、プロフィール画像）</li>
            <li>本サービスの利用時に自動的に収集される情報（アクセスログ等）</li>
          </ul>

          <h2>3. データの保存場所</h2>
          <p>
            本サービスで作成・管理されるデータ（チャット履歴、ワークフロー、設定情報等）は、すべてユーザー自身のGoogle Driveに保存されます。当社のサーバーにユーザーのコンテンツデータが永続的に保存されることはありません。セッション情報はCookieを通じて一時的に管理されます。
          </p>

          <h2>4. 個人情報の利用目的</h2>
          <p>当社は、取得した個人情報を以下の目的のために利用します：</p>
          <ul>
            <li>本サービスの提供・運営</li>
            <li>Google DriveおよびGoogle Gemini APIとの連携</li>
            <li>ユーザー認証とセッション管理</li>
            <li>サービスの改善と新機能の開発</li>
          </ul>

          <h2>5. 個人情報の第三者提供</h2>
          <p>当社は、以下の場合を除き、お客様の個人情報を第三者へ提供することはありません：</p>
          <ul>
            <li>お客様の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
            <li>Google APIサービスの利用に必要な範囲での情報連携（Google Drive、Gemini API等）</li>
          </ul>

          <h2>6. 個人情報の安全管理</h2>
          <p>
            当社は、個人情報の漏洩、滅失、き損を防止するため、適切なセキュリティ対策を実施し、個人情報の安全管理に努めます。本サービスでは、オプションの暗号化機能（RSA+AES）によるチャット履歴・ワークフロー履歴の暗号化もご利用いただけます。
          </p>

          <h2>7. Cookieの使用について</h2>
          <p>
            本サービスでは、ユーザー認証とセッション管理のためにCookieを使用します。Cookieを拒否した場合、本サービスをご利用いただけない場合があります。
          </p>

          <h2>8. お客様の権利</h2>
          <p>
            お客様は、ご自身のデータについて、Google Driveから直接アクセス・削除が可能です。本サービスのアカウント削除をご希望の場合は、Googleアカウントの連携を解除することで対応できます。
          </p>

          <h2>9. プライバシーポリシーの変更</h2>
          <p>
            当社は、必要に応じて本プライバシーポリシーを変更することがあります。変更後のプライバシーポリシーは、本サービス上に掲載された時点から効力を生じるものとします。
          </p>

          <p className="mt-10 text-sm text-gray-400 dark:text-gray-500">最終更新日：2025年3月16日</p>
        </div>
      </main>
    </div>
  );
}
