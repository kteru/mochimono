# 持ち物メモアプリ

持ち物をメモするためのWebアプリケーション。

## 機能概要

### 認証機能
- Googleアカウントでのログイン（メールアドレスのみ取得）
- ユーザー情報とデータの紐付け

### 子供管理機能
- 複数の子供を登録・管理
- 子供ごとに完全に独立した持ち物リスト管理
- 子供の順番をドラッグ&ドロップで並べ替え可能
- 子供ごとの並び順をデータベースに永続化

### 持ち物管理機能
- デフォルト持ち物：「上着, 下着, ズボン, おむつ, 靴下」（子供ごとに自動作成）
- 持ち物の種類を動的に追加・削除（デフォルト項目も削除可能）
- 各持ち物の数量を増減（+/-ボタン）
- 項目の順番をドラッグ&ドロップで並べ替え可能
- **子供ごとに完全に独立した持ち物リスト**（他の子供に影響なし）
- **デバウンス機能**: 数量変更は1秒待機してからAPIリクエスト（コスト削減）
- **インライン編集機能**: 子供・項目名のクリック編集（PC/スマホ対応）

### UI/UX機能
- **iPhone風Edit機能**: 編集モードで並べ替えと削除の操作を分離
- **モーダルベースの操作**: 子供・項目の追加は + ボタンからモーダルで実行
- **スマート数量表示**: 0個は灰色、1個以上は明るい青色で表示
- **コンパクトデザイン**: 間隔を詰めて情報密度を向上
- **ドラッグ&ドロップ**: 子供と項目の両方で並べ替え可能
- スマートフォン表示を前提としたレスポンシブデザイン
- PC表示でも表示が崩れない（幅480px固定、中央寄せ）

## 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Mantine UI 8.2** (UIコンポーネント、Modals、Notifications、Hooks)
- **@dnd-kit** (ドラッグ&ドロップ)
- **@tabler/icons-react** (アイコン)
- **Emotion** (CSS-in-JS)

### バックエンド
- **Next.js API Routes**
- **SQLite** (データベース)
- **Prisma 6.13** (ORM)

### 認証
- **NextAuth.js 4.24** (Google OAuth - メールアドレスのみのスコープ)

### デプロイメント
- **Docker** (コンテナ化)
- **SQLite** (本番環境対応)
- **ボリュームマウント** (データ永続化)

### その他
- **ESLint** (コード品質)
- **Tailwind CSS 4.1** (ユーティリティCSS)
- **PostCSS** (CSS処理)

## データベース設計

### User テーブル
```sql
- id (PRIMARY KEY)
- email (UNIQUE)
- emailVerified
- created_at
- updated_at
```

### Child テーブル
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- name
- sort_order (INTEGER, DEFAULT 0) -- 並び順
- created_at
- updated_at
```

### ItemType テーブル（子供固有）
```sql
- id (PRIMARY KEY)
- child_id (FOREIGN KEY) -- 子供に紐付け（ユーザー共有ではない）
- name
- is_default (BOOLEAN, DEFAULT false)
- sort_order (INTEGER, DEFAULT 0) -- 並び順
- created_at
- updated_at
- UNIQUE(child_id, name)
```

### ChildItem テーブル
```sql
- id (PRIMARY KEY)
- child_id (FOREIGN KEY)
- item_type_id (FOREIGN KEY)
- quantity (INTEGER, DEFAULT 0)
- updated_at
- UNIQUE(child_id, item_type_id)
```

## API設計

### 子供関連
- `GET /api/children` - 子供一覧取得（itemTypes, childItems含む）
- `POST /api/children` - 子供作成（デフォルト項目も自動作成）
- `PUT /api/children/[childId]` - 子供名前更新
- `DELETE /api/children/[childId]` - 子供削除
- `PUT /api/children/reorder` - 子供の並び順更新

### 項目関連
- `GET /api/item-types?childId=xxx` - 指定子供の項目一覧
- `POST /api/item-types` - 項目作成（childId必須）
- `PUT /api/item-types/[itemTypeId]` - 項目名前更新
- `DELETE /api/item-types/[itemTypeId]` - 項目削除
- `PUT /api/item-types/reorder` - 項目の並び順更新（childId必須）

### 数量関連
- `PUT /api/child-items` - 数量更新（デバウンス処理）

## UI設計

### メイン画面レイアウト
```
┌─────────────────────┐
│      持ち物メモ      │
└─────────────────────┘

[≡] 👶 たろう        [🗑] [編集]
上着     [ - ] 1 [ + ]
下着     [ - ] 1 [ + ]  
ズボン   [ - ] 1 [ + ]
パンツ   [ - ] 0 [ + ]  ← 0は灰色背景
靴下     [ - ] 0 [ + ]
[+ 新しい項目を追加]

[≡] 👶 はなこ        [🗑] [編集]  
上着     [ - ] 0 [ + ]  ← 0は灰色背景
下着     [ - ] 1 [ + ]  ← 1以上は青色背景
ズボン   [ - ] 1 [ + ]
おむつ   [ - ] 0 [ + ]
靴下     [ - ] 0 [ + ]
[+ 新しい項目を追加]

👶 [+ 子供を追加]

        [ログアウト]
```

### UI特徴
- **Mantine UI Paper**: カードベースのデザイン
- **グラデーション**: タイトルとボタンに美しいグラデーション効果
- **ドラッグ&ドロップ**: 子供と項目の並べ替え対応
- **モーダル**: 子供・項目追加は専用モーダルで操作
- **デバウンス**: 数量変更は1秒後にAPI送信
- **インライン編集**: 子供名・項目名のクリック編集対応

## パフォーマンス最適化

### デバウンス機能
- 数量変更時は即座にUIを更新
- APIリクエストは最後の変更から1秒後に送信
- 連続クリック時のサーバー負荷とコストを大幅削減

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# データベースマイグレーション
npx prisma db push

# データベース確認
npx prisma studio

# ビルド
npm run build

# 型チェック
npm run type-check

# リント
npm run lint
```

## 環境変数

```env
# データベース
DATABASE_URL="file:./data/mochimono.db"

# NextAuth設定
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"  
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Docker

### 基本起動
```bash
docker run -d \
  -p 3000:3000 \
  -v ./data:/app/data \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=your-secret \
  -e GOOGLE_CLIENT_ID=your-client-id \
  -e GOOGLE_CLIENT_SECRET=your-secret \
  mochimono
```

### Docker Compose
```bash
docker-compose up -d
```

## 実装済み機能

✅ **基本機能**
- Google OAuth認証（メールアドレスのみ）
- 子供・項目・数量のCRUD操作
- 子供ごとの独立した項目管理

✅ **編集機能**
- **インライン編集**: 子供名・項目名のクリック編集
- **PC/スマホ対応**: Enter/Escape確定・フォーカスアウト保存
- **リアルタイム更新**: 編集内容の即座反映
- **エラーハンドリング**: 失敗時の自動復元

✅ **UI/UX改善**  
- Mantine UI 8.2ライブラリによるモダンなデザイン
- + ボタンによるモーダル操作
- ドラッグ&ドロップによる並べ替え（子供・項目両方）
- **高密度デザイン**: 最適化されたスペーシング
- **グラデーション効果**: ボタンとタイトルの美しいUI
- **レスポンシブ対応**: 480px固定幅でPC/スマホ両対応

✅ **パフォーマンス**
- 数量変更のデバウンス機能（1秒）
- 並び順のデータベース永続化

✅ **レスポンシブデザイン**
- モバイルファースト設計
- PC表示対応（幅480px固定）

✅ **デプロイメント**
- **Docker環境**: 公開イメージレベルの使いやすさ
- **自動初期化**: データベーススキーマ自動作成
- **ヘルスチェック**: アプリケーション監視機能
- **環境変数バリデーション**: 設定不備の自動検出

## アーキテクチャの特徴

### 子供固有の項目管理
- 従来: 全ユーザーで項目を共有
- **改善後**: 各子供が独自の項目リストを持つ
- メリット: 子供ごとに異なる持ち物を管理可能

### デバウンス処理
- UI: 即座に反映（レスポンシブ）
- API: 1秒待機後にリクエスト（効率的）
- コスト削減効果: 10回クリック → 1回のAPIコール

### インライン編集システム
- **ハイブリッド操作方式**: PC（キーボード）とスマホ（タッチ）の最適化
- **即座UI更新**: ローカル状態での即時反映
- **サーバー同期**: API経由での永続化
- **重複チェック**: 項目名の一意性保証

### ドラッグ&ドロップ
- @dnd-kitライブラリ使用
- 子供と項目の両方で並べ替え対応
- データベースにsort_order永続化

### Docker化アーキテクチャ
- **マルチステージビルド**: 最適化された本番イメージ
- **エントリーポイント**: 自動初期化スクリプト
- **ボリューム設計**: SQLiteデータの永続化
- **セキュリティ**: 非root実行・最小権限

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.