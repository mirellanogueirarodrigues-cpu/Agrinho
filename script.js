// Executa ao salvar o cadastro
function salvarCadastroEEntrar() {
    const nome = document.getElementById('reg-nome').value;
    const cultura = document.getElementById('reg-cultura').value;
    const area = document.getElementById('reg-area').value;
    const plantio = document.getElementById('reg-plantio').value;

    if (!nome || !cultura || !area || !plantio) {
        alert("Por favor, preencha todos os campos essenciais!");
        return;
    }

    // Salva os dados no navegador para usar na página do Dashboard
    localStorage.setItem('agro_nome', nome);
    localStorage.setItem('agro_cultura', cultura);
    localStorage.setItem('agro_area', area);
    localStorage.setItem('agro_plantio', plantio);

    // Redireciona para a página do Dashboard
    window.location.href = 'dashboard.html';
}

// Carrega as informações salvas assim que a página do Dashboard abre
window.onload = function() {
    if (document.getElementById('info-cultura')) {
        document.getElementById('info-cultura').innerText = localStorage.getItem('agro_cultura') || 'Não informada';
        document.getElementById('info-area').innerText = (localStorage.getItem('agro_area') || '0') + ' Hectares';
        
        // Cálculo simples de dias desde o plantio
        const dataPlantio = localStorage.getItem('agro_plantio');
        if (dataPlantio) {
            const dataAtual = new Date();
            const dataP = new Date(dataPlantio);
            const diferencaTempo = Math.abs(dataAtual - dataP);
            const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
            document.getElementById('info-dias').innerText = diferencaDias + ' dias';
        }
    }
};

// Navegação entre as abas internas do Dashboard
function navegarAba(idAba) {
    // Desativa todas as abas e botões
    const modulos = document.querySelectorAll('.modulo-conteudo');
    const botoes = document.querySelectorAll('.menu button');
    
    modulos.forEach(mod => mod.classList.remove('active'));
    botoes.forEach(btn => btn.classList.remove('active'));

    // Ativa a aba clicada e o respectivo botão
    document.getElementById(`aba-${idAba}`).classList.add('active');
    document.getElementById(`btn-menu-${idAba}`).classList.add('active');
}

// Lógica básica de envio do Chat
function processarEnvioChat() {
    const input = document.getElementById('input-texto-chat');
    const chatBox = document.getElementById('chat-box');
    
    if (input.value.trim() === '') return;

    // Mensagem do Usuário
    const msgUser = document.createElement('div');
    msgUser.className = 'msg user';
    msgUser.innerText = input.value;
    chatBox.appendChild(msgUser);

    const textoDigitado = input.value;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Resposta Simulada da IA
    setTimeout(() => {
        const msgIa = document.createElement('div');
        msgIa.className = 'msg ia';
        msgIa.innerText = `Recebi sua dúvida sobre "${textoDigitado}". Recomendo verificar os níveis de umidade do solo nesta semana.`;
        chatBox.appendChild(msgIa);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}

function verificarEnterChat(event) {
    if (event.key === 'Enter') {
        processarEnvioChat();
    }
}

// Exibição de foto ao carregar no input file
function carregarEFazerVarreduraFoto(event) {
    const reader = new FileReader();
    reader.onload = function() {
        const output = document.getElementById('preview-foto-planta');
        output.src = reader.result;
        output.style.display = 'block';
        
        // Simulação de Diagnóstico
        document.getElementById('box-resultado-analise').style.display = 'block';
        document.getElementById('lbl-resultado-diagnostico').innerText = "Análise concluída via imagem: Folhagem saudável com coloração padrão. Monitore nos próximos 5 dias.";
    };
    reader.readAsDataURL(event.target.files[0]);
}

// Funções de Registro Auxiliares
function registrarIrrigacao() { alert("💧 Irrigação registrada com sucesso!"); }
function registrarAdubacao() { alert("🌱 Adubação registrada com sucesso!"); }
function registrarColheita() { alert("🚜 Dados de colheita salvos!"); }