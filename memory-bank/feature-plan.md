# 衝突教練：功能計畫與待辦

最後更新：2026-10-10
分支：`feature/conflict-coach`（fork 自 `tntpsu/Cue`）

## 目標

在 Even G2 眼鏡上做一個即時衝突教練，給自己用。對話進行時，鏡片顯示「下一步該做的動作」加上「一句可以說出口的話」，內容依據《解決衝突的關鍵技巧》（Dana Caspersen，17 條原則）。

不是目標：上架商店、給別人用、支援 Cue 原本的其他六個模式。

## 目前的運作方式

```
G2 麥克風 ──► Even app ──► Cue (WebView)
                              │ 每 2.5 秒切一段
                              ├─► Deepgram：轉文字
                              │   眼鏡的 speakerRole：這段是 ME 還是 THEM
                              │
                              ├─► 對方說了新的話才觸發（最少間隔 5 秒）
                              │   Claude Haiku + prompts/conflict-coach.txt
                              │
                              └─► 鏡片：動作（繁中）+ 一句話（繁中）+ 一行逐字稿
```

鏡片畫面：

```
◆ CUSTOM  ● LIVE
複述對方立場
「你是說我沒先告訴你就改了排程，是這樣嗎？」
————————————————————
[them] …without telling me first.
```

## 已驗證（真機實測）

| 項目 | 結果 | 依據 |
|---|---|---|
| 語音轉文字（英文） | 可用，中位數約 220 毫秒 | 多場，數百次請求 |
| LLM 回應時間 | 中位數 1.0 秒，0.5–1.3 秒 | 10/10 最後一場，20 次 |
| 眼鏡的說話者標記 | 分得開：對方說話時 self 佔 0–12%，自己說話時多為 80% 以上 | 10/10，對方是手機喇叭 |
| 繁體中文顯示 | 可顯示，6 行放得下 | 10/10 最後一場 |
| 在自編劇本上跟得上對話 | 可以 | 報稅劇本第 3 次 |
| 中文語音辨識（nova-3 繁中） | 可用，中位數約 170 毫秒，LLM 約 1.0 秒；輸出沒有標點 | 10/10 模擬器三場 |
| 模擬器沒有說話者標記 | 全部回報 `unknown` | 10/10 模擬器實測 |

## 尚未驗證（不要當成事實）

- **在沒準備過的衝突裡有沒有用。** 目前的好結果來自同一人寫的劇本和 prompt、配合的 ChatGPT 對手、重複練習過的情境。
- **讀提示會不會讓人漏聽對方。** 這是最初的核心疑慮，還沒有答案。
- **對方是真人時，說話者標記準不準。** 門檻 0.3 只根據一場、對方是手機喇叭。
- **端到端延遲**（對方說完到提示出現）。只量過 LLM 那一段。
- **中英夾雜的辨識。** 英文句子在中文模式下會變成亂碼（`let's try this one` → `let'trietisone`），夾雜單字的表現未知。

## 已做的決定

| 決定 | 原因 |
|---|---|
| 留在 Custom 模式，不放進 Argue calm | 內建模式會套上三句編號格式和「不准重複」指令，跟設計相反 |
| prompt 放 `prompts/conflict-coach.txt` 並進版控 | 它是產品本體，原本放在被忽略的檔案裡 |
| 提示只在對方說話後更新 | 自己說話時出提示會讓模型編造動作 |
| 動作名稱和句子都用繁中 | 使用者母語，中翻英很快 |
| 用眼鏡的 speakerRole，不用 Deepgram 分說話者 | Deepgram 每段獨立編號，跨段無法認人 |
| 整場對話改用中文：Deepgram `nova-3` + `zh-TW`，設定在 `.env` | 使用者母語。10/10 決定，nova-3 自 2026-03 起支援繁中 |
| 分支名不帶 Jira 單號 | 個人專案，使用者確認無單號 |

## 待辦

### 一、驗證產品是否成立（最優先）

- [ ] **盲測**：讓 ChatGPT 自己出題，雙方都不知道劇本（提示詞見下方）
- [ ] 回答三個體驗問題：照著句子說還是只看動作？讀提示時有沒有漏聽？提示來得及用嗎？
- [ ] 對照組：同一情境改成「事前練習」和「事後覆盤」，不給即時提示。若拿到八成效果，產品就不該是即時 HUD
- [ ] 找真人當對手測一場，確認說話者標記門檻
- [ ] 量端到端延遲

### 二、開發流程

- [x] 桌面模擬器可用（`evenhub-simulator` 0.9.5）
- [x] 開發用說話者切換：模擬器的 Up = ME、Down = THEM，鎖定式。試過「按住 Up = ME、放開自動回 THEM」，但計時器的延遲會讓換手後的頭幾個字標錯，10/10 使用者決定改回兩鍵手動切換
- [x] 模擬器的麥克風和轉文字可用（10/10 實測）
- [ ] 備用方式未確認：按住右 Option 鍵或頁面按鈕 = ME。空白鍵會觸發模擬器的點擊，已棄用；10/10 使用者實測按鍵無效，原因未查明（可能是鍵盤焦點）
- [ ] 在模擬器上用說話者切換跑完整一場

### 三、已知問題

- [ ] 句子常超過 24 字上限（最長 38 字）
- [ ] 對方含糊收尾時（「我們以後小心點」），沒有明確點出太含糊
- [ ] 偶爾過早跳到「核實共識細節」
- [ ] Haiku 有時不遵守「做過了就別再提」。評估換較強模型，代價是延遲
- [ ] 逐字稿出現辱罵字眼時 LLM 曾拒答（在 Argue calm 模式發生一次，Custom 模式未重測）
- [ ] 中文逐字稿沒有標點：句尾觸發失效（只能靠停頓和計時），LLM 也曾因此誤解情境（把「公司…吃飯」讀成公司聚餐）。待查是參數問題還是模型限制
- [ ] 每 2.5 秒一段只能歸給一個人，換手瞬間的字會黏到前一個人身上
- [x] 重開麥克風後畫面殘留上一輪最後一句（已修，10/10 實測確認）
- [ ] `transcribe network error` 出現過一次，自動恢復，原因不明
- [ ] 中途重來要手動關開麥克風才會清空上下文

### 四、待使用者決定

- [ ] 要不要關掉雙擊切換模式，鎖定在 Custom（誤觸過多次）
- [ ] 要不要把介面固定文字（`LIVE`、`mic off`）也翻成中文

### 五、之後再說

- [ ] 升級成獨立的「衝突教練」模式，把格式、去重、`-` 的行為改成模式屬性。脫離 Mac 使用前要做
- [ ] 打包成 `.ehpk` 上傳私人版本，不靠開發伺服器
- [ ] 只分析自己說的話（偵測「總是」「從不」「你就是」）這個方向，尚未探索
- [ ] 隱私：錄下對方的聲音送到雲端，對方不知情。真實使用前要想清楚
- [ ] 近視鏡片：寫信給 support@evenrealities.com 詢問事後更換的價格與流程

## 怎麼跑

```bash
cd /Users/yen/fork_repo/Cue
source ~/.nvm/nvm.sh && nvm use 24.11.1   # 預設的 Node 18 跑不動

npm run dev                                # 開發伺服器，port 5176
npx evenhub qr --url "http://<Mac 區網 IP>:5176"      # 真機：用 Even app 掃
npx evenhub-simulator --glow --automation-port 9898 http://localhost:5176   # 模擬器
npm run test:all                           # 測試 + manifest 檢查
```

- API key 放 `.env.development.local`（不進 git），載入時自動帶入手機。
- 改 `prompts/conflict-coach.txt` 後手機和模擬器會自動重載。
- 每一場的紀錄在 `dev-log.local`（不進 git，內含對話逐字稿）。
- 開麥克風前確認標題是 `◆ CUSTOM`。

## 盲測用的對手提示詞

```
Play someone who is in a real conflict with me. Invent the situation
yourself and do not tell me what it is in advance: pick who you are to
me, what I did, and what you actually need underneath. Decide privately
what would and would not calm you down, and do not reveal it.
Start mid-argument. Speak 1-2 sentences at a time. React like a real
person: if I say something clumsy or formulaic, get more annoyed.
Do not make peace just because I am polite. Stay in character.
```
