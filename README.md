# NFL Season Tracker

Static page + one Netlify function. No API keys, no preloaded data.

- `index.html` – the app (pick favorite/least favorite team, season-long stats, remaining-schedule predictions)
- `netlify/functions/games.js` – fetches nflverse's `games.csv` and returns trimmed JSON (cached 15 min)
- `netlify.toml` – tells Netlify where the function lives

## Run
Local: `npm i -g netlify-cli`, then `netlify dev` in this folder and open the URL it prints.
Deploy: `netlify deploy --prod` (or drag the folder into app.netlify.com/drop; the function needs a Git or CLI deploy).

Opening index.html straight from disk will show a "couldn't load" message, since the function isn't running.
