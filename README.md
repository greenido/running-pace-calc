# Running Pace Calculator

Hey folks! 👋 As runners, we continually chase that new PR, and sometimes doing the mental math during a tough block of training just doesn't cut it. This is a practical, no-nonsense calculator to figure out exactly what pace you need to hold to hit your goals for standard race distances.

## What?

Works in both directions:

* **Goal time → pace.** "I want to run a 3:30 marathon — what pace is that?"
* **Goal pace → time.** "I can hold 8:00/mi — what does that finish in?"

Pick miles or kilometres, choose a preset distance (5K through 100 miles) or type
a custom one, and drag the sliders. Everything updates live, including a full
**splits table** of cumulative times at every mile/km.

The URL tracks whatever you've selected, so you can paste a link to a friend and
they'll see the same numbers. The **Copy link** button grabs it for you.

## How Does It Look?

<img src="https://cdn.glitch.com/17a325bd-b2e8-4805-bc29-d62b9d07897b%2FScreen%20Shot%202019-04-23%20at%203.34.05%20PM.png?1556058857202" width="600" alt="Running Pace Calculator Demo preview" />

## Try It out

* **Web App:** [greenido.github.io/running-pace-calc](https://greenido.github.io/running-pace-calc/) 🏃🏼‍♀️
* **Chrome Extension:** [Install from the Chrome Web Store](https://chromewebstore.google.com/detail/running-pace-calculator/beofpjkjbfoamcofpnedjamkkocbffoc) 🏃🏽‍♂️

## Under the Hood

The stack is aggressively simple, because overcomplicating a calculator adds zero value:

* **Vanilla HTML/CSS/JS**, no framework and no build step. It loads instantly even on spotty race-day cell connections.
* **Fully static.** `public/` is deployed straight to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`/`master`. There is no server.
* **Chrome Extension:** a Manifest V3 popup that wraps the live site.

The code splits into two files:

| File | Job |
| :--- | :--- |
| [`public/js/pace.js`](public/js/pace.js) | Pure pace math — parsing, formatting, splits. No DOM, so it is directly unit tested. |
| [`public/js/main.js`](public/js/main.js) | Reads the form, renders the results, syncs the URL. |

### Local Development

The page uses ES modules, so it needs to be served over HTTP — opening
`index.html` from the filesystem won't work.

```bash
npm start
```

That serves `public/` on <http://localhost:3000>. Any static server does the job.

### Tests

```bash
npm test
```

Node's built-in test runner, no dependencies. The suite covers the pace math,
including the rounding case that used to render a 7.999 min/mi pace as `7:60`.

### Chrome Extension Installation

To test the extension locally:

1. Open Chrome and head to `chrome://extensions/`
2. Toggle "Developer Mode" in the top right.
3. Click "Load unpacked" and select the `chrome_ext/` directory.

> **Note:** `chrome_ext/popup.html` points at the live GitHub Pages URL. If that
> URL ever moves, the extension has to be re-packaged and re-uploaded — the
> published build embeds whatever URL it was packed with.

Enjoy the runs and keep chasing that PR! 🏅
