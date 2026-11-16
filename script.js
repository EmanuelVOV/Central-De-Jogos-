const STORAGE_CODIGOS = "central_roblox_codigos_v1";
const STORAGE_UPDATES = "central_roblox_updates_v1";

let jogoSelecionado = "todos";
let statusSelecionado = "todos";
let tipoFormulario = "codigo";

// Exemplos iniciais para os 4 jogos (você pode editar, adicionar ou apagar)
const codigosIniciais = [
    { id: 1, jogo: "Blox Fruits", codigo: "SUB2GAMERROBOT_EXP1", recompensa: "20 minutos de 2x EXP", status: "ativo" },
    { id: 2, jogo: "Blox Fruits", codigo: "KITT_RESET", recompensa: "Reembolso de Status (Stat Reset)", status: "ativo" },
    { id: 3, jogo: "Jujutsu Shenanigans", codigo: "JJS_UPDATE", recompensa: "Recompensa de atualização / Cash", status: "ativo" },
    { id: 4, jogo: "Stand Out", codigo: "STANDOUT_RELEASE", recompensa: "Itens e giros iniciais", status: "ativo" },
    { id: 5, jogo: "A Bizarre Run", codigo: "BIZARRE_RUN", recompensa: "Bônus de moeda do jogo", status: "ativo" }
];

const updatesIniciais = [
    {
        id: 1,
        jogo: "Jujutsu Shenanigans",
        titulo: "Balanceamento de Personagens & Novos Movesets",
        data: "Recente",
        descricao: "Ajustes de hitbox em habilidades corpo a corpo, correções de bugs no modo ranqueado e melhorias na destruição do mapa."
    },
    {
        id: 2,
        jogo: "Blox Fruits",
        titulo: "Rotação de Frutas & Eventos no Mar",
        data: "Recente",
        descricao: "Acompanhe o estoque do Blox Fruit Dealer (atualiza a cada 4 horas) e eventos de Sea Beasts para farmar Beli e Fragmentos."
    },
    {
        id: 3,
        jogo: "Stand Out",
        titulo: "Novos Stands & Ajustes de Combate",
        data: "Recente",
        descricao: "Adição de novas variações de Stands, melhorias na fluidez dos combos e otimização de servidores."
    },
    {
        id: 4,
        jogo: "A Bizarre Run",
        titulo: "Novas Fases & Obstáculos",
        data: "Recente",
        descricao: "Novos desafios de corrida temática, desbloqueáveis cosméticos e correções de velocidade."
    }
];

let codigos = JSON.parse(localStorage.getItem(STORAGE_CODIGOS)) || codigosIniciais;
let updates = JSON.parse(localStorage.getItem(STORAGE_UPDATES)) || updatesIniciais;

function salvarDados() {
    localStorage.setItem(STORAGE_CODIGOS, JSON.stringify(codigos));
    localStorage.setItem(STORAGE_UPDATES, JSON.stringify(updates));
}

function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    toast.innerText = mensagem;
    toast.classList.remove('escondido');
    setTimeout(() => toast.classList.add('escondido'), 2200);
}

// --- RENDERIZAR CÓDIGOS ---
function renderizarCodigos() {
    const grid = document.getElementById('grid-codigos');
    const busca = document.getElementById('input-busca').value.toLowerCase().trim();
    grid.innerHTML = '';

    const filtrados = codigos.filter(item => {
        const matchJogo = jogoSelecionado === "todos" || item.jogo === jogoSelecionado;
        const matchStatus = statusSelecionado === "todos" || item.status === statusSelecionado;
        const matchBusca = item.codigo.toLowerCase().includes(busca) ||
                           item.recompensa.toLowerCase().includes(busca) ||
                           item.jogo.toLowerCase().includes(busca);
        return matchJogo && matchStatus && matchBusca;
    });

    if (filtrados.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhum código encontrado para este filtro.</p>`;
        return;
    }

    filtrados.forEach(item => {
        const isResgatado = item.status === "resgatado";
        const card = document.createElement('article');
        card.className = `codigo-card ${isResgatado ? 'resgatado' : ''}`;
        card.innerHTML = `
            <div>
                <div class="card-topo">
                    <span class="tag-jogo">${item.jogo}</span>
                    <span class="badge-estado ${isResgatado ? 'estado-resgatado' : 'estado-ativo'}">
                        ${isResgatado ? 'Resgatado' : 'Ativo'}
                    </span>
                </div>
            </div>

            <div class="codigo-box">
                <span class="codigo-texto">${item.codigo}</span>
                <button class="btn-copiar" data-codigo="${item.codigo}">Copiar</button>
            </div>

            <p class="recompensa-texto">${item.recompensa}</p>

            <div class="card-rodape">
                <button class="btn-check" data-id="${item.id}">
                    ${isResgatado ? '↺ Marcar como ativo' : '✓ Marcar como resgatado'}
                </button>
                <button class="btn-excluir" data-id="${item.id}" title="Remover">Remover</button>
            </div>
        `;

        // Copiar código
        card.querySelector('.btn-copiar').addEventListener('click', (e) => {
            const texto = e.target.dataset.codigo;
            navigator.clipboard.writeText(texto);
            mostrarToast(`Código "${texto}" copiado!`);
        });

        // Alternar status resgatado
        card.querySelector('.btn-check').addEventListener('click', () => {
            item.status = item.status === "ativo" ? "resgatado" : "ativo";
            salvarDados();
            renderizarCodigos();
        });

        // Excluir código
        card.querySelector('.btn-excluir').addEventListener('click', () => {
            codigos = codigos.filter(c => c.id !== item.id);
            salvarDados();
            renderizarCodigos();
        });

        grid.appendChild(card);
    });
}

// --- RENDERIZAR ATUALIZAÇÕES ---
function renderizarUpdates() {
    const lista = document.getElementById('lista-updates');
    const busca = document.getElementById('input-busca').value.toLowerCase().trim();
    lista.innerHTML = '';

    const filtrados = updates.filter(u => {
        const matchJogo = jogoSelecionado === "todos" || u.jogo === jogoSelecionado;
        const matchBusca = u.titulo.toLowerCase().includes(busca) ||
                           u.descricao.toLowerCase().includes(busca) ||
                           u.jogo.toLowerCase().includes(busca);
        return matchJogo && matchBusca;
    });

    if (filtrados.length === 0) {
        lista.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhuma atualização registrada para este filtro.</p>`;
        return;
    }

    filtrados.forEach(u => {
        const card = document.createElement('article');
        card.className = 'update-card';
        card.innerHTML = `
            <div class="update-topo">
                <span class="tag-jogo">${u.jogo}</span>
                <div>
                    <span class="update-data">${u.data}</span>
                    <button class="btn-excluir" style="margin-left: 10px;" data-id="${u.id}">Remover</button>
                </div>
            </div>
            <h3>${u.titulo}</h3>
            <p>${u.descricao}</p>
        `;

        card.querySelector('.btn-excluir').addEventListener('click', () => {
            updates = updates.filter(item => item.id !== u.id);
            salvarDados();
            renderizarUpdates();
        });

        lista.appendChild(card);
    });
}

// --- EVENTOS E CONTROLES ---
function configurarEventos() {
    // Filtro de Jogos
    document.querySelectorAll('.jogo-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.jogo-pill').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            jogoSelecionado = btn.dataset.jogo;
            renderizarCodigos();
            renderizarUpdates();
        });
    });

    // Filtro de Status dos Códigos
    document.querySelectorAll('.status-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.status-pill').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            statusSelecionado = btn.dataset.status;
            renderizarCodigos();
        });
    });

    // Abas
    document.querySelectorAll('.aba-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
            document.querySelectorAll('.aba-conteudo').forEach(c => c.classList.remove('ativa'));
            btn.classList.add('ativa');
            document.getElementById(btn.dataset.aba).classList.add('ativa');
        });
    });

    // Busca
    document.getElementById('input-busca').addEventListener('input', () => {
        renderizarCodigos();
        renderizarUpdates();
    });

    // Tema Claro/Escuro
    const btnTema = document.getElementById('btn-tema');
    if (localStorage.getItem('roblox_tema_light') === 'true') {
        document.body.classList.add('light-mode');
    }
    btnTema.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('roblox_tema_light', document.body.classList.contains('light-mode'));
    });

    // Modal
    const modal = document.getElementById('modal-novo');
    document.getElementById('btn-abrir-modal').addEventListener('click', () => modal.classList.remove('escondido'));
    document.getElementById('btn-fechar-modal').addEventListener('click', () => modal.classList.add('escondido'));

    document.querySelectorAll('.tipo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            tipoFormulario = btn.dataset.tipo;

            document.getElementById('campos-codigo').classList.toggle('escondido', tipoFormulario !== 'codigo');
            document.getElementById('campos-update').classList.toggle('escondido', tipoFormulario !== 'update');
        });
    });

    // Salvar Novo Item
    document.getElementById('form-adicionar').addEventListener('submit', (e) => {
        e.preventDefault();
        const jogo = document.getElementById('select-jogo').value;

        if (tipoFormulario === 'codigo') {
            const codigo = document.getElementById('input-codigo').value.trim();
            const recompensa = document.getElementById('input-recompensa').value.trim() || "Recompensa do jogo";
            if (!codigo) return;

            codigos.unshift({
                id: Date.now(),
                jogo,
                codigo,
                recompensa,
                status: "ativo"
            });
            document.getElementById('input-codigo').value = '';
            document.getElementById('input-recompensa').value = '';
            renderizarCodigos();
            mostrarToast("Novo código adicionado!");
        } else {
            const titulo = document.getElementById('input-titulo-update').value.trim();
            const descricao = document.getElementById('input-desc-update').value.trim();
            if (!titulo) return;

            const hoje = new Date().toLocaleDateString('pt-BR');
            updates.unshift({
                id: Date.now(),
                jogo,
                titulo,
                data: hoje,
                descricao: descricao || "Sem detalhes adicionais."
            });
            document.getElementById('input-titulo-update').value = '';
            document.getElementById('input-desc-update').value = '';
            renderizarUpdates();
            mostrarToast("Atualização registrada!");
        }

        salvarDados();
        modal.classList.add('escondido');
    });
}

configurarEventos();
renderizarCodigos();
renderizarUpdates();