# Running Pace Calculator

Hey folks! 👋 As runners, we continually chase that new PR, and sometimes doing the mental math during a tough block of training just doesn't cut it. This is a practical, no-nonsense calculator to figure out exactly what pace you need to hold to hit your goals for standard race distances.

**It works with no signal.** Install it to your home screen and it opens at the start line whether or not the cell network does.

## What?

### Pace

Works in both directions:

* **Goal time → pace.** "I want to run a 3:30 marathon — what pace is that?"
* **Goal pace → time.** "I can hold 8:00/mi — what does that finish in?"

Pick miles or kilometres, choose a preset distance (5K through 100 miles) or type
a custom one, and drag the sliders. You get a full **splits table** of cumulative
times, with an optional **negative split** strategy — nobody actually races even
pace, so the table can front-load the effort you're planning to give away. **Print
pace band** prints just the splits, sized for a strip you can carry.

The URL tracks whatever you've selected, so you can paste a link to a friend and
they'll see the same numbers. The **Copy link** button grabs it for you.

### Predict & Train

Enter a race you have actually run and get:

* **Predicted times** at every other distance, via Riegel's endurance formula.
* **Training paces** — easy, marathon, threshold, interval, repetition — from the
  Daniels/Gilbert VO₂ model, along with your VDOT.

Both are estimates. They assume you have trained for the distance, and they know
nothing about hills, heat, or how your taper went.

## Try It out

* **Web App:** [greenido.github.io/running-pace-calc](https://greenido.github.io/running-pace-calc/) 🏃🏼‍♀️
* **Chrome Extension:** [Install from the Chrome Web Store](https://chromewebstore.google.com/detail/running-pace-calculator/beofpjkjbfoamcofpnedjamkkocbffoc) 🏃🏽‍♂️

## Under the Hood

The stack is aggressively simple, because overcomplicating a calculator adds zero value:

* **Vanilla HTML/CSS/JS**, no framework and no build step for the site itself.
* **Fully static.** `public/` is deployed straight to GitHub Pages by
  [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to
  `main`/`master` — but only after `npm test` passes. There is no server.
* **Offline-first.** A service worker caches the whole app shell, so it keeps
  working with no connection. It serves from cache and refreshes in the
  background, so a deploy lands on the next visit.
* **Chrome Extension:** Manifest V3, bundling the app locally rather than
  loading a remote page.

| File | Job |
| :--- | :--- |
| [`public/js/pace.js`](public/js/pace.js) | Pace math — parsing, formatting, splits, split strategy. |
| [`public/js/predict.js`](public/js/predict.js) | Riegel prediction and the VDOT/training-pace model. |
| [`public/js/main.js`](public/js/main.js) | Reads the forms, renders results, syncs the URL. |
| [`public/sw.js`](public/sw.js) | Service worker. Cache list lives here. |

The two model files are pure functions with no DOM access, which is what makes
them directly testable.

### Local Development

The page uses ES modules and a service worker, so it needs to be served over
HTTP — opening `index.html` from the filesystem won't work.

```bash
npm start
```

That serves `public/` on <http://localhost:3000>. Any static server does the job.

> If you change a file and don't see it, the service worker is doing its job.
> Hard-reload, or untick *Application → Service Workers → Bypass for network* in
> DevTools.

### Tests

```bash
npm test
```

Node's built-in test runner, no dependencies. Covers the pace math (including the
rounding case that used to render a 7.999 min/mi pace as `7:60`), the split
strategy, and the prediction models against Daniels' published VDOT tables.

### Chrome Extension

The extension bundles the app instead of pointing at a URL, so it opens instantly,
works offline, and can't be broken by the site moving. `chrome_ext/app/` is
generated and gitignored — `public/` is the only source.

```bash
npm run build:ext
```

Then in Chrome:

1. Head to `chrome://extensions/`
2. Toggle "Developer Mode" in the top right.
3. Click "Load unpacked" and select the `chrome_ext/` directory.

To publish, bump `version` in `package.json` (the build script copies it into the
manifest), run `npm run build:ext`, then zip and upload `chrome_ext/`.

Enjoy the runs and keep chasing that PR! 🏅
