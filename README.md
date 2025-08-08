# 持ち物メモアプリ

子供の持ち物を管理するためのWebアプリケーション。Mantine UIを使用したモダンなデザインで、直感的な操作性を実現しています。

## 🎯 主な機能

### 📱 認証機能
- Googleアカウントでの安全なログイン
- ユーザー情報とデータの紐付け

### 👶 子供管理
- 複数の子供を登録・管理
- 子供の追加・削除・名前編集
- ドラッグ&ドロップによる並び順変更

### 🎒 持ち物管理
- **デフォルト項目**: 上着、下着、ズボン、おむつ、靴下（子供ごとに自動作成）
- **カスタム項目**: 自由に持ち物を追加・削除
- **数量調整**: +/-ボタンで直感的に数量設定
- **個別管理**: 子供ごとに独立した持ち物リスト
- **デバウンス機能**: 数量変更は1秒後にまとめてAPI送信
- **並び順変更**: 項目のドラッグ&ドロップ対応

### 🎨 UI/UX
- **Mantine UI**: モダンなデザインシステム
- **レスポンシブ対応**: 480px固定幅でPC/スマホ最適化
- **グラデーション効果**: 美しいビジュアル
- **インライン編集**: 名前のクリック編集対応
- **モーダル操作**: 追加操作は専用モーダル

## 🚀 使用方法

1. **開発サーバーを起動**:
```bash
npm run dev
```

2. **ブラウザでアクセス**:
`http://localhost:3000`

3. **Googleアカウントでログイン**

4. **子供を追加** → **持ち物を管理**

## 🎯 主な機能

### 認証機能
- Googleアカウントでの安全なログイン
- ユーザー情報とデータの紐付け

### 子供管理
- 複数の子供を登録・管理
- 子供の追加・削除

### 持ち物管理
- **デフォルト項目**: 上着、下着、ズボン、おむつ、靴下
- **カスタム項目**: 自由に持ち物を追加
- **数量調整**: +/-ボタンで直感的に数量設定
- **個別管理**: 子供ごとに異なる持ち物リスト

### UI/UX
- **スマートフォン最適化**: 480px幅でデザイン
- **レスポンシブ対応**: PC画面でも適切に表示
- **直感的操作**: ワンタップで数量調整

## 🛠️ セットアップ（初回のみ）

### 1. 依存関係インストール
```bash
npm install
```

### 2. データベースセットアップ
```bash
npm run db:generate  # Prismaクライアント生成
npm run db:push      # データベーススキーマ同期
```

### 3. 環境変数設定
`.env`ファイルは既に設定済みです。Google OAuth認証情報も設定済み。

## 📋 Google OAuth設定（参考）

既に設定済みですが、新しいプロジェクトで使用する場合の手順：

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクト作成
2. 「APIとサービス」→「認証情報」→「OAuth 2.0 クライアントID」作成
3. 承認済みリダイレクトURIに追加: `http://localhost:3000/api/auth/callback/google`
4. `.env`ファイルに認証情報設定

## 🏗️ 技術スタック

- **フロントエンド**: Next.js 15 (App Router)、React 19、TypeScript
- **UIライブラリ**: Mantine UI 8.2、@tabler/icons-react
- **ドラッグ&ドロップ**: @dnd-kit
- **スタイリング**: Tailwind CSS 4.1、Emotion (CSS-in-JS)
- **バックエンド**: Next.js API Routes
- **データベース**: SQLite + Prisma 6.13 ORM
- **認証**: NextAuth.js 4.24 (Google OAuth)
- **開発ツール**: ESLint、TypeScript、PostCSS

## 📊 API エンドポイント

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/children` | GET/POST | 子供一覧取得・新規作成 |
| `/api/children/[childId]` | PUT/DELETE | 子供更新・削除 |
| `/api/children/reorder` | PUT | 子供並び順更新 |
| `/api/item-types` | GET/POST | 持ち物種類一覧・新規作成 |
| `/api/item-types/[itemTypeId]` | PUT/DELETE | 持ち物種類更新・削除 |
| `/api/item-types/reorder` | PUT | 持ち物種類並び順更新 |
| `/api/child-items` | PUT | 持ち物数量更新 |
| `/api/health` | GET | ヘルスチェック |

## 🔧 開発コマンド

```bash
npm run dev          # 開発サーバー起動 (http://localhost:3000)
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
npm run lint         # ESLint実行
npm run type-check   # TypeScript型チェック
npm run db:generate  # Prismaクライアント生成
npm run db:push      # データベーススキーマ同期
npm run db:studio    # Prisma Studio起動（DB管理UI）
```

## 📱 使用例

1. **ログイン**: Googleアカウントでログイン
2. **子供追加**: 「たろう」「はなこ」を追加
3. **持ち物設定**: 
   - たろう: 上着1枚、下着1枚、ズボン1枚
   - はなこ: 下着1枚、ズボン1枚、おむつ5枚
4. **カスタム項目**: 「パンツ」「タオル」など追加
5. **数量調整**: +/-ボタンで必要数に調整
6. **並び替え**: ドラッグ&ドロップで子供・項目を並び替え
7. **名前編集**: 子供名・項目名をクリックして編集

アプリケーションは完全に動作可能な状態です！ 🎉

## 🐳 Docker対応

Dockerコンテナとしても実行可能です。詳細は `DOCKER.md` をご確認ください。

```bash
# Docker で起動
docker-compose up -d
```