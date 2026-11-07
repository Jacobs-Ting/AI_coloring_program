# 魔法塗色屋 · Magic Coloring House

純 HTML / CSS / Vanilla JavaScript、無前端依賴的塗色遊戲，AI 生成另附可選本機代理。附 12 張本專案原創 SVG。內建模式沒有外部字型、圖片請求或付費服務；AI 模式使用伺服器端 API Key 與 OpenAI 付費圖片服務。

## 開啟與部署

一般使用者只需開啟部署後的網址，不必安裝任何軟體。也可以直接雙擊 `index.html` 開啟並塗色、下載圖片；直接開啟檔案時，IndexedDB 是否可用取決於瀏覽器設定，若無法儲存會顯示提示。建議正式使用部署後的 HTTP/HTTPS 網址，讓作品可靠地保留於固定網站來源。開發者亦可執行 `python3 -m http.server 8080`，開啟 http://localhost:8080 。

- GitHub Pages：將整個專案推送至 repository，Settings → Pages → Deploy from a branch → main / root。使用相對路徑，支援專案子網址。
- Netlify：拖曳整個資料夾到 Netlify 的手動部署區；不需要 build command，發布目錄為專案根目錄。
- 建議使用最新的 Safari、Chrome、Edge 或 Firefox。IndexedDB 必須可用。

## 使用方式

挑選顏色、調整 5–60 px 畫筆，在畫紙上自由塗色。橡皮擦只清除繪圖層。驚喜生成會避免與目前圖案重複；切換作品或離開頁面時，瀏覽器會提示尚未儲存的修改。手機點「你的魔法工具」展開工具列。

「儲存進度」存到目前瀏覽器的 IndexedDB；重新整理後點「我的畫廊」→「繼續塗色」恢復。再次儲存會更新同一作品。下載 PNG 不等同儲存可編輯進度。清除網站資料、無痕模式結束或更換網址／瀏覽器，可能失去本機作品，重要作品請另行下載。畫廊提供永久刪除功能。

## 啟動相容性

實際入口為 `js/standalone.js`，它將獨立模組及 12 張 SVG 包成一般 script，不依賴 file:// 不支援的 ES module 載入，也不需另外抓取圖檔。交付檔已產生完成，使用與部署不需建置。修改 `js/` 原始模組或 SVG 後，維護者執行 `python3 scripts/build-standalone.py` 更新入口。

## 架構

- `js/brush.js`：Pointer Events、pointer capture、coalesced samples、座標轉換與筆畫生命週期。pointercancel 保留當下筆畫。
- `js/canvas.js`：圓角二次曲線插值、繪圖層重播、PNG 合成與 toBlob。
- `js/history.js`：向量命令、每筆畫一次歷史、50 步復原／重做。較早筆畫保留為不可復原的基底命令，不儲存整張快照；clear 越過復原窗口後回收舊基底。每作品最多 180,000 採樣點，達上限會提示下載及換圖。
- `js/storage.js`：IndexedDB transaction complete 才視為儲存成功；錯誤會顯示提示。
- `js/lineart.js`：素材清單、非重複隨機 provider 與載入錯誤處理。
- `js/app.js`：工具、畫廊、修改狀態與儲存競態控制。
- `assets/lineart/`：12 張原創透明背景 SVG；黑線維持在上層、CSS 白底在下層。

畫布 backing store 與匯出固定 1000 × 1000，不使用 CSS 尺寸當作像素座標；以 boundingClientRect 將各種螢幕、縮放及 DPR 的 pointer 座標換算至固定邏輯畫紙。高 DPI 不會令筆畫偏移或輸出尺寸改變。極高 DPI／放大顯示仍受 1000 px 原始解析度限制。歷史使用固定寬度筆刷，不包含 Pencil 壓力變化。大量筆畫重播可能在低階裝置變慢。

## 未來 AI 擴充介面

將 `LocalLineartProvider` 替換為實作 `async generate({excludeId, signal}) => {id, title, url}` 的 provider。保留素材 id 的穩定性，讓畫廊可在重新整理後找到相同線稿；若新增動態素材，需另外將 SVG／圖像 Blob 存入 IndexedDB 並擴充資料庫版本。遠端圖像必須可由同源或正確 CORS 方式載入，否則 Canvas 匯出會遭瀏覽器阻擋。

若服務需要金鑰，應透過未來自行架設的安全代理呼叫，禁止把金鑰寫進前端。驗證及清理 AI 產生的 SVG（移除 scripts、外部資源及事件屬性），再載入；本版已新增可選的 OpenAI 本機代理串接，設定方式見下方。

## 驗證

執行 `node tests/history.test.mjs`。完整人工驗收項目與目前執行狀態見 TESTING.md。

## OpenAI AI 隨機線稿（新增）

已依 [OpenAI Images API 官方文件](https://developers.openai.com/api/reference/resources/images/methods/generate) 實作 `POST /v1/images/generations`。預設使用 `gpt-image-2.5-sunburst`、1024 × 1024、low quality、一次一張 PNG。主題由伺服器隨機挑選，包括動物、森林、花卉與甜點；圖片經瀏覽器轉成黑線透明底，再供自由塗色。實際圖案品質由生成結果決定，可能有不適合塗色的細節或黑色填塊。

AI 使用你的 OpenAI API 額度並可能收費。取消等待或網路逾時不代表上游請求未計費。本程式不會自動重試付費請求。

### Mac 雙擊啟動（建議）

先安裝 Node.js 22 或更新版本，之後只需雙擊專案資料夾內的 **啟動魔法塗色屋.command**。啟動檔會自動啟動本機服務並開啟瀏覽器，不必輸入指令。網頁開啟後，再輸入本次使用的 API Key。使用期間保留終端機視窗，按 Control+C 停止服務。

若服務已啟動，再次雙擊只會開啟現有網站。直接雙擊 index.html 仍可使用內建塗色；瀏覽器安全限制不允許 HTML 自行執行 Node.js，因此 AI 功能請使用上述啟動檔。

### 手動本機設定（Node.js 22 或更新版本）

1. 在專案目錄執行 `node server.mjs`，不需要建立 `.env` 或在檔案中填寫金鑰。
2. 開啟 http://localhost:8080 ，點「API Key 設定」。
3. 在密碼輸入欄貼上自己的 OpenAI API Key，點「本次使用」。
4. 點「AI 生成線稿」開始。若尚未輸入金鑰，會先開啟設定視窗。

金鑰僅放在目前分頁記憶體，不寫入 localStorage、sessionStorage、IndexedDB、Cookie 或檔案。視窗關閉後輸入欄會清空，不回填已輸入的金鑰。重新整理、離開分頁或關閉分頁後必須重新輸入；「清除金鑰」可立即移除分頁中的金鑰並停止等待生成。已送到 OpenAI 的請求仍可能完成及計費。瀏覽器或密碼管理工具本身的行為不屬於程式持久化儲存；欄位已設定 autocomplete=off。

生成時透過請求 header 將 Key 送至同源本機代理，再透過 HTTPS 傳給 OpenAI；代理不記錄、不回傳、也不跨請求保存使用者的 Key。不要把金鑰貼在聊天中。`server.mjs` 沒有第三方依賴，僅監聽 127.0.0.1；採用 Host/Origin 檢查、單一進行中請求、10 秒間隔及每天最多 20 次請求（UTC 日界線，重新啟動會重設）。這是本機防誤觸限制，不是帳務硬上限。舊版 `.env` 的 OPENAI_API_KEY 已不再由伺服器讀取。

「AI 生成線稿」可取消等待；失敗時保留目前作品。等待時若有新增筆畫，換圖前會再次提示。生成線稿本身也視為未儲存內容；按「儲存進度」會把 AI 圖像連同筆畫、縮圖一起存入 IndexedDB，重新整理後由畫廊繼續編輯，無需再次呼叫 OpenAI。

### 部署限制

純靜態 GitHub Pages／Netlify 靜態部署仍支援內建線稿，但不會執行 `server.mjs`，因此 AI 按鈕會顯示服務未設定提示。這個代理只供本機使用，不可直接暴露至公網。若要公開供多人生成，需另行部署具有登入、每人配額、持久化限流及伺服器環境變數的 API 或 Netlify Function；不能將 API Key 放入靜態網站。

### AI 驗證

`node tests/ai.test.mjs` 使用模擬 OpenAI 回應測試成功、未設 Key、權限錯誤、異常回應、網路失敗、同源限制、環境檔保護與請求節流；不會產生費用。修改原始碼後請重新執行 `python3 scripts/build-standalone.py`。

目前尚未提供真實 API Key，因此未進行付費的端到端生成測試。

## 背景音樂

右上角「開啟音樂」播放使用者提供的 Graphite and Tea，預設音量 35%，循環播放；再次點擊可暫停。需主動點擊後播放，不自動播放或記憶播放狀態。直接開啟 HTML、本機代理與靜態部署皆使用相對路徑。部署時請一起上傳 `assets/audio/Graphite_and_Tea.mp3`（約 4 MB）。
