/**
 * Throwaway check of the AI proxy's JSON extraction and response validation.
 * Run: npx tsx scripts/test-parse.ts
 */

const extractJson = (text: string): unknown => {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[[{]/);
    if (start === -1) throw new Error('No JSON found in model response');

    const opener = cleaned[start];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === opener) depth++;
      else if (ch === closer) {
        depth--;
        if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
      }
    }
    throw new Error('Unbalanced JSON in model response');
  }
};

let pass = 0;
let fail = 0;
const check = (name: string, fn: () => void) => {
  try {
    fn();
    pass++;
    console.log(`  ok   ${name}`);
  } catch (err) {
    fail++;
    console.log(`  FAIL ${name}: ${err instanceof Error ? err.message : err}`);
  }
};
const eq = (a: unknown, b: unknown) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  }
};

console.log('extractJson:');

check('parses clean object', () => {
  eq(extractJson('{"a":1}'), { a: 1 });
});

check('strips ```json fences', () => {
  eq(extractJson('```json\n{"a":1}\n```'), { a: 1 });
});

check('strips bare ``` fences', () => {
  eq(extractJson('```\n{"a":1}\n```'), { a: 1 });
});

check('recovers JSON after prose preamble', () => {
  eq(extractJson('Sure! Here you go:\n{"a":1}'), { a: 1 });
});

check('recovers JSON before trailing prose', () => {
  eq(extractJson('{"a":1}\nHope that helps!'), { a: 1 });
});

check('handles nested objects and arrays', () => {
  eq(extractJson('{"a":{"b":[1,2,{"c":3}]}}'), { a: { b: [1, 2, { c: 3 }] } });
});

check('handles braces inside strings', () => {
  eq(extractJson('{"a":"contains } and { braces"}'), {
    a: 'contains } and { braces',
  });
});

check('handles escaped quotes inside strings', () => {
  eq(extractJson('{"a":"he said \\"hi\\" }"}'), { a: 'he said "hi" }' });
});

check('parses top-level array (culture recs)', () => {
  eq(extractJson('[{"title":"Dune"},{"title":"Solaris"}]'), [
    { title: 'Dune' },
    { title: 'Solaris' },
  ]);
});

check('recovers array wrapped in fences', () => {
  eq(extractJson('```json\n[{"title":"Dune"}]\n```'), [{ title: 'Dune' }]);
});

check('throws on pure prose', () => {
  try {
    extractJson('I cannot help with that request.');
    throw new Error('should have thrown');
  } catch (err) {
    if (err instanceof Error && err.message === 'should have thrown') throw err;
  }
});

check('throws on truncated JSON', () => {
  try {
    extractJson('{"a":1,"b":');
    throw new Error('should have thrown');
  } catch (err) {
    if (err instanceof Error && err.message === 'should have thrown') throw err;
  }
});

// --- Catalog search -----------------------------------------------------
import { searchCatalog, CATALOG } from '../src/data/catalog';

console.log('\ncatalog search:');

check('catalog is populated', () => {
  if (CATALOG.length < 150) throw new Error(`only ${CATALOG.length} entries`);
});

check('finds exact title', () => {
  if (searchCatalog('Dune', 'book')[0]?.title !== 'Dune')
    throw new Error('missed Dune');
});

check('is case insensitive', () => {
  if (searchCatalog('BEBOP', 'anime')[0]?.title !== 'Cowboy Bebop')
    throw new Error('missed Cowboy Bebop');
});

check('matches partial prefix', () => {
  const top = searchCatalog('blad', 'movie')[0];
  if (!top || !top.title.includes('Blade Runner'))
    throw new Error('missed Blade Runner');
});

check('ranks exact match above partial', () => {
  const first = searchCatalog('Pluto', 'manga')[0]?.title;
  if (first !== 'Pluto') throw new Error(`expected Pluto first, got ${first}`);
});

check('matches via alias', () => {
  const titles = searchCatalog('sicp', 'book').map((m) => m.title);
  if (!titles.some((t) => t.includes('Structure and Interpretation')))
    throw new Error('alias SICP did not resolve');
});

check('matches multi-word out of order', () => {
  const titles = searchCatalog('2049 blade', 'movie').map((m) => m.title);
  if (!titles.some((t) => t.includes('Blade Runner 2049')))
    throw new Error('multi-word failed');
});

check('returns nothing for nonsense', () => {
  if (searchCatalog('zzzqqqxxx', 'game').length !== 0)
    throw new Error('expected no matches');
});

check('respects the limit', () => {
  if (searchCatalog('the', 'series', 3).length > 3) throw new Error('limit ignored');
});

check('every category is represented', () => {
  const cats = new Set(CATALOG.map((e) => e.category));
  for (const c of ['movie', 'series', 'anime', 'game', 'book', 'manga']) {
    if (!cats.has(c as never)) throw new Error(`missing category ${c}`);
  }
});

check('no duplicate titles within a category', () => {
  const seen = new Set<string>();
  for (const e of CATALOG) {
    const key = `${e.category}:${e.title.toLowerCase()}`;
    if (seen.has(key)) throw new Error(`duplicate ${e.title} (${e.category})`);
    seen.add(key);
  }
});

check('results are scoped to the requested category', () => {
  // A book must never surface while searching games.
  for (const q of ['dune', 'berserk', 'evangelion', 'severance', 'minecraft']) {
    for (const m of searchCatalog(q, 'game')) {
      if (m.category !== 'game')
        throw new Error(`"${q}" returned ${m.category} title ${m.title}`);
    }
  }
});

check('every entry has a plausible year and genres', () => {
  for (const e of CATALOG) {
    // 1600 floor: the catalog includes classics like Don Quixote (1605).
    if (!Number.isInteger(e.year) || e.year < 1600 || e.year > 2030)
      throw new Error(`${e.title}: bad year ${e.year}`);
    if (e.genres.length === 0) throw new Error(`${e.title}: no genres`);
  }
});

// ---------------------------------------------------------------------------
// Free media sources (server/sources.ts)
//
// Pure transforms only -- the upstream payloads are what break when a provider
// changes shape, so that's what we pin down here.
// ---------------------------------------------------------------------------

const { testing: t } = await import('../server/sources');

check('stripHtml removes markup and decodes entities', () => {
  const html = '<p>Hades is a <b>roguelike</b>.</p><br>Roguelike &amp; stylish &quot;fun&quot;';
  const out = t.stripHtml(html);
  if (out.includes('<') || out.includes('&amp;') || out.includes('&quot;'))
    throw new Error(`markup survived: ${out}`);
  if (!out.includes('roguelike') || !out.includes('&')) throw new Error(`text lost: ${out}`);
});

check('stripHtml ignores non-strings', () => {
  for (const bad of [undefined, null, 42, {}, []]) {
    if (t.stripHtml(bad) !== '') throw new Error(`expected "" for ${String(bad)}`);
  }
});

check('asScore clamps to 0-100 and rejects junk', () => {
  if (t.asScore(86) !== 86) throw new Error('plain score mangled');
  if (t.asScore(140) !== 100) throw new Error('over-100 not clamped');
  // Zero means "unrated" upstream, so it must not surface as a 0/100 rating.
  for (const bad of [0, -5, NaN, 'abc', null, undefined]) {
    if (t.asScore(bad) !== undefined) throw new Error(`${String(bad)} became a score`);
  }
});

check('clampGenres keeps strings, caps the count', () => {
  const out = t.clampGenres(['Action', '  RPG  ', '', 42, 'Indie', 'Sci-Fi', 'Drama', 'Extra']);
  if (out.length !== 6) throw new Error(`expected 6 genres, got ${out.length}`);
  if (out[1] !== 'RPG') throw new Error(`whitespace not trimmed: ${out[1]}`);
  if (out.includes('')) throw new Error('empty genre survived');
  if (out.includes('42')) throw new Error('non-string survived');
  if (t.clampGenres('Action').length !== 0) throw new Error('a bare string should yield []');
  if (t.clampGenres(null).length !== 0) throw new Error('null should yield []');
});

check('steamYear pulls the year out of Steam date formats', () => {
  if (t.steamYear('17 Sep, 2020') !== 2020) throw new Error('failed on long format');
  if (t.steamYear('Sep 2020') !== 2020) throw new Error('failed on short format');
  if (t.steamYear('coming soon') !== undefined) throw new Error('invented a year');
  if (t.steamYear(undefined) !== undefined) throw new Error('invented a year');
});

check('cleanBookSubjects drops generic library noise', () => {
  const out = t.cleanBookSubjects([
    'Fiction', 'Science fiction', 'Dune (Imaginary place)', 'New York Times bestseller',
  ]);
  if (out.includes('Fiction')) throw new Error('kept generic "Fiction"');
  if (out.includes('New York Times bestseller')) throw new Error('kept NYT bestseller noise');
  if (!out.includes('Science fiction')) throw new Error('dropped a real subject');
  if (!out.includes('Dune (Imaginary place)')) throw new Error('dropped a real subject');
});

check('cinemetaToLookup normalises IMDb ratings to 0-100', () => {
  const out = t.cinemetaToLookup({
    imdb_id: 'tt0133093',
    name: 'The Matrix',
    year: '1999',
    genres: ['Action', 'Sci-Fi'],
    imdbRating: '8.7',
    director: ['Lana Wachowski', 'Lilly Wachowski'],
    description: 'A hacker learns the truth.',
  });
  if (!out) throw new Error('returned null for a valid record');
  if (out.title !== 'The Matrix') throw new Error(`bad title ${out.title}`);
  if (out.category !== 'movie') throw new Error(`bad category ${out.category}`);
  if (out.year !== 1999) throw new Error(`year not coerced: ${out.year}`);
  // 8.7 on IMDb's 10-point scale becomes 87 on our 0-100 scale.
  if (out.rating !== 87) throw new Error(`rating not scaled: ${out.rating}`);
  if (out.creator !== 'Lana Wachowski') throw new Error(`wrong director: ${out.creator}`);
  if (out.externalId !== 'tt0133093') throw new Error(`id not captured: ${out.externalId}`);
});

check('cinemetaToLookup rejects untitled records', () => {
  if (t.cinemetaToLookup({ year: '1999' }) !== null) throw new Error('accepted a titleless record');
  if (t.cinemetaToLookup({ name: '   ' }) !== null) throw new Error('accepted a blank title');
});

check('needsHydration flags incomplete search stubs', () => {
  // What Cinemeta's search catalog actually returns for some titles: a name
  // and an id, nothing else. Those must be re-fetched from the detail endpoint.
  const stub = t.cinemetaToLookup({ imdb_id: 'tt1', name: 'Stub Film' });
  const full = t.cinemetaToLookup({
    imdb_id: 'tt2', name: 'Full Film', genres: ['Drama'], imdbRating: '7.0',
  });
  if (stub && !t.needsHydration(stub)) throw new Error('stub was not flagged');
  if (full && t.needsHydration(full)) throw new Error('complete record was flagged');
});

check('anilistStudio picks the main studio, not a licensor', () => {
  const media = {
    studios: {
      edges: [
        { isMain: false, node: { name: 'Funimation' } },
        { isMain: true, node: { name: 'Sunrise' } },
      ],
    },
  };
  if (t.anilistStudio(media) !== 'Sunrise') {
    throw new Error(`picked ${t.anilistStudio(media)} instead of the main studio`);
  }
  if (t.anilistStudio({}) !== undefined) throw new Error('invented a studio');
});

check('anilistAuthor matches on role, not position', () => {
  // Voice actors and translators often outrank the author in AniList's
  // relevance ordering, which previously surfaced them as the "creator".
  const media = {
    staff: {
      edges: [
        { role: 'Voice Actor', node: { name: { full: 'Mary Elizabeth McGlynn' } } },
        { role: 'Original Creator', node: { name: { full: 'Kentarou Miura' } } },
      ],
    },
  };
  if (t.anilistAuthor(media) !== 'Kentarou Miura') {
    throw new Error(`picked ${t.anilistAuthor(media)} instead of the author`);
  }
});

check('anilistTitle prefers English then romaji', () => {
  if (t.anilistTitle({ title: { english: 'Cowboy Bebop', romaji: 'Cowboy Bebop' } }) !== 'Cowboy Bebop')
    throw new Error('did not prefer the English title');
  // Non-English releases often have no English title at all.
  if (t.anilistTitle({ title: { english: null, romaji: 'Shingeki no Kyojin' } }) !== 'Shingeki no Kyojin')
    throw new Error('did not fall back to romaji');
  if (t.anilistTitle({ title: {} }) !== '') throw new Error('invented a title');
});

check('norm collapses case and spacing for title matching', () => {
  if (t.norm('  The   Matrix ') !== 'the matrix') throw new Error('did not normalise');
  if (t.norm('The Matrix') !== t.norm('the matrix')) throw new Error('case-sensitive');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
