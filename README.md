# AI 角色扮演互動故事網站

沉浸式暗黑故事書風格 React + Vite 網站。首頁選擇劇目及角色名稱，之後進入故事簡介、二選一分支回合、數值變化及結局回顧。

## 主要功能

- 多劇目主題：末日生存、校園懸疑、魔法學院、偵探查案、古代宮廷、社工個案情境、自訂主題
- AI 生成故事簡介、每回合二選一、結局
- 無 API Key 時自動使用本地 Demo 劇本
- 數值系統：勇氣、智慧、信任、道德、風險
- LocalStorage 自動保存進度
- 手機及電腦自適應介面
- 支援 Vercel API 代理，避免 API Key 暴露在前端

## 本地測試

```bash
npm install
npm run dev
```

## Vercel 部署 AI API

1. 上傳專案到 GitHub
2. 到 Vercel 匯入 GitHub Repo
3. 到 Project Settings > Environment Variables 新增：

```env
OPENAI_API_KEY=你的 OpenAI API Key
```

4. Deploy

前端會呼叫：

```txt
/api/generate
```

此 API 位於：

```txt
api/generate.js
```

API Key 只會在 Vercel Serverless Function 內使用，不會打包到前端。

## GitHub Pages 部署

GitHub Pages 只支援靜態網站，因此不能安全保存 API Key。部署到 GitHub Pages 時，網站仍可使用本地 Demo 劇本，但不建議在 Pages 上使用真實 API Key。

如仍需部署：

```bash
npm run build
npm run deploy
```

## 更新介面檔案

今次主要更新：

```txt
src/App.jsx
src/App.css
api/generate.js
.env.example
README.md
```

如你已有舊版專案，可直接覆蓋以上檔案。
