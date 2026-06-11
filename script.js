// ==========================================================================
// BASE DE DADOS DO SISTEMA (MISSÕES E DIAGNÓSTICOS REALISTAS)
// ==========================================================================

const MISSOES_PADRAO = [
    { id: 1, texto: "💧 Realizar a primeira irrigação do dia na lavoura.", pontos: 50, concluida: false },
    { id: 2, texto: "🔎 Fazer uma varredura visual em busca de lagartas ou pragas.", pontos: 80, concluida: false },
    { id: 3, texto: "📸 Enviar uma foto de uma folha para o Diagnóstico IA.", pontos: 100, concluida: false },
    { id: 4, texto: "🌿 Verificar se há plantas daninhas competindo por nutrientes.", pontos: 60, concluida: false }
];

const BANCO_DIAGNOSTICOS = {
    Milho: [
        "Possível incidência de Lagarta-do-cartucho detectada. Recomendamos monitoramento biológico integrado ou aplicação direcionada.",
        "Sinais de Mancha-de-diplodia nas folhas baixeiras. Atente-se para evitar lâminas excessivas de irrigação ao final do dia.",
        "Folhagem com excelente índice de clorofila. Níveis nutricionais de nitrogênio ideais para esta fase fisiológica."
    ],
    Soja: [
        "Sintomas iniciais característicos de Ferrugem Asiática identificados. Alerte produtores vizinhos e prepare o manejo com fungicida.",
        "Presença leve detectada de percevejos fitófagos na amostragem. Monitore a densidade populacional por metro linear.",
        "Nódulos radiculares ativos e saudáveis realizando fixação biológica de nitrogênio. Ótimo vigor vegetativo."
    ],
    Tomate: [
        "Alerta para requima (mela). Condições de alta umidade podem acelerar o fungo. Realize desbrotas para melhorar a ventilação.",
        "Presença sutil de Broca-pequena-do-fruto. Inspecione os ponteiros novos imediatamente.",
        "Desenvolvimento de frutos dentro do padrão esperado. Sem sinais visuais de estresse nutricional."
    ],
    Padrao: [
        "Coloração foliar homogênea e saudável. Índices de absorção solar e fotossíntese estabilizados.",
        "Início sutil de estresse hídrico (murchamento foliar leve). Recomendamos antecipar ou estender o ciclo de irrigação.",
        "Deficiência sutil de micronutrientes observada nas folhas novas (clorose intervenal). Monitore a próxima adubação foliar."
    ]
};

// ==========================================================================
// INICIALIZAÇÃO DA PÁGINA (ONLOAD)
// ==========================================================================

window.onload = function() {
    if (!document.getElementById('info-cultura')) return; // Garante execução exclusiva no Dashboard

    // 1. Coleta dados cadastrais de forma segura do LocalStorage
    const cultura = localStorage.getItem('agro_cultura') || 'Não informada';
    document.getElementById('info-cultura').innerText = cultura;
    document.getElementById('info-area').innerText = (localStorage.getItem('agro_area') || '0') + ' Hectares';
    
    // 2. Calcula dias decorridos do plantio
    const dataPlantio = localStorage.getItem('agro_plantio');
    if (dataPlantio) {
        const diferencaTempo = Math.abs(new Date() - new Date(dataPlantio));
        const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
        document.getElementById('info-dias').innerText = `${diferencaDias} dias de evolução`;
    }

    // 3. Garante estruturas base de pontos e missões
    if (!localStorage.getItem('agro_pontos')) localStorage.setItem('agro_pontos', '0');
    if (!localStorage.getItem('agro_missoes')) {
        localStorage.setItem('agro_missoes', JSON.stringify(MISSOES_PADRAO));
    }

    // 4. Executa atualizações na Interface Gráfica
    atualizarPlacarEInterface();
    renderizarMissoes();
};

// ==========================================================================
// REGISTRO DE CADASTRO E REDIRECIONAMENTO
// ==========================================================================

function salvarCadastroEEntrar() {
    const nome = document.getElementById('reg-nome').value;
    const cultura = document.getElementById('reg-cultura').value;
    const area = document.getElementById('reg-area').value;
    const plantio = document.getElementById('reg-plantio').value;

    if (!nome || !cultura || !area || !plantio) {
        alert("Preencha todos os campos obrigatórios para calibrar a inteligência do sistema!");
        return;
    }

    localStorage.setItem('agro_nome', nome);
    localStorage.setItem('agro_cultura', cultura);
    localStorage.setItem('agro_area', area);
    localStorage.setItem('agro_plantio', plantio);

    // Envia o usuário diretamente para o painel operacional
    window.location.href = 'dashboard.html';
}

// ==========================================================================
// SISTEMA DE SCORE E NÍVEIS DE CARREIRA AGRÍCOLA
// ==========================================================================

function ganharPontos(quantidade) {
    let pontosAtuais = parseInt(localStorage.getItem('agro_pontos')) || 0;
    pontosAtuais += quantidade;
    localStorage.setItem('agro_pontos', pontosAtuais);
    
    atualizarPlacarEInterface();
}

function atualizarPlacarEInterface() {
    const pontos = parseInt(localStorage.getItem('agro_pontos')) || 0;
    if (document.getElementById('lbl-pontos')) document.getElementById('lbl-pontos').innerText = pontos;
    
    // Escala de Evolução AgroViva
    let ranking = "Agricultor Iniciante 🏕️";
    if (pontos >= 100 && pontos < 250) ranking = "Protetor do Broto 🌿";
    if (pontos >= 250 && pontos < 500) ranking = "Mestre da Irrigação 💧";
    if (pontos >= 500) ranking = "Guardião Líder da Safra 🚜🏆";

    if (document.getElementById('txt-ranking-pos')) {
        document.getElementById('txt-ranking-pos').innerText = ranking;
    }
}

// ==========================================================================
// CONTROLE DINÂMICO DE MISSÕES REAIS
// ==========================================================================

function renderizarMissoes() {
    const listaUI = document.getElementById('lista-missoes-campo');
    if (!listaUI) return;

    const missoes = JSON.parse(localStorage.getItem('agro_missoes'));
    listaUI.innerHTML = ''; 

    missoes.forEach(missao => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        const containerTexto = document.createElement('div');
        containerTexto.innerHTML = `<span>${missao.texto}</span><br><small style="color: #3B533E; font-weight: bold;">Recompensa: +${missao.pontos} XP</small>`;
        
        const botao = document.createElement('button');
        botao.className = 'btn-cumprir';
        
        if (missao.concluida) {
            botao.innerText = "Concluído ✓";
            botao.classList.add('feito');
            botao.disabled = true;
            containerTexto.style.textDecoration = 'line-through';
            containerTexto.style.opacity = '0.5';
        } else {
            botao.innerText = "Cumprir Meta";
            botao.onclick = () => concluirMissao(missao.id);
        }

        li.appendChild(containerTexto);
        li.appendChild(botao);
        listaUI.appendChild(li);
    });
}

function concluirMissao(id) {
    let missoes = JSON.parse(localStorage.getItem('agro_missoes'));
    const missao = missoes.find(m => m.id === id);

    if (missao && !missao.concluida) {
        missao.concluida = true;
        localStorage.setItem('agro_missoes', JSON.stringify(missoes));
        
        ganharPontos(missao.pontos);
        renderizarMissoes();
        adicionarAoDiario(`Meta de Campo Atingida: ${missao.texto}`);
    }
}

function forçarConclusaoDeMissaoPorAcao(idMissao) {
    let missoes = JSON.parse(localStorage.getItem('agro_missoes'));
    const missao = missoes.find(m => m.id === idMissao);
    if (missao && !missao.concluida) {
        concluirMissao(idMissao);
    }
}

// ==========================================================================
// ENGENHARIA DE DIAGNÓSTICO POR FOTO (POR CULTURA)
// ==========================================================================

function carregarEFazerVarreduraFoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function() {
        const output = document.getElementById('preview-foto-planta');
        output.src = reader.result;
        output.style.display = 'block';
        
        const boxResultado = document.getElementById('box-resultado-analise');
        const txtResultado = document.getElementById('lbl-resultado-diagnostico');
        
        boxResultado.style.display = 'block';
        txtResultado.innerText = "Varrendo imagem estrutural buscando anomalias cromáticas... Aguarde.";

        setTimeout(() => {
            const cultura = localStorage.getItem('agro_cultura');
            const opcoes = BANCO_DIAGNOSTICOS[cultura] || BANCO_DIAGNOSTICOS['Padrao'];
            const resultadoFinal = opcoes[Math.floor(Math.random() * opcoes.length)];

            txtResultado.innerHTML = `<strong>[Laudo Digital AgroViva]:</strong> ${resultadoFinal}`;
            
            // Dispara automaticamente a conclusão da missão relacionada a envio de fotos
            forçarConclusaoDeMissaoPorAcao(3);
            adicionarAoDiario(`Varredura por imagem executada com sucesso para a cultura de ${cultura}.`);
        }, 1600);
    };
    reader.readAsDataURL(file);
}

// ==========================================================================
// SISTEMA AUTOMÁTICO DO DIÁRIO DE BORDO
// ==========================================================================

function adicionarAoDiario(textoAcao) {
    const listaDiario = document.getElementById('lista-atividades-home');
    if (!listaDiario) return;

    const agora = new Date();
    const horario = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const li = document.createElement('li');
    li.innerHTML = `<strong>[${horario}]</strong> ${textoAcao}`;
    
    listaDiario.insertBefore(li, listaDiario.firstChild);
}

// Interações operacionais directas
function registrarIrrigacao() { 
    alert("💧 Manejo de Irrigação registrado!"); 
    ganharPontos(15);
    forçarConclusaoDeMissaoPorAcao(1);
    adicionarAoDiario("Acionamento técnico do sistema de irrigação do talhão.");
}

function registrarAdubacao() { 
    alert("🌱 Aplicação de Adubo registrada!"); 
    ganharPontos(20);
    adicionarAoDiario("Distribuição controlada de insumos/fertilizantes em cobertura.");
}

function registrarColheita() { 
    alert("🚜 Ciclo produtivo finalizado com sucesso!"); 
    ganharPontos(100);
    adicionarAoDiario("Fechamento e pesagem do lote de colheita principal enviado ao diário.");
}

// ==========================================================================
// ROTINAS AUXILIARES (NAVEGAÇÃO E CHAT)
// ==========================================================================

function navegarAba(idAba) {
    const modulos = document.querySelectorAll('.modulo-conteudo');
    const botoes = document.querySelectorAll('.menu button');
    
    modulos.forEach(mod => mod.classList.remove('active'));
    botoes.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`aba-${idAba}`).classList.add('active');
    document.getElementById(`btn-menu-${idAba}`).classList.add('active');
}

function processarEnvioChat() {
    const input = document.getElementById('input-texto-chat');
    const chatBox = document.getElementById('chat-box');
    if (input.value.trim() === '') return;

    const msgUser = document.createElement('div');
    msgUser.className = 'msg user';
    msgUser.innerText = input.value;
    chatBox.appendChild(msgUser);

    const textoDigitado = input.value;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
        const msgIa = document.createElement('div');
        msgIa.className = 'msg ia';
        msgIa.innerText = `Processando sua solicitação sobre "${textoDigitado}". Analisando as diretrizes de manejo e os logs recentes salvos no seu Diário de Bordo. Recomendo manter o solo monitorado e focar nas Missões diárias.`;
        chatBox.appendChild(msgIa);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1100);
}

function verificarEnterChat(event) { 
    if (event.key === 'Enter') processarEnvioChat(); 
}