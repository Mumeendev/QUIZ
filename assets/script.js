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
    isAnswered: false
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
        console.log('Sound error:', error);
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
        audioElements.background.currentTime = 0;
        backgroundMusicPlaying = false;
    } catch (error) {
        console.log('Background music pause error:', error);
    }
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
const QUESTIONS_PER_GAME = 25; // Number of questions per quiz session
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
    loadQuestion();
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

    // Update prize ladder
    updatePrizeLadder();

    // Start timer
    gameState.timeLeft = timerLimits[gameState.currentQuestion];
    startTimer();

    // Reset answer state
    gameState.isAnswered = false;

    // Add fade-in animation
    questionText.parentElement.classList.add('fade-in');
    setTimeout(() => {
        questionText.parentElement.classList.remove('fade-in');
    }, 500);

    // Play question load sound
    playSound('click');
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
        wonPrizeEl.textContent = prizeLevels[questions.length - 1];
        playSound('win');
        stopBackgroundMusic();
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

        wonPrizeEl.textContent = guaranteedPrize;
        playSound('lose');
        stopBackgroundMusic();
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
        isAnswered: false
    };

    // Reset lifeline buttons
    lifelineBtns.forEach(btn => btn.classList.remove('used'));

    // Reset screens
    resultScreen.classList.remove('active');
    quizScreen.classList.add('active');
    
    // Play start sound and restart background music
    playSound('start');
    playBackgroundMusic();

    loadQuestion();
}

// ===== INITIALIZE =====
loadQuestions();
