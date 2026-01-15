// Substitua com suas credenciais do Supabase
const SUPABASE_URL = 'https://vvlximqucyqsqqfndjmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bHhpbXF1Y3lxc3FxZm5kam14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODYyNzgsImV4cCI6MjA4NDA2MjI3OH0.rZV1D9J4ilJ5Qu8ZZzxAnV6Sy3BQ8loL9JZOldqvr9Y';

// Elementos do DOM
const acceptBtn = document.getElementById('acceptBtn');
const messageDiv = document.getElementById('message');
const hwidDisplay = document.getElementById('hwidDisplay');
const timerFill = document.getElementById('timerFill');
const countdown = document.getElementById('countdown');

// Timer de 15 segundos
const TIMER_SECONDS = 15;
let timeRemaining = TIMER_SECONDS;
let timerInterval;

// Obter HWID da URL
function getHwidFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('hwid') || 'unknown';
}

// Mostrar mensagem
function showMessage(text, isSuccess = false) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${isSuccess ? 'success' : 'error'}`;
}

// Limpar mensagem
function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.className = 'message hidden';
}

// Verificar se HWID já aceitou
async function checkIfAccepted(hwid) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/tos_acceptances?hwid=eq.${hwid}`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                }
            }
        );

        const data = await response.json();
        return data.length > 0;
    } catch (error) {
        console.error('Erro ao verificar:', error);
        return false;
    }
}

// Salvar aceitação
async function saveAcceptance(hwid) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/tos_acceptances`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hwid: hwid,
                    accepted_at: new Date().toISOString(),
                })
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao salvar');
        }

        // Encolhe o card principal suavemente
        document.getElementById('mainCard').classList.add('shrinking');
        
        // Aguarda a animação terminar antes de esconder
        setTimeout(() => {
            document.getElementById('mainCard').classList.add('hidden');
            document.getElementById('successScreen').classList.remove('hidden');
        }, 500);
        
        // Fecha a página automaticamente após 2 segundos
        setTimeout(() => {
            window.close();
        }, 2500);
        
        return true;
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro ao processar sua aceitacao. Tente novamente.', false);
        return false;
    }
}

// Iniciar o timer
function startTimer() {
    timeRemaining = TIMER_SECONDS;
    acceptBtn.disabled = true;
    let elapsedTime = 0;

    timerInterval = setInterval(() => {
        elapsedTime += 0.05;
        timeRemaining = TIMER_SECONDS - Math.floor(elapsedTime);
        countdown.textContent = Math.max(0, timeRemaining);
        
        // Animar a barra de progresso de forma smooth
        const progress = (elapsedTime / TIMER_SECONDS) * 100;
        timerFill.style.width = Math.min(progress, 100) + '%';

        if (elapsedTime >= TIMER_SECONDS) {
            clearInterval(timerInterval);
            acceptBtn.disabled = false;
            
            // Dispara animação de fade-out e depois remove
            const timerContainer = document.getElementById('timerContainer');
            timerContainer.classList.add('fade-out');
            
            setTimeout(() => {
                timerContainer.classList.add('hidden');
            }, 500);
        }
    }, 50);
}

// Event listeners
acceptBtn.addEventListener('click', async () => {
    const hwid = getHwidFromUrl();
    acceptBtn.disabled = true;
    acceptBtn.textContent = 'Processando...';

    const success = await saveAcceptance(hwid);

    if (!success) {
        acceptBtn.disabled = false;
        acceptBtn.textContent = 'Aceitar Termos';
    }
});

// Toggle HWID blur/reveal ao clicar
hwidDisplay.addEventListener('click', () => {
    hwidDisplay.classList.toggle('revealed');
});

// Inicializar página
async function init() {
    const hwid = getHwidFromUrl();
    hwidDisplay.textContent = hwid.substring(0, 16) + '...';

    const alreadyAccepted = await checkIfAccepted(hwid);
    
    if (alreadyAccepted) {
        // Se já foi aceito, mostrar tela de sucesso
        document.getElementById('mainCard').classList.add('hidden');
        document.getElementById('successScreen').classList.remove('hidden');
    } else {
        // Senão, iniciar o timer
        startTimer();
    }
}

// Rodar quando a página carregar
document.addEventListener('DOMContentLoaded', init);