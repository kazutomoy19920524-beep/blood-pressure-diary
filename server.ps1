# Lightweight PowerShell TCP HTTP Server (No Admin Rights Required)
# Serves files on http://localhost:8080/ and http://[PC-IP]:8080/

$port = 8080
$baseDir = "C:\Users\kazut\.gemini\antigravity\scratch\blood-pressure-diary"

# Get Local IPv4 Address (excluding loopback)
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -ExpandProperty IPAddress -First 1)
if (!$ip) {
    $ip = "127.0.0.1"
}

# Bind to 0.0.0.0 to listen on all interfaces
$address = [System.Net.IPAddress]::Any
$server = New-Object System.Net.Sockets.TcpListener($address, $port)

try {
    $server.Start()
    Write-Host "========================================="
    Write-Host "  Blood Pressure Diary Local Server (TCP)"
    Write-Host "  Listening on all interfaces:"
    Write-Host "  - Local:  http://localhost:$port/"
    if ($ip -ne "127.0.0.1") {
        Write-Host "  - Mobile: http://${ip}:${port}/ (Connect phone to same Wi-Fi)"
    }
    Write-Host "  Press Ctrl+C to stop the server"
    Write-Host "========================================="

    while ($server.Active -or $true) {
        if (!$server.Pending()) {
            Start-Sleep -Milliseconds 100
            continue
        }

        $client = $server.AcceptTcpClient()
        $stream = $client.GetStream()
        
        # Read HTTP Request
        $buffer = New-Object System.Byte[] 4096
        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
        if ($bytesRead -eq 0) {
            $client.Close()
            continue
        }
        
        $requestString = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $bytesRead)
        
        # Simple HTTP GET routing
        if ($requestString -match "GET\s+(/[^\s\?]*)\s+HTTP") {
            $path = $Matches[1]
            if ($path -eq "/") {
                $path = "/index.html"
            }
            
            # Prevent path traversal
            $sanitizedPath = $path.Replace("../", "").Replace("..\", "")
            $filePath = Join-Path $baseDir $sanitizedPath.Substring(1)
            
            if (Test-Path $filePath -PathType Leaf) {
                $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                
                # MIME Types
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = "text/plain"
                switch ($ext) {
                    ".html" { $contentType = "text/html; charset=utf-8" }
                    ".css"  { $contentType = "text/css; charset=utf-8" }
                    ".js"   { $contentType = "application/javascript; charset=utf-8" }
                    ".png"  { $contentType = "image/png" }
                    ".json" { $contentType = "application/json; charset=utf-8" }
                    ".csv"  { $contentType = "text/csv; charset=utf-8" }
                }
                
                # Send HTTP Response
                $header = "HTTP/1.1 200 OK`r`n" +
                          "Content-Type: $contentType`r`n" +
                          "Content-Length: $($fileBytes.Length)`r`n" +
                          "Connection: close`r`n" +
                          "Cache-Control: no-cache`r`n" +
                          "Access-Control-Allow-Origin: *`r`n`r`n"
                
                $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($fileBytes, 0, $fileBytes.Length)
            } else {
                # 404
                $errHeader = "HTTP/1.1 404 Not Found`r`n" +
                             "Content-Type: text/plain; charset=utf-8`r`n" +
                             "Connection: close`r`n`r`n"
                $errBody = "404 Not Found"
                
                $errHeaderBytes = [System.Text.Encoding]::UTF8.GetBytes($errHeader)
                $errBodyBytes = [System.Text.Encoding]::UTF8.GetBytes($errBody)
                
                $stream.Write($errHeaderBytes, 0, $errHeaderBytes.Length)
                $stream.Write($errBodyBytes, 0, $errBodyBytes.Length)
            }
        }
        
        $stream.Close()
        $client.Close()
    }
} catch {
    Write-Error $_
} finally {
    $server.Stop()
}
