// Substitua com suas credenciais do Supabase
const SUPABASE_URL = 'https://vvlximqucyqsqqfndjmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bHhpbXF1Y3lxc3FxZm5kam14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODYyNzgsImV4cCI6MjA4NDA2MjI3OH0.rZV1D9J4ilJ5Qu8ZZzxAnV6Sy3BQ8loL9JZOldqvr9Y';

// Elementos do DOM
const acceptBtn = document.getElementById('acceptBtn');
const messageDiv = document.getElementById('message');
const hwidDisplay = document.getElementById('hwidDisplay');
const timerFill = document.getElementById('timerFill');
const countdown = document.getElementById('countdown');
const footer = document.querySelector('.footer');

// Timer de 15 segundos
const TIMER_SECONDS = 15;
let timeRemaining = TIMER_SECONDS;
let timerInterval;

// Obter HWID da URL
function getHwidFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const hwid = params.get('hwid');
    
    if (!hwid) {
        document.getElementById('mainCard').innerHTML = `
            <div style="padding: 40px 24px; text-align: center;">
                <h2 style="color: #ff5050; margin-bottom: 12px;">Erro</h2>
                <p style="color: #888888; font-size: 14px;">HWID não fornecido. Acesso inválido.</p>
            </div>
        `;
        return null;
    }
    
    return hwid;
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

        // Esconde o card principal e mostra a tela de sucesso
        document.getElementById('mainCard').classList.add('hidden');
        document.getElementById('successScreen').classList.remove('hidden');
        
        // Fecha a página automaticamente após 2 segundos
        setTimeout(() => {
            window.close();
        }, 2000);
        
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
            
            const timerContainer = document.getElementById('timerContainer');
            timerContainer.classList.add('collapsed'); 
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
    
    if (!hwid) {
        return;
    }
    
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

    const tos = document.querySelector('.tos-content');
    const scrollbarThumb = document.getElementById('scrollbarThumb');
    const track = document.querySelector('.scrollbar-track');

    let targetScrollY = 0;
    let currentScrollY = 0;
    const sensitivity = 1.0; 
    const speed = 0.08; 

    function updateScroll() {
        // 1. Calcular dimensões dinamicamente (caso a janela mude)
        const contentHeight = tos.scrollHeight;
        const viewHeight = tos.clientHeight;
        const maxScroll = contentHeight - viewHeight;

        // 2. Interpolação suave (Lerp)
        const diff = targetScrollY - currentScrollY;
        currentScrollY += diff * speed;

        // Evitar micro-movimentos infinitos
        if (Math.abs(diff) < 0.01) currentScrollY = targetScrollY;

        // 3. Aplicar scroll ao conteúdo
        tos.scrollTop = currentScrollY;

        // 4. Atualizar Scrollbar Visual
        if (maxScroll > 0) {
            track.style.display = 'block';
            const trackHeight = track.clientHeight;
            
            // Altura proporcional do thumb
            const thumbHeight = Math.max((viewHeight / contentHeight) * trackHeight, 30);
            scrollbarThumb.style.height = `${thumbHeight}px`;

            // Posição proporcional do thumb
            const scrollPercent = currentScrollY / maxScroll;
            const thumbPosition = scrollPercent * (trackHeight - thumbHeight);
            scrollbarThumb.style.top = `${thumbPosition}px`;
        } else {
            track.style.display = 'none';
        }

        requestAnimationFrame(updateScroll);
    }

    // Evento de Scroll do Mouse
    tos.addEventListener('wheel', (e) => {
        e.preventDefault();
        const maxScroll = tos.scrollHeight - tos.clientHeight;
        
        // Atualiza o destino do scroll
        targetScrollY += e.deltaY * sensitivity;
        
        // Limita as bordas
        targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll));
    }, { passive: false });

    // Inicia o loop
    updateScroll();

// Rodar quando a página carregar
document.addEventListener('DOMContentLoaded', init);