const SUPABASE_URL = 'https://vvlximqucyqsqqfndjmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bHhpbXF1Y3lxc3FxZm5kam14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODYyNzgsImV4cCI6MjA4NDA2MjI3OH0.rZV1D9J4ilJ5Qu8ZZzxAnV6Sy3BQ8loL9JZOldqvr9Y';

const acceptBtn = document.getElementById('acceptBtn');
const messageDiv = document.getElementById('message');
const hwidDisplay = document.getElementById('hwidDisplay');
const timerFill = document.getElementById('timerFill');
const countdown = document.getElementById('countdown');

const TIMER_SECONDS = 15;
let elapsed = 0;

function getHwidFromUrl() {
    return new URLSearchParams(window.location.search).get('hwid') || 'unknown';
}

async function saveAcceptance(hwid) {
    await fetch(`${SUPABASE_URL}/rest/v1/tos_acceptances`, {
        method: 'POST',
        headers: {
            apikey: SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hwid, accepted_at: new Date().toISOString() })
    });

    document.getElementById('mainCard').classList.add('hidden');
    document.getElementById('successScreen').classList.remove('hidden');

    setTimeout(() => window.close(), 2000);
}

function startTimer() {
    const interval = setInterval(() => {
        elapsed += 0.05;
        const remaining = Math.max(0, TIMER_SECONDS - Math.floor(elapsed));
        countdown.textContent = remaining;
        timerFill.style.width = `${(elapsed / TIMER_SECONDS) * 100}%`;

        if (elapsed >= TIMER_SECONDS) {
            clearInterval(interval);
            acceptBtn.disabled = false;
        }
    }, 50);
}

acceptBtn.onclick = () => {
    acceptBtn.disabled = true;
    saveAcceptance(getHwidFromUrl());
};

hwidDisplay.onclick = () => {
    hwidDisplay.classList.toggle('revealed');
};

document.addEventListener('DOMContentLoaded', () => {
    const hwid = getHwidFromUrl();
    hwidDisplay.textContent = hwid.substring(0, 16) + '...';
    startTimer();
});
