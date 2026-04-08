// ===== GAME DATA =====
let questions = [];

const prizeLevels = [
    "$100", "$200", "$300", "$500", "$1,000",
    "$2,000", "$4,000", "$8,000", "$16,000", "$32,000",
    "$64,000", "$125,000", "$250,000", "$500,000", "$1,000,000",
    "$2,000,000", "$5,000,000", "$10,000,000", "$25,000,000", "$50,000,000",
    "$100,000,000", "$250,000,000", "$500,000,000", "$750,000,000", "$1,000,000,000"
];

const timerLimits = [
    30, 30, 30, 30, 30,       // Questions 1-5
    30, 30, 30, 30, 30,       // Questions 6-10
    30, 30, 30, 30, 45,       // Questions 11-15
    45, 45, 45, 45, 45,       // Questions 16-20
    60, 60, 60, 60, 60        // Questions 21-25
];

// ===== GAME STATE =====
let gameState = {
    currentQuestion: 0,
    score: 0,
    lifelines: {
        fiftyFifty: false,
        audience: false,
        phone: false
    },
    timer: null,
    timeLeft: 30,
    isAnswered: false,
    activePowerUps: [], // Purchased power-ups for this game
    doublePrizeActive: false,
    secondChanceActive: false,
    hintSystemActive: false,
    usedSkipQuestion: false,
    usedRemoveWrong: false,
    usedExtraTime: false,
    extraTimeCount: 0,
    freezeTimerActive: false,
    freezeTimerCount: 0
};

// ===== DOM ELEMENTS =====
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const questionText = document.getElementById('question-text');
const currentQuestionEl = document.getElementById('current-question');
const totalQuestionsEl = document.getElementById('total-questions');
const currentPrizeEl = document.getElementById('current-prize');
const answerBtns = document.querySelectorAll('.answer-btn');
const lifelineBtns = document.querySelectorAll('.lifeline-btn');
const timerText = document.getElementById('timer-text');
const timerProgress = document.querySelector('.timer-progress');
const prizeList = document.getElementById('prize-list');
const audienceModal = document.getElementById('audience-modal');
const phoneModal = document.getElementById('phone-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const resultTitle = document.getElementById('result-title');
const wonPrizeEl = document.getElementById('won-prize');
const soundToggleBtn = document.getElementById('sound-toggle');
const soundOnIcon = document.getElementById('sound-on-icon');
const soundOffIcon = document.getElementById('sound-off-icon');

// ===== AUDIO ELEMENTS =====
const audioElements = {
    start: document.getElementById('audio-start'),
    correct: document.getElementById('audio-correct'),
    wrong: document.getElementById('audio-wrong'),
    timer: document.getElementById('audio-timer'),
    lifeline: document.getElementById('audio-lifeline'),
    win: document.getElementById('audio-win'),
    lose: document.getElementById('audio-lose'),
    click: document.getElementById('audio-click'),
    background: document.getElementById('audio-background')
};

// ===== SOUND SYSTEM =====
let soundEnabled = true;
let backgroundMusicPlaying = false;
let audioContext = null;
let backgroundMusicNodes = [];

function playSound(soundName) {
    if (!soundEnabled || !audioElements[soundName]) return;
    
    try {
        audioElements[soundName].currentTime = 0;
        audioElements[soundName].volume = 0.7;
        audioElements[soundName].play().catch(err => console.log('Audio play failed:', err));
    } catch (error) {
        // If audio file doesn't exist, generate sound programmatically
        if (soundName === 'wrong') {
            playWrongSound();
        } else if (soundName === 'correct') {
            playCorrectSound();
        }
        console.log('Sound error:', error);
    }
}

function playWrongSound() {
    if (!soundEnabled) return;
    
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const now = audioContext.currentTime;
        
        // Create a descending buzzer sound for wrong answer
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.type = 'sawtooth';
        oscillator2.type = 'square';
        
        // Descending frequency
        oscillator1.frequency.setValueAtTime(400, now);
        oscillator1.frequency.exponentialRampToValueAtTime(150, now + 0.5);
        
        oscillator2.frequency.setValueAtTime(350, now);
        oscillator2.frequency.exponentialRampToValueAtTime(120, now + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + 0.6);
        oscillator2.stop(now + 0.6);
        
    } catch (error) {
        console.log('Wrong sound error:', error);
    }
}

function playCorrectSound() {
    if (!soundEnabled) return;
    
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const now = audioContext.currentTime;
        
        // Create an ascending happy sound for correct answer
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        // Ascending frequency
        oscillator1.frequency.setValueAtTime(523.25, now); // C5
        oscillator1.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5
        
        oscillator2.frequency.setValueAtTime(659.25, now + 0.15); // E5
        oscillator2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.4); // C6
        
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator2.start(now + 0.15);
        oscillator1.stop(now + 0.5);
        oscillator2.stop(now + 0.5);
        
    } catch (error) {
        console.log('Correct sound error:', error);
    }
}

function generateBackgroundMusic() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create a simple quiz game background melody
    const duration = 30; // 30 seconds loop
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(2, sampleRate * duration, sampleRate);
    
    // Musical notes for a catchy quiz melody (in Hz)
    const notes = [
        523.25, // C5
        659.25, // E5
        783.99, // G5
        659.25, // E5
        523.25, // C5
        587.33, // D5
        659.25, // E5
        783.99, // G5
        880.00, // A5
        783.99, // G5
        659.25, // E5
        587.33, // D5
        523.25, // C5
        493.88, // B4
        523.25, // C5
        659.25, // E5
    ];
    
    const noteDuration = 0.4; // seconds per note
    const tempo = 120; // BPM
    
    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        let sampleIndex = 0;
        
        for (let note of notes) {
            const samplesPerNote = Math.floor(sampleRate * noteDuration);
            
            for (let i = 0; i < samplesPerNote && sampleIndex < data.length; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 3); // Decay envelope
                
                // Main tone
                let sample = Math.sin(2 * Math.PI * note * t);
                
                // Add harmonics for richer sound
                sample += 0.5 * Math.sin(2 * Math.PI * note * 2 * t);
                sample += 0.3 * Math.sin(2 * Math.PI * note * 3 * t);
                
                // Apply envelope
                sample *= envelope;
                
                // Add bass line
                const bassNote = note / 2;
                sample += 0.4 * Math.sin(2 * Math.PI * bassNote * t);
                
                // Add subtle vibrato
                sample *= 1 + 0.1 * Math.sin(2 * Math.PI * 5 * t);
                
                // Stereo effect
                if (channel === 1) {
                    sample *= 0.9;
                    sample += 0.1 * Math.sin(2 * Math.PI * (note + 2) * t);
                }
                
                data[sampleIndex] = sample * 0.15; // Lower volume for background
                sampleIndex++;
            }
        }
    }
    
    return buffer;
}

function playBackgroundMusic() {
    if (!soundEnabled || !audioElements.background || backgroundMusicPlaying) return;
    
    try {
        audioElements.background.volume = 0.3;
        audioElements.background.currentTime = 0;
        audioElements.background.play().catch(err => console.log('Background music failed:', err));
        backgroundMusicPlaying = true;
    } catch (error) {
        console.log('Background music error:', error);
    }
}

function stopBackgroundMusic() {
    if (!audioElements.background) return;
    
    try {
        audioElements.background.pause();
        backgroundMusicPlaying = false;
    } catch (error) {
        console.log('Background music pause error:', error);
    }
}

function updateSoundIcon() {
    if (soundEnabled) {
        soundOnIcon.style.display = 'block';
        soundOffIcon.style.display = 'none';
        soundToggleBtn.classList.remove('muted');
    } else {
        soundOnIcon.style.display = 'none';
        soundOffIcon.style.display = 'block';
        soundToggleBtn.classList.add('muted');
    }
}

// Sound toggle button event listener
if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
        toggleSound();
        updateSoundIcon();
    });
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    if (!soundEnabled) {
        stopBackgroundMusic();
    } else {
        playBackgroundMusic();
    }
    return soundEnabled;
}

// ===== CSV PARSER =====
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentLine = parseCSVLine(lines[i]);
        
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j].trim()] = currentLine[j];
        }
        result.push(obj);
    }
    return result;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function csvToQuestions(csvData) {
    return csvData.map(row => ({
        question: row.question,
        answers: {
            A: row.option_a,
            B: row.option_b,
            C: row.option_c,
            D: row.option_d
        },
        correct: row.correct_answer,
        category: row.category || 'General'
    }));
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ===== LOAD QUESTIONS FROM CSV =====
const QUESTIONS_PER_GAME = 30; // Number of questions per quiz session
let allQuestions = []; // Store all loaded questions

async function loadQuestions() {
    try {
        const response = await fetch('data/questions.csv');
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        allQuestions = csvToQuestions(parsedData);
        
        // Shuffle and select questions for this game
        questions = shuffleArray(allQuestions).slice(0, QUESTIONS_PER_GAME);
        
        // Update UI with question count
        totalQuestionsEl.textContent = questions.length;
        
        // Update prize levels and timer limits based on question count
        updateDynamicArrays();
        
        // Update hero stats display
        updateHeroStats();
        
        console.log(`Loaded ${allQuestions.length} questions from questions.csv`);
        console.log(`Selected ${questions.length} random questions for this game`);
    } catch (error) {
        console.error('Error loading questions.csv:', error);
        // Fallback: use default questions if CSV fails to load
        loadFallbackQuestions();
    }
}

function loadFallbackQuestions() {
    allQuestions = [
        {
            question: "What is the capital of France?",
            answers: { A: "London", B: "Paris", C: "Berlin", D: "Madrid" },
            correct: "B",
            category: "Geography"
        }
    ];
    questions = shuffleArray(allQuestions).slice(0, QUESTIONS_PER_GAME);
    totalQuestionsEl.textContent = questions.length;
    updateDynamicArrays();
}

function updateHeroStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 3) {
        statNumbers[0].textContent = questions.length; // Questions
        // Keep $1B as top prize
        statNumbers[2].textContent = '3'; // Lifelines
    }
}

function updateDynamicArrays() {
    const numQuestions = questions.length;
    
    // Update prize levels to match question count
    while (prizeLevels.length < numQuestions) {
        const lastPrize = prizeLevels[prizeLevels.length - 1];
        const numericValue = parseInt(lastPrize.replace(/[$,]/g, ''));
        const nextPrize = numericValue * 2;
        prizeLevels.push('$' + nextPrize.toLocaleString());
    }
    
    // Update timer limits to match question count
    while (timerLimits.length < numQuestions) {
        if (timerLimits.length < 15) {
            timerLimits.push(30);
        } else if (timerLimits.length < 20) {
            timerLimits.push(45);
        } else {
            timerLimits.push(60);
        }
    }
}

// ===== EVENT LISTENERS =====
startBtn.addEventListener('click', () => {
    playSound('click');
    startGame();
});
playAgainBtn.addEventListener('click', () => {
    playSound('click');
    resetGame();
});

answerBtns.forEach(btn => {
    btn.addEventListener('click', () => selectAnswer(btn.dataset.answer));
    
    // Add hover sound effect
    btn.addEventListener('mouseenter', () => {
        if (!gameState.isAnswered) {
            playSound('click');
        }
    });
});

lifelineBtns.forEach(btn => {
    btn.addEventListener('click', () => useLifeline(btn.dataset.lifeline));
    
    // Add hover sound effect
    btn.addEventListener('mouseenter', () => {
        if (!btn.classList.contains('used')) {
            playSound('click');
        }
    });
});

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        playSound('click');
        audienceModal.classList.remove('active');
        phoneModal.classList.remove('active');
    });
});

// ===== GAME FUNCTIONS =====

function startGame() {
    if (questions.length === 0) {
        console.error('No questions loaded yet');
        return;
    }
    playSound('start');
    playBackgroundMusic();
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    
    // Initialize power-ups from shop purchases
    initializePowerUps();
    
    loadQuestion();
}

function initializePowerUps() {
    // Check if there are any active power-ups from shop purchases
    if (gameState.activePowerUps && gameState.activePowerUps.length > 0) {
        console.log('Active power-ups for this game:', gameState.activePowerUps);
        
        // Show notification about active power-ups
        if (gameState.activePowerUps.includes('extra-time')) {
            setTimeout(() => showPowerUpNotification('⏱️ Extra Time purchased!'), 500);
        }
        if (gameState.activePowerUps.includes('double-prize')) {
            setTimeout(() => showPowerUpNotification('💰 Double Prize purchased!'), 1000);
        }
        if (gameState.activePowerUps.includes('skip-question')) {
            setTimeout(() => showPowerUpNotification('⏭️ Skip Question available!'), 1500);
            // Add skip button to UI
            addSkipQuestionButton();
        }
        if (gameState.activePowerUps.includes('remove-wrong')) {
            setTimeout(() => showPowerUpNotification('✂️ Remove Wrong purchased!'), 2000);
        }
        if (gameState.activePowerUps.includes('freeze-timer')) {
            setTimeout(() => showPowerUpNotification('❄️ Freeze Timer purchased!'), 2500);
        }
        if (gameState.activePowerUps.includes('second-chance')) {
            setTimeout(() => showPowerUpNotification('🔄 Second Chance available!'), 3000);
        }
        if (gameState.activePowerUps.includes('hint-system')) {
            setTimeout(() => showPowerUpNotification('💡 Hint System activated!'), 3500);
        }
    }
}

function addSkipQuestionButton() {
    // Check if skip button already exists
    if (document.getElementById('skip-question-btn')) return;
    
    const skipBtn = document.createElement('button');
    skipBtn.id = 'skip-question-btn';
    skipBtn.className = 'lifeline-btn';
    skipBtn.title = 'Skip Question';
    skipBtn.innerHTML = '⏭️';
    skipBtn.style.fontSize = '1.5rem';
    
    skipBtn.addEventListener('click', () => {
        if (!gameState.isAnswered && !gameState.usedSkipQuestion) {
            gameState.usedSkipQuestion = true;
            showPowerUpNotification('Question Skipped!');
            playSound('lifeline');
            
            // Move to next question
            if (gameState.currentQuestion < questions.length - 1) {
                gameState.currentQuestion++;
                loadQuestion();
            }
            
            // Disable the button
            skipBtn.style.opacity = '0.3';
            skipBtn.style.pointerEvents = 'none';
        }
    });
    
    // Add to lifelines container
    const lifelines = document.querySelector('.lifelines');
    if (lifelines) {
        lifelines.appendChild(skipBtn);
    }
}

function loadQuestion() {
    const question = questions[gameState.currentQuestion];
    questionText.textContent = question.question;
    currentQuestionEl.textContent = gameState.currentQuestion + 1;

    // Update current prize
    if (gameState.currentQuestion > 0) {
        currentPrizeEl.textContent = prizeLevels[gameState.currentQuestion - 1];
    } else {
        currentPrizeEl.textContent = "$0";
    }

    // Reset answer buttons
    answerBtns.forEach(btn => {
        btn.classList.remove('selected', 'correct', 'wrong', 'disabled', 'hidden');
        const answerKey = btn.dataset.answer;
        btn.querySelector('.answer-text').textContent = question.answers[answerKey];
    });

    // Apply Remove Wrong power-up if available
    if (gameState.activePowerUps.includes('remove-wrong') && !gameState.usedRemoveWrong) {
        gameState.usedRemoveWrong = true;
        const wrongAnswers = ['A', 'B', 'C', 'D'].filter(a => a !== question.correct);
        const toRemove = wrongAnswers.sort(() => Math.random() - 0.5).slice(0, 1);
        toRemove.forEach(answer => {
            const btn = document.querySelector(`[data-answer="${answer}"]`);
            btn.classList.add('hidden');
        });
        showPowerUpNotification('Remove Wrong Answer Activated!');
    }

    // Show hint if hint system is active
    if (gameState.activePowerUps.includes('hint-system') && !gameState.hintSystemActive) {
        gameState.hintSystemActive = true;
        showHint(question);
    }

    // Update prize ladder
    updatePrizeLadder();

    // Start timer - check for extra time and freeze timer
    let baseTime = timerLimits[gameState.currentQuestion];
    
    if (gameState.activePowerUps.includes('extra-time') && gameState.extraTimeCount < 3) {
        baseTime += 15;
        gameState.extraTimeCount++;
        if (gameState.extraTimeCount === 1) {
            showPowerUpNotification('Extra Time Activated! +15 seconds for next 3 questions');
        }
    }
    
    if (gameState.activePowerUps.includes('freeze-timer') && gameState.freezeTimerCount === 0) {
        gameState.freezeTimerActive = true;
        gameState.freezeTimerCount = 20; // 20 seconds frozen
        showPowerUpNotification('Timer Frozen for 20 seconds!');
    }
    
    gameState.timeLeft = baseTime;
    startTimer();

    // Reset answer state
    gameState.isAnswered = false;
    
    // Reset hint system for next question
    gameState.hintSystemActive = false;

    // Add fade-in animation
    questionText.parentElement.classList.add('fade-in');
    setTimeout(() => {
        questionText.parentElement.classList.remove('fade-in');
    }, 500);

    // Play question load sound
    playSound('click');
}

function showHint(question) {
    // Create a subtle hint by highlighting the correct answer slightly
    const correctBtn = document.querySelector(`[data-answer="${question.correct}"]`);
    if (correctBtn) {
        // Add a very subtle glow to hint (not too obvious)
        correctBtn.style.boxShadow = '0 0 5px rgba(255, 215, 0, 0.3)';
        setTimeout(() => {
            correctBtn.style.boxShadow = '';
        }, 1000);
    }
}

function showPowerUpNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'powerup-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ffd700 0%, #b8941f 100%);
        color: #0a0e27;
        padding: 15px 30px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 1.1rem;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.5);
        animation: slideDown 0.5s ease, fadeOut 0.5s ease 2.5s forwards;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function selectAnswer(answer) {
    if (gameState.isAnswered) return;

    gameState.isAnswered = true;
    stopTimer();

    const question = questions[gameState.currentQuestion];
    const selectedBtn = document.querySelector(`[data-answer="${answer}"]`);
    const correctBtn = document.querySelector(`[data-answer="${question.correct}"]`);

    // Mark selected answer
    selectedBtn.classList.add('selected');

    // Disable all buttons
    answerBtns.forEach(btn => btn.classList.add('disabled'));

    // Play click sound when selecting
    playSound('click');

    // Show correct answer after delay
    setTimeout(() => {
        if (answer === question.correct) {
            // Correct answer
            selectedBtn.classList.remove('selected');
            selectedBtn.classList.add('correct');
            gameState.score = gameState.currentQuestion + 1;
            
            // Apply Double Prize if active
            if (gameState.activePowerUps.includes('double-prize') && !gameState.doublePrizeActive) {
                gameState.doublePrizeActive = true;
                showPowerUpNotification('Double Prize Activated! Next correct answer worth 2x!');
            }

            // Play correct sound
            playSound('correct');

            setTimeout(() => {
                if (gameState.currentQuestion < questions.length - 1) {
                    gameState.currentQuestion++;
                    loadQuestion();
                } else {
                    // Won the game!
                    endGame(true);
                }
            }, 1500);
        } else {
            // Wrong answer
            selectedBtn.classList.add('wrong');
            correctBtn.classList.add('correct');

            // Check for Second Chance power-up
            if (gameState.activePowerUps.includes('second-chance') && !gameState.secondChanceActive) {
                gameState.secondChanceActive = true;
                showPowerUpNotification('Second Chance Activated! Try again!');
                
                // Reset the answer selection and give another chance
                setTimeout(() => {
                    selectedBtn.classList.remove('selected', 'wrong');
                    correctBtn.classList.remove('correct');
                    answerBtns.forEach(btn => btn.classList.remove('disabled'));
                    
                    // Remove hidden answers from Remove Wrong
                    answerBtns.forEach(btn => btn.classList.remove('hidden'));
                    
                    gameState.isAnswered = false;
                    // Restart timer
                    gameState.timeLeft = timerLimits[gameState.currentQuestion];
                    startTimer();
                }, 1000);
                
                playSound('lifeline');
                return;
            }

            // Play wrong sound
            playSound('wrong');

            setTimeout(() => {
                endGame(false);
            }, 2000);
        }
    }, 1000);
}

function useLifeline(lifeline) {
    if (gameState.isAnswered) return;

    switch(lifeline) {
        case '5050':
            if (!gameState.lifelines.fiftyFifty) {
                useFiftyFifty();
                gameState.lifelines.fiftyFifty = true;
                document.querySelector('[data-lifeline="5050"]').classList.add('used');
                playSound('lifeline');
            }
            break;
        case 'audience':
            if (!gameState.lifelines.audience) {
                useAudience();
                gameState.lifelines.audience = true;
                document.querySelector('[data-lifeline="audience"]').classList.add('used');
                playSound('lifeline');
            }
            break;
        case 'phone':
            if (!gameState.lifelines.phone) {
                usePhone();
                gameState.lifelines.phone = true;
                document.querySelector('[data-lifeline="phone"]').classList.add('used');
                playSound('lifeline');
            }
            break;
    }
}

function useFiftyFifty() {
    const question = questions[gameState.currentQuestion];
    const wrongAnswers = ['A', 'B', 'C', 'D'].filter(a => a !== question.correct);
    const toRemove = wrongAnswers.sort(() => Math.random() - 0.5).slice(0, 2);

    toRemove.forEach(answer => {
        const btn = document.querySelector(`[data-answer="${answer}"]`);
        btn.classList.add('hidden');
    });
}

function useAudience() {
    const question = questions[gameState.currentQuestion];
    const correctPercent = Math.floor(Math.random() * 40) + 50; // 50-90%
    const remaining = 100 - correctPercent;

    const percentages = {
        [question.correct]: correctPercent
    };

    ['A', 'B', 'C', 'D'].forEach(answer => {
        if (answer !== question.correct) {
            percentages[answer] = 0;
        }
    });

    // Distribute remaining percentage
    let remainingAnswers = ['A', 'B', 'C', 'D'].filter(a => a !== question.correct);
    remainingAnswers.forEach((answer, index) => {
        if (index === remainingAnswers.length - 1) {
            percentages[answer] = remaining - remainingAnswers.slice(0, -1).reduce((sum, a) => sum + percentages[a], 0);
        } else {
            percentages[answer] = Math.floor(Math.random() * (remaining / 2));
        }
    });

    // Update modal
    document.getElementById('poll-a').style.width = `${percentages['A']}%`;
    document.getElementById('percent-a').textContent = `${percentages['A']}%`;
    document.getElementById('poll-b').style.width = `${percentages['B']}%`;
    document.getElementById('percent-b').textContent = `${percentages['B']}%`;
    document.getElementById('poll-c').style.width = `${percentages['C']}%`;
    document.getElementById('percent-c').textContent = `${percentages['C']}%`;
    document.getElementById('poll-d').style.width = `${percentages['D']}%`;
    document.getElementById('percent-d').textContent = `${percentages['D']}%`;

    audienceModal.classList.add('active');
}

function usePhone() {
    const question = questions[gameState.currentQuestion];
    const messages = [
        `I'm pretty confident the answer is ${question.correct}!`,
        `Hmm, let me think... I'd go with ${question.correct}.`,
        `I remember this! It's definitely ${question.correct}.`,
        `Not entirely sure, but I think it's ${question.correct}.`
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('friend-response').textContent = randomMessage;

    phoneModal.classList.add('active');
}

function startTimer() {
    updateTimerDisplay();

    gameState.timer = setInterval(() => {
        // Check if freeze timer is active
        if (gameState.freezeTimerActive && gameState.freezeTimerCount > 0) {
            gameState.freezeTimerCount--;
            if (gameState.freezeTimerCount === 0) {
                gameState.freezeTimerActive = false;
                showPowerUpNotification('⏱️ Timer Unfrozen!');
            }
            // Don't decrease timeLeft while frozen
            updateTimerDisplay();
            return;
        }
        
        gameState.timeLeft--;
        updateTimerDisplay();

        if (gameState.timeLeft <= 0) {
            stopTimer();
            timeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

function updateTimerDisplay() {
    timerText.textContent = gameState.timeLeft;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (gameState.timeLeft / timerLimits[gameState.currentQuestion]) * circumference;
    timerProgress.style.strokeDashoffset = offset;

    // Change color when time is low
    if (gameState.timeLeft <= 10) {
        timerProgress.style.stroke = 'var(--danger-red)';
        // Play timer warning sound at 10 seconds
        if (gameState.timeLeft === 10) {
            playSound('timer');
        }
    } else {
        timerProgress.style.stroke = 'var(--accent-gold)';
    }
}

function timeUp() {
    gameState.isAnswered = true;

    // Show correct answer
    const question = questions[gameState.currentQuestion];
    const correctBtn = document.querySelector(`[data-answer="${question.correct}"]`);
    correctBtn.classList.add('correct');
    answerBtns.forEach(btn => btn.classList.add('disabled'));

    setTimeout(() => {
        endGame(false);
    }, 2000);
}

function updatePrizeLadder() {
    const items = prizeList.querySelectorAll('li');
    items.forEach((item, index) => {
        const level = parseInt(item.dataset.level);
        item.classList.remove('active', 'completed');

        if (level === gameState.currentQuestion + 1) {
            item.classList.add('active');
        } else if (level <= gameState.currentQuestion) {
            item.classList.add('completed');
        }
    });
}

function endGame(won) {
    stopTimer();
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');

    if (won) {
        resultTitle.textContent = "Congratulations!";
        
        // Calculate final prize with double prize power-up if active
        let finalPrize = prizeLevels[questions.length - 1];
        if (gameState.doublePrizeActive) {
            // Double the prize
            const prizeNumber = parseInt(finalPrize.replace(/[$,]/g, ''));
            finalPrize = '$' + (prizeNumber * 2).toLocaleString();
            showPowerUpNotification('🎉 Double Prize Applied! You won ' + finalPrize + '!');
        }
        
        wonPrizeEl.textContent = finalPrize;
        playSound('win');
        stopBackgroundMusic();

        // Set player balance for shop
        setBalanceFromGame(finalPrize);
    } else {
        resultTitle.textContent = "Game Over";
        // Calculate guaranteed prize based on milestones
        let guaranteedPrize = "$0";
        const milestoneLevels = [4, 10, 20];
        const milestonePrizes = ["$500", "$32,000", "$50,000,000"];

        for (let i = milestoneLevels.length - 1; i >= 0; i--) {
            if (gameState.score >= milestoneLevels[i]) {
                guaranteedPrize = milestonePrizes[i];
                break;
            }
        }

        if (gameState.score > 0 && guaranteedPrize === "$0") {
            guaranteedPrize = prizeLevels[gameState.score - 1];
        }
        
        // Apply double prize if active
        if (gameState.doublePrizeActive && guaranteedPrize !== "$0") {
            const prizeNumber = parseInt(guaranteedPrize.replace(/[$,]/g, ''));
            guaranteedPrize = '$' + (prizeNumber * 2).toLocaleString();
            showPowerUpNotification('💰 Double Prize Applied!');
        }

        wonPrizeEl.textContent = guaranteedPrize;

        // Play the lose sound when game is over
        playSound('lose');
        stopBackgroundMusic();

        // Set player balance for shop
        setBalanceFromGame(guaranteedPrize);
    }
}

function resetGame() {
    // Reshuffle and select new questions for this game
    questions = shuffleArray(allQuestions).slice(0, QUESTIONS_PER_GAME);
    totalQuestionsEl.textContent = questions.length;
    updateDynamicArrays();
    updateHeroStats();

    gameState = {
        currentQuestion: 0,
        score: 0,
        lifelines: {
            fiftyFifty: false,
            audience: false,
            phone: false
        },
        timer: null,
        timeLeft: 30,
        isAnswered: false,
        activePowerUps: [], // Clear power-ups on new game
        doublePrizeActive: false,
        secondChanceActive: false,
        hintSystemActive: false,
        usedSkipQuestion: false,
        usedRemoveWrong: false,
        usedExtraTime: false,
        extraTimeCount: 0,
        freezeTimerActive: false,
        freezeTimerCount: 0
    };

    // Reset lifeline buttons
    lifelineBtns.forEach(btn => btn.classList.remove('used'));
    
    // Remove skip question button if it exists
    const skipBtn = document.getElementById('skip-question-btn');
    if (skipBtn) {
        skipBtn.remove();
    }

    // Reset screens
    resultScreen.classList.remove('active');
    quizScreen.classList.add('active');
    
    // Play start sound and restart background music
    playSound('start');
    playBackgroundMusic();

    loadQuestion();
}

// ===== SHOP SYSTEM =====
let playerBalance = 0;
let ownedItems = [];
let selectedItemForPurchase = null;

// Shop items data
const shopItems = [
    // Power-ups
    {
        id: 'extra-time',
        name: 'Extra Time',
        description: 'Add 15 seconds to your timer for the next 3 questions',
        price: 5000,
        category: 'powerups',
        icon: '⏱️',
        type: 'consumable'
    },
    {
        id: 'double-prize',
        name: 'Double Prize',
        description: 'Double the prize money for your next correct answer',
        price: 15000,
        category: 'powerups',
        icon: '💰',
        type: 'consumable'
    },
    {
        id: 'skip-question',
        name: 'Skip Question',
        description: 'Skip the current question and move to the next one',
        price: 10000,
        category: 'powerups',
        icon: '⏭️',
        type: 'consumable'
    },
    {
        id: 'remove-wrong',
        name: 'Remove Wrong',
        description: 'Automatically remove one wrong answer (better than 50:50)',
        price: 8000,
        category: 'powerups',
        icon: '✂️',
        type: 'consumable'
    },
    {
        id: 'freeze-timer',
        name: 'Freeze Timer',
        description: 'Freeze the timer for 20 seconds on your next question',
        price: 12000,
        category: 'powerups',
        icon: '❄️',
        type: 'consumable'
    },
    {
        id: 'second-chance',
        name: 'Second Chance',
        description: 'Get a second chance if you answer incorrectly',
        price: 25000,
        category: 'powerups',
        icon: '🔄',
        type: 'consumable'
    },
    // Themes
    {
        id: 'theme-gold',
        name: 'Golden Theme',
        description: 'Change the game theme to luxurious gold',
        price: 20000,
        category: 'themes',
        icon: '👑',
        type: 'permanent'
    },
    {
        id: 'theme-neon',
        name: 'Neon Lights',
        description: 'Transform the game with vibrant neon colors',
        price: 25000,
        category: 'themes',
        icon: '💡',
        type: 'permanent'
    },
    {
        id: 'theme-space',
        name: 'Space Theme',
        description: 'Play among the stars with a cosmic background',
        price: 30000,
        category: 'themes',
        icon: '🚀',
        type: 'permanent'
    },
    {
        id: 'theme-ocean',
        name: 'Ocean Breeze',
        description: 'Relaxing ocean-themed theme for your game',
        price: 20000,
        category: 'themes',
        icon: '🌊',
        type: 'permanent'
    },
    // Special
    {
        id: 'hint-system',
        name: 'Hint System',
        description: 'Get a subtle hint for each question',
        price: 35000,
        category: 'special',
        icon: '💡',
        type: 'permanent'
    },
    {
        id: 'stats-booster',
        name: 'Stats Booster',
        description: 'Track your performance with detailed statistics',
        price: 15000,
        category: 'special',
        icon: '📊',
        type: 'permanent'
    },
    {
        id: 'custom-name',
        name: 'Custom Player Name',
        description: 'Set your own custom player name',
        price: 10000,
        category: 'special',
        icon: '✏️',
        type: 'permanent'
    },
    {
        id: 'victory-music',
        name: 'Victory Music Pack',
        description: 'Unlock special victory music tracks',
        price: 18000,
        category: 'special',
        icon: '🎵',
        type: 'permanent'
    }
];

// DOM elements for shop
const shopScreen = document.getElementById('shop-screen');
const shopGrid = document.getElementById('shop-grid');
const shopBalanceAmount = document.getElementById('shop-balance-amount');
const shopBtn = document.getElementById('shop-btn');
const backToResultBtn = document.getElementById('back-to-result-btn');
const purchaseModal = document.getElementById('purchase-modal');
const purchaseSuccessModal = document.getElementById('purchase-success-modal');
const confirmPurchaseBtn = document.getElementById('confirm-purchase-btn');
const cancelPurchaseBtn = document.getElementById('cancel-purchase-btn');
const closeSuccessModal = document.getElementById('close-success-modal');
const categoryBtns = document.querySelectorAll('.category-btn');

// Shop functions
function openShop() {
    resultScreen.classList.remove('active');
    shopScreen.classList.add('active');
    updateShopBalance();
    renderShopItems('all');
    playSound('click');
}

function closeShop() {
    shopScreen.classList.remove('active');
    resultScreen.classList.add('active');
    playSound('click');
}

function updateShopBalance() {
    shopBalanceAmount.textContent = formatPrizeAmount(playerBalance);
}

function formatPrizeAmount(amount) {
    if (amount >= 1000000000) {
        return '$' + (amount / 1000000000).toFixed(1) + 'B';
    } else if (amount >= 1000000) {
        return '$' + (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
        return '$' + (amount / 1000).toFixed(1) + 'K';
    } else {
        return '$' + amount.toLocaleString();
    }
}

function renderShopItems(category) {
    shopGrid.innerHTML = '';
    
    const filteredItems = category === 'all' 
        ? shopItems 
        : shopItems.filter(item => item.category === category);
    
    filteredItems.forEach(item => {
        const isOwned = ownedItems.includes(item.id);
        const canAfford = playerBalance >= item.price;
        
        const itemElement = document.createElement('div');
        itemElement.className = `shop-item ${isOwned ? 'owned' : ''}`;
        itemElement.innerHTML = `
            <span class="item-icon">${item.icon}</span>
            <h3 class="item-name">${item.name}</h3>
            <p class="item-description">${item.description}</p>
            <div class="item-price">${isOwned ? 'OWNED' : formatPrizeAmount(item.price)}</div>
            <button class="buy-btn ${isOwned ? 'owned-btn' : ''}" 
                    data-item-id="${item.id}" 
                    ${isOwned || !canAfford ? 'disabled' : ''}>
                ${isOwned ? '✓ Owned' : (!canAfford ? 'Not Enough Funds' : 'Purchase')}
            </button>
        `;
        
        shopGrid.appendChild(itemElement);
    });
    
    // Add event listeners to buy buttons
    const buyBtns = shopGrid.querySelectorAll('.buy-btn:not([disabled])');
    buyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = btn.dataset.itemId;
            initiatePurchase(itemId);
        });
    });
}

function initiatePurchase(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item || ownedItems.includes(itemId) || playerBalance < item.price) {
        return;
    }
    
    selectedItemForPurchase = item;
    
    // Update purchase modal
    document.getElementById('purchase-item-icon').textContent = item.icon;
    document.getElementById('purchase-item-name').textContent = item.name;
    document.getElementById('purchase-item-price').textContent = formatPrizeAmount(item.price);
    document.getElementById('purchase-balance').textContent = formatPrizeAmount(playerBalance);
    
    // Show modal
    purchaseModal.classList.add('active');
    playSound('click');
}

function confirmPurchase() {
    if (!selectedItemForPurchase) return;
    
    // Deduct price from balance
    playerBalance -= selectedItemForPurchase.price;
    
    // Add to owned items
    ownedItems.push(selectedItemForPurchase.id);
    
    // Apply item effect if consumable
    if (selectedItemForPurchase.type === 'consumable') {
        applyConsumableEffect(selectedItemForPurchase);
    }
    
    // Hide purchase modal
    purchaseModal.classList.remove('active');
    
    // Show success modal
    document.getElementById('success-message').textContent = 
        `You've successfully purchased ${selectedItemForPurchase.name}!`;
    purchaseSuccessModal.classList.add('active');
    
    // Update shop
    updateShopBalance();
    renderShopItems(document.querySelector('.category-btn.active').dataset.category);
    
    // Play purchase sound
    playSound('correct');
    
    selectedItemForPurchase = null;
}

function cancelPurchase() {
    purchaseModal.classList.remove('active');
    selectedItemForPurchase = null;
    playSound('click');
}

function closeSuccessAndContinue() {
    purchaseSuccessModal.classList.remove('active');
    playSound('click');
}

function applyConsumableEffect(item) {
    console.log(`Applied consumable: ${item.name}`);
    // Store active power-ups for use in next game
    if (!gameState.activePowerUps) {
        gameState.activePowerUps = [];
    }
    gameState.activePowerUps.push(item.id);
}

function setBalanceFromGame(prize) {
    // Convert prize string to number
    const prizeNumber = parseInt(prize.replace(/[$,]/g, ''));
    playerBalance = prizeNumber;
}

// Shop event listeners
if (shopBtn) {
    shopBtn.addEventListener('click', openShop);
}

if (backToResultBtn) {
    backToResultBtn.addEventListener('click', closeShop);
}

if (confirmPurchaseBtn) {
    confirmPurchaseBtn.addEventListener('click', confirmPurchase);
}

if (cancelPurchaseBtn) {
    cancelPurchaseBtn.addEventListener('click', cancelPurchase);
}

if (closeSuccessModal) {
    closeSuccessModal.addEventListener('click', closeSuccessAndContinue);
}

// Category filter buttons
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderShopItems(btn.dataset.category);
        playSound('click');
    });
});

// ===== INITIALIZE =====
loadQuestions();
