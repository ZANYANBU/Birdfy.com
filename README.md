# Flappy Bird Pro — Sci‑Fi Edition

> **Created by ANBU**  
> A modern single‑page sci‑fi reimagining of Flappy Bird with smooth controls, difficulty modes, local AI chat, and persistent score tracking.

![Gameplay Preview](https://img.shields.io/badge/Status-Ready%20for%20Launch-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🎮 Features

### Game Mechanics
- **Three difficulty modes**: Easy, Medium, Hard with tuned physics
- **Live gravity control**: Real-time slider to adjust game feel
- **Smooth input buffering**: Responsive flap controls with cooldown
- **Persistent scores**: Best score + recent run history in localStorage

### Sci‑Fi UI
- **Neon aesthetic**: Glowing pipes, animated starfield, particle trails
- **Elegant HUD**: Minimal floating controls with glassmorphic panels
- **Dynamic bird**: Rotating sprite with animated wings and thrust particles

### AI Chat Sidebar
- **Comedy interludes**: Random jokes appear during gameplay
- **How-to tips**: Ask the chatbot for controls and strategy
- **Local DeepSeek support**: Optional 1.5B model integration (Ollama/LM Studio)

---

## 🚀 Quick Start

### Run Locally (No Install)
```bash
# Just open the file in your browser
start index.html
```

Or use a local server:
```bash
python -m http.server 8000
# Visit http://localhost:8000
```

### Deploy to GitHub Pages
1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set **Source** to `main` branch `/root`
4. Visit `https://zanyanbu.github.io/Birdfy.com/`

---

## 🎯 Controls

| Key | Action |
|-----|--------|
| **SPACE / ↑** | Flap |
| **ENTER** | Restart after crash |
| **Difficulty buttons** | Switch Easy/Medium/Hard |
| **Gravity slider** | Fine-tune physics |

---

## 🤖 Local AI Setup (Optional)

### Using Ollama
```bash
# Install Ollama (https://ollama.ai)
ollama pull deepseek-r1:1.5b
ollama serve
```

### Using LM Studio
1. Download [LM Studio](https://lmstudio.ai/)
2. Load `deepseek-r1-distill-qwen-1.5b`
3. Start local server (default: `http://localhost:1234`)

### In the UI
1. Open the **Local DeepSeek** section in sidebar
2. Select your preset (Ollama or LM Studio)
3. Click **Test Local Model** to verify
4. Enable the checkbox to activate AI responses

---

## 📁 Project Structure

```
flappy-pro/
├── index.html       # Main page layout
├── styles.css       # Sci-fi styling & responsive design
├── app.js           # Game logic, physics, AI chat
└── README.md        # This file
```

---

## 🛠️ Tech Stack

- **Vanilla JavaScript** – No frameworks, pure DOM + Canvas
- **Web Audio API** – Procedural sound effects
- **localStorage** – Score persistence
- **Fetch API** – Local AI model calls

---

## 🎨 Customization

### Adjust Difficulty
Edit `difficulties` object in `app.js`:
```javascript
const difficulties = {
  easy: { gravity: 0.45, lift: -10.5, pipeGap: 230, pipeFreq: 125, pipeSpeed: 2.8 },
  // ... customize values
};
```

### Change Colors
Update CSS variables in `styles.css`:
```css
:root {
  --accent: #45e6ff;
  --accent-2: #7e7bff;
  --danger: #ff5d9e;
}
```

---

## 🐛 Troubleshooting

**Controls not responding?**
- Hard refresh the page (Ctrl+F5)
- Check browser console for errors

**Best score stuck?**
- Click **Reset Scores** in sidebar
- Clear browser cache

**Local model fails?**
- Verify endpoint URL matches your server
- Check CORS settings
- Test with `curl` first

---

## 📜 License

MIT License — feel free to fork, modify, and distribute.

---

## 🙏 Credits

**Created by V Anbu Chelvan (ANBU)**  
- GitHub: [@ZANYANBU](https://github.com/ZANYANBU)
- Original inspiration: Flappy Bird by Dong Nguyen

**Technologies**:
- Canvas rendering
- Web Audio synthesis
- Local AI inference

---

## 🚀 Roadmap

- [ ] Mobile touch controls
- [ ] Leaderboard API
- [ ] Custom bird skins
- [ ] Multiplayer mode
- [ ] Progressive Web App (PWA)

