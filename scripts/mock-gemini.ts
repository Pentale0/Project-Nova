/**
 * Throwaway mock of the Gemini generateContent endpoint.
 *
 * Lets the real AI proxy in server/index.ts be exercised end to end — request
 * forwarding, JSON extraction, response validation, and error mapping — without
 * a real API key. Point GEMINI_BASE_URL at this server to use it.
 *
 * Run: npx tsx scripts/mock-gemini.ts
 */

import express from 'express';

const PORT = Number(process.env.MOCK_PORT ?? 8799);
const app = express();
app.use(express.json({ limit: '2mb' }));

/** Which canned reply to send, chosen by the prompt's own content. */
type Reply = string;

const pick = (prompt: string): Reply => {
  // Test hook: any request containing this marker gets an unparseable reply.
  if (prompt.includes('TRIGGER_PROSE')) return 'I am afraid I cannot do that.';

  // Test hook: valid JSON, wrong shape, to exercise response validation.
  if (prompt.includes('TRIGGER_EMPTY')) return '{"summaryNotes":[],"quizzes":[]}';

  if (prompt.includes('Academics Coach')) {
    return JSON.stringify({
      summaryNotes: [
        'Vector clocks totally order events in a distributed system.',
        'Each process keeps a per-process counter advanced on every event.',
        'Causality means A happened-before B if A precedes B in every vector.',
        'Concurrent events have incomparable vectors and no causal ordering.',
      ],
      conceptGraph: [
        '┌───────────────┐      ┌───────────────┐',
        '│  Process A    │      │  Process B    │',
        '│ VC_A: {0,0}   │      │  VC_B: {0,0}   │',
        '└───────┬───────┘      └───────┬───────┘',
        '        │  msg  ──────────────▶ │',
        '        │  VC_A becomes {1,0}  │',
        '        └───────────────────────┘',
      ].join('\n'),
      quizzes: [
        {
          question: 'What does a vector clock entry mean?',
          answer: 'The number of events that process has observed.',
          explanation: 'Defined in the source as a per-process counter.',
        },
        {
          question: 'When are two events concurrent?',
          answer: 'When neither vector is less than the other.',
          explanation: 'The source states incomparable vectors mean no ordering.',
        },
        {
          question: 'What relation does "happened-before" encode?',
          answer: 'Causality between two events.',
          explanation: 'Introduced as the causality relation in the material.',
        },
        {
          question: 'Why not just use a single scalar timestamp?',
          answer: 'Clocks can drift, so scalars cannot express causality.',
          explanation: 'The source motivates vector clocks with clock skew.',
        },
        {
          question: 'What is the cost of vector clocks?',
          answer: 'Size grows linearly with the number of processes.',
          explanation: 'Stated as a downside in the supplied text.',
        },
      ],
    });
  }

  if (prompt.includes('Vitality Coach')) {
    return JSON.stringify({
      headline: 'TEMPO HYBRID 5K BLOCK',
      protocol: [
        'Run 1 rep at 60% effort as a warm-up to rehearse the pace.',
        'Complete 5 sets of 3 minutes hard with 2 minutes easy between sets.',
        'Keep your heart rate near 85% of max for the working sets.',
        'Cool down with 5 minutes of easy jogging.',
        'Repeat the block once per week and add 30 seconds per week.',
      ],
      workoutPlan: {
        warmup: '10 minutes of easy jogging plus dynamic lunges and leg swings.',
        mainRoutine:
          'Interval block of 5 x 3 minutes at threshold pace with 2 minutes easy jog recovery. Stay relaxed and even-footed.',
        cooldown: '5 minutes easy jog, then static hamstring and calf holds.',
      },
    });
  }

  if (prompt.includes('Culture Recommender')) {
    return JSON.stringify([
      {
        title: 'Outer Wilds',
        type: 'game',
        reason: 'You logged Hollow Knight, which shares its curiosity-driven loop.',
      },
      {
        title: 'Sea of Stars',
        type: 'game',
        reason: 'Like Chrono Trigger, it leans on tightly tuned turn-based combat.',
      },
      {
        title: 'Nine Sols',
        type: 'game',
        reason: 'Its parry-heavy melee echoes the precision you liked in Sekiro.',
      },
      {
        title: 'Chants of Sennaar',
        type: 'game',
        reason: 'Decoding languages mirrors the puzzle focus of Outer Wilds.',
      },
      {
        title: 'Tunic',
        type: 'game',
        reason: 'It hides a secret mechanic in plain sight, like Hollow Knight does.',
      },
    ]);
  }

  return 'Sorry, I do not know how to help with that.';
};

/**
 * The SDK sends `contents` as an array of { role, parts: [{ text }] }, so
 * flatten it back to plain text before matching on it.
 */
const promptText = (body: Record<string, unknown>): string => {
  const contents = body?.contents;
  if (typeof contents === 'string') return contents;
  if (!Array.isArray(contents)) return '';

  return contents
    .flatMap((turn) => {
      const parts = (turn as { parts?: unknown })?.parts;
      if (!Array.isArray(parts)) return [];
      return parts.map((p) => (p as { text?: string })?.text ?? '');
    })
    .join('\n');
};

app.post('/v1beta/models/:model', (req, res) => {
  const prompt = promptText(req.body as Record<string, unknown>);
  const reply = pick(prompt);

  if (!prompt) {
    res.status(400).json({ error: { message: 'mock: no prompt text found' } });
    return;
  }

  res.json({
    candidates: [
      {
        content: { role: 'model', parts: [{ text: reply }] },
        finishReason: 'STOP',
      },
    ],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 },
  });
});

// Prose-only mode, to exercise the client's parse-failure path.
app.post('/v1beta/prose/:model', (_req, res) => {
  res.json({
    candidates: [
      {
        content: { role: 'model', parts: [{ text: 'I cannot answer that.' }] },
        finishReason: 'STOP',
      },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`[mock-gemini] listening on http://localhost:${PORT}`);
});
