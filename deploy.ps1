# UTF-8 出力を有効化
$OutputEncoding = [System.Text.Encoding]::UTF8

$baseDir = $PSScriptRoot
Set-Location $baseDir

Write-Host "=== GitHub ＆ iOS モバイル構成プロファイル デプロイスクリプト ===" -ForegroundColor Cyan

# 1. Git リポジトリの初期化チェック
if (-not (Test-Path ".git")) {
    Write-Host "Git リポジトリを初期化しています..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit"
} else {
    git add .
    git commit -m "Auto update before deploy (v2.1)" -ErrorAction SilentlyContinue
}

# 2. リポジトリURLの確認 / 入力
$existingUrl = (git remote get-url origin 2>$null)

if ($existingUrl) {
    Write-Host "検出されたGitHubリポジトリ: $existingUrl" -ForegroundColor Cyan
    Write-Host "そのまま使用する場合は、何も入力せず [Enter] キーを押してください。" -ForegroundColor Green
    $inputUrl = Read-Host "GitHub のリポジトリ URL (または Enter)"
    if ([string]::IsNullOrWhiteSpace($inputUrl)) {
        $repoUrl = $existingUrl
    } else {
        $repoUrl = $inputUrl.Trim()
    }
} else {
    $repoUrl = Read-Host "GitHub のリポジトリ URL を入力してください (例: https://github.com/username/repository.git)"
    if ([string]::IsNullOrWhiteSpace($repoUrl)) {
        Write-Host "エラー: URLが入力されていません。" -ForegroundColor Red
        Read-Host "Enterキーを押して終了します..."
        exit
    }
}

# リポジトリURLから ユーザー名 と リポジトリ名 を抽出
$owner = ""
$repo = ""

if ($repoUrl -match 'github\.com[:/]([^/]+)/([^/\.]+)') {
    $owner = $Matches[1]
    $repo = $Matches[2]
} else {
    Write-Host "エラー: GitHub URL の解析に失敗しました ($repoUrl)" -ForegroundColor Red
    Read-Host "Enterキーを押して終了します..."
    exit
}

# 3. リモートの設定と Push
git remote remove origin -ErrorAction SilentlyContinue
git remote add origin $repoUrl
git branch -M main
Write-Host "GitHub へコードをプッシュしています..." -ForegroundColor Yellow
git push -u origin main --force

# 4. GitHub Pages 用 URL の決定
$pagesUrl = "https://$owner.github.io/$repo/"
Write-Host "GitHub Pages URL: $pagesUrl" -ForegroundColor Green

# 5. .mobileconfig ファイルの生成 (アイコンの埋め込みと全画面設定)
$iconBase64 = ""
$iconPath = Join-Path $baseDir "icon.png"
if (Test-Path $iconPath) {
    Write-Host "アプリアイコンをエンコードしています..." -ForegroundColor Yellow
    $bytes = [System.IO.File]::ReadAllBytes($iconPath)
    $iconBase64 = [Convert]::ToBase64String($bytes)
}

$profileUuid = [Guid]::NewGuid().ToString().ToUpper()
$payloadUuid = [Guid]::NewGuid().ToString().ToUpper()

$profileXml = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>URL</key>
            <string>$pagesUrl</string>
            <key>Label</key>
            <string>血圧手帳</string>
            <key>IsRemovable</key>
            <true/>
            <key>FullScreen</key>
            <true/>
            <key>Icon</key>
            <data>$iconBase64</data>
            <key>PayloadDescription</key>
            <string>アプリ「血圧手帳」へのショートカットを設定します。</string>
            <key>PayloadDisplayName</key>
            <string>血圧手帳</string>
            <key>PayloadIdentifier</key>
            <string>com.bloodpressure.app.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>$payloadUuid</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>血圧手帳 インストーラー</string>
    <key>PayloadIdentifier</key>
    <string>com.bloodpressure.app.profile</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>$profileUuid</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
"@

$profileFileName = "blood-pressure.mobileconfig"
$profileOutputPath = Join-Path $baseDir $profileFileName

# UTF-8 (BOMなし) で保存
[System.IO.File]::WriteAllText($profileOutputPath, $profileXml, [System.Text.Encoding]::UTF8)

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host " [OK] iOS用インストーラー ($profileFileName) を生成しました。" -ForegroundColor Green
Write-Host " [OK] GitHubへのコードプッシュが完了しました！" -ForegroundColor Green
Write-Host ""
Write-Host " 📱 あなたの血圧手帳 公開URL (完全HTTPS):" -ForegroundColor Yellow
Write-Host "    $pagesUrl" -ForegroundColor White
Write-Host ""
Write-Host " 【重要: 初回のみ必要なGitHub側の1分設定】" -ForegroundColor Cyan
Write-Host " 1. ブラウザで以下を開きます:"
Write-Host "    https://github.com/$owner/$repo/settings/pages"
Write-Host " 2. 'Branch' を 'None' から 'main' (/(root)) に変更して [Save] をクリック"
Write-Host " (約1〜2分待つと、世界中どこからでも上記URLで安全にアクセスできます)"
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

Read-Host "Enterキーを押して終了します..."