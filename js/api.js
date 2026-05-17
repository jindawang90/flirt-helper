/* ===== API 集成层 ===== */

function buildReplyPrompt(profile, scene, userInput) {
  const nameText = profile.name ? `她的名字：${profile.name}` : '';
  const interestsText = profile.interests.length > 0
    ? `她的兴趣/标签：${profile.interests.join('、')}`
    : '';
  const notesText = profile.notes ? `其他信息：${profile.notes}` : '';

  const sceneMap = {
    reply: '她刚刚发来了一条消息，你需要根据消息内容给出回复建议。',
    open: '你想主动找她聊天/开场破冰，需要一些话题切入建议。',
    awkward: '聊天气氛有点尴尬/冷场，需要打破僵局的话题。'
  };

  return `你是一个社交聊天教练，正在帮助用户与他喜欢的女生聊天。

当前关系阶段：${profile.stage}
${nameText}
${interestsText}
${notesText}

当前场景：${sceneMap[scene] || sceneMap.reply}

${userInput ? `她发来的消息（或当前场景描述）：\n"""\n${userInput}\n"""` : ''}

请根据以上信息，给出以下 4 个方面的建议，用明确的标题分隔：

【她的情绪/潜台词】
分析她这条消息背后的情绪、态度或潜台词。如果信息不足就说"信息有限，建议直接回应"。

【回复方向】
给出 2-3 个不同的回复方向建议。每个方向用一句话概括核心思路，并给出一个参考话术示例（不超过 40 字）。注意：方向之间要有区别，不要都是同一种策略。

【雷区提醒】
指出这个场景下需要避免说什么、注意什么。如果没有明显雷区，就写"暂无明显雷区"。

【话题切入】
如果当前适合开启新话题或深入已有话题，给出 1 个具体的切入点。如果已经是回复场景且不适合转移话题，写"专注当前对话即可"。

重要原则：
- 语言自然口语化，不要像机器人说话
- 多给方向，少给标准答案
- 鼓励他用自己的话来说
- 输出保持简洁，每个部分不超过 100 字`;
}

function buildTopicsPrompt(profile) {
  const interestsText = profile.interests.length > 0
    ? `她的兴趣/标签：${profile.interests.join('、')}`
    : '暂未知她的兴趣';
  const notesText = profile.notes ? `其他信息：${profile.notes}` : '';

  return `你是一个社交聊天教练，帮用户找话题和他喜欢的女生聊天。

关系阶段：${profile.stage}
${interestsText}
${notesText}

请推荐 5 个适合当前阶段聊的话题。每个话题包含：
- 类别（如：日常/兴趣/深度/玩笑）
- 话题标题
- 一句话说明为什么适合，以及怎么切入

要求：
- 话题要具体，不要说空话
- 避免查户口式的提问
- 优先选和她兴趣相关的话题
- 每个话题描述控制在 30 字以内
- 输出 JSON 数组格式，不要其他废话，格式：
[
  {"category":"日常","title":"话题标题","desc":"切入方式"},
  ...
]`;
}

async function callDeepSeek(messages, settings) {
  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    let errMsg = `API 请求失败 (${response.status})`;
    try {
      const err = await response.json();
      errMsg = err.error?.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function getChatSuggestions(profile, scene, userInput) {
  const settings = Data.getSettings();
  if (!settings.apiKey) {
    throw new Error('请先在设置页填入 API Key');
  }

  const systemPrompt = buildReplyPrompt(profile, scene, userInput);
  const userMessage = userInput
    ? `场景：${scene}\n\n她的消息：${userInput}`
    : `场景：${scene}\n\n暂无具体消息，请给出开场建议。`;

  return await callDeepSeek([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ], settings);
}

async function getTopicSuggestions(profile) {
  const settings = Data.getSettings();
  if (!settings.apiKey) {
    throw new Error('请先在设置页填入 API Key');
  }

  const prompt = buildTopicsPrompt(profile);

  const text = await callDeepSeek([
    { role: 'system', content: '你是一个数据输出助手，严格按照用户要求的格式输出 JSON。不要输出任何多余内容。' },
    { role: 'user', content: prompt }
  ], settings);

  // Parse JSON from the response
  let json = text.trim();
  // Remove markdown code fences if present
  if (json.startsWith('```')) {
    json = json.replace(/```(?:json)?\n?/g, '').trim();
  }
  const topics = JSON.parse(json);
  return Array.isArray(topics) ? topics : [];
}
