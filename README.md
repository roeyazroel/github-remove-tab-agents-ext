# GitHub Agents Tab Remover

Chrome extension that removes the `Agents` tab from GitHub repository navigation.

## Why this exists

This extension is for users who want a cleaner repository navigation bar and do not use the `Agents` feature.

## What it does

- Runs only on GitHub repository pages.
- Detects and hides the repository `Agents` tab.
- Re-applies automatically after GitHub Turbo/PJAX navigation events.
- Does not modify any data, requests, or repository content.

## Installation (Load Unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder.

## Local checks

```bash
node --check content.js
python3 -m json.tool manifest.json >/dev/null
node --test content.test.js
```

## Privacy

This extension:

- does not collect analytics,
- does not track browsing behavior,
- does not send data to external services.

All logic runs locally in the browser as a content script.

## License

MIT
