import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'ai_roleplay_story_save_v2'
const MAX_ROUNDS = 6

const THEMES = [
  { name: '末日生存', icon: '☢', tone: '廢墟、資源、倖存者' },
  { name: '校園懸疑', icon: '✦', tone: '舊校舍、匿名訊息、禁忌校刊' },
  { name: '魔法學院', icon: '✧', tone: '魔法、禁書、結界崩裂' },
  { name: '偵探查案', icon: '⌕', tone: '雨夜、密室、半真半假證供' },
  { name: '古代宮廷', icon: '♛', tone: '權謀、密詔、朝堂暗湧' },
  { name: '社工個案情境', icon: '◈', tone: '危機評估、信任建立、專業判斷' },
  { name: '自訂主題', icon: '+', tone: '由你建立全新劇本世界' },
]

const initialStats = {
  courage: 0,
  wisdom: 0,
  trust: 0,
  morality: 0,
  risk: 0,
}

const statMeta = {
  courage: { label: '勇氣', icon: '⚔' },
  wisdom: { label: '智慧', icon: '✦' },
  trust: { label: '信任', icon: '♢' },
  morality: { label: '道德', icon: '⚖' },
  risk: { label: '風險', icon: '☽' },
}

const fallbackIntros = {
  末日生存: {
    background: '全球通訊中斷後，城市變成了寂靜的廢墟。倖存者在資源、信任與恐懼之間掙扎。',
    role: '你是一名帶領小隊尋找安全據點的倖存者。',
    goal: '在有限物資下，保護同伴並找到穩定避難所。',
    crisis: '附近出現陌生武裝隊伍，同時水源即將耗盡。',
    rules: '每次選擇會影響勇氣、智慧、信任、道德與風險。第 6 回合後會產生結局。',
  },
  校園懸疑: {
    background: '一所歷史悠久的學校接連發生怪事，舊校刊中似乎藏着真相。',
    role: '你是一名被捲入事件的學生調查者。',
    goal: '找出事件源頭，同時保護身邊朋友。',
    crisis: '每當你接近真相，就會有人收到匿名警告。',
    rules: '每個決定都會改變線索、人際信任與危險程度。',
  },
  魔法學院: {
    background: '古老學院的結界突然破裂，禁書庫傳出不屬於人類的低語。',
    role: '你是一名擁有特殊魔法天賦的新生。',
    goal: '修復結界，查明禁忌魔法復甦的原因。',
    crisis: '老師之中可能有人暗中協助黑暗力量。',
    rules: '選擇會影響魔法判斷、同伴信任與混亂風險。',
  },
  偵探查案: {
    background: '雨夜中，一宗密室案件令全城震驚。所有證人都說了一半真話。',
    role: '你是一名受委託查案的年輕偵探。',
    goal: '在警方結案前找出真正兇手。',
    crisis: '關鍵證物突然失蹤，而委託人也隱瞞了重要線索。',
    rules: '你的推理、冒險與道德選擇會改變案件走向。',
  },
  古代宮廷: {
    background: '皇城表面歌舞昇平，內裡卻暗潮洶湧。太子失勢，權臣逼宮。',
    role: '你是一名初入宮廷卻掌握秘密情報的人。',
    goal: '在權力鬥爭中生存，並決定國家的未來。',
    crisis: '你手上的證據足以改變皇位繼承，但公開它可能引來殺身之禍。',
    rules: '每次選擇都會影響信任、道德、智慧與風險。',
  },
  社工個案情境: {
    background: '社區中一個家庭正面對照顧壓力、經濟困難與情緒困擾。',
    role: '你是一名前線社工，需要在有限資源中作出專業判斷。',
    goal: '評估風險、建立信任，並協助服務使用者連結合適支援。',
    crisis: '家庭成員對服務存有戒心，而危機可能正在升級。',
    rules: '選擇會影響信任、道德、智慧及風險。故事只作訓練及反思用途。',
  },
}

function getFallbackIntro(theme, playerName, customTheme) {
  const selectedTheme = theme === '自訂主題' ? customTheme || '神秘冒險' : theme
  const intro = fallbackIntros[selectedTheme] || {
    background: `霧氣覆蓋了「${selectedTheme}」的世界，熟悉的秩序正在崩解。`,
    role: `${playerName} 是故事中的關鍵角色，必須在壓力下作出選擇。`,
    goal: '理解局勢、作出判斷，並帶領故事走向不同結局。',
    crisis: '每個決定都可能帶來意想不到的後果。',
    rules: '每回合從兩個選項中選擇一個，最終根據選擇產生結局。',
  }
  return { ...intro, role: intro.role.replace('你', playerName || '你') }
}

function fallbackScene({ theme, customTheme, playerName, round, stats }) {
  const selectedTheme = theme === '自訂主題' ? customTheme || '神秘冒險' : theme
  const templates = [
    {
      scene: `${playerName} 踏入「${selectedTheme}」的核心地帶。遠方傳來不明鐘聲，一名陌生人交出一張沾有灰燼的地圖，聲稱知道下一步該往哪裡走。`,
      choiceA: { text: '接受地圖，邀請對方同行', effects: { courage: 0, wisdom: 0, trust: 2, morality: 1, risk: 1 } },
      choiceB: { text: '收下線索，但保持距離觀察', effects: { courage: 0, wisdom: 2, trust: -1, morality: 0, risk: 0 } },
    },
    {
      scene: `隊伍內部開始出現分歧。有人主張立即行動，有人認為這是一個陷阱。${playerName} 必須在眾人失控前作出決定。`,
      choiceA: { text: '公開所有資訊，讓大家共同決定', effects: { courage: 1, wisdom: 0, trust: 2, morality: 2, risk: 1 } },
      choiceB: { text: '先隱瞞部分情報，避免引起恐慌', effects: { courage: 0, wisdom: 2, trust: -1, morality: -1, risk: 0 } },
    },
    {
      scene: `一道機會在夜色中浮現：成功的話可接近真相，失敗則可能令所有努力歸零。火光照亮 ${playerName} 的臉，選擇只剩下一瞬間。`,
      choiceA: { text: '立即行動，把握機會', effects: { courage: 2, wisdom: 0, trust: 0, morality: 0, risk: 2 } },
      choiceB: { text: '先收集更多資料再行動', effects: { courage: -1, wisdom: 2, trust: 0, morality: 1, risk: -1 } },
    },
    {
      scene: `${playerName} 發現一名重要角色正隱藏痛苦的真相。揭開它可能有助任務，但也可能傷害對方最後一點信任。`,
      choiceA: { text: '溫和追問，先理解對方處境', effects: { courage: 0, wisdom: 1, trust: 2, morality: 2, risk: 0 } },
      choiceB: { text: '直接指出疑點，迫對方交代', effects: { courage: 2, wisdom: 1, trust: -2, morality: -1, risk: 1 } },
    },
    {
      scene: `真相逐漸明朗，但代價也浮現。${playerName} 必須在個人安全與整體利益之間取捨。`,
      choiceA: { text: '冒險保護他人', effects: { courage: 2, wisdom: 0, trust: 2, morality: 2, risk: 2 } },
      choiceB: { text: '選擇保守方案，降低損失', effects: { courage: -1, wisdom: 2, trust: 0, morality: 0, risk: -2 } },
    },
    {
      scene: `最後一道門打開，過去累積的勇氣、智慧、信任與風險全都在此刻回響。${playerName} 已無法回頭。`,
      choiceA: { text: '相信一路建立的關係，合作解決危機', effects: { courage: 1, wisdom: 1, trust: 2, morality: 1, risk: 1 } },
      choiceB: { text: '獨自承擔責任，快速作出最後決斷', effects: { courage: 2, wisdom: 1, trust: -1, morality: 0, risk: 1 } },
    },
  ]
  return { ...templates[(round - 1) % templates.length], round, statsSnapshot: stats }
}

function fallbackEnding({ playerName, theme, customTheme, stats, history }) {
  const selectedTheme = theme === '自訂主題' ? customTheme || '神秘冒險' : theme
  const positiveScore = stats.courage + stats.wisdom + stats.trust + stats.morality - stats.risk
  const review = history.map((item, index) => `回合 ${index + 1}：${item.choiceText}`)

  if (positiveScore >= 8) {
    return {
      title: '希望的曙光',
      summary: `${playerName} 在「${selectedTheme}」的危機中保持清醒與善意，成功把混亂轉化成新的可能。`,
      fate: '主角完成任務，也成為眾人願意信任的核心人物。',
      review,
      reflection: ['你最重視哪一次選擇？', '如果重新開始，你會否作出不同決定？'],
    }
  }

  if (stats.risk >= 6) {
    return {
      title: '燃燒的代價',
      summary: `${playerName} 多次選擇冒險推進，雖然接近真相，但也令局面變得難以控制。`,
      fate: '主角保住了部分成果，但必須承受選擇帶來的代價。',
      review,
      reflection: ['冒險是否值得？', '安全與效率應如何平衡？'],
    }
  }

  return {
    title: '灰色餘波',
    summary: `${playerName} 完成了部分目標，但仍有未解的遺憾。故事沒有完全勝利，也沒有完全失敗。`,
    fate: '主角帶着經驗離開，明白每個選擇都會改變人與人之間的關係。',
    review,
    reflection: ['這個結局反映了你怎樣的價值取向？', '你認為最困難的抉擇是甚麼？'],
  }
}

async function callAI(systemPrompt, userPrompt) {
  const serverApi = import.meta.env.VITE_AI_ENDPOINT || '/api/generate'
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'

  if (serverApi) {
    const response = await fetch(serverApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, prompt: userPrompt, model }),
    })
    if (response.ok) {
      const data = await response.json()
      const text = data.text || data.output || data.content || ''
      return JSON.parse(String(text).replace(/```json|```/g, '').trim())
    }
  }

  if (!apiKey) throw new Error('沒有設定 API Key，已使用本地 Demo 劇本。')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) throw new Error('AI API 回應失敗，已使用本地 Demo 劇本。')
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  return JSON.parse(content.replace(/```json|```/g, '').trim())
}

function App() {
  const [page, setPage] = useState('home')
  const [theme, setTheme] = useState('末日生存')
  const [customTheme, setCustomTheme] = useState('')
  const [playerName, setPlayerName] = useState('阿晴')
  const [intro, setIntro] = useState(null)
  const [currentScene, setCurrentScene] = useState(null)
  const [ending, setEnding] = useState(null)
  const [round, setRound] = useState(1)
  const [stats, setStats] = useState(initialStats)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const selectedTheme = useMemo(() => (theme === '自訂主題' ? customTheme || '自訂冒險' : theme), [theme, customTheme])
  const selectedThemeMeta = useMemo(() => THEMES.find((item) => item.name === theme) || THEMES[0], [theme])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      setPage(parsed.page || 'home')
      setTheme(parsed.theme || '末日生存')
      setCustomTheme(parsed.customTheme || '')
      setPlayerName(parsed.playerName || '阿晴')
      setIntro(parsed.intro || null)
      setCurrentScene(parsed.currentScene || null)
      setEnding(parsed.ending || null)
      setRound(parsed.round || 1)
      setStats(parsed.stats || initialStats)
      setHistory(parsed.history || [])
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ page, theme, customTheme, playerName, intro, currentScene, ending, round, stats, history }))
  }, [page, theme, customTheme, playerName, intro, currentScene, ending, round, stats, history])

  async function generateIntro() {
    setLoading(true)
    setNotice('')
    try {
      const result = await callAI(
        '你是一名繁體中文互動故事遊戲設計師。你必須只輸出 JSON，不要 Markdown。風格要有沉浸感、電影感，但文字要清楚。',
        `請為互動角色扮演故事生成故事簡介。主題：${selectedTheme}。主角名稱：${playerName}。JSON 格式：{"background":"","role":"","goal":"","crisis":"","rules":""}`,
      )
      setIntro(result)
    } catch (error) {
      setIntro(getFallbackIntro(theme, playerName, customTheme))
      setNotice(error.message)
    } finally {
      setLoading(false)
      setPage('intro')
    }
  }

  async function generateScene(nextRound = round, nextStats = stats, nextHistory = history) {
    setLoading(true)
    setNotice('')
    try {
      const result = await callAI(
        '你是一名繁體中文互動故事遊戲主持。你必須只輸出 JSON，不要 Markdown。每回合只提供兩個選項。effects 必須包含 courage, wisdom, trust, morality, risk，數值介乎 -2 至 2。',
        `主題：${selectedTheme}\n主角：${playerName}\n目前回合：${nextRound}/${MAX_ROUNDS}\n目前分數：${JSON.stringify(nextStats)}\n過往選擇：${JSON.stringify(nextHistory)}\n請生成下一回合。JSON 格式：{"scene":"","choiceA":{"text":"","effects":{"courage":0,"wisdom":0,"trust":0,"morality":0,"risk":0}},"choiceB":{"text":"","effects":{"courage":0,"wisdom":0,"trust":0,"morality":0,"risk":0}}}`,
      )
      setCurrentScene(result)
    } catch (error) {
      setCurrentScene(fallbackScene({ theme, customTheme, playerName, round: nextRound, stats: nextStats }))
      setNotice(error.message)
    } finally {
      setLoading(false)
      setPage('story')
    }
  }

  async function generateEnding(finalStats, finalHistory) {
    setLoading(true)
    setNotice('')
    try {
      const result = await callAI(
        '你是一名繁體中文互動故事結局設計師。你必須只輸出 JSON，不要 Markdown。',
        `主題：${selectedTheme}\n主角：${playerName}\n最終分數：${JSON.stringify(finalStats)}\n選擇紀錄：${JSON.stringify(finalHistory)}\n請生成結局。JSON 格式：{"title":"","summary":"","fate":"","review":[""],"reflection":[""]}`,
      )
      setEnding(result)
    } catch (error) {
      setEnding(fallbackEnding({ playerName, theme, customTheme, stats: finalStats, history: finalHistory }))
      setNotice(error.message)
    } finally {
      setLoading(false)
      setPage('ending')
    }
  }

  function startStory() {
    if (!playerName.trim()) return setNotice('請先輸入角色名稱。')
    if (theme === '自訂主題' && !customTheme.trim()) return setNotice('請輸入自訂劇目主題。')
    setRound(1)
    setStats(initialStats)
    setHistory([])
    setEnding(null)
    generateIntro()
  }

  function chooseOption(key) {
    const choice = key === 'A' ? currentScene.choiceA : currentScene.choiceB
    const effects = choice.effects || {}
    const nextStats = Object.fromEntries(
      Object.keys(initialStats).map((stat) => [stat, stats[stat] + Number(effects[stat] || 0)]),
    )
    const nextHistory = [...history, { round, scene: currentScene.scene, choiceKey: key, choiceText: choice.text, effects }]
    setStats(nextStats)
    setHistory(nextHistory)

    if (round >= MAX_ROUNDS) generateEnding(nextStats, nextHistory)
    else {
      const nextRound = round + 1
      setRound(nextRound)
      generateScene(nextRound, nextStats, nextHistory)
    }
  }

  function resetGame() {
    localStorage.removeItem(STORAGE_KEY)
    setPage('home')
    setTheme('末日生存')
    setCustomTheme('')
    setPlayerName('阿晴')
    setIntro(null)
    setCurrentScene(null)
    setEnding(null)
    setRound(1)
    setStats(initialStats)
    setHistory([])
    setNotice('')
  }

  return (
    <main className="world-shell">
      <div className="mist mist-one" />
      <div className="mist mist-two" />
      <nav className="game-nav">
        <div>
          <span className="brand-mark">✥</span>
          <strong>AI Roleplay Story</strong>
        </div>
        <div className="nav-badges">
          <span>分支劇情</span><span>數值系統</span><span>AI 生成</span>
        </div>
      </nav>

      <section className="game-frame">
        <aside className="left-lore">
          <p className="eyebrow">沉浸式互動故事</p>
          <h1>你的故事，<br />由你決定</h1>
          <p className="lead">每個選擇都會改變命運。你會成為英雄、倖存者、調查者，還是那個改寫結局的人？</p>
          <div className="chapter-line"><span />第 {page === 'home' ? 0 : round} 章<span /></div>
        </aside>

        <section className="main-stage">
          {notice && <div className="notice">{notice}</div>}
          {loading && <div className="loading"><span className="spinner" />AI 正在編寫下一頁命運……</div>}

          {page === 'home' && (
            <div className="screen home-screen">
              <div className="screen-heading">
                <p>1. 首頁 / 選擇劇目</p>
                <h2>選擇你的劇本世界</h2>
              </div>

              <div className="theme-grid">
                {THEMES.map((item) => (
                  <button
                    key={item.name}
                    className={`theme-card ${theme === item.name ? 'active' : ''}`}
                    onClick={() => setTheme(item.name)}
                  >
                    <span className="theme-icon">{item.icon}</span>
                    <strong>{item.name}</strong>
                    <small>{item.tone}</small>
                  </button>
                ))}
              </div>

              <div className="input-scroll">
                {theme === '自訂主題' && (
                  <label>
                    自訂劇目主題
                    <input value={customTheme} onChange={(event) => setCustomTheme(event.target.value)} placeholder="例如：時間旅行、職場危機、奇幻王國" />
                  </label>
                )}
                <label>
                  你的名字
                  <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="輸入你的角色名稱" />
                </label>
                <button className="primary-btn" onClick={startStory} disabled={loading}>開始故事</button>
              </div>
            </div>
          )}

          {page === 'intro' && intro && (
            <div className="screen intro-screen">
              <StoryBook title={`${selectedTheme}｜故事簡介`} items={[
                ['故事背景', intro.background],
                ['主角身份', intro.role],
                ['任務目標', intro.goal],
                ['主要危機', intro.crisis],
                ['遊戲規則', intro.rules],
              ]} />
              <div className="action-row">
                <button className="primary-btn" onClick={() => generateScene(1, stats, history)} disabled={loading}>進入故事</button>
                <button className="ghost-btn" onClick={resetGame}>重新開始</button>
              </div>
            </div>
          )}

          {page === 'story' && currentScene && (
            <div className="screen story-screen">
              <div className="screen-heading compact">
                <p>3. 故事進行中</p>
                <h2>{selectedTheme}</h2>
                <span className="round-pill">回合 {round} / {MAX_ROUNDS}</span>
              </div>
              <div className="scene-card">
                <p>{currentScene.scene}</p>
              </div>
              <div className="choice-grid">
                <button className="choice-card choice-a" onClick={() => chooseOption('A')} disabled={loading}>
                  <span>A</span><strong>{currentScene.choiceA?.text}</strong>
                </button>
                <div className="or-mark">或</div>
                <button className="choice-card choice-b" onClick={() => chooseOption('B')} disabled={loading}>
                  <span>B</span><strong>{currentScene.choiceB?.text}</strong>
                </button>
              </div>
              <StatsPanel stats={stats} />
            </div>
          )}

          {page === 'ending' && ending && (
            <div className="screen ending-screen">
              <div className="ending-hero">
                <p>4. 結局頁面</p>
                <h2>{ending.title}</h2>
                <span>你的故事結束了</span>
              </div>
              <div className="ending-grid">
                <InfoCard title="故事總結" text={ending.summary} />
                <InfoCard title="主角命運" text={ending.fate} />
                <div className="info-card wide"><h3>關鍵選擇回顧</h3><ul>{(ending.review || []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
                <div className="info-card wide"><h3>反思問題</h3><ul>{(ending.reflection || []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
              </div>
              <StatsPanel stats={stats} />
              <div className="action-row"><button className="primary-btn" onClick={resetGame}>重新開始</button></div>
            </div>
          )}
        </section>

        <aside className="right-panel">
          <div className="status-card">
            <small>目前劇目</small>
            <strong>{selectedTheme}</strong>
            <p>{selectedThemeMeta.tone}</p>
          </div>
          <StatsPanel stats={stats} compact />
          <div className="mini-log">
            <h3>選擇紀錄</h3>
            {history.length === 0 ? <p>故事尚未開始。</p> : history.slice(-4).map((item) => <p key={item.round}>#{item.round} {item.choiceKey}｜{item.choiceText}</p>)}
          </div>
        </aside>
      </section>
    </main>
  )
}

function StoryBook({ title, items }) {
  return (
    <div className="storybook">
      <div className="book-tabs">{items.map(([title]) => <span key={title}>{title}</span>)}</div>
      <div className="paper">
        <h2>{title}</h2>
        {items.map(([heading, text]) => <InfoCard key={heading} title={heading} text={text} plain />)}
      </div>
    </div>
  )
}

function InfoCard({ title, text, plain = false }) {
  return <div className={plain ? 'paper-section' : 'info-card'}><h3>{title}</h3><p>{text}</p></div>
}

function StatsPanel({ stats, compact = false }) {
  return (
    <div className={`stats-panel ${compact ? 'compact' : ''}`}>
      {Object.entries(stats).map(([key, value]) => {
        const percentage = Math.min(100, Math.max(4, (Number(value) + 8) * 6))
        return (
          <div className="stat-row" key={key}>
            <div className="stat-label"><span>{statMeta[key].icon}</span>{statMeta[key].label}<strong>{value}</strong></div>
            <div className="stat-bar"><i style={{ width: `${percentage}%` }} /></div>
          </div>
        )
      })}
    </div>
  )
}

export default App
