# 血圧手帳アプリ App Store (iOS) 公開手順ガイド

本アプリは PWA（Progressive Web App）として開発されており、そのままでも iPhone のホーム画面に追加してアプリのように使えますが、**App Store（アップルストア）に正式なアプリとして公開して配信することも可能**です。

以下に、PWAをApp Store向けにパッケージングして申請・公開するまでの具体的な手順を解説します。

---

## 📋 事前準備（必要なもの）

1. **公開用のWebサーバー（HTTPS対応）**
   - App Storeに公開するアプリであっても、PWAの場合は「常に最新バージョンのWebサイトを表示するシェル（枠組み）」として動作します。
   - そのため、まずはアプリがインターネット上（例: GitHub Pages, Vercel, Firebase Hostingなど）に公開されており、**`https://` で始まるURL**を持っている必要があります。
2. **Mac PC (Xcode)**
   - Appleストアにアプリを申請・ビルドするためには、最終的に macOS 上の公式開発ツール「Xcode」を使用する必要があります。
3. **Apple Developer Account（開発者アカウント）**
   - App Storeにアプリを公開するには、Appleの有料アカウント（個人：年間99米ドル / 組織：年間299米ドル）に加入する必要があります。

---

## 🛠️ 公開までの5つのステップ

### STEP 1: PWA の動作確認とアセット確認
App Storeの審査では、アプリアイコンやアプリの挙動が非常に厳しくチェックされます。
- `manifest.json` の設定が正しいこと。
- アプリアイコン（`icon.png`）が 512x512 ピクセル以上の高解像度で用意されていること。
- アプリがオフライン環境でも最低限動作すること（本アプリはサービスワーカーを導入しているためクリアしています）。

### STEP 2: PWABuilder を使って Xcode プロジェクトを作成
Microsoftが提供する無料ツール **[PWABuilder](https://www.pwabuilder.com/)** を使うと、WebアプリのURLを入力するだけで、App Store用の「Xcodeプロジェクト（iOSネイティブアプリ化パッケージ）」を自動生成してくれます。

1. [PWABuilderの公式サイト](https://www.pwabuilder.com/) をブラウザで開きます。
2. 公開した血圧手帳のURL（例: `https://[ユーザー名].github.io/blood-pressure-diary/`）を入力し、**「Start」**をクリックします。
3. PWAの品質スコアが表示されます。下部にある **「Store Package」** セクションの **「iOS」**（または「Apple Store」）にある **「Generate Package」** をクリックします。
4. アプリ名やバンドルID（例: `com.yourname.bloodpressure`）などの基本設定を入力し、生成された **Xcodeプロジェクト (.zip)** をダウンロードします。

### STEP 3: Apple Developer アカウントの取得と設定
1. [Apple Developer Portal](https://developer.apple.com/) にアクセスし、Apple IDでサインインします。
2. 有料の開発者プログラム **Apple Developer Program**（年間99ドル）に登録します。
3. 登録完了後、開発者コンソール（App Store Connect）にログインし、新規アプリの枠組みを作成（App名、言語、バンドルID等を登録）します。

### STEP 4: Xcode でのビルドとアップロード (Macでの操作)
1. ダウンロードした XcodeプロジェクトのZIPファイルを Mac で展開し、Xcode で開きます。
2. Xcode 内で自分の Apple Developer アカウントと連携します。
3. **Signing & Capabilities** 設定で、自身の開発者プロファイル（証明書）を設定します。
4. シミュレーターを「Any iOS Device (arm64)」に設定し、メニューの **Product -> Archive** を実行してビルドをまとめます。
5. ビルド成功後、配布オーガナイザー（Distribute App）から **App Store Connect に直接アプリ（バイナリ）をアップロード**します。

### STEP 5: App Store Connect での申請と審査
1. [App Store Connect](https://appstoreconnect.apple.com/) にアクセスします。
2. アップロードしたビルドを選択します。
3. アプリの説明文、キーワード、サポートURL、プライバシーポリシー、およびアプリのスクリーンショット（iPhone各サイズ）を登録します。
4. **「審査用に提出」** をクリックします。
   - 通常、Appleによる審査は 24時間〜48時間 程度で行われます。
   - ガイドライン違反（機能がシンプルすぎる、Webサイトと見栄えが変わらない等）でリジェクトされる場合がありますが、本アプリは「カレンダー」「SVGによるローカルグラフ描画」「オフラインLocalStorage動作」など、Web機能を超えたネイティブアプリ並みのUXを提供しているため、審査を通過しやすい設計になっています。

---

## 💡 Android (Google Play) にも公開したい場合

PWABuilder を使用すると、Android用（Google Playストア用）のパッケージ（`.aab`ファイル）も同時にワンクリックで生成できます。
Google Playストアに公開する場合は：
1. PWABuilderで「Android」のパッケージを生成。
2. Google Play Consoleアカウント（登録料：初回のみ25米ドル）を作成。
3. 生成されたファイルをコンソールにアップロードし、審査にかける。
これで、Androidユーザー向けにもPlayストアから配信できるようになります。
