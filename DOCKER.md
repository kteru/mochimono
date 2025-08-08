# 🐳 Mochimono Docker 環境

持ち物メモアプリの Docker 環境。マルチステージビルド、マルチプロファイル対応で本格的な運用に対応しています。

## 🚀 クイックスタート

```bash
# 環境変数を設定
export NEXTAUTH_URL=http://localhost:3000
export NEXTAUTH_SECRET=your-secret-key
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret

# コンテナを起動
docker run -d \
  --name mochimono \
  -p 3000:3000 \
  -v ./data:/app/data \
  -e NEXTAUTH_URL=$NEXTAUTH_URL \
  -e NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
  -e GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
  -e GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
  mochimono
```

## 📋 環境変数

### 必須項目

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | アプリケーションのベースURL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth.js シークレットキー | `your-secret-key` |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | `GOCSPX-xxxxx` |

### オプション項目

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | データベース接続文字列 | `file:/app/data/mochimono.db` |
| `LOG_LEVEL` | ログレベル (`INFO`, `DEBUG`) | `INFO` |
| `PORT` | リスニングポート | `3000` |

## 🗂️ ボリューム

| Path | Description |
|------|-------------|
| `/app/data` | SQLiteデータベース格納ディレクトリ |

## 💻 使用方法

### 1. 基本的な使用

```bash
# イメージをビルド
docker build -t mochimono .

# 環境変数を設定してコンテナを起動
docker run -d \
  --name mochimono-app \
  -p 3000:3000 \
  -v ./data:/app/data \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=your-production-secret \
  -e GOOGLE_CLIENT_ID=your-google-client-id \
  -e GOOGLE_CLIENT_SECRET=your-google-client-secret \
  -e LOG_LEVEL=INFO \
  mochimono
```

### 2. Docker Compose を使用

#### 開発環境

```bash
# 環境変数を設定
export NEXTAUTH_URL=http://localhost:3000
export NEXTAUTH_SECRET=your-secret-key
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret

# 開発用コンテナを起動
docker-compose up -d
```

#### 本番環境

```bash
# 環境変数を設定
export NEXTAUTH_URL=https://your-domain.com
export NEXTAUTH_SECRET=your-production-secret
export GOOGLE_CLIENT_ID=your-production-client-id
export GOOGLE_CLIENT_SECRET=your-production-client-secret

# 本番用コンテナを起動
docker-compose --profile production up -d
```

#### 開発・デバッグ用

```bash
# 開発用設定（ホットリロード、デバッガーポート開放）
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret

docker-compose --profile development up -d
```

## 🏗️ 主要機能

### 高度なエントリーポイントスクリプト

- ✅ **カラフルなログ出力** - 視認性の高いコンソール表示
- ✅ **詳細なエラーメッセージ** - 問題の特定が容易
- ✅ **自動環境変数バリデーション** - 設定不備の早期発見
- ✅ **データベース自動初期化** - 初回実行時の自動セットアップ
- ✅ **シグナルハンドリング** - 優雅なシャットダウン
- ✅ **セキュリティ考慮** - 機密情報をログでマスク

### マルチプロファイル Docker Compose

```bash
# デフォルト（開発・テスト用）
docker-compose up -d

# 本番用（最適化されたイメージ使用）
docker-compose --profile production up -d

# 開発用（ホットリロード、デバッガー対応）
docker-compose --profile development up -d
```

### 各プロファイルの特徴

| プロファイル | ビルド方式 | ホットリロード | デバッガー | 用途 |
|-------------|-----------|----------------|------------|------|
| default | フルビルド | ❌ | ❌ | 本番環境テスト |
| production | 最適化ビルド | ❌ | ❌ | 本番デプロイ |
| development | 開発ビルド | ✅ | ✅ (Port 9229) | ローカル開発 |

### セキュリティ強化

- 🔐 非rootユーザー（nextjs:nodejs）での実行
- 🛡️ dumb-init による適切なシグナル処理
- 🔍 機密情報の自動マスキング
- ✨ 最小権限の原則

### ヘルスチェック内蔵

```bash
# 自動ヘルスチェック（Docker内蔵）
# 30秒間隔、10秒タイムアウト、3回リトライ

# 手動確認
curl http://localhost:3000/api/health
```

## 📁 ファイル構成

```
.
├── Dockerfile                  # マルチステージビルド (base/deps/builder/runner)
├── docker-compose.yml         # マルチプロファイル設定 (default/production/development)
├── .dockerignore              # Docker除外ファイル
├── data/                      # SQLiteデータベースマウントポイント
│   └── mochimono.db          # SQLiteデータベースファイル
└── scripts/
    └── docker-entrypoint.sh  # エントリーポイント（環境変数バリデーション、DB初期化）
```

## 🔧 詳細設定

### 環境変数バリデーション

コンテナ起動時に必須環境変数の自動チェックを実行：

```bash
# 設定不備がある場合、詳細なエラーメッセージを表示
[2024-01-01 12:00:00] ERROR 必須環境変数が設定されていません: NEXTAUTH_SECRET GOOGLE_CLIENT_ID

使用例:
  docker run -d \
    --name mochimono \
    -p 3000:3000 \
    -v ./data:/app/data \
    -e NEXTAUTH_URL=http://localhost:3000 \
    -e NEXTAUTH_SECRET=your-secret-key \
    -e GOOGLE_CLIENT_ID=your-client-id \
    -e GOOGLE_CLIENT_SECRET=your-client-secret \
    mochimono
```

### デバッグモード

```bash
# デバッグログを有効化
docker run -d \
  -e LOG_LEVEL=DEBUG \
  -p 3000:3000 \
  -p 9229:9229 \  # デバッガーポート
  -v ./data:/app/data \
  # ... その他の設定
  mochimono
```

### 開発環境での使用

```bash
# 開発用プロファイルでホットリロード + デバッガー
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret

docker-compose --profile development up -d

# ログを確認
docker-compose logs -f mochimono-dev
```

### ボリューム設定のカスタマイズ

```bash
# 本番環境での推奨設定
docker run -d \
  -v /var/lib/mochimono/data:/app/data \  # 本番データ保存先
  -v /var/log/mochimono:/app/logs \       # ログファイル（オプション）
  # ... その他の設定
  mochimono
```

## 📊 監視・運用

### ヘルスチェック

```bash
# アプリケーション状態確認
curl -f http://localhost:3000/api/health

# レスポンス例
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "mochimono"
}
```

### ログ監視

```bash
# リアルタイムログ表示
docker logs -f mochimono

# Docker Compose使用時
docker-compose logs -f

# カラーログ出力例
[2024-01-01 12:00:00] INFO  環境変数の検証が完了しました
[2024-01-01 12:00:01] INFO  データベースを初期化中...
[2024-01-01 12:00:02] INFO  アプリケーションを開始します...
```

### パフォーマンス監視

```bash
# コンテナリソース使用状況
docker stats mochimono

# データベースサイズ確認
du -h ./data/mochimono.db
```

## 🛠️ トラブルシューティング

### 環境変数関連

```bash
# 環境変数の確認
docker exec mochimono env | grep -E "(NEXTAUTH|GOOGLE)"

# 設定の再検証
docker restart mochimono && docker logs mochimono
```

### データベース関連

```bash
# データベース再初期化
rm -f ./data/mochimono.db
docker restart mochimono

# Prismaスキーマ更新
docker exec mochimono npx prisma db push

# データベース接続テスト
docker exec mochimono node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => console.log('OK')).catch(console.error);
"
```

### ネットワーク関連

```bash
# ポート使用状況確認
netstat -tlnp | grep :3000

# コンテナネットワーク確認
docker network inspect mochimono_network
```

### パーミッション関連

```bash
# データディレクトリの権限確認・修正
sudo chown -R 1001:1001 ./data/
chmod -R 755 ./data/
```

## 🔄 運用・メンテナンス

### アップデート手順

```bash
# 1. 新しいイメージをビルド
docker-compose build

# 2. データをバックアップ（推奨）
cp ./data/mochimono.db ./data/mochimono.db.backup

# 3. サービスを更新
docker-compose up -d

# 4. 古いイメージを削除
docker image prune -f
```

### バックアップ・リストア

```bash
# バックアップ
tar -czf mochimono-backup-$(date +%Y%m%d).tar.gz ./data/

# リストア
tar -xzf mochimono-backup-20240101.tar.gz
docker restart mochimono
```

### スケールアウト考慮

```bash
# 複数インスタンス実行時の注意点
# SQLiteは単一ファイルアクセスのため、読み取り専用レプリカか
# PostgreSQL等への移行を検討してください

# 負荷分散設定例（nginx）
upstream mochimono {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}
```

## 🚀 本番デプロイメント

### セキュリティチェックリスト

- [ ] `NEXTAUTH_SECRET`に強力なランダム文字列（32文字以上）を使用
- [ ] Google OAuth設定で本番ドメインを正しく設定
- [ ] HTTPS接続の設定（リバースプロキシ推奨）
- [ ] ファイアウォール設定でポート3000を適切に制限
- [ ] 定期的なセキュリティアップデート

### パフォーマンス考慮事項

- SQLiteは軽量〜中規模アプリに適している
- 大量アクセス時はPostgreSQLなどへの移行を検討
- CDN使用でスタティックアセットの配信を最適化
- ヘルスチェック間隔の調整（本番では60秒〜）

### 監視・アラート

```bash
# システム監視スクリプト例
#!/bin/bash
curl -f http://localhost:3000/api/health || {
  echo "アプリケーションダウン" | mail -s "Alert" admin@example.com
  docker restart mochimono
}
```

## 🤝 サポート

問題が発生した場合：

1. ログを確認: `docker logs mochimono`
2. ヘルスチェック: `curl http://localhost:3000/api/health`
3. 環境変数確認: `docker exec mochimono env`
4. GitHub Issueで報告

---

**Tweet**: Docker実装をフルリニューアル！🐳 公式イメージレベルの使いやすさを実現しました。カラフルなログ、自動バリデーション、マルチプロファイル対応で開発体験が向上しました✨ #Docker #Next.js #持ち物メモ