# 🚀 Flappy Bird Pro – Sci‑Fi Edition

> **Created by ANBU (V Anbu Chelvan)**
> A modern, single‑page **sci‑fi reimagining of Flappy Bird**, built with pure web technologies.
> This project is created **as a tribute and mark of respect to the original creator of Flappy Bird, Dong Nguyen**, whose simple yet brilliant design inspired a generation of developers.

 

---

## 🎮 About the Project

**Flappy Bird Pro – Sci‑Fi Edition** is a modernized browser game that preserves the **core challenge and spirit of Flappy Bird**, while enhancing it with:

* Smooth physics
* Neon sci‑fi visuals
* Particle effects
* Difficulty modes
* Persistent scoring
* Optional **local AI chatbot integration**

This project demonstrates strong fundamentals in **game physics, Canvas rendering, UI/UX design, and JavaScript architecture** — all without using frameworks.

---

## ✨ Highlights

* ⚡ **Pure Vanilla JavaScript** – no libraries, no engines
* 🧠 **Physics‑based gameplay** with tunable gravity & lift
* 🎆 **Custom particle engine** for collision effects
* 💾 **Persistent scores** using localStorage
* 🎨 **Sci‑Fi neon UI** with glassmorphism
* 🤖 **Optional local AI chat** (DeepSeek via Ollama / LM Studio)
* 🔊 **Procedural sound effects** using Web Audio API

---

## 🕹️ Features

### Game Mechanics

* Three difficulty modes: **Easy, Medium, Hard**
* Real‑time **gravity slider** for fine control
* Input buffering & cooldown for smooth flaps
* Restart instantly after crash

### Visuals & Effects

* Animated starfield background
* Glowing pipes & HUD
* Rotating bird sprite with thrust particles
* 25‑particle explosion on collision

### AI Chat Sidebar (Optional)

* Gameplay tips
* Random jokes during play
* Strategy help
* Fully **offline local AI** support

---

## 🧪 Tech Stack & Skills Used

### Core Technologies

* **HTML5 Canvas** – real‑time rendering
* **JavaScript (ES6+)** – game loop, physics, AI calls
* **CSS3** – neon sci‑fi styling & animations
* **Web Audio API** – sound synthesis

### Advanced Concepts Demonstrated

* Game loop & delta‑time physics
* Collision detection
* Particle systems
* State management
* Browser storage APIs
* Local AI inference via HTTP

---

## 📁 Project Structure

```
flappy-pro/
│
├── index.html      # Main game layout
├── styles.css      # Sci‑fi UI & responsive styling
├── app.js          # Game logic, physics, particles, AI chat
├── README.md       # Documentation
├── LICENSE         # MIT License
```

---

## 🚀 Installation & Running Locally

### Option 1: No Install (Fastest)

Simply open the file in your browser:

```
index.html
```

### Option 2: Local Server (Recommended)

Using Python:

```
python -m http.server 8000
```

Then open:

```
http://localhost:8000
```

---

## 🌐 Hosting & Deployment

### GitHub Pages (Free Hosting)

1. Push the project to GitHub
2. Go to **Repository → Settings → Pages**
3. Set:

   * **Source:** `main` branch
   * **Folder:** `/root`
4. Save

Your game will be live at:

```
https://zanyanbu.github.io/Birdfy.com/
```

---

## 🎮 Controls

| Key                | Action              |
| ------------------ | ------------------- |
| **Space**          | Flap                |
| **Enter**          | Restart after crash |
| Difficulty buttons | Change difficulty   |
| Gravity slider     | Adjust physics      |

---

## 🤖 Local AI Setup (Optional)

### Using Ollama

```
ollama pull deepseek-r1:1.5b
ollama serve
```

### Using LM Studio

1. Download LM Studio
2. Load `deepseek-r1-distill-qwen-1.5b`
3. Start local server (default: `http://localhost:1234`)

### Enable in Game

1. Open **Local DeepSeek** panel
2. Select Ollama or LM Studio
3. Click **Test Local Model**
4. Enable AI responses

---

## 🎨 Customization

### Difficulty Tuning (`app.js`)

```js
const difficulties = {
  easy:   { gravity: 0.45, lift: -10.5, pipeGap: 230, pipeFreq: 125, pipeSpeed: 2.8 },
  medium: { gravity: 0.6,  lift: -11.5, pipeGap: 200, pipeFreq: 110, pipeSpeed: 3.2 },
  hard:   { gravity: 0.8,  lift: -12.5, pipeGap: 170, pipeFreq: 95,  pipeSpeed: 3.8 }
};
```

### Theme Colors (`styles.css`)

```css
:root {
  --accent: #45e6ff;
  --accent-2: #7e7bff;
  --danger: #ff5d9e;
}
```

---

##

---

## 🏆 Credits & Respect

**Original Game Inspiration**
🎮 *Flappy Bird* by **Dong Nguyen**
This project exists purely as a **technical tribute and learning project**, honoring the simplicity and brilliance of the original game.

**Developer**
👨‍💻 **V Anbu Chelvan (ANBU)**

* GitHub: [https://github.com/ZANYANBU](https://github.com/ZANYANBU)
* Repository: [https://github.com/ZANYANBU/Birdfy.com](https://github.com/ZANYANBU/Birdfy.com)

---

## 📜 License

MIT License — free to fork, learn from, and improve.

---

⭐ If you like this project, consider starring the repo and sharing it with fellow developers.
