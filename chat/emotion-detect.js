/*
 * NKNu Dating App — 情緒判斷教學版（純前端、免 API、免網路）
 * 以公開可讀的關鍵字與情境規則分類，不是真正訓練過的 AI / ML 模型。
 * 僅供課堂原型展示；不作心理健康診斷或可靠的意圖推斷。
 */
(function (root, build) {
  'use strict';
  const api=build();
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
  if (root) root.ChatEmotion=api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const terms={
    happy: [
      [/開心/g,2], [/高興/g,2], [/快樂/g,2], [/幸福/g,3], [/很棒|太棒|超棒|好耶|真讚/g,2],
      [/喜歡|期待|感動|感謝|謝謝/g,1], [/很貼心|真好|好幸福/g,2], [/😊|😄|😃|😁|🥰|❤️|💕|😍/gu,2]
    ],
    sad: [
      [/難過/g,3], [/傷心|沮喪|失落|失望|孤單/g,2], [/不開心|心情不好|心情很差/g,3],
      [/想哭|哭了|流淚/g,2], [/好累|很累|不舒服/g,1], [/😢|😭|😞|😔|🥺/gu,2]
    ],
    angry: [
      [/生氣|憤怒|火大|不爽/g,3], [/氣死|很氣|受不了|煩死|煩躁/g,2],
      [/討厭|不要再煩|騙我/g,2], [/😡|🤬|😠|💢/gu,2]
    ]
  };
  const labels={ happy:'開心', sad:'難過', angry:'生氣', neutral:'中性', mixed:'混合情緒' };
  const emojis={ happy:'😊', sad:'😢', angry:'😠', neutral:'😐', mixed:'🤔' };

  function clean(input){
    return String(input==null?'':input).normalize('NFKC').trim();
  }
  function analyzeText(input){
    const text=clean(input);
    if (!text) return {code:'empty',label:'無有效文字',emoji:'—',reasons:[],scores:{happy:0,sad:0,angry:0},reliable:false};
    const scores={happy:0,sad:0,angry:0};
    const reasons=[];
    // 「不開心」不是「開心」；避免同時加到正向詞彙
    const positiveText=text.replace(/不開心|沒開心|不高興|沒有高興|沒有不開心|不是不開心/g,'');
    // 「沒有不開心」只是模糊的雙重否定，不強制判為難過
    const negativeText=text.replace(/沒有不開心|不是不開心/g,'');
    for(const code of ['happy','sad','angry']){
      const target=code==='happy'?positiveText:negativeText;
      for(const [pattern,points] of terms[code]){
        const matches=target.match(pattern)||[];
        if(matches.length){scores[code]+=points*Math.min(matches.length,3);reasons.push(...matches.map(s=>`${labels[code]}詞：${s}`));}
      }
    }
    // 模糊一般語氣不應硬分類
    let code='neutral';
    const sorted=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
    if(sorted[0][1]>0){
      code=sorted[0][0];
      if(sorted[1][1]>0 && sorted[0][1]-sorted[1][1]<=1) code='mixed';
    }
    return {code,label:labels[code],emoji:emojis[code],reasons:[...new Set(reasons)].slice(0,5),scores,reliable:code!=='neutral'&&code!=='mixed'};
  }
  function analyzeConversation(input){
    const texts=(Array.isArray(input)?input:[]).map(x=>typeof x==='string'?x:(x && (x.kind==='in'||x.kind==='out')?x.text:null))
      .filter(x=>typeof x==='string'&&x.trim());
    const results=texts.map(analyzeText);
    const counts={happy:0,sad:0,angry:0,neutral:0,mixed:0};
    results.forEach(r=>counts[r.code]=(counts[r.code]||0)+1);
    return {total:results.length,counts,latest:results[results.length-1]||null,recent:results.slice(-6)};
  }
  return {clean,analyzeText,analyzeConversation,labels,emojis};
});
