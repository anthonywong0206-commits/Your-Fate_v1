# AI 角色扮演互動故事網站

這是一個使用 React + Vite 製作的 AI 互動故事網站。用戶可以選擇劇目主題、輸入角色名稱，然後進入由 AI 或本地 Demo 劇本生成的二選一分支故事。

## 功能

- 多個劇目主題
- 自訂角色名稱
- AI 生成故事簡介
- AI 生成每回合二選一選項
- 分支劇情與分數系統
- 不同結局
- LocalStorage 暫存進度
- AI 失敗或沒有 API Key 時自動使用本地 Demo 劇本
- 手機及電腦友善 UI

## 安裝

```bash
npm install
npm run dev
```

## 建立正式版本

```bash
npm run build
npm run preview
```

## 環境變數

請複製 `.env.example` 成 `.env`：

```bash
cp .env.example .env
```

然後填入：

```env
VITE_OPENAI_API_KEY=你的_OpenAI_API_Key
VITE_OPENAI_MODEL=gpt-4o-mini
```

注意：純前端網站的 `VITE_` 變數會被打包到前端，因此正式公開網站不建議直接把真實 API Key 放在前端。正式版建議改用 Vercel Serverless Function 或自建後端代理 API。

## Vercel 部署說明

1. 把專案上載到 GitHub。
2. 登入 Vercel。
3. 選擇 `Add New Project`。
4. 匯入你的 GitHub repository。
5. Framework Preset 選擇 `Vite`。
6. Build Command 使用：

```bash
npm run build
```

7. Output Directory 使用：

```bash
dist
```

8. 如要使用 AI，在 Vercel 的 Project Settings > Environment Variables 加入：

```env
VITE_OPENAI_API_KEY=你的_OpenAI_API_Key
VITE_OPENAI_MODEL=gpt-4o-mini
```

9. 按 Deploy。

## GitHub Pages 部署說明

### 方法一：使用 gh-pages

先確認 `package.json` 內有：

```json
"deploy": "gh-pages -d dist"
```

然後執行：

```bash
npm run build
npm run deploy
```

完成後，到 GitHub repository：

Settings > Pages > Branch 選擇 `gh-pages`。

### 方法二：GitHub Actions

你亦可以自行新增 GitHub Actions，把 `dist` 自動部署到 Pages。

## 重要提醒

如果網站只是 Demo 或內部測試，可以直接使用 `.env` 的 API Key。若網站會公開給其他人使用，請不要把 API Key 放在前端，應改用後端代理方式處理 AI API。
