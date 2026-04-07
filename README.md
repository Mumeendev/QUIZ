# 💎 Who Wants to Be a Millionaire? Quiz App

A modern, mobile-responsive quiz game inspired by the classic TV show "Who Wants to Be a Millionaire?" Test your knowledge across multiple categories and climb the prize ladder to win $1 Billion!

## ✨ Features

### 🎮 Gameplay
- **25 Questions per game** randomly selected from 50+ questions
- **10 Categories**: Geography, Science, History, Music, Art, Literature, Technology, Sports, Food, Nature
- **Progressive difficulty** with increasing prize money
- **3 Lifelines** to help you along the way:
  - **50:50** - Remove two wrong answers
  - **Ask the Audience** - See simulated poll results
  - **Phone a Friend** - Get a simulated hint

### 🎨 Design
- **Dramatic dark theme** with gold accents
- **Animated hero section** with floating particles and spotlight effects
- **Smooth transitions** and visual feedback
- **Fully responsive** - works on desktop, tablet, and mobile

### 📊 Prize System
- **25 Prize levels** from $100 to $1,000,000,000
- **Milestone checkpoints** at questions 4, 10, and 20
- **Guaranteed prizes** based on milestone completion

## 📁 Project Structure

```
QUIZ/
├── index.html           # Main HTML file
├── README.md            # Project documentation
├── assets/              # Frontend assets
│   ├── style.css        # All styling and animations
│   └── script.js        # Game logic and CSV parser
├── data/                # Game data
│   └── questions.csv    # Quiz questions (50+ questions)
└── docs/                # Additional documentation
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (required for CSV fetching)

### Running the App

**Option 1: Using VS Code Live Server (Recommended)**
1. Install the "Live Server" extension in VS Code
2. Right-click `index.html` and select "Open with Live Server"

**Option 2: Using Python**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open `http://localhost:8000` in your browser

**Option 3: Using Node.js**
```bash
npx serve
```

> ⚠️ **Note**: Due to browser security (CORS), you cannot simply open `index.html` directly. You must use a local web server.

## 📝 Adding Questions

Edit `data/questions.csv` to add or modify questions. Follow this format:

```csv
question,option_a,option_b,option_c,option_d,correct_answer,category
"What is the capital of France?",London,Paris,Berlin,Madrid,B,Geography
```

**Columns:**
- `question` - The quiz question
- `option_a` - Answer choice A
- `option_b` - Answer choice B
- `option_c` - Answer choice C
- `option_d` - Answer choice D
- `correct_answer` - The correct answer (A, B, C, or D)
- `category` - Question category

## 🎯 Game Rules

1. **Answer 25 questions** correctly to win $1,000,000,000
2. **Use lifelines wisely** - each can only be used once
3. **Beat the timer** - time runs out faster on higher levels
4. **Milestone prizes**:
   - Question 4: Guaranteed $500
   - Question 10: Guaranteed $32,000
   - Question 20: Guaranteed $50,000,000

## 🛠️ Customization

### Change Questions Per Game
In `assets/script.js`, modify:
```javascript
const QUESTIONS_PER_GAME = 25; // Change to desired number
```

### Adjust Timer Limits
In `assets/script.js`, edit the `timerLimits` array:
```javascript
const timerLimits = [
    30, 30, 30, 30, 30,       // Questions 1-5 (30 seconds each)
    30, 30, 30, 30, 30,       // Questions 6-10
    30, 30, 30, 30, 45,       // Questions 11-15
    45, 45, 45, 45, 45,       // Questions 16-20
    60, 60, 60, 60, 60        // Questions 21-25 (60 seconds each)
];
```

### Modify Prize Levels
In `assets/script.js`, edit the `prizeLevels` array to customize prize amounts.

## 🎨 Color Scheme

The app uses a custom color palette defined in CSS variables:
- **Primary Dark**: `#0a0e27`
- **Secondary Dark**: `#1a1f3a`
- **Accent Blue**: `#2d4a8c`
- **Accent Gold**: `#ffd700`
- **Success Green**: `#28a745`
- **Danger Red**: `#dc3545`

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 🐛 Troubleshooting

**Questions not loading?**
- Make sure you're using a local web server (not opening file directly)
- Check browser console for errors (F12)
- Verify `data/questions.csv` exists and is properly formatted

**CSS/JS not updating?**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh with Ctrl+F5

## 📄 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Feel free to:
- Add more questions to `data/questions.csv`
- Suggest new features
- Report bugs
- Improve responsiveness

## 🎮 How to Play

1. Click **"PLAY NOW"** to start
2. Read the question carefully
3. Select one of the four answer choices
4. Use lifelines if you need help
5. Answer correctly to advance and win prizes
6. Reach question 25 to win $1 Billion!

---

**Good luck and have fun! 💎**
