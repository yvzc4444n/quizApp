"use strict";

// ─── Utility ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── ThemeController ──────────────────────────────────────────────────────────

class ThemeController {
  constructor() {
    this._theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this._btn = document.querySelector('[data-theme-toggle]');
    document.documentElement.setAttribute('data-theme', this._theme);
    this._updateIcon();
    this._btn?.addEventListener('click', () => this.toggle());
  }

  toggle() {
    this._theme = this._theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this._theme);
    this._updateIcon();
  }

  _updateIcon() {
    if (!this._btn) return;
    const isDark = this._theme === 'dark';
    this._btn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    this._btn.innerHTML = isDark
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
}

// ─── ConfettiController ───────────────────────────────────────────────────────

class ConfettiController {
  constructor(canvasId) {
    this._canvas = document.getElementById(canvasId);
    this._ctx = this._canvas?.getContext('2d');
    this._particles = [];
    this._animId = null;
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
  }

  _resizeCanvas() {
    if (!this._canvas) return;
    this._canvas.width = window.innerWidth;
    this._canvas.height = window.innerHeight;
  }

  launch(pct) {
    if (pct < 60) return;
    this._particles = [];
    const count = pct >= 90 ? 160 : pct >= 70 ? 100 : 60;
    const colors = ['#01696f','#437a22','#d19900','#a12c7b','#4f98a3','#6daa45'];
    for (let i = 0; i < count; i++) {
      this._particles.push({
        x: Math.random() * this._canvas.width, y: -10,
        w: Math.random() * 8 + 4, h: Math.random() * 4 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2, angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2, drift: (Math.random() - 0.5) * 1.5, opacity: 1,
      });
    }
    if (this._animId) cancelAnimationFrame(this._animId);
    this._animate();
  }

  _animate() {
    if (!this._ctx) return;
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._particles = this._particles.filter(p => p.opacity > 0.05);
    for (const p of this._particles) {
      p.y += p.speed; p.x += p.drift; p.angle += p.spin;
      if (p.y > this._canvas.height * 0.75) p.opacity -= 0.02;
      this._ctx.save();
      this._ctx.globalAlpha = p.opacity;
      this._ctx.translate(p.x, p.y);
      this._ctx.rotate(p.angle);
      this._ctx.fillStyle = p.color;
      this._ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this._ctx.restore();
    }
    if (this._particles.length > 0) {
      this._animId = requestAnimationFrame(() => this._animate());
    } else {
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
  }
}

// ─── CardDeck ─────────────────────────────────────────────────────────────────

class CardDeck {
  constructor(allCards, limit) {
    this._source = allCards;
    this._limit = limit;
    this._cards = [];
    this._index = 0;
    this.reset();
  }

  reset() {
    const shuffled = shuffle(this._source);
    this._cards = this._limit === 'all'
      ? shuffled
      : shuffled.slice(0, Math.min(this._limit, shuffled.length));
    this._index = 0;
  }

  get current() { return this._cards[this._index] ?? null; }
  get total()   { return this._cards.length; }
  get index()   { return this._index; }
  get hasNext() { return this._index < this._cards.length - 1; }
  advance()     { if (this.hasNext) { this._index++; return true; } return false; }
}

// ─── ScoreTracker ─────────────────────────────────────────────────────────────

class ScoreTracker {
  constructor() { this.reset(); }
  reset()     { this._correct = 0; this._wrong = 0; }
  markRight() { this._correct++; }
  markWrong() { this._wrong++; }
  get correct() { return this._correct; }
  get wrong()   { return this._wrong; }
  get total()   { return this._correct + this._wrong; }
  get percent() { return this.total === 0 ? 0 : Math.round((this._correct / this.total) * 100); }
}

// ─── ModeSelector ─────────────────────────────────────────────────────────────

class ModeSelector {
  constructor() {
    this._selected = 10;
    this._btns = document.querySelectorAll('[data-mode]');
    this._btns.forEach(btn => {
      btn.addEventListener('click', () => this._select(btn));
    });
  }

  _select(btn) {
    this._btns.forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
    const val = btn.dataset.mode;
    this._selected = val === 'all' ? 'all' : Number(val);
  }

  setTotalCount(n) {
    const allNum = document.getElementById('mode-all-num');
    const allSub = document.getElementById('mode-all-sub');
    if (allNum) allNum.textContent = n;
    if (allSub) allSub.textContent = 'Fragen';
    // Hide 10/20 options if not enough cards
    this._btns.forEach(btn => {
      const val = btn.dataset.mode;
      if (val !== 'all') {
        const num = Number(val);
        btn.style.display = n < num ? 'none' : '';
      }
    });
  }

  get value() { return this._selected; }
}

// ─── UIState ──────────────────────────────────────────────────────────────────

class UIState {
  constructor() {
    this._screens = {
      start: document.getElementById('screen-start'),
      quiz:  document.getElementById('screen-quiz'),
      stats: document.getElementById('screen-stats'),
    };
  }
  showScreen(name) {
    for (const [key, el] of Object.entries(this._screens)) {
      el.classList.toggle('active', key === name);
    }
  }
}

// ─── FlashcardUI ──────────────────────────────────────────────────────────────

class FlashcardUI {
  constructor() {
    this._card       = document.getElementById('flashcard');
    this._questionEl = document.getElementById('card-question');
    this._answerWrap = document.getElementById('card-answer-wrap');
    this._revealBtn  = document.getElementById('btn-reveal');
    this._answerBtns = document.getElementById('answer-btns');
    this._hintText   = document.getElementById('card-hint-text');
    this._revealed   = false;
  }

  setCard(question, answer) {
    this._revealed = false;
    this._questionEl.textContent = question;
    this._currentAnswer = answer;

    // Reset answer area
    this._answerWrap.style.display = 'none';
    this._answerWrap.innerHTML = '';
    this._revealBtn.style.display = '';
    this._answerBtns.style.display = 'none';

    // Reset hint
    this._hintText.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Drücke <span class="kbd">Leertaste</span> oder <span class="kbd">Enter</span>`;

    // Trigger enter animation
    this._card.classList.remove('card-enter');
    void this._card.offsetWidth;
    this._card.classList.add('card-enter');
  }

  reveal() {
    if (this._revealed) return;
    this._revealed = true;

    // Hide reveal button
    this._revealBtn.style.display = 'none';

    // Show answer section
    this._answerWrap.innerHTML = `
      <div class="card-answer-wrap">
        <span class="card-a-label">Antwort</span>
        <p class="card-a-text">${this._escapeHtml(this._currentAnswer)}</p>
      </div>`;
    this._answerWrap.style.display = '';

    // Show answer buttons
    this._answerBtns.style.display = '';

    // Update hint
    this._hintText.innerHTML = '';
  }

  _escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  get isRevealed() { return this._revealed; }

  bindReveal(handler) {
    this._revealBtn.addEventListener('click', () => handler());
  }
}

// ─── ProgressUI ───────────────────────────────────────────────────────────────

class ProgressUI {
  constructor() {
    this._bar     = document.getElementById('progress-bar');
    this._barAria = document.getElementById('progress-bar-aria');
    this._label   = document.getElementById('progress-label');
    this._pillC   = document.getElementById('pill-correct-num');
    this._pillW   = document.getElementById('pill-wrong-num');
  }
  update(index, total, correct, wrong) {
    const pct = Math.round((index / total) * 100);
    this._bar.style.width = `${pct}%`;
    this._barAria.setAttribute('aria-valuenow', pct);
    this._label.textContent = `Frage ${index + 1} von ${total}`;
    this._pillC.textContent = correct;
    this._pillW.textContent = wrong;
  }
}

// ─── StatsUI ──────────────────────────────────────────────────────────────────

class StatsUI {
  constructor() {
    this._title   = document.getElementById('stats-title');
    this._subtitle= document.getElementById('stats-subtitle');
    this._trophy  = document.getElementById('stats-trophy');
    this._msg     = document.getElementById('result-msg');
    this._ringPct = document.getElementById('ring-pct');
    this._ringProg= document.getElementById('ring-progress');
    this._statC   = document.getElementById('stat-correct');
    this._statW   = document.getElementById('stat-wrong');
    this._statT   = document.getElementById('stat-total');
  }

  render(correct, wrong, total, pct) {
    this._statC.textContent = correct;
    this._statW.textContent = wrong;
    this._statT.textContent = total;

    setTimeout(() => {
      const circumference = 326.7;
      this._ringProg.style.strokeDashoffset = circumference - (pct / 100) * circumference;
      this._animateCount(this._ringPct, 0, pct, '%');
    }, 80);

    if (pct === 100) {
      this._trophy.textContent = '🏆'; this._title.textContent = 'Perfekte Punktzahl!';
      this._subtitle.textContent = `Du hast alle ${total} Karten gemeistert!`;
      this._ringProg.style.stroke = 'var(--color-success)';
      this._msg.textContent = '"Herausragend! Du hast jede Karte in diesem Stapel gemeistert."';
    } else if (pct >= 80) {
      this._trophy.textContent = '🌟'; this._title.textContent = 'Ausgezeichnete Arbeit!';
      this._subtitle.textContent = `${correct} von ${total} richtig`;
      this._ringProg.style.stroke = 'var(--color-primary)';
      this._msg.textContent = '"Großartige Leistung! Noch ein paar Runden und du hast alles verinnerlicht."';
    } else if (pct >= 60) {
      this._trophy.textContent = '👍'; this._title.textContent = 'Guter Fortschritt!';
      this._subtitle.textContent = `${correct} von ${total} richtig`;
      this._ringProg.style.stroke = 'var(--color-primary)';
      this._msg.textContent = '"Solide Leistung - das Wiederholen der kniffligen Karten wird den Unterschied machen."';
    } else if (pct >= 40) {
      this._trophy.textContent = '📚'; this._title.textContent = 'Weiter lernen!';
      this._subtitle.textContent = `${correct} von ${total} richtig`;
      this._ringProg.style.stroke = 'var(--color-warning)';
      this._msg.textContent = '"Du baust die Grundlage auf - bleib dran, dann wird es klick machen."';
    } else {
      this._trophy.textContent = '💪'; this._title.textContent = 'Gerade erst angefangen';
      this._subtitle.textContent = `${correct} von ${total} richtig`;
      this._ringProg.style.stroke = 'var(--color-warning)';
      this._msg.textContent = '"Jeder Experte war einmal ein Anfänger. Versuch es noch einmal - du schaffst das!"';
    }
  }

  _animateCount(el, from, to, suffix = '') {
    const duration = 900, start = performance.now();
    const update = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased) + suffix;
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
}

// ─── QuizApp ──────────────────────────────────────────────────────────────────

class QuizApp {
  constructor() {
    this._ui       = new UIState();
    this._cardUI   = new FlashcardUI();
    this._progress = new ProgressUI();
    this._stats    = new StatsUI();
    this._score    = new ScoreTracker();
    this._mode     = new ModeSelector();
    this._confetti = new ConfettiController('confetti-canvas');
    this._theme    = new ThemeController();
    this._deck     = null;
    this._allCards = [];
    this._bindListeners();
  }

  async init() {
    try {
      const res = await fetch('./questions.json');
      this._allCards = await res.json();
      this._mode.setTotalCount(this._allCards.length);
    } catch (err) {
      console.error('Failed to load questions.json:', err);
    }
    this._ui.showScreen('start');
  }

  _bindListeners() {
    document.getElementById('btn-start')    ?.addEventListener('click', () => this._startQuiz());
    document.getElementById('btn-restart')  ?.addEventListener('click', () => this._startQuiz());
    document.getElementById('btn-back-home')?.addEventListener('click', () => this._ui.showScreen('start'));
    document.getElementById('btn-knew')     ?.addEventListener('click', () => this._answer(true));
    document.getElementById('btn-didnt')    ?.addEventListener('click', () => this._answer(false));
    this._cardUI.bindReveal(() => this._cardUI.reveal());
    this._bindKeyboard();
  }

  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      const quizActive = document.getElementById('screen-quiz').classList.contains('active');
      if (!quizActive) return;
      if (e.target.tagName === 'BUTTON') return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!this._cardUI.isRevealed) this._cardUI.reveal();
          break;
        case 'y':
        case 'Y':
          if (this._cardUI.isRevealed) { e.preventDefault(); this._answer(true); }
          break;
        case 'n':
        case 'N':
          if (this._cardUI.isRevealed) { e.preventDefault(); this._answer(false); }
          break;
      }
    });
  }

  _startQuiz() {
    this._deck = new CardDeck(this._allCards, this._mode.value);
    this._score.reset();
    this._ui.showScreen('quiz');
    this._renderCard();
  }

  _renderCard() {
    const card = this._deck.current;
    if (!card) return;
    this._cardUI.setCard(card.question, card.answer);
    this._progress.update(this._deck.index, this._deck.total, this._score.correct, this._score.wrong);
  }

  _answer(knew) {
    knew ? this._score.markRight() : this._score.markWrong();
    if (this._deck.hasNext) {
      this._deck.advance();
      setTimeout(() => this._renderCard(), 80);
    } else {
      setTimeout(() => this._showStats(), 120);
    }
  }

  _showStats() {
    const { correct, wrong, total, percent } = this._score;
    this._stats.render(correct, wrong, total, percent);
    this._ui.showScreen('stats');
    this._confetti.launch(percent);
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

window.onload = function() {
  const app = new QuizApp();
  app.init();
}