# Teambuilding Hub

A static multi-page info site for your team event. Fully editable via JSON — no rebuild needed.

## File structure

```
teambuilding/
├── index.html           ← Home / Overview
├── pages/
│   ├── schedule.html    ← Agenda
│   ├── rooms.html       ← Room assignments
│   ├── cars.html        ← Transport / cars
│   ├── meals.html       ← Meals & dietary info
│   └── info.html        ← Packing list, weather, FAQ, emergency contacts
├── css/
│   └── style.css
├── js/
│   └── shared.js
├── data/                ← ✏️  Edit these files to update all content
│   ├── event.json       ← Event name, dates, location, highlights, organizer
│   ├── people.json      ← List of attendees (id, name, emoji)
│   ├── schedule.json    ← Day-by-day agenda
│   ├── rooms.json       ← Room assignments (uses person ids)
│   ├── cars.json        ← Car groups (uses person ids)
│   ├── meals.json       ← Per-person diet + allergies (uses person ids)
│   └── info.json        ← Packing, weather, FAQ, emergency contacts
└── .nojekyll            ← Required for GitHub Pages
```

## How to update content

1. Open any file in `data/` with a text editor.
2. Edit the values — all person references use the `id` field from `people.json`.
3. Save and commit. No build step required.

## Run locally

Because the pages fetch JSON via `fetch()`, open them through a local server (not directly as `file://` URLs):

```bash
# Python (built in)
cd teambuilding
python3 -m http.server 8080
# → open http://localhost:8080

# Node (npx)
npx serve .
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings → Pages**.
3. Under **Source**, select **Deploy from a branch**.
4. Choose `main` branch, `/ (root)` folder → **Save**.
5. Your site will be live at `https://<username>.github.io/<repo>/`.

> The `.nojekyll` file is already included — it tells GitHub Pages not to process the site through Jekyll, which would break the `data/` folder.

## Add a custom domain (optional)

1. In **Settings → Pages → Custom domain**, enter your domain.
2. Add a `CNAME` file at the root with just your domain name.
3. Configure your DNS provider to point to GitHub Pages.
