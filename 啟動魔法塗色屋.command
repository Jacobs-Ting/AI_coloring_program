#!/bin/zsh
unsetopt BG_NICE
# Double-click in Finder. No keys or credentials are read or saved here.
cd -- "${0:A:h}" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  print '找不到 Node.js。請先從 https://nodejs.org 安裝 Node.js 22 或更新版本，再雙擊本檔。'
  read '?按 Enter 關閉…'
  exit 1
fi
if ! node -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)'; then
  print '請先更新至 Node.js 22 或更新版本。'
  read '?按 Enter 關閉…'
  exit 1
fi
# Reuse only an identified instance of this app; never terminate unrelated services.
if curl --silent --max-time 2 http://localhost:8080/api/health | /usr/bin/grep -q 'magic-coloring-house'; then
  open 'http://localhost:8080/'
  print '塗色屋已在執行，已開啟網頁。'
  exit 0
fi
print '正在啟動魔法塗色屋…'
PORT=8080 node server.mjs &
magic_server_pid=$!
trap 'kill "$magic_server_pid" 2>/dev/null' EXIT
trap 'exit 0' INT TERM HUP
for magic_attempt in {1..40}; do
  if ! kill -0 "$magic_server_pid" 2>/dev/null; then
    print '啟動失敗，8080 連接埠可能已被其他程式使用。請先關閉原本的服務再重試。'
    read '?按 Enter 關閉…'
    exit 1
  fi
  if curl --silent --max-time 1 http://localhost:8080/api/health | /usr/bin/grep -q 'magic-coloring-house'; then
    open 'http://localhost:8080/'
    print '已開啟塗色屋！在網頁輸入 API Key 即可使用 AI。'
    print '使用期間請保留此視窗。按 Control+C 可停止服務。'
    wait "$magic_server_pid"
    exit $?
  fi
  sleep 0.25
done
print '服務未能及時啟動，請查看上方訊息。'
read '?按 Enter 關閉…'
exit 1
