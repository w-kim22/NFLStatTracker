// Netlify function: fetches nflverse's games.csv (free, public, updated through the season)
// and returns a trimmed JSON payload. No API keys. Betting columns are dropped on purpose.
const SOURCE = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv";

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const json = (statusCode, body, maxAge = 0) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": maxAge ? `public, max-age=${maxAge}` : "no-store",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  try {
    const res = await fetch(SOURCE);
    if (!res.ok) throw new Error(`nflverse returned HTTP ${res.status}`);

    const rows = parseCSV(await res.text());
    const head = rows[0];
    const col = (name) => head.indexOf(name);
    const c = Object.fromEntries(
      ["season", "game_type", "week", "gameday", "away_team", "away_score", "home_team", "home_score"]
        .map((n) => [n, col(n)])
    );
    if (Object.values(c).some((i) => i < 0)) throw new Error("Unexpected nflverse column layout");

    const num = (v) => (v === "" || v === undefined ? null : Number(v));
    const all = rows.slice(1).filter((r) => r.length > c.home_score).map((r) => ({
      season: Number(r[c.season]),
      type: r[c.game_type],
      week: Number(r[c.week]),
      date: r[c.gameday],
      away: r[c.away_team],
      awayScore: num(r[c.away_score]),
      home: r[c.home_team],
      homeScore: num(r[c.home_score]),
    }));

    const seasons = [...new Set(all.map((g) => g.season))].sort((a, b) => b - a);
    const requested = Number(event.queryStringParameters && event.queryStringParameters.season);
    const season = requested || seasons[0];
    if (!seasons.includes(season)) return json(400, { error: `No data for season ${season}` });

    return json(
      200,
      { season, seasons: seasons.slice(0, 10), games: all.filter((g) => g.season === season), source: "nflverse/nfldata games.csv" },
      900
    );
  } catch (err) {
    return json(502, { error: err.message });
  }
};
