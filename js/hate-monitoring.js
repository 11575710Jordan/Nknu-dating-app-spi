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

  // 更新仇恨值儀表板 UI
  function updateGauge(score) {
    currentScore = Math.min(Math.max(score, 0), 100);
    scoreValueEl.textContent = currentScore;
    gaugeFill.style.width = `${currentScore}%`;

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

  // 模擬分析輸入內容之仇恨值
  analyzeBtn.addEventListener('click', () => {
    const text = testInput.value.trim();
    if (!text) {
      testResult.textContent = '請輸入文字內容以進行分析。';
      testResult.style.color = 'var(--coral-600)';
      return;
    }

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
      testResult.textContent = `⚠️ 偵測到敏感詞：[${detectedWords.join(', ')}]，仇恨值增加 +${addedScore}！`;
      testResult.style.color = 'var(--coral-600)';
    } else {
      testResult.textContent = '✓ 未偵測到高風險仇恨詞彙，內容符合規範。';
      testResult.style.color = 'var(--sage-800)';
    }
  });

  // 初次初始化顯示
  updateGauge(currentScore);
});