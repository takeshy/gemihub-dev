# 暗号化

Google Drive に保存されたファイルを保護するためのハイブリッド RSA+AES 暗号化。

## 機能

- **ハイブリッド暗号化**: RSA-OAEP (2048ビット) + AES-256-GCM をファイルごとに使用
- **パスワード保護**: 秘密鍵を PBKDF2 派生鍵で暗号化（10万回反復）
- **ファイルごとの AES 鍵**: 暗号化のたびに新しい AES-256 鍵を生成
- **自己完結型ファイル**: 暗号化ファイルには復号に必要な情報がすべて含まれる（パスワードを除く）
- **クライアントサイド復号**: ブラウザ内で復号 — 平文がデバイスの外に出ることはない
- **パスワードキャッシュ**: セッション中は一度の入力で済む
- **二重暗号化防止**: 既に暗号化されたコンテンツは再暗号化されない

## 暗号化ファイルフォーマット

YAML フロントマターの後に Base64 エンコードされたデータが続く形式:

```
---
encrypted: true
key: <Base64: 暗号化された秘密鍵 (IV + AES-GCM 暗号文)>
salt: <Base64: PBKDF2 ソルト (16バイト)>
---
<Base64: key_length(2バイト) + RSA暗号化AES鍵 + IV(12バイト) + AES-GCM暗号文>
```

`key` と `salt` フィールドは暗号化時点の設定からコピーされる。これによりファイルは自己完結型となり、パスワードだけで復号できる。

## 仕組み

### セットアップ（初回のみ）

```
パスワード
  → RSA-2048 鍵ペア生成 (SPKI/PKCS8, Base64)
  → PBKDF2 でパスワードから AES-256 鍵を派生 (SHA-256, 10万回反復, ランダムソルト)
  → 派生鍵で秘密鍵を暗号化 (AES-256-GCM)
  → 設定に保存: publicKey, encryptedPrivateKey, salt
```

### 暗号化（ファイルごと）

```
平文
  → ランダム AES-256 鍵を生成
  → AES-256-GCM で平文を暗号化（ランダム IV）
  → RSA 公開鍵で AES 鍵を暗号化 (RSA-OAEP, SHA-256)
  → パック: key_length(2) + 暗号化AES鍵 + IV(12) + 暗号文
  → Base64 エンコード → YAML フロントマターでラップ
```

### 復号（ファイルごと）

```
パスワード + ソルト
  → PBKDF2 で AES-256 鍵を派生
  → 秘密鍵を復号 (AES-256-GCM)
  → アンラップ: 暗号化AES鍵、IV、暗号文を抽出
  → RSA 秘密鍵で AES 鍵を復号 (RSA-OAEP)
  → AES 鍵でコンテンツを復号 (AES-256-GCM)
  → 平文
```

## 暗号化データのバイナリレイアウト

データセクションを Base64 デコードした後:

```
オフセット  長さ      内容
0          2         AES鍵長 (ビッグエンディアン uint16)
2          key_len   RSA-OAEP 暗号化 AES-256 鍵
2+kl       12        AES-GCM IV (ノンス)
2+kl+12    残り       AES-GCM 暗号文 (16バイト認証タグ含む)
```

RSA-2048 + OAEP-SHA256 の場合、`key_len` は通常 256 バイト。

## 使い方

### ファイルを暗号化する

ファイルツリーでファイルを右クリック → **Encrypt**。ファイル内容が暗号化され、`.encrypted` 拡張子にリネームされる。

### 暗号化ファイルを開く

ツリーで `.encrypted` ファイルをクリック。パスワード入力画面が表示される。暗号化パスワードを入力すると、復号されたコンテンツの表示・編集が可能。

パスワードはセッション中メモリにキャッシュされる。以降の暗号化ファイルは自動的に復号される。

### 一時アップロード / ダウンロード

暗号化ファイルエディタ内:
- **一時アップロード**: 編集内容を再暗号化し、一時領域に保存（フル同期なしでデバイス間転送）
- **一時ダウンロード**: 一時コンテンツを取得・復号し、差分を表示

### ファイルの暗号化を解除する

`.encrypted` ファイルを右クリック → **Decrypt**。パスワードを入力。サーバー側でファイルが復号され、元のファイル名にリネームされる（`.encrypted` 拡張子が削除）。

## セキュリティに関する注意

- **パスワードは保存されない** — 設定に保存されるのは暗号化された秘密鍵とソルトのみ
- **平文はブラウザ内にとどまる** — サーバー側の暗号化/復号はファイル管理（リネーム、Drive 更新）にのみ使用。クライアント側ビューアはローカルで復号
- **ファイルごとに固有の AES 鍵** — 1つのファイルの AES 鍵が漏洩しても他のファイルには影響しない
- **RSA 鍵ペアは一度だけ生成** — パスワードで暗号化して設定に保存
- **パスワードを忘れるとデータは復旧不可** — リカバリ機能はない

## Python 復号スクリプト

暗号化ファイルは自己完結型であり、以下の Python スクリプトで Gemini Hub なしで復号できる。

### 必要なライブラリ

```bash
pip install cryptography
```

### スクリプト

```python
#!/usr/bin/env python3
"""Gemini Hub の暗号化ファイルをアプリケーションなしで復号する。"""
import base64, sys, re, getpass
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import padding

def decrypt_file(filepath: str, password: str) -> str:
    with open(filepath, 'r') as f:
        content = f.read()

    # YAML フロントマターをパース
    match = re.match(r'^---\n([\s\S]*?)\n---\n([\s\S]*)$', content)
    if not match:
        raise ValueError("無効な暗号化ファイル形式です")

    frontmatter, encrypted_data = match.groups()
    key_match = re.search(r'key:\s*(.+)', frontmatter)
    salt_match = re.search(r'salt:\s*(.+)', frontmatter)
    if not key_match or not salt_match:
        raise ValueError("フロントマターに key または salt がありません")

    enc_private_key = base64.b64decode(key_match.group(1).strip())
    salt = base64.b64decode(salt_match.group(1).strip())
    data = base64.b64decode(encrypted_data.strip())

    # パスワードから鍵を派生 (PBKDF2-SHA256, 10万回反復)
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=100000)
    derived_key = kdf.derive(password.encode())

    # 秘密鍵を復号 (AES-256-GCM)
    iv, enc_priv = enc_private_key[:12], enc_private_key[12:]
    private_key_pem = AESGCM(derived_key).decrypt(iv, enc_priv, None)
    private_key = serialization.load_der_private_key(base64.b64decode(private_key_pem), None)

    # 暗号化データをパース: key_length(2) + enc_aes_key + iv(12) + enc_content
    key_len = (data[0] << 8) | data[1]
    enc_aes_key = data[2:2+key_len]
    content_iv = data[2+key_len:2+key_len+12]
    enc_content = data[2+key_len+12:]

    # RSA 秘密鍵で AES 鍵を復号 (RSA-OAEP, SHA-256)
    aes_key = private_key.decrypt(enc_aes_key, padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))

    # コンテンツを復号 (AES-256-GCM)
    return AESGCM(aes_key).decrypt(content_iv, enc_content, None).decode('utf-8')

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"使い方: {sys.argv[0]} <暗号化ファイル>")
        sys.exit(1)
    password = getpass.getpass("パスワード: ")
    print(decrypt_file(sys.argv[1], password))
```

### 使い方

```bash
python decrypt.py path/to/file.md.encrypted
# プロンプトでパスワードを入力
```

## 主要ファイル

| ファイル | 役割 |
|---------|------|
| `app/services/crypto-core.ts` | 暗号化/復号関数 (Web Crypto API, クライアント/サーバー共通) |
| `app/services/crypto.server.ts` | crypto-core のサーバー側再エクスポート |
| `app/services/crypto-cache.ts` | メモリ内パスワード/秘密鍵キャッシュ (クライアント側, セッション単位) |
| `app/components/ide/EncryptedFileViewer.tsx` | パスワード入力 + 復号済みファイルエディタ |
| `app/routes/api.drive.files.tsx` | サーバー側暗号化/復号アクション (encrypt, decrypt) |

## 暗号パラメータ

| パラメータ | 値 |
|-----------|-----|
| RSA 鍵サイズ | 2048 ビット |
| RSA パディング | OAEP (SHA-256) |
| AES 鍵サイズ | 256 ビット |
| AES モード | GCM (認証付き) |
| AES IV サイズ | 12 バイト (96ビット) |
| KDF | PBKDF2 (SHA-256) |
| KDF 反復回数 | 100,000 |
| KDF ソルトサイズ | 16 バイト (128ビット) |
| 秘密鍵フォーマット | PKCS8 (DER, Base64) |
| 公開鍵フォーマット | SPKI (DER, Base64) |
