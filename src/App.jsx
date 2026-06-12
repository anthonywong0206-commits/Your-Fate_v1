import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'ai_roleplay_story_save_v1'
const MAX_ROUNDS = 6

const THEMES = [
  '末日生存',
  '校園懸疑',
  '魔法學院',
  '偵探查案',
  '古代宮廷',
  '社工個案情境',
  '自訂主題',
]

const initialStats = {
  courage: 0,
  wisdom: 0,
  trust: 0,
  morality: 0,
  risk: 0,
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
    background: `這是一個關於「${selectedTheme}」的互動故事，危機正在悄悄展開。`,
    role: `${playerName} 是故事中的關鍵角色，必須在壓力下作出選擇。`,
    goal: '理解局勢、作出判斷，並帶領故事走向不同結局。',
    crisis: '每個決定都可能帶來意想不到的後果。',
    rules: '每回合從兩個選項中選擇一個，最終根據選擇產生結局。',
  }
  return {
    ...intro,
    role: intro.role.replace('你', playerName || '你'),
  }
}

function fallbackScene({ theme, customTheme, playerName, round, stats }) {
  const selectedTheme = theme === '自訂主題' ? customTheme || '神秘冒險' : theme
  const templates = [
    {
      scene: `${playerName} 在「${selectedTheme}」的世界中發現第一個關鍵線索。一名陌生人提出合作，但他的說法似乎有漏洞。`,
      choiceA: { text: '相信對方，交換手上情報', effects: { courage: 0, wisdom: 0, trust: 2, morality: 1, risk: 1 } },
      choiceB: { text: '保持距離，暗中觀察對方', effects: { courage: 0, wisdom: 2, trust: -1, morality: 0, risk: 0 } },
    },
    {
      scene: `新的危機出現：時間不足，而隊伍內部開始出現分歧。${playerName} 必須決定如何穩住局面。`,
      choiceA: { text: '公開所有資訊，讓大家共同決定', effects: { courage: 1, wisdom: 0, trust: 2, morality: 2, risk: 1 } },
      choiceB: { text: '先隱瞞部分情報，避免引起恐慌', effects: { courage: 0, wisdom: 2, trust: -1, morality: -1, risk: 0 } },
    },
    {
      scene: `一個高風險機會擺在眼前。成功的話可以大幅推進目標，失敗則可能令形勢急轉直下。`,
      choiceA: { text: '立即行動，把握機會', effects: { courage: 2, wisdom: 0, trust: 0, morality: 0, risk: 2 } },
      choiceB: { text: '先收集更多資料再行動', effects: { courage: -1, wisdom: 2, trust: 0, morality: 1, risk: -1 } },
    },
    {
      scene: `${playerName} 發現一名重要角色正隱藏痛苦的真相。揭開它可能有助任務，但也可能傷害對方。`,
      choiceA: { text: '溫和追問，嘗試理解對方', effects: { courage: 0, wisdom: 1, trust: 2, morality: 2, risk: 0 } },
      choiceB: { text: '直接指出疑點，迫對方交代', effects: { courage: 2, wisdom: 1, trust: -2, morality: -1, risk: 1 } },
    },
    {
      scene: `最終局勢逐漸明朗，但代價也浮現。${playerName} 需要在個人安全與整體利益之間取捨。`,
      choiceA: { text: '冒險保護他人', effects: { courage: 2, wisdom: 0, trust: 2, morality: 2, risk: 2 } },
      choiceB: { text: '選擇保守方案，降低損失', effects: { courage: -1, wisdom: 2, trust: 0, morality: 0, risk: -2 } },
    },
    {
      scene: `最後一道選擇來臨。過去累積的勇氣、智慧、信任與風險，將決定故事走向。`,
      choiceA: { text: '相信一路建立的關係，合作解決危機', effects: { courage: 1, wisdom: 1, trust: 2, morality: 1, risk: 1 } },
      choiceB: { text: '獨自承擔責任，快速作出最後決斷', effects: { courage: 2, wisdom: 1, trust: -1, morality: 0, risk: 1 } },
    },
  ]
  const scene = templates[(round - 1) % templates.length]
  return { ...scene, round, statsSnapshot: stats }
}

function fallbackEnding({ playerName, theme, customTheme, stats, history }) {
  const selectedTheme = theme === '自訂主題' ? customTheme || '神秘冒險' : theme
  const positiveScore = stats.courage + stats.wisdom + stats.trust + stats.morality - stats.risk

  if (positiveScore >= 8) {
    return {
      title: '希望之路',
      summary: `${playerName} 在「${selectedTheme}」的危機中保持清醒與善意，成功把混亂轉化成新的可能。`,
      fate: '主角不但完成任務，也成為眾人願意信任的核心人物。',
      review: history.map((item, index) => `第 ${index + 1} 回合：${item.choiceText}`),
      reflection: ['你最重視哪一次選擇？', '如果重新開始，你會否作出不同決定？'],
    }
  }

  if (stats.risk >= 6) {
    return {
      title: '高風險結局',
      summary: `${playerName} 多次選擇冒險推進，雖然接近真相，但也令局面變得難以控制。`,
      fate: '主角保住了部分成果，但必須承受選擇帶來的代價。',
      review: history.map((item, index) => `第 ${index + 1} 回合：${item.choiceText}`),
      reflection: ['冒險是否值得？', '在壓力下，安全與效率應如何平衡？'],
    }
  }

  return {
    title: '灰色餘波',
    summary: `${playerName} 完成了部分目標，但仍有未解的遺憾。故事沒有完全勝利，也沒有完全失敗。`,
    fate: '主角帶着經驗離開，明白每個選擇都會改變人與人之間的關係。',
    review: history.map((item, index) => `第 ${index + 1} 回合：${item.choiceText}`),
    reflection: ['這個結局反映了你怎樣的價值取向？', '你認為最困難的抉擇是甚麼？'],
  }
}

async function callOpenAI(systemPrompt, userPrompt) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    throw new Error('沒有設定 API Key，使用本地 Demo 內容。')
  }

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

  if (!response.ok) {
    throw new Error('AI API 回應失敗')
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  const cleaned = content.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
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

  const selectedTheme = useMemo(() => {
    return theme === '自訂主題' ? customTheme || '自訂冒險' : theme
  }, [theme, customTheme])

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
    const save = { page, theme, customTheme, playerName, intro, currentScene, ending, round, stats, history }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
  }, [page, theme, customTheme, playerName, intro, currentScene, ending, round, stats, history])

  async function generateIntro() {
    setLoading(true)
    setNotice('')

    try {
      const result = await callOpenAI(
        '你是一名繁體中文互動故事遊戲設計師。你必須只輸出 JSON，不要 Markdown。',
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
      const result = await callOpenAI(
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
      const result = await callOpenAI(
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
    if (!playerName.trim()) {
      setNotice('請先輸入角色名稱。')
      return
    }
    if (theme === '自訂主題' && !customTheme.trim()) {
      setNotice('請輸入自訂劇目主題。')
      return
    }
    setRound(1)
    setStats(initialStats)
    setHistory([])
    setEnding(null)
    generateIntro()
  }

  function enterStory() {
    generateScene(1, stats, history)
  }

  function chooseOption(key) {
    const choice = key === 'A' ? currentScene.choiceA : currentScene.choiceB
    const effects = choice.effects || {}
    const nextStats = {
      courage: stats.courage + Number(effects.courage || 0),
      wisdom: stats.wisdom + Number(effects.wisdom || 0),
      trust: stats.trust + Number(effects.trust || 0),
      morality: stats.morality + Number(effects.morality || 0),
      risk: stats.risk + Number(effects.risk || 0),
    }
    const nextHistory = [
      ...history,
      {
        round,
        scene: currentScene.scene,
        choiceKey: key,
        choiceText: choice.text,
        effects,
      },
    ]

    setStats(nextStats)
    setHistory(nextHistory)

    if (round >= MAX_ROUNDS) {
      generateEnding(nextStats, nextHistory)
    } else {
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
    <main className="app-shell">
      <section className="hero-card">
        <div className="topline">AI Roleplay Story</div>
        <h1>AI 角色扮演互動故事</h1>
        <p className="subtitle">選擇劇目、建立角色，然後用每一次二選一決定改寫故事支線。</p>

        {notice && <div className="notice">{notice}</div>}
        {loading && <div className="loading">AI 正在生成內容，如未設定 API Key 會自動使用 Demo 劇本……</div>}

        {page === 'home' && (
          <div className="panel">
            <label>選擇劇目主題</label>
            <select value={theme} onChange={(event) => setTheme(event.target.value)}>
              {THEMES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            {theme === '自訂主題' && (
              <>
                <label>自訂主題</label>
                <input value={customTheme} onChange={(event) => setCustomTheme(event.target.value)} placeholder="例如：時間旅行、職場危機、奇幻王國" />
              </>
            )}

            <label>角色名稱</label>
            <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="輸入你的角色名稱" />

            <button onClick={startStory} disabled={loading}>開始故事</button>
          </div>
        )}

        {page === 'intro' && intro && (
          <div className="panel story-panel">
            <h2>{selectedTheme}｜故事簡介</h2>
            <Info title="故事背景" text={intro.background} />
            <Info title="主角身份" text={intro.role} />
            <Info title="任務目標" text={intro.goal} />
            <Info title="主要危機" text={intro.crisis} />
            <Info title="遊戲規則" text={intro.rules} />
            <div className="button-row">
              <button onClick={enterStory} disabled={loading}>進入故事</button>
              <button className="secondary" onClick={resetGame}>重新開始</button>
            </div>
          </div>
        )}

        {page === 'story' && currentScene && (
          <div className="panel story-panel">
            <div className="round-chip">第 {round} / {MAX_ROUNDS} 回合</div>
            <h2>{selectedTheme}</h2>
            <p className="scene-text">{currentScene.scene}</p>
            <div className="choices">
              <button onClick={() => chooseOption('A')} disabled={loading}>A. {currentScene.choiceA?.text}</button>
              <button onClick={() => chooseOption('B')} disabled={loading}>B. {currentScene.choiceB?.text}</button>
            </div>
            <Stats stats={stats} />
          </div>
        )}

        {page === 'ending' && ending && (
          <div className="panel story-panel">
            <div className="round-chip">故事結局</div>
            <h2>{ending.title}</h2>
            <Info title="故事總結" text={ending.summary} />
            <Info title="主角命運" text={ending.fate} />
            <div className="info-block">
              <h3>關鍵選擇回顧</h3>
              <ul>
                {(ending.review || []).map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <div className="info-block">
              <h3>反思問題</h3>
              <ul>
                {(ending.reflection || []).map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <Stats stats={stats} />
            <button onClick={resetGame}>重新開始</button>
          </div>
        )}
      </section>
    </main>
  )
}

function Info({ title, text }) {
  return (
    <div className="info-block">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function Stats({ stats }) {
  const labels = {
    courage: '勇氣',
    wisdom: '智慧',
    trust: '信任',
    morality: '道德',
    risk: '風險',
  }

  return (
    <div className="stats-grid">
      {Object.entries(stats).map(([key, value]) => (
        <div className="stat-card" key={key}>
          <span>{labels[key]}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

export default App
