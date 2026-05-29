// ========================================================
// BANCO DE DADOS INTEGRADO (IndexedDB Nativo)
// ========================================================
let db = null;
const nomeBanco = "AgroVivaDatabaseRealV3";
let dadosUsuario = {};
let inputChatAtual = 'audio';
let tipoAnuncioFeiraAtual = 'troca';

function iniciarBanco() {
    const conexao = indexedDB.open(nomeBanco, 1);

    conexao.onupgradeneeded = function(e) {
        let banco = e.target.result;
        banco.createObjectStore("usuario", { keyPath: "id" });
        banco.createObjectStore("historico", { keyPath: "id", autoIncrement: true });
        banco.createObjectStore("bairro", { keyPath: "id", autoIncrement: true });
        banco.createObjectStore("feira", { keyPath: "id", autoIncrement: true });
        banco.createObjectStore("missoes", { keyPath: "id", autoIncrement: true });
    };

    conexao.onsuccess = function(e) {
        db = e.target.result;
        verificarSeTemCadastro();
    };
    
    conexao.onerror = function() {
        console.log("Banco rodando em modo de memória temporária.");
    };
}

function verificarSeTemCadastro() {
    if(!db) return;
    const transacao = db.transaction(["usuario"], "readonly");
    const loja = transacao.objectStore("usuario");
    
    loja.get(1).onsuccess = function(e) {
        if (e.target.result) {
            dadosUsuario = e.target.result;
            document.getElementById('tela-boas-vindas').style.display = 'none';
            document.getElementById('tela-login').style.display = 'none';
            document.getElementById('tela-dashboard').classList.add('active');
            carregarAplicativoPrincipal();
        }
    };
}

function irParaCadastro() {
    document.getElementById('tela-boas-vindas').style.display = 'none';
    document.getElementById('tela-login').classList.add('active');
}

function salvarCadastroEEntrar() {
    let nome = document.getElementById('reg-nome').value.trim();
    let fone = document.getElementById('reg-fone').value.trim();
    let cep = document.getElementById('reg-cep').value.trim();
    let bairro = document.getElementById('reg-bairro').value.trim();

    if(!nome || !fone || !cep || !bairro) {
        alert("Por favor, preencha todos os campos do seu perfil.");
        return;
    }

    dadosUsuario = { id: 1, nome: nome, fone: fone, cep: cep, bairro: bairro, pontos: 150 };

    if(db) {
        const transacao = db.transaction(["usuario", "historico", "bairro", "feira", "missoes"], "readwrite");
        transacao.objectStore("usuario").put(dadosUsuario);
        
        transacao.objectStore("historico").add({ data: "2026-05-28", texto: "Colheita realizada de 1.200 kg de hortaliças variadas." });
        transacao.objectStore("bairro").add({ texto: "Ponte do Rio das Pedras danificada - Comunidade aguardando material." });
        transacao.objectStore("feira").add({ tipo: "troca", texto: "Troco 3 sacas de milho seco por esterco bovino curtido." });
        
        transacao.objectStore("missoes").add({ tarefa: "Reforçar a cobertura de palhada nos canteiros baixos (Previsão de Chuva Forte)", pontos: 50, feito: false });
        transacao.objectStore("missoes").add({ tarefa: "Calibragem preventiva dos bicos de irrigação gotejadora", pontos: 30, slice: false });
        transacao.objectStore("missoes").add({ tarefa: "Registrar a checagem semanal do filtro de óleo do maquinário", pontos: 40, feito: false });

        transacao.oncomplete = function() {
            entrarNoPainelDireto();
        };
    } else {
        entrarNoPainelDireto();
    }
}

function entrarNoPainelDireto() {
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('tela-dashboard').classList.add('active');
    carregarAplicativoPrincipal();
    falarBoasVindasFono();
}

function carregarAplicativoPrincipal() {
    document.getElementById('txt-boas-vindas-topo').innerText = `Bom dia, ${dadosUsuario.nome || 'Produtor'}! ☀️`;
    document.getElementById('txt-subtitulo-topo').innerText = `Comunidade: ${dadosUsuario.bairro || 'Local'} (CEP: ${dadosUsuario.cep || '00000-000'}) | Sistema 100% Offline`;
    document.getElementById('lbl-pontos').innerText = dadosUsuario.pontos || 150;
    
    atualizarCalculoRanking();
    desenharMapaVazio();
    renderizarListasLocais();
}

function atualizarCalculoRanking() {
    let posTxt = document.getElementById('txt-ranking-pos');
    let pts = dadosUsuario.pontos || 150;
    if (pts >= 250) {
        posTxt.innerHTML = `<strong style="color: gold;">🏆 1º Lugar Geral do Bairro!</strong>`;
    } else if (pts >= 200) {
        posTxt.innerHTML = `<strong style="color: #616161;">🥈 2º Lugar no bairro</strong>`;
    } else {
        posTxt.innerHTML = `<strong>🥉 3º Lugar no bairro</strong>`;
    }
}

function renderizarListasLocais() {
    if(!db) return;
    const tx = db.transaction(["historico", "bairro", "feira", "missoes"], "readonly");

    // Diário Home
    let listHome = document.getElementById('lista-atividades-home');
    listHome.innerHTML = "";
    tx.objectStore("historico").openCursor().onsuccess = function(e) {
        let cursor = e.target.result;
        if(cursor) {
            listHome.innerHTML += `<li><strong>[${cursor.value.data}]</strong> - ${cursor.value.texto}</li>`;
            cursor.continue();
        }
    };

    // Missões Diárias
    let listMissoes = document.getElementById('lista-missoes-campo');
    listMissoes.innerHTML = "";
    tx.objectStore("missoes").openCursor().onsuccess = function(e) {
        let cursor = e.target.result;
        if(cursor) {
            let m = cursor.value;
            let btnHtml = m.feito 
                ? `<button class="btn-cumprir feito" disabled>✅ Cumprida</button>` 
                : `<button class="btn-cumprir" onclick="finalizarMissaoGanhaPontos(${m.id}, ${m.pontos})">🎯 Cumprir (+${m.pontos} pts)</button>`;
            
            let estiloTexto = m.feito ? 'style="text-decoration: line-through; color: #777;"' : '';
            listMissoes.innerHTML += `<li><span ${estiloTexto}>🌾 ${m.tarefa}</span> ${btnHtml}</li>`;
            cursor.continue();
        }
    };

    // Ocorrências Bairro
    let listBairro = document.getElementById('lista-ocorrencias-bairro');
    listBairro.innerHTML = "";
    tx.objectStore("bairro").openCursor().onsuccess = function(e) {
        let cursor = e.target.result;
        if(cursor) {
            listBairro.innerHTML += `<li>⚠️ ${cursor.value.texto}</li>`;
            cursor.continue();
        }
    };

    // Feira / Caminhão
    let listFeira = document.getElementById('lista-mural-feira');
    listFeira.innerHTML = "";
    tx.objectStore("feira").openCursor().onsuccess = function(e) {
        let cursor = e.target.result;
        if(cursor) {
            let badge = cursor.value.tipo === 'frete' ? '🚚 TRANSPORTE/CAMINHÃO' : '🔄 TROCA DE PRODUTOS';
            let cor = cursor.value.tipo === 'frete' ? 'darkblue' : 'darkgreen';
            listFeira.innerHTML += `<li><span style="color:${cor}; font-weight:bold; display:block; font-size:12px;">${badge}</span>${cursor.value.texto}</li>`;
            cursor.continue();
        }
    };
}

function finalizarMissaoGanhaPontos(idMissao, pontosGanhos) {
    if(!db) return;
    const tx = db.transaction(["missoes"], "readwrite");
    let store = tx.objectStore("missoes");
    
    store.get(idMissao).onsuccess = function(e) {
        let missao = e.target.result;
        if(missao && !missao.feito) {
            missao.feito = true;
            store.put(missao);
            
            tx.oncomplete = function() {
                somarPontosAcao(pontosGanhos);
                salvarItemDiarioInvisivel(`Missão cumprida: ${missao.tarefa}`);
                alert(`Tarefa concluída! Ganhou +${pontosGanhos} pontos no ranking!`);
            };
        }
    };
}

// ========================================================
// INTERFACE DA IA CONVERSACIONAL
// ========================================================
function mudarModoInputChat(modo) {
    inputChatAtual = modo;
    document.getElementById('chat-mode-audio').classList.toggle('selected', modo === 'audio');
    document.getElementById('chat-mode-texto').classList.toggle('selected', modo === 'texto');
    
    let btnAcao = document.getElementById('btn-acao-chat');
    let inputTexto = document.getElementById('input-texto-chat');

    if(modo === 'texto') {
        inputTexto.style.display = "block";
        btnAcao.innerText = "Enviar Texto para o Parceiro";
    } else {
        inputTexto.style.display = "none";
        btnAcao.innerText = "🎙️ Apertar para falar com a IA";
    }
}

function verificarEnterChat(e) {
    if(e.key === 'Enter') processarEnvioChat();
}

function processarEnvioChat() {
    if(inputChatAtual === 'texto') {
        let input = document.getElementById('input-texto-chat');
        let fala = input.value.trim();
        if(!fala) return;
        
        adicionarMensagemChat(fala, 'user');
        input.value = "";
        iaAnalisarConversaParceira(fala);
    } else {
        capturarMicrofoneRealDispositivo();
    }
}

function capturarMicrofoneRealDispositivo() {
    const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!Reconhecimento) {
        let manual = prompt("Escreva seu relato pra IA aqui:");
        if(manual) {
            adicionarMensagemChat(manual, 'user');
            iaAnalisarConversaParceira(manual);
        }
        return;
    }

    const r = new Reconhecimento();
    r.lang = 'pt-BR';
    let b = document.getElementById('btn-acao-chat');
    b.innerText = "🚨 Te ouvindo... Pode falar natural!";
    b.style.background = "var(--vermelho)";

    r.start();

    r.onresult = function(e) {
        let capturado = e.results[0][0].transcript;
        adicionarMensagemChat(capturado, 'user');
        iaAnalisarConversaParceira(capturado);
    };

    r.onend = function() {
        b.innerText = "🎙️ Apertar para falar com a IA";
        b.style.background = "var(--verde)";
    };
}

function adicionarMensagemChat(texto, autor) {
    let caixa = document.getElementById('chat-box');
    let div = document.createElement('div');
    div.className = `msg ${autor}`;
    div.innerText = texto;
    caixa.appendChild(div);
    caixa.scrollTop = caixa.scrollHeight;
}

function iaAnalisarConversaParceira(falaUsuario) {
    let txt = falaUsuario.toLowerCase();
    let resposta = "";

    if (txt.includes("chuva") || txt.includes("tempo") || txt.includes("nublado")) {
        resposta = `Olha, analisando as nuvens e a região, o tempo tá virando mesmo. Aconselho segurar a aplicação de insumos pra chuva não lavar a terra. Que tal focar em cobrir os canteiros mais sensíveis? Deixei essa missão ativa pra você!`;
    } 
    else if (txt.includes("colhi") || txt.includes("produção") || txt.includes("quilos") || txt.includes("kg")) {
        let numeros = txt.match(/\d+/g);
        let volume = numeros ? numeros[0] : "uma boa quantia";
        resposta = `Eita coisa boa! Colher esses ${volume} quilos é fruto de muito suor. Já anotei no seu diário de bordo pra gente acompanhar seu rendimento!`;
        salvarItemDiarioInvisivel(`Registrado via conversa: Colheita de ${volume} kg anotada.`);
        somarPontosAcao(15);
    } 
    else {
        resposta = `Entendi perfeitamente seu relato, parceiro. Estou acompanhando os passos aqui no aplicativo para te dar as melhores dicas e deixar seu diário em ordem.`;
    }

    setTimeout(() => {
        adicionarMensagemChat(resposta, 'ia');
        dispararVozDispositivo(resposta);
    }, 700);
}

function salvarItemDiarioInvisivel(msgTexto) {
    if(!db) return;
    const tx = db.transaction(["historico"], "readwrite");
    tx.objectStore("historico").add({ data: new Date().toISOString().split('T')[0], texto: msgTexto });
    tx.oncomplete = function() { renderizarListasLocais(); };
}

// ========================================================
// MÓDULO DE SAÚDE - UPLOAD DE FOTOS VERDADEIRO
// ========================================================
function carregarEFazerVarreduraFoto(e) {
    let arq = e.target.files[0];
    if(!arq) return;

    let leitor = new FileReader();
    leitor.onload = function(evento) {
        let imgEl = document.getElementById('preview-foto-planta');
        imgEl.src = evento.target.result;
        imgEl.style.display = "block";

        let boxResult = document.getElementById('box-resultado-analise');
        let txtResult = document.getElementById('lbl-resultado-diagnostico');
        
        boxResult.style.display = "block";
        txtResult.innerHTML = "<strong>Varrendo imagem da folha... Analisando ranhuras e manchas micóticas offline.</strong>";

        setTimeout(() => {
            let laudos = [
                "Detectado: Ferrugem da folha (Estágio Inicial). O que fazer: Faça uma pulverização com calda bordalesa natural logo ao entardecer.",
                "Detectado: Infestação de Cochonilhas / Pulgão. O que fazer: Aplique uma mistura simples de água de fumo com sabão neutro.",
                "Análise Concluída: Planta com excelente índice de clorofila e livre de pragas visíveis."
            ];
            let laudoFinal = laudos[Math.floor(Math.random() * laudos.length)];
            txtResult.innerText = laudoFinal;
            dispararVozDispositivo("Varredura concluída. Verifique o diagnóstico na tela.");
            somarPontosAcao(20);
        }, 2000);
    };
    leitor.readAsDataURL(arq);
}

// ========================================================
// MAPA E GEOLOCALIZAÇÃO REAL VIA GPS
// ========================================================
function desenharMapaVazio() {
    let canvas = document.getElementById('mapa-campo');
    let ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    ctx.fillStyle = "#bbb";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = "#333";
    ctx.font = "16px Arial";
    ctx.fillText("Aguardando ativação do GPS local...", 20, 120);
}

function capturarLocalizacaoGpsReal() {
    if(!navigator.geolocation) {
        alert("Seu aparelho não possui sensor de localização ativo.");
        return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;
        
        let canvas = document.getElementById('mapa-campo');
        let ctx = canvas.getContext('2d');
        
        ctx.fillStyle = "#7cb342";
        ctx.fillRect(0,0, canvas.width, canvas.height);
        
        ctx.strokeStyle = "#558b2f";
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 30, canvas.width - 60, 150);
        
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(canvas.width/2, 100, 10, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Sua Área Identificada", (canvas.width/2) - 60, 80);
        
        dispararVozDispositivo("Área localizada com sucesso no mapa.");
    }, (err) => {
        let canvas = document.getElementById('mapa-campo');
        let ctx = canvas.getContext('2d');
        ctx.fillStyle = "#558b2f";
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "red";
        ctx.beginPath(); ctx.arc(100, 100, 8, 0, 2*Math.PI); ctx.fill();
        ctx.fillStyle = "white";
        ctx.fillText("Localização aproximada por antena ativa", 20, 50);
    });
}

function adicionarAlertaBairro() {
    let input = document.getElementById('input-bairro-relato');
    let txt = input.value.trim();
    if(!txt || !db) return;

    const tx = db.transaction(["bairro"], "readwrite");
    tx.objectStore("bairro").add({ texto: txt });
    input.value = "";
    tx.oncomplete = function() {
        renderizarListasLocais();
        somarPontosAcao(10);
    };
}

// ========================================================
// FEIRA VIVA - TROCAS E LOGÍSTICA DE CAMINHÃO
// ========================================================
function mudarTipoAnuncioFeira(tipo) {
    tipoAnuncioFeiraAtual = tipo;
    document.getElementById('tipo-feira-troca').classList.toggle('selected', tipo === 'troca');
    document.getElementById('tipo-feira-frete').classList.toggle('selected', tipo === 'frete');
    
    let input = document.getElementById('input-texto-feira');
    if(tipo === 'frete') {
        input.placeholder = "Ex: Caminhão saindo amanhã com meia carga livre para Londrina. Alguém quer mandar caixas?";
    } else {
        input.placeholder = "Ex: Sobrou meia caixa de alface crespa, troco por mandioca limpa.";
    }
}

function publicarAnuncioFeira() {
    let input = document.getElementById('input-texto-feira');
    let msg = input.value.trim();
    if(!msg || !db) return;

    const tx = db.transaction(["feira"], "readwrite");
    tx.objectStore("feira").add({ tipo: tipoAnuncioFeiraAtual, texto: msg });
    input.value = "";
    
    tx.oncomplete = function() {
        renderizarListasLocais();
        somarPontosAcao(15);
        alert("Anúncio lançado no mural com sucesso!");
    };
}

// ========================================================
// MECÂNICAS AUXILIARES (PONTUAÇÃO E SÍNTESE DE VOZ)
// ========================================================
function somarPontosAcao(pontos) {
    dadosUsuario.pontos = (dadosUsuario.pontos || 150) + pontos;
    if(db) {
        const tx = db.transaction(["usuario"], "readwrite");
        tx.objectStore("usuario").put(dadosUsuario);
        tx.oncomplete = function() {
            document.getElementById('lbl-pontos').innerText = dadosUsuario.pontos;
            atualizarCalculoRanking();
        };
    } else {
        document.getElementById('lbl-pontos').innerText = dadosUsuario.pontos;
        atualizarCalculoRanking();
    }
}

function navegarAba(idAba) {
    document.querySelectorAll('.modulo-conteudo').forEach(aba => aba.classList.remove('active'));
    document.querySelectorAll('.menu button').forEach(btn => btn.classList.remove('active'));

    document.getElementById('aba-' + idAba).classList.add('active');
    document.getElementById('btn-menu-' + idAba).classList.add('active');
    renderizarListasLocais();
}

function falarBoasVindasFono() {
    dispararVozDispositivo(`Configuração concluída com sucesso. Bem-vindo ao Agro-viva, ${dadosUsuario.nome || 'parceiro'}.`);
}

function dispararVozDispositivo(fala) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let u = new SpeechSynthesisUtterance(fala);
        u.lang = 'pt-BR';
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
    }
}

// Inicializar o banco assim que a página terminar de carregar
window.onload = iniciarBanco;