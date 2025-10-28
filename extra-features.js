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
    if (quizTimer) return; // already running
    quizStartTime = Date.now();
    const timerEl = document.getElementById('quiz-timer');
    if (!timerEl) return;
    quizTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerEl.textContent = `Waktu: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopQuizTimer() {
    if (!quizTimer) return 0;
    clearInterval(quizTimer);
    quizTimer = null;
    if (!quizStartTime) return 0;
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
// Wrap original checkAnswers to add enhancements (stop timer, save, sounds, feedback)
(function enhanceCheckAnswers(){
    const original = window.checkAnswers;
    window.checkAnswers = function wrappedCheckAnswers(){
        try{
            if (typeof original === 'function') original();
        } catch(err){
            console.error('Original checkAnswers threw:', err);
        }
        // stop timer and compute time
        const timeSpent = stopQuizTimer();
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        // parse numeric score from #score element if present
        const scoreEl = document.getElementById('score');
        let score = null;
        if (scoreEl) {
            const txt = scoreEl.textContent || '';
            const m = txt.match(/(\d+)\//);
            if (m) score = parseInt(m[1], 10);
        }
        // append time info to score element
        if (scoreEl) {
            const timeInfo = `\nWaktu: ${minutes}:${seconds.toString().padStart(2,'0')}`;
            // keep existing innerHTML but add time info in small text
            scoreEl.innerHTML = scoreEl.innerHTML + `<div style="font-size:0.9rem;color:#666;margin-top:6px">${timeInfo}</div>`;
        }
        // extra congrats for fast perfect
        if (score === 10 && timeSpent > 0 && timeSpent < 120 && scoreEl) {
            scoreEl.innerHTML += `<div style="font-size:0.9rem;color:#d48a00">🏆 Kecepatan Sempurna!</div>`;
        }
        // Save progress
        try{ saveProgress(); }catch(e){console.warn('saveProgress failed',e)}
        // Play sounds
        try{
            if (score !== null){
                if (score >= 8) sounds.correct.play().catch(()=>{});
                else if (score < 5) sounds.incorrect.play().catch(()=>{});
            }
        }catch(e){/* noop */}
    };
})();

// Initialize enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add timer to quiz section if not present
    if (!document.getElementById('quiz-timer')){
        const h2 = document.querySelector('#latihan h2');
        if (h2){
            const timerDiv = document.createElement('div');
            timerDiv.id = 'quiz-timer';
            h2.after(timerDiv);
        }
    }

    // Load saved progress (safe if original functions not yet present)
    try{ loadProgress(); } catch(e){ console.warn('loadProgress failed', e); }

    // Update streak
    try{ updateStreak(); } catch(e){ console.warn('updateStreak failed', e); }

    // Auto-save progress on radio changes using delegated listener
    document.addEventListener('change', (ev)=>{
        const t = ev.target;
        if (t && t.matches && t.matches('input[type="radio"]')){
            try{ saveProgress(); } catch(e){/* ignore */}
            try{ sounds.flip.play().catch(()=>{}); } catch(e){}
            // update progress bar if function available
            if (typeof updateProgressBar === 'function') try{ updateProgressBar(); } catch(e){}
        }
    });

    // Start timer when user opens the quiz via the nav button(s)
    const quizButtons = Array.from(document.querySelectorAll('button[onclick]')).filter(b=>b.getAttribute('onclick').includes("showSection('latihan')") || b.getAttribute('onclick').includes('showSection("latihan")'));
    quizButtons.forEach(b=>b.addEventListener('click', ()=>{ startQuizTimer(); }));

    // Also observe when the latihan section becomes visible (class 'visible') so timer starts for keyboard nav
    const target = document.querySelector('main');
    if (target && window.MutationObserver){
        const mo = new MutationObserver(()=>{
            const sec = document.querySelector('section.visible');
            if (sec && sec.id === 'latihan') startQuizTimer();
        });
        mo.observe(target, { attributes:false, childList:true, subtree:true });
    }
});