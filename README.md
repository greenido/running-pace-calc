# Running Pace Calculator

Hey folks! 👋 As runners, we continually chase that new PR, and sometimes doing the mental math during a tough block of training just doesn't cut it. This is a practical, no-nonsense calculator to figure out exactly what pace you need to hold to hit your goals for standard race distances.

## What?
This tool calculates the required pace to achieve a specific time for popular race distances (10k, Half Marathon, Marathon, 50k, 50M, 100k, 100M). Adjust the sliders, and the expected pace updates in real-time. It's built with simplicity and speed in mind. No fluff.

## How Does It Look?

<img src="https://cdn.glitch.com/17a325bd-b2e8-4805-bc29-d62b9d07897b%2FScreen%20Shot%202019-04-23%20at%203.34.05%20PM.png?1556058857202" width="600" alt="Running Pace Calculator Demo preview" />

## Try It out
* **Web App:** Available live at [running-pace-calculator.glitch.me](https://running-pace-calculator.glitch.me/) 🏃🏼‍♀️
* **Chrome Extension:** [Install from the Chrome Web Store](https://chromewebstore.google.com/detail/running-pace-calculator/beofpjkjbfoamcofpnedjamkkocbffoc) 🏃🏽‍♂️

## Under the Hood

The stack is aggressively simple, because overcomplicating a calculator adds zero value:
* **Frontend:** Vanilla HTML/CSS/JS (no framework overhead). Kept lightweight so it loads instantly even on spotty race-day cell connections.
* **Backend:** A minimal Express.js node server to serve static files. 
* **Chrome Extension:** An included Manifest V3 setup wrapping the UI into a quick-access browser popup.

### Local Development

1. Clone the repository.
2. Install dependencies (basically just Express):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Navigate to a localhost port (watch the terminal logs).

### Chrome Extension Installation

To test the extension locally:
1. Open Chrome and head to `chrome://extensions/`
2. Toggle "Developer Mode" in the top right.
3. Click "Load unpacked" and select the `chrome_ext/` directory.

Enjoy the runs and keep chasing that PR! 🏅
