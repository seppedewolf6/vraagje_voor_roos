/* ====================================================================
   CONFIG — vul hier je eigen Telegram bot-token en chat ID in.
   Let op: dit blijft zichtbaar voor iedereen die de paginabron bekijkt.
   Gebruik dit alleen voor een persoonlijk, low-stakes paginaatje.
   ==================================================================== */
const TELEGRAM_BOT_TOKEN = '8618514716:AAEP9Q4silk9giSC9FfxNJwFRAwUZe_5mDU';
const TELEGRAM_CHAT_ID = '7669073237';

/* ==================== Achtergrond: zwevende hartjes ==================== */
const floatLayer = document.getElementById('floatLayer');
const HEART_SYMBOLS = ['❤️', '💛', '💕'];

function spawnFloatingHeart() {
    const heart = document.createElement('span');
    heart.className = 'float-heart';
    heart.textContent = HEART_SYMBOLS[Math.floor(Math.random() * HEART_SYMBOLS.length)];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
    heart.style.fontSize = `${1 + Math.random() * 1.4}rem`;
    const duration = 7 + Math.random() * 6;
    heart.style.animationDuration = `${duration}s`;
    floatLayer.appendChild(heart);
    setTimeout(() => heart.remove(), duration * 1000 + 200);
}

setInterval(spawnFloatingHeart, 650);
for (let i = 0; i < 6; i++) setTimeout(spawnFloatingHeart, i * 220);

/* ==================== Stage 5: De ontwijkende "Nee"-knop ==================== */
const buttonRow = document.getElementById('buttonRow');
const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');
const tauntText = document.getElementById('tauntText');

const TAUNT_MESSAGES = [
    'Denk het niet.',
    'Mooie poging.',
    'Zeker van?',
    'Foute knop',
    'Blijf het maar proberen.',
    'Druk maar op ja'
];

let tauntTimeoutId = null;

// Bij hover springt "Nee" naar een willekeurige plek binnen zijn
// begrensde ouder (.button-row), op dezelfde manier als de Aditi-referentie
// een knop binnen .card laat springen.
function dodgeNoButton() {
    const rowRect = buttonRow.getBoundingClientRect();
    const btnRect = btnNo.getBoundingClientRect();

    const maxLeft = Math.max(rowRect.width - btnRect.width - 10, 0);
    const maxTop = Math.max(rowRect.height - btnRect.height - 10, 0);

    btnNo.style.left = `${Math.random() * maxLeft}px`;
    btnNo.style.top = `${Math.random() * maxTop}px`;
}

function showTaunt() {
    const message = TAUNT_MESSAGES[Math.floor(Math.random() * TAUNT_MESSAGES.length)];
    tauntText.textContent = message;
    tauntText.classList.add('is-visible');

    clearTimeout(tauntTimeoutId);
    tauntTimeoutId = setTimeout(() => {
        tauntText.classList.remove('is-visible');
    }, 1400);
}

// mouseenter vuurt zodra de cursor de knop binnenkomt, dus de knop is al
// weg voordat een klik kan landen. Geen mousemove-tracking nodig.
btnNo.addEventListener('mouseenter', dodgeNoButton);

// Mobiel/touch-fallback: een tik laat de knop ook ontsnappen i.p.v. te
// activeren, en telt zelf niet als klik.
btnNo.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dodgeNoButton();
}, { passive: false });

// Vangnet: als de sprong ooit te klein was (bv. heel smal venster) en de
// cursor toch nog op de knop staat, telt een klik nooit als geldige "Nee".
// De knop springt meteen opnieuw weg en er verschijnt kort een plaagtekst.
btnNo.addEventListener('click', (e) => {
    e.preventDefault();
    dodgeNoButton();
    btnNo.classList.add('is-caught');
    setTimeout(() => btnNo.classList.remove('is-caught'), 300);
    showTaunt();
});

btnYes.addEventListener('click', () => {
    goToStage('stage-celebrate');
    setTimeout(() => goToStage('stage-date'), 1600);
});

/* ==================== Stage-navigatie ==================== */
function goToStage(stageId) {
    document.querySelectorAll('.stage').forEach((el) => {
        el.dataset.active = 'false';
    });
    const target = document.getElementById(stageId);
    target.dataset.active = 'true';
}

/* ==================== Stages 1-4: Opener + nieuwsgierigheidshints ==================== */
document.getElementById('btnStart').addEventListener('click', () => {
    goToStage('stage-hint1');
});
document.getElementById('btnHint1Next').addEventListener('click', () => {
    goToStage('stage-hint2');
});
document.getElementById('btnHint2Next').addEventListener('click', () => {
    goToStage('stage-hint3');
});
document.getElementById('btnHint3Next').addEventListener('click', () => {
    goToStage('stage-ask');
});

/* ==================== Stage 7: Datum- en tijdkeuze ==================== */
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');
const btnConfirmDate = document.getElementById('btnConfirmDate');
const dateError = document.getElementById('dateError');
const finalDateText = document.getElementById('finalDateText');

const todayIso = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', todayIso);

function updateConfirmButtonState() {
    btnConfirmDate.disabled = !(dateInput.value && timeInput.value);
    dateError.textContent = '';
}

dateInput.addEventListener('change', updateConfirmButtonState);
timeInput.addEventListener('change', updateConfirmButtonState);

function formatDateNL(isoDate) {
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTimestampNL(date) {
    const datePart = date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
    const timePart = date.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} om ${timePart}`;
}

btnConfirmDate.addEventListener('click', async () => {
    if (!dateInput.value || !timeInput.value) {
        dateError.textContent = 'Kies eerst een datum en een tijdstip.';
        return;
    }

    btnConfirmDate.disabled = true;
    btnConfirmDate.textContent = 'Versturen…';

    const chosenDate = dateInput.value;
    const chosenTime = timeInput.value;
    const confirmedAt = new Date();

    const sent = await sendTelegramNotification(chosenDate, chosenTime, confirmedAt);

    finalDateText.textContent = `Eerste date: ${formatDateNL(chosenDate)} om ${chosenTime}`;
    goToStage('stage-final');

    if (!sent) {
        console.warn('Telegram-melding is niet verstuurd. Controleer bot-token en chat ID in script.js.');
    }
});

/* ==================== Telegram-melding ==================== */
async function sendTelegramNotification(chosenDateIso, chosenTime, confirmedAtDate) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || TELEGRAM_BOT_TOKEN.includes('VUL_HIER')) {
        console.warn('Telegram nog niet geconfigureerd: vul TELEGRAM_BOT_TOKEN en TELEGRAM_CHAT_ID in bovenaan script.js.');
        return false;
    }

    const message =
        `❤️ Goed nieuws!\n` +
        `Ze wilt afspreken met jou!\n\n` +
        `📅 Datum: ${formatDateNL(chosenDateIso)}\n` +
        `🕒 Tijdstip: ${chosenTime}\n` +
        `✅ Bevestigd op: ${formatTimestampNL(confirmedAtDate)}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
            }),
        });
        return response.ok;
    } catch (err) {
        console.error('Telegram-melding versturen mislukt:', err);
        return false;
    }
}