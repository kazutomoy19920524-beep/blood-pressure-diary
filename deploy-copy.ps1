# Blood Pressure Diary - GitHub Pages Deploy & iOS Profile Generator
# Run this script in PowerShell to deploy the app and generate an iPhone installer profile.

$port = 8080
$baseDir = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      血圧手帳 iPhoneアプリ化 ＆ デプロイツール" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Check Git Environment ---
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git がこのPCにインストールされていないか、PATHが通っていません。"
    Write-Host "デプロイには Git が必要です。https://git-scm.com/ からインストールしてください。" -ForegroundColor Yellow
    Read-Host "Enterキーを押して終了します..."
    Exit
}

# --- 2. Get GitHub Repository URL ---
Write-Host "事前準備: GitHubで新しく空のリポジトリ（例: blood-pressure-diary）を作成してください。" -ForegroundColor Yellow
Write-Host "作成後、リポジトリのURL（例: https://github.com/ユーザー名/リポジトリ名.git）をコピーしてください。" -ForegroundColor Yellow
Write-Host ""
$repoUrl = Read-Host "GitHubリポジトリのURLを入力してください"
$repoUrl = $repoUrl.Trim()

if ([string]::IsNullOrEmpty($repoUrl) -or $repoUrl -notmatch "github\.com") {
    Write-Error "無効なGitHubリポジトリURLです。"
    Read-Host "Enterキーを押して終了します..."
    Exit
}

# Extract User and Repo names for GitHub Pages URL
if ($repoUrl -match "github\.com[:/]([^/]+)/([^/\.]+)") {
    $githubUser = $Matches[1]
    $githubRepo = $Matches[2]
    $pagesUrl = "https://${githubUser}.github.io/${githubRepo}/"
} else {
    Write-Error "GitHubのURL解析に失敗しました。"
    Read-Host "Enterキーを押して終了します..."
    Exit
}

Write-Host ""
Write-Host "設定情報:" -ForegroundColor Green
Write-Host " - リモート: $repoUrl"
Write-Host " - 公開URL : $pagesUrl"
Write-Host ""

# --- 3. Initialize Git & Push to GitHub ---
Write-Host ">>> Gitローカルリポジトリを初期化中..." -ForegroundColor Cyan

# Create basic .gitignore if not exists
$gitignorePath = Join-Path $baseDir ".gitignore"
if (!(Test-Path $gitignorePath)) {
    # Ignore server file and logs
    Set-Content -Path $gitignorePath -Value "server.ps1`n*.log`n*.mobileconfig`n.git/"
}

# Execute Git commands
try {
    # Check if .git directory exists
    if (!(Test-Path (Join-Path $baseDir ".git"))) {
        & git init
    }
    
    & git add .
    & git commit -m "Deploy blood pressure diary app"
    
    # Check if remote origin already exists
    $existingRemote = & git remote get-url origin 2>$null
    if ($existingRemote) {
        & git remote set-url origin $repoUrl
    } else {
        & git remote add origin $repoUrl
    }
    
    & git branch -M main
    
    Write-Host ">>> GitHubにデータをアップロード（プッシュ）中..." -ForegroundColor Cyan
    Write-Host "※GitHubのログイン画面や認証プロンプトが表示された場合は、画面の指示に従ってください。" -ForegroundColor Yellow
    & git push -u origin main --force
    
    Write-Host "GitHubへのアップロードが成功しました！" -ForegroundColor Green
} catch {
    Write-Error "Git処理中にエラーが発生しました: $_"
    Read-Host "Enterキーを押して終了します..."
    Exit
}

# --- 4. Generate iOS Configuration Profile (.mobileconfig) ---
Write-Host ""
Write-Host ">>> iPhone用の簡単インストーラー（構成プロファイル）を生成中..." -ForegroundColor Cyan

$iconPath = Join-Path $baseDir "icon.png"
if (Test-Path $iconPath) {
    $iconBytes = [System.IO.File]::ReadAllBytes($iconPath)
    $iconBase64 = [System.Convert]::ToBase64String($iconBytes)
} else {
    Write-Warning "icon.png が見つからないため、デフォルトアイコンで生成します。"
    $iconBase64 = ""
}

# Generate unique UUIDs
$uuid1 = [Guid]::NewGuid().ToString().ToUpper()
$uuid2 = [Guid]::NewGuid().ToString().ToUpper()

# Build Plist XML
$profileXml = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>PayloadDisplayName</key>
	<string>血圧手帳 インストーラー</string>
	<key>PayloadIdentifier</key>
	<string>com.bloodpressure.diary</string>
	<key>PayloadRemovalDisallowed</key>
	<false/>
	<key>PayloadType</key>
	<string>Configuration</string>
	<key>PayloadUUID</key>
	<string>$uuid1</string>
	<key>PayloadVersion</key>
	<integer>1</integer>
	<key>PayloadContent</key>
	<array>
		<dict>
			<key>FullScreen</key>
			<true/>
			<key>Icon</key>
			<data>
$iconBase64
			</data>
			<key>IsRemovable</key>
			<true/>
			<key>Label</key>
			<string>血圧手帳</string>
			<key>PayloadDescription</key>
			<string>血圧手帳アプリをホーム画面に追加します</string>
			<key>PayloadDisplayName</key>
			<string>血圧手帳 Web Clip</string>
			<key>PayloadIdentifier</key>
			<string>com.bloodpressure.diary.webclip</string>
			<key>PayloadType</key>
			<string>com.apple.webclip.managed</string>
			<key>PayloadUUID</key>
			<string>$uuid2</string>
			<key>PayloadVersion</key>
			<integer>1</integer>
			<key>Precomposed</key>
			<true/>
			<key>URL</key>
			<string>$pagesUrl</string>
		</dict>
	</array>
</dict>
</plist>
"@

$profileFileName = "blood-pressure.mobileconfig"
$profileOutputPath = Join-Path $baseDir $profileFileName
[System.IO.File]::WriteAllText($profileOutputPath, $profileXml)

Write-Host "簡単インストーラーファイル（ $profileFileName ）を生成しました！" -ForegroundColor Green

# --- 5. Output Instructions ---
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "                  🎉 デプロイ完了 🎉" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "残りの手順:"
Write-Host "1. GitHub Pages を有効化してください:"
Write-Host "   - コピーしたリポジトリのブラウザ画面を開きます。"
Write-Host "   - [Settings] -> [Pages] を開きます。"
Write-Host "   - Build and deployment の Branch で 'main' と '/(root)' を選択して [Save] を押します。"
Write-Host "   - 1〜2分待つと、以下の公開URLでアクセスできるようになります。"
Write-Host "     👉 $pagesUrl"
Write-Host ""
Write-Host "2. iPhoneへアプリをインストールする:"
Write-Host "   - 生成されたファイル '${profileFileName}' をAirDrop、メール等でiPhoneに送ります。"
Write-Host "   - iPhone側でファイルを開き、「プロファイルをダウンロードしました」と表示されたら、設定アプリの一番上にある「プロファイルのインストール」からインストールを完了させます。"
Write-Host "   - ホーム画面にアイコンが追加され、iPhone単体で使えるようになります！"
Write-Host "=========================================================="
Write-Host ""

Read-Host "Enterキーを押して終了します..."
