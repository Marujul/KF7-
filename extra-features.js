// Extra features with safe audio fallbacks (no external assets required)
// If you later add real audio files under assets/sounds/, replace these with Audio objects.
const sounds = {
    correct: { play: () => Promise.resolve() },
    incorrect: { play: () => Promise.resolve() },
    flip: { play: () => Promise.resolve() }
};

// Timer for quiz
let quizStartTime;
let quizTimer;

function startQuizTimer() {
    quizStartTime = Date.now();
    quizTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('quiz-timer').textContent = 
            `Waktu: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopQuizTimer() {
    clearInterval(quizTimer);
    return Math.floor((Date.now() - quizStartTime) / 1000);
}

// Save progress to localStorage
function saveProgress() {
    const progress = {
        lastCard: currentCardIndex,
        quizAnswers: Array.from(document.querySelectorAll('input[type="radio"]:checked')).map(input => ({
            name: input.name,
            value: input.value
        }))
    };
    localStorage.setItem('japaneseQuizProgress', JSON.stringify(progress));
}

function loadProgress() {
    const saved = localStorage.getItem('japaneseQuizProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        if (progress.lastCard) {
            currentCardIndex = progress.lastCard;
            showFlashcard(currentCardIndex);
        }
        if (progress.quizAnswers) {
            progress.quizAnswers.forEach(answer => {
                const input = document.querySelector(`input[name="${answer.name}"][value="${answer.value}"]`);
                if (input) input.checked = true;
            });
            updateProgressBar();
        }
    }
}

// Motivational streaks
let streak = parseInt(localStorage.getItem('streak') || '0');
let lastVisit = localStorage.getItem('lastVisit');

function updateStreak() {
    const today = new Date().toDateString();
    if (lastVisit !== today) {
        if (lastVisit === new Date(Date.now() - 86400000).toDateString()) {
            streak++;
        } else if (lastVisit !== new Date(Date.now() - 86400000).toDateString()) {
            streak = 1;
        }
        localStorage.setItem('streak', streak.toString());
        localStorage.setItem('lastVisit', today);
        
        if (streak > 1) {
            const streakMsg = document.createElement('div');
            streakMsg.className = 'streak-message';
            streakMsg.innerHTML = `🔥 ${streak} hari berturut-turut! がんばっています！`;
            document.querySelector('header').appendChild(streakMsg);
        }
    }
}

// Enhanced feedback
function showFeedback(type, message) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    feedback.setAttribute('role', 'alert');
    feedback.style.animation = 'fadeInOut 2s forwards';
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
}

// Add these to existing functions:
function checkAnswers() {
    // ... existing checkAnswers code ...
    
    const timeSpent = stopQuizTimer();
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    
    feedback += `\nWaktu: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (score === 10 && timeSpent < 120) {
        feedback += '\n🏆 Kecepatan Sempurna!';
    }
    
    // Save progress
    saveProgress();
    
    // Play sound based on score
    if (score >= 8) {
        sounds.correct.play().catch(() => {});
    } else if (score < 5) {
        sounds.incorrect.play().catch(() => {});
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization code ...
    
    // Add timer to quiz section
    const timerDiv = document.createElement('div');
    timerDiv.id = 'quiz-timer';
    document.querySelector('#latihan h2').after(timerDiv);
    
    // Load saved progress
    loadProgress();
    
    // Update streak
    updateStreak();
    
    // Auto-save progress on changes
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
            saveProgress();
            sounds.flip.play().catch(() => {});
        });
    });
    
    // Start timer when entering quiz section
    document.querySelector('button[onclick="showSection(\'latihan\')"]')
        .addEventListener('click', startQuizTimer);
});