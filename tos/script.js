// Substitua com suas credenciais do Supabase
const SUPABASE_URL = 'https://vvlximqucyqsqqfndjmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bHhpbXF1Y3lxc3FxZm5kam14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODYyNzgsImV4cCI6MjA4NDA2MjI3OH0.rZV1D9J4ilJ5Qu8ZZzxAnV6Sy3BQ8loL9JZOldqvr9Y';

// Elementos do DOM
const acceptCheckbox = document.getElementById('acceptCheckbox');
const acceptBtn = document.getElementById('acceptBtn');
const messageDiv = document.getElementById('message');
const hwidDisplay = document.getElementById('hwidDisplay');

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

// Verificar se HWID já aceitou (usando API REST do Supabase)
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

// Salvar aceitação (usando API REST do Supabase)
async function saveAcceptance(hwid) {
    try {
        console.log('Iniciando salvamento...');
        console.log('SUPABASE_URL:', SUPABASE_URL);
        console.log('HWID:', hwid);

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

        console.log('Status da resposta:', response.status);
        const responseText = await response.text();
        console.log('Resposta:', responseText);

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${responseText}`);
        }

        console.log('✓ Salvo com sucesso!');
        showMessage('✓ Termos aceitos! Você pode fechar esta janela e voltar ao aplicativo.', true);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        showMessage('Erro ao processar sua aceitação. Tente novamente.', false);
        return false;
    }
}

// Event listeners
acceptCheckbox.addEventListener('change', () => {
    acceptBtn.disabled = !acceptCheckbox.checked;
    clearMessage();
});

acceptBtn.addEventListener('click', async () => {
    const hwid = getHwidFromUrl();

    if (!acceptCheckbox.checked) {
        showMessage('Por favor, aceite os Termos de Serviço', false);
        return;
    }

    acceptBtn.disabled = true;
    acceptBtn.textContent = 'Processando...';

    const success = await saveAcceptance(hwid);

    if (!success) {
        acceptBtn.disabled = !acceptCheckbox.checked;
        acceptBtn.textContent = 'Aceitar e Continuar';
    }
});

// Inicializar página
async function init() {
    const hwid = getHwidFromUrl();
    hwidDisplay.textContent = hwid.substring(0, 16) + '...';

    const alreadyAccepted = await checkIfAccepted(hwid);
    
    if (alreadyAccepted) {
        showMessage('✓ Você já aceitou os termos! Pode fechar esta janela.', true);
        acceptCheckbox.disabled = true;
        acceptBtn.disabled = true;
        acceptBtn.textContent = 'Já Aceito';
    }
}

// Rodar quando a página carregar
document.addEventListener('DOMContentLoaded', init);