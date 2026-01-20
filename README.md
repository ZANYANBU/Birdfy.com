# Flappy Bird Pro  Sci-Fi Edition

> **Created by ANBU**  
> A modern single-page sci-fi reimagining of Flappy Bird with smooth controls, difficulty modes, particle effects, local AI chat, and persistent score tracking.

![Gameplay Preview](https://img.shields.io/badge/Status-Ready%20for%20Launch-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

---

##  Features

### Game Mechanics
- **Three difficulty modes**: Easy, Medium, Hard with tuned physics
- **Live gravity control**: Real-time slider to adjust game feel
- **Smooth input buffering**: Responsive flap controls with cooldown
- **Persistent scores**: Best score + recent run history in localStorage
- **Particle system**: Explosion effects on collision for visual impact

### Sci-Fi UI
- **Neon aesthetic**: Glowing pipes, animated starfield, particle trails
- **Elegant HUD**: Minimal floating controls with glassmorphic panels
- **Dynamic bird**: Rotating sprite with animated wings and thrust particles
- **Collision effects**: 25-particle burst system with gravity and glow

### AI Chat Sidebar
- **Comedy interludes**: Random jokes appear during gameplay
- **How-to tips**: Ask the chatbot for controls and strategy
- **Local DeepSeek support**: Optional 1.5B model integration (Ollama/LM Studio)

---

##  Preview

> **Tip**: Add a screenshot here! Take a screenshot during gameplay and save it as screenshot.png in the repo, then add:
> `markdown
> ![Game Screenshot](screenshot.png)
> `

---

##  Quick Start

### Run Locally (No Install)
`ash
# Just open the file in your browser
start index.html
`

Or use a local server:
`ash
python -m http.server 8000
# Visit http://localhost:8000
`

### Deploy to GitHub Pages
1. Push this repo to GitHub
2. Go to **Settings  Pages**
3. Set **Source** to main branch /root
4. Visit https://zanyanbu.github.io/Birdfy.com/

---

##  Controls

| Key | Action |
|-----|--------|
| **SPACE / ** | Flap |
| **ENTER** | Restart after crash |
| **Difficulty buttons** | Switch Easy/Medium/Hard |
| **Gravity slider** | Fine-tune physics |

---

##  Local AI Setup (Optional)

### Using Ollama
`ash
# Install Ollama (https://ollama.ai)
ollama pull deepseek-r1:1.5b
ollama serve
`

### Using LM Studio
1. Download [LM Studio](https://lmstudio.ai/)
2. Load deepseek-r1-distill-qwen-1.5b
3. Start local server (default: http://localhost:1234)

### In the UI
1. Open the **Local DeepSeek** section in sidebar
2. Select your preset (Ollama or LM Studio)
3. Click **Test Local Model** to verify
4. Enable the checkbox to activate AI responses

---

##  Project Structure

`
flappy-pro/
 index.html       # Main page layout
 styles.css       # Sci-fi styling & responsive design
 app.js           # Game logic, physics, particle system, AI chat
 README.md        # Documentation
 LICENSE          # MIT License
`

---

##  Tech Stack

- **Vanilla JavaScript**  No frameworks, pure DOM + Canvas
- **Web Audio API**  Procedural sound effects
- **localStorage**  Score persistence
- **Fetch API**  Local AI model calls
- **Canvas Particle System**  Collision effects with physics

---

##  Customization

### Adjust Difficulty
Edit difficulties object in pp.js:
`javascript
const difficulties = {
  easy: { gravity: 0.45, lift: -10.5, pipeGap: 230, pipeFreq: 125, pipeSpeed: 2.8 },
  // ... customize values
};
`

### Change Colors
Update CSS variables in styles.css:
`css
:root {
  --accent: #45e6ff;
  --accent-2: #7e7bff;
  --danger: #ff5d9e;
}
`

### Modify Particle Effects
Edit the Particle class in pp.js:
`javascript
class Particle {
  constructor(x, y) {
    this.size = Math.random() * 5 + 2;  // Particle size
    this.speedX = Math.random() * 6 - 3; // Horizontal velocity
    this.speedY = Math.random() * 6 - 3; // Vertical velocity
    // ... customize behavior
  }
}
`

---

##  Troubleshooting

**Controls not responding?**
- Hard refresh the page (Ctrl+F5)
- Check browser console for errors

**Best score stuck?**
- Click **Reset Scores** in sidebar
- Clear browser cache

**Local model fails?**
- Verify endpoint URL matches your server
- Check CORS settings
- Test with curl first

**Particles not showing?**
- Check browser console for Canvas errors
- Ensure hardware acceleration is enabled

---

##  License

MIT License  feel free to fork, modify, and distribute.

See [LICENSE](LICENSE) file for full details.

---

##  Credits

**Created by V Anbu Chelvan (ANBU)**
- GitHub: [@ZANYANBU](https://github.com/ZANYANBU)
- Repository: [Birdfy.com](https://github.com/ZANYANBU/Birdfy.com)
- Original inspiration: Flappy Bird by Dong Nguyen

**Technologies**:
- Canvas rendering with particle physics
- Web Audio synthesis
- Local AI inference

---

##  Roadmap

- [x] Particle system for collision effects
- [ ] Mobile touch controls
- [ ] Screenshot in README
- [ ] Leaderboard API
- [ ] Custom bird skins
- [ ] Multiplayer mode
- [ ] Progressive Web App (PWA)

---

##  Contributing

Issues and pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

