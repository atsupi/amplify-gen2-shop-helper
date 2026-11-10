# Amplify Gen2 Shop Helper

Vite + React (TypeScript) の洗練されたフロントエンド環境と、AWS Amplify Gen2 を組み合わせた、セキュアなユーザー専用高機能タスク管理アプリケーションです。

## 🚀 概要

このプロジェクトは、AWS Amplify Gen2 のコードファーストなバックエンド定義（TypeScript）を活用し、堅牢な認証基盤とリアルタイムなデータ同期を実現したモダンなWebアプリケーションです。
ユーザーごとに独立した安全なデータ領域が確保され、クラウド上の DynamoDB とシームレスに連携します。

### ✨ 主な機能

- **ユーザー認証**: AWS Amplify & Amazon Cognito を用いたセキュアなサインアップ・サインイン・ログアウト、およびワンタイムパスワード（OTP）検証。
- **リアルタイムデータ同期**: GraphQL (AWS AppSync) Subscription を活用した、モデルデータのリアルタイムな CRUD 操作。
- **オーナーベースの認可制御**: ログインユーザー本人のみが自身のレコードにアクセスできる厳格なセキュリティルールの適用。

## 🛠️ 技術スタック

### フロントエンド
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x (TypeScript 5.x)
- **Package Manager**: pnpm 9.x
- **UI Components**: @aws-amplify/ui-react, @mui/material

### バックエンド (AWS Amplify Gen2)
- **Authentication**: Amazon Cognito
- **API**: AWS AppSync (GraphQL)
- **Database**: Amazon DynamoDB
- **Infrastructure as Code**: AWS CDK v2 (TypeScript-based Code-first definition)

## 📦 環境構築と起動手順

### 前提条件
- Node.js v22.x (LTS)
- pnpm v9.x+
- AWS CLI がローカル環境にインストールされ、適切な IAM 権限が設定されていること

### 1. リポジトリのクローンと依存関係のインストール
`pnpm` を使用して、依存関係の競合を回避しつつクリーンにインストールします。
```bash
git clone <repository-url>
cd amplify-gen2-shop-helper

# pnpm が未導入の場合のみ実行
npm install -g pnpm

# 初回インストール時にビルドスクリプトの実行を許可
pnpm approve-builds --all

# 依存関係のインストール
pnpm install
```

### 2. AWS 開発環境（サンドボックス）の起動
ローカルファイル（`amplify/` フォルダ）の変更を検知して、リアルタイムに AWS 上へバックエンドリソースをプロビジョニングする watch モードを立ち上げます。
```bash
npx ampx sandbox
```
正常にデプロイが完了すると、ルートディレクトリにフロントエンド接続用の `amplify_outputs.json` が自動生成されます。

### 3. フロントエンド開発サーバーの起動
別のターミナルセッションを開き、ローカルの Vite サーバーを起動します。
```bash
pnpm run dev
```
起動後、ブラウザで `http://localhost:5173/` にアクセスしてアプリケーションを利用できます。

## 📂 ディレクトリ構造

```text
amplify-gen2-shop-helper/
├── amplify/                  # AWS Amplify Gen2 バックエンド定義フォルダ
│   ├── auth/
│   │   └── resource.ts       # Cognito 認証（Email認証ベース）の定義
│   ├── data/
│   │   └── resource.ts       # DynamoDB/AppSync のデータスキーマ、認可ルールの定義
│   └── backend.ts            # バックエンドリソースの統合定義
├── src/                      # フロントエンドソースコード
│   ├── App.tsx               # アプリのメインロジック（認証ガード、Todo CRUD実装）
│   ├── main.tsx              # エントリーポイント（Amplifyの初期化とマウント）
│   └── index.css             # グローバルスタイル定義
├── index.html                # Vite エントリーHTML
├── vite.config.ts            # Vite 5 / @vitejs/plugin-react の設定
├── pnpm-lock.yaml            # pnpm ロックファイル
├── pnpm-workspace.yaml       # pnpm ワークスペース定義ファイル
└── tsconfig.json             # TypeScript コンパイル・JSXランタイムの設定
```

## 💡 Amplify Gen1 から Gen2 への移行ポイント

- **複合プライマリキー**: Gen1 の `@primaryKey(sortKeyFields: ["SK"])` は、Gen2 ではモデルに対して `.identifier(['PK', 'SK'])` をチェーンすることで同一の挙動になります。
- **グローバルセカンダリインデックス (GSI)**: Gen1 の `@index` は、Gen2 では `.secondaryIndexes()` 内に配列でまとめて定義します。`name` や `queryField` もそのままマッピング可能です。
- **認証ルール (guest)**: デフォルトの認証モードが `userPool` になっているため、Gen1 の `allow: public` を再現するには `.authorization()` 内で `allow.guest()` を指定します。また、これに伴い `defineData` 側に `apiKeyAuthorizationMode` などのパブリック用認証設定が必要になります。
