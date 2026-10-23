/* =========================================================
   社群健康度與仇恨值監控 (UI/UX 最佳化版本)
   - 支援即時權重模擬分析、Enter 鍵快捷觸發、動態狀態回饋
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const scoreValueEl = document.getElementById('scoreValue');
  const scoreStatusText = document.getElementById('scoreStatusText');
  const gaugeFill = document.getElementById('gaugeFill');

  const testInput = document.getElementById('testInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const testResult = document.getElementById('testResult');

  // 敏感詞庫與權重比對表
  const sensitiveKeywords = [
    { word: '笨蛋', weight: 5 },
    { word: '白痴', weight: 15 },
    { word: '討厭你', weight: 10 },
    { word: '詐騙', weight: 25 },
    { word: '錢', weight: 10 },
    { word: '加LINE', weight: 15 },
    { word: '死', weight: 30 }
  ];

  let currentScore = 15;

  // 更新仇恨值儀表板 UI (Visibility of System Status)
  function updateGauge(score) {
    currentScore = Math.min(Math.max(score, 0), 100);
    if (scoreValueEl) scoreValueEl.textContent = currentScore;
    if (gaugeFill) gaugeFill.style.width = `${currentScore}%`;

    if (!scoreStatusText) return;
    if (currentScore < 30) {
      scoreStatusText.textContent = '良好';
      scoreStatusText.className = 'status-safe';
    } else if (currentScore < 70) {
      scoreStatusText.textContent = '警告區';
      scoreStatusText.className = 'status-warning';
    } else {
      scoreStatusText.textContent = '高風險 / 凍結';
      scoreStatusText.className = 'status-danger';
    }
  }

  // 執行分析核心邏輯
  function handleAnalysis() {
    if (!testInput || !testResult) return;
    const text = testInput.value.trim();

    if (!text) {
      testResult.textContent = '請輸入文字內容以進行 AI 敏感度分析。';
      testResult.style.color = 'var(--coral-600, #d93025)';
      return;
    }

    // 模擬分析載入狀態
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'AI 深度語意分析中...';
    testResult.textContent = '正在掃描詞彙庫權重...';
    testResult.style.color = 'var(--text-secondary, #666)';

    setTimeout(() => {
      let addedScore = 0;
      let detectedWords = [];

      sensitiveKeywords.forEach(item => {
        if (text.includes(item.word)) {
          addedScore += item.weight;
          detectedWords.push(item.word);
        }
      });

      if (detectedWords.length > 0) {
        const newScore = currentScore + addedScore;
        updateGauge(newScore);
        testResult.textContent = `⚠️ 偵測到敏感詞：[${detectedWords.join(', ')}]，風險指數增加 +${addedScore} 分！`;
        testResult.style.color = 'var(--coral-600, #d93025)';
      } else {
        testResult.textContent = '✓ 未偵測到高風險仇恨詞彙，對話內容符合社群規範。';
        testResult.style.color = 'var(--sage-800, #137333)';
      }

      analyzeBtn.disabled = false;
      analyzeBtn.textContent = '分析仇恨權重';
    }, 600);
  }

  // 3. 綁定事件監聽 (支援點擊與 Enter 鍵快捷操作 - Flexiblity)
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', handleAnalysis);
  }

  if (testInput) {
    testInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleAnalysis();
      }
    });
  }

  // 初次初始化顯示
  updateGauge(currentScore);
});