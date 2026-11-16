const STORAGE_CODIGOS = "central_roblox_codigos_v2";
const STORAGE_UPDATES = "central_roblox_updates_v2";

let jogoSelecionado = "todos";
let statusSelecionado = "todos";
let tipoFormulario = "codigo";

// Configuração real das Wikis (Fandom API) e páginas dedicadas de cada jogo
const FONTES_JOGOS = [
    {
        jogo: "Blox Fruits",
        wikiDominio: "blox-fruits.fandom.com",
        paginaCodigos: "Codes",
        paginaUpdates: "Updates",
        links: [
            { nome: "Wiki Oficial • Códigos", url: "https://blox-fruits.fandom.com/wiki/Codes" },
            { nome: "Wiki Oficial • Updates", url: "https://blox-fruits.fandom.com/wiki/Updates" },
            { nome: "Pro Game Guides • Códigos", url: "https://progameguides.com/roblox/roblox-blox-fruits-codes/" }
        ]
    },
    {
        jogo: "Jujutsu Shenanigans",
        wikiDominio: "jujutsu-shenanigans.fandom.com",
        paginaCodigos: "Codes",
        paginaUpdates: "Updates",
        links: [
            { nome: "Wiki Oficial • Códigos", url: "https://jujutsu-shenanigans.fandom.com/wiki/Codes" },
            { nome: "Wiki Oficial • Updates", url: "https://jujutsu-shenanigans.fandom.com/wiki/Updates" },
            { nome: "Pro Game Guides • Códigos", url: "https://progameguides.com/roblox/jujutsu-shenanigans-codes/" }
        ]
    },
    {
        jogo: "Stand Out",
        wikiDominio: "stand-out.fandom.com",
        paginaCodigos: "Codes",
        paginaUpdates: "Updates",
        links: [
            { nome: "Wiki Oficial • Códigos", url: "https://stand-out.fandom.com/wiki/Codes" },
            { nome: "Wiki Oficial • Página Principal", url: "https://stand-out.fandom.com/wiki/Stand_Out_Wiki" }
        ]
    },
    {
        jogo: "A Bizarre Run",
        wikiDominio: "a-bizarre-run.fandom.com",
        paginaCodigos: "Codes",
        paginaUpdates: "Updates",
        links: [
            { nome: "Wiki Oficial • Códigos", url: "https://a-bizarre-run.fandom.com/wiki/Codes" },
            { nome: "Wiki Oficial • Página Principal", url: "https://a-bizarre-run.fandom.com/wiki/A_Bizarre_Run_Wiki" }
        ]
    }
];

let codigos = JSON.parse(localStorage.getItem(STORAGE_CODIGOS)) || [];
let updates = JSON.parse(localStorage.getItem(STORAGE_UPDATES)) || [];

function salvarDados() {
    localStorage.setItem(STORAGE_CODIGOS, JSON.stringify(codigos));
    localStorage.setItem(STORAGE_UPDATES, JSON.stringify(updates));
}

function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    toast.innerText = mensagem;
    toast.classList.remove('escondido');
    setTimeout(() => toast.classList.add('escondido'), 2600);
}

// --- EXTRAÇÃO DIRETA DA API DO FANDOM WIKI ---
async function buscarCodigosWikiFandom(fonte) {
    const endpoint = `https://${fonte.wikiDominio}/api.php?action=parse&page=${encodeURIComponent(fonte.paginaCodigos)}&prop=text&format=json&origin=*`;
    const resposta = await fetch(endpoint);
    if (!resposta.ok) throw new Error("Wiki inacessível");

    const json = await resposta.json();
    if (!json.parse || !json.parse.text) return [];

    const doc = new DOMParser().parseFromString(json.parse.text["*"], "text/html");
    const extraidos = [];

    // Varre tabelas padrão das Wikis (wikitable / article-table)
    doc.querySelectorAll("table tr").forEach(tr => {
        const colunas = Array.from(tr.querySelectorAll("td"));
        if (colunas.length < 2) return;

        const textoLinha = tr.innerText.toLowerCase();
        if (textoLinha.includes("expired") || textoLinha.includes("expirado")) return;

        const codeEl = colunas[0].querySelector("code, b, strong") || colunas[0];
        const codigoLimpo = codeEl.innerText.replace(/\[.*?\]/g, "").trim();
        const recompensaLimpa = colunas[1].innerText.replace(/\[.*?\]/g, "").trim();

        // Valida formato típico de código (sem espaços longos e tamanho coerente)
        if (codigoLimpo && codigoLimpo.length >= 3 && codigoLimpo.length <= 35 && !codigoLimpo.includes(" ")) {
            extraidos.push({
                jogo: fonte.jogo,
                codigo: codigoLimpo,
                recompensa: recompensaLimpa || "Recompensa da Wiki",
                fonte: "Wiki Oficial"
            });
        }
    });

    // Fallback: listas (<ul><li>) caso a Wiki não use tabela
    if (extraidos.length === 0) {
        doc.querySelectorAll(".mw-parser-output > ul li").forEach(li => {
            const texto = li.innerText;
            if (texto.toLowerCase().includes("expired")) return;

            const destaque = li.querySelector("code, b, strong");
            if (destaque) {
                const codigoLimpo = destaque.innerText.trim();
                const partes = texto.split(/[-–:]/);
                const recompensa = partes.length > 1 ? partes.slice(1).join("-").trim() : "Recompensa da Wiki";

                if (codigoLimpo.length >= 3 && codigoLimpo.length <= 35 && !codigoLimpo.includes(" ")) {
                    extraidos.push({
                        jogo: fonte.jogo,
                        codigo: codigoLimpo,
                        recompensa,
                        fonte: "Wiki Oficial"
                    });
                }
            }
        });
    }

    return extraidos;
}

async function buscarUpdatesWikiFandom(fonte) {
    // 1. Tenta ler a página dedicada de Updates da Wiki
    const endpointParse = `https://${fonte.wikiDominio}/api.php?action=parse&page=${encodeURIComponent(fonte.paginaUpdates)}&prop=text&format=json&origin=*`;
    const resParse = await fetch(endpointParse);
    const jsonParse = await resParse.json();

    const listaNovidades = [];

    if (jsonParse.parse && jsonParse.parse.text) {
        const doc = new DOMParser().parseFromString(jsonParse.parse.text["*"], "text/html");
        const titulos = doc.querySelectorAll(".mw-parser-output h2, .mw-parser-output h3");

        titulos.forEach((h, idx) => {
            if (idx >= 5) return; // Pega as 5 atualizações mais recentes do topo
            const tituloTexto = h.innerText.replace(/\[edit.*?\]|\[editar.*?\]/gi, "").trim();
            if (!tituloTexto || tituloTexto.toLowerCase().includes("contents") || tituloTexto.toLowerCase().includes("navigation")) return;

            let resumo = "";
            let irmao = h.nextElementSibling;
            while (irmao && !["H2", "H3"].includes(irmao.tagName)) {
                if (irmao.tagName === "UL" || irmao.tagName === "P") {
                    resumo += irmao.innerText.replace(/\[.*?\]/g, "").trim() + "\n";
                }
                if (resumo.length > 320) break;
                irmao = irmao.nextElementSibling;
            }

            if (resumo.trim()) {
                listaNovidades.push({
                    jogo: fonte.jogo,
                    titulo: tituloTexto,
                    data: "Wiki Oficial",
                    descricao: resumo.trim().slice(0, 350) + (resumo.length > 350 ? "..." : "")
                });
            }
        });
    }

    // 2. Fallback: Se a Wiki não tiver página "Updates", busca as edições recentes reais da Wiki
    if (listaNovidades.length === 0) {
        const endpointRecent = `https://${fonte.wikiDominio}/api.php?action=query&list=recentchanges&rcnamespace=0&rclimit=4&format=json&origin=*`;
        const resRecent = await fetch(endpointRecent);
        const jsonRecent = await resRecent.json();

        const mudancas = jsonRecent?.query?.recentchanges || [];
        mudancas.forEach(rc => {
            const dataFormatada = new Date(rc.timestamp).toLocaleDateString("pt-BR");
            listaNovidades.push({
                jogo: fonte.jogo,
                titulo: `Página atualizada na Wiki: ${rc.title}`,
                data: dataFormatada,
                descricao: rc.comment ? `Alteração registrada: ${rc.comment}` : "Conteúdo atualizado pela comunidade na Wiki oficial."
            });
        });
    }

    return listaNovidades;
}

// --- LEITOR DE SITES EXTERNOS DE CÓDIGOS (EX: PRO GAME GUIDES / BEEBOM) ---
async function importarDeSiteExterno(jogo, urlPagina) {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlPagina)}`;
    const resposta = await fetch(proxyUrl);
    if (!resposta.ok) throw new Error("Não foi possível acessar o site informado");

    const data = await resposta.json();
    const doc = new DOMParser().parseFromString(data.contents, "text/html");
    const encontrados = [];

    // Padrão comum em sites de códigos Roblox: <ul><li><strong>CODIGO</strong> – Recompensa</li></ul>
    doc.querySelectorAll("article li, .entry-content li, main li, table tr").forEach(el => {
        const texto = el.innerText.trim();
        if (!texto || texto.toLowerCase().includes("expired") || texto.toLowerCase().includes("working")) return;

        const tagDestaque = el.querySelector("strong, b, code, td:first-child");
        if (!tagDestaque) return;

        const possivelCodigo = tagDestaque.innerText.replace(/[:–-]/g, "").trim();
        if (possivelCodigo.length >= 4 && possivelCodigo.length <= 32 && !possivelCodigo.includes(" ")) {
            const recompensa = texto.replace(tagDestaque.innerText, "").replace(/^[\s–:-]+/, "").trim();
            if (recompensa.length > 2) {
                encontrados.push({
                    jogo,
                    codigo: possivelCodigo,
                    recompensa,
                    fonte: new URL(urlPagina).hostname.replace("www.", "")
                });
            }
        }
    });

    return encontrados;
}

// --- SINCRONIZAÇÃO GERAL ---
async function sincronizarTodasWikis() {
    const btnSync = document.getElementById('btn-sincronizar');
    const statusEl = document.getElementById('status-sync');

    btnSync.disabled = true;
    btnSync.innerText = "Sincronizando...";
    statusEl.innerText = "Consultando Wikis oficiais...";

    let novosCodigosCount = 0;
    const novosUpdatesGerais = [];

    for (const fonte of FONTES_JOGOS) {
        try {
            const [listaCod, listaUpd] = await Promise.all([
                buscarCodigosWikiFandom(fonte),
                buscarUpdatesWikiFandom(fonte)
            ]);

            listaCod.forEach(novo => {
                const jaExiste = codigos.some(
                    c => c.jogo === novo.jogo && c.codigo.toLowerCase() === novo.codigo.toLowerCase()
                );
                if (!jaExiste) {
                    codigos.unshift({
                        id: Date.now() + Math.random(),
                        jogo: novo.jogo,
                        codigo: novo.codigo,
                        recompensa: novo.recompensa,
                        status: "ativo",
                        fonte: novo.fonte
                    });
                    novosCodigosCount++;
                }
            });

            listaUpd.forEach(u => {
                novosUpdatesGerais.push({
                    id: Date.now() + Math.random(),
                    ...u
                });
            });
        } catch (err) {
            console.warn(`Aviso ao ler Wiki de ${fonte.jogo}:`, err);
        }
    }

    if (novosUpdatesGerais.length > 0) {
        // Mantém updates manuais do usuário e substitui os automáticos da Wiki pelos mais recentes
        const manuais = updates.filter(u => u.data !== "Wiki Oficial");
        updates = [...novosUpdatesGerais, ...manuais];
    }

    salvarDados();
    renderizarCodigos();
    renderizarUpdates();
    renderizarFontes();

    const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    statusEl.innerText = `Sincronizado às ${agora}`;
    btnSync.disabled = false;
    btnSync.innerText = "↻ Sincronizar Wikis";

    mostrarToast(
        novosCodigosCount > 0
            ? `${novosCodigosCount} novo(s) código(s) importado(s) das Wikis!`
            : "Wikis verificadas! Tudo atualizado."
    );
}

// --- RENDERIZAÇÃO DA INTERFACE ---
function renderizarCodigos() {
    const grid = document.getElementById('grid-codigos');
    const contador = document.getElementById('contador-codigos');
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

    contador.innerText = `Códigos (${filtrados.length})`;

    if (filtrados.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhum código salvo ainda. Clique em <strong>↻ Sincronizar Wikis</strong> no topo para puxar das Wikis.</p>`;
        return;
    }

    filtrados.forEach(item => {
        const isResgatado = item.status === "resgatado";
        const card = document.createElement('article');
        card.className = `codigo-card ${isResgatado ? 'resgatado' : ''}`;
        card.innerHTML = `
            <div class="card-topo">
                <span class="tag-jogo">${item.jogo}</span>
                <span class="badge-estado ${isResgatado ? 'estado-resgatado' : 'estado-ativo'}">
                    ${isResgatado ? 'Resgatado' : 'Ativo'}
                </span>
            </div>

            <div class="codigo-box">
                <span class="codigo-texto">${item.codigo}</span>
                <button class="btn-copiar" data-codigo="${item.codigo}">Copiar</button>
            </div>

            <p class="recompensa-texto">${item.recompensa}</p>

            <div class="card-rodape">
                <button class="btn-check">
                    ${isResgatado ? '↺ Desmarcar' : '✓ Marcar resgatado'}
                </button>
                <span class="tag-fonte">${item.fonte || 'Manual'}</span>
                <button class="btn-excluir" title="Remover">Remover</button>
            </div>
        `;

        card.querySelector('.btn-copiar').addEventListener('click', (e) => {
            const texto = e.target.dataset.codigo;
            navigator.clipboard.writeText(texto);
            mostrarToast(`Código "${texto}" copiado!`);
        });

        card.querySelector('.btn-check').addEventListener('click', () => {
            item.status = item.status === "ativo" ? "resgatado" : "ativo";
            salvarDados();
            renderizarCodigos();
        });

        card.querySelector('.btn-excluir').addEventListener('click', () => {
            codigos = codigos.filter(c => c.id !== item.id);
            salvarDados();
            renderizarCodigos();
        });

        grid.appendChild(card);
    });
}

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
        lista.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhuma atualização carregada. Clique em <strong>↻ Sincronizar Wikis</strong> para buscar.</p>`;
        return;
    }

    filtrados.forEach(u => {
        const card = document.createElement('article');
        card.className = 'update-card';
        card.innerHTML = `
            <div class="update-topo">
                <span class="tag-jogo">${u.jogo}</span>
                <div class="update-meta">
                    <span class="update-data">${u.data}</span>
                    <button class="btn-excluir">Remover</button>
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

function renderizarFontes() {
    const grid = document.getElementById('grid-fontes');
    grid.innerHTML = '';

    FONTES_JOGOS.forEach(f => {
        const qtdCodigos = codigos.filter(c => c.jogo === f.jogo).length;
        const card = document.createElement('div');
        card.className = 'link-card';
        card.innerHTML = `
            <div>
                <span class="tag-jogo">${f.wikiDominio}</span>
                <h3 style="margin-top: 8px;">${f.jogo}</h3>
                <p class="fonte-status">${qtdCodigos} código(s) salvo(s) no painel</p>
            </div>
            <div class="lista-links-diretos">
                ${f.links.map(l => `<a href="${l.url}" target="_blank" class="btn-link"><span>${l.nome}</span><span>↗</span></a>`).join('')}
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- EVENTOS ---
function configurarEventos() {
    document.getElementById('btn-sincronizar').addEventListener('click', sincronizarTodasWikis);

    document.querySelectorAll('.jogo-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.jogo-pill').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            jogoSelecionado = btn.dataset.jogo;
            renderizarCodigos();
            renderizarUpdates();
        });
    });

    document.querySelectorAll('.status-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.status-pill').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            statusSelecionado = btn.dataset.status;
            renderizarCodigos();
        });
    });

    document.querySelectorAll('.aba-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
            document.querySelectorAll('.aba-conteudo').forEach(c => c.classList.remove('ativa'));
            btn.classList.add('ativa');
            document.getElementById(btn.dataset.aba).classList.add('ativa');
        });
    });

    document.getElementById('input-busca').addEventListener('input', () => {
        renderizarCodigos();
        renderizarUpdates();
    });

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
            document.getElementById('campos-url').classList.toggle('escondido', tipoFormulario !== 'url');
            document.getElementById('btn-salvar-modal').innerText = tipoFormulario === 'url' ? 'Importar da Página' : 'Salvar';
        });
    });

    document.getElementById('form-adicionar').addEventListener('submit', async (e) => {
        e.preventDefault();
        const jogo = document.getElementById('select-jogo').value;
        const btnSalvar = document.getElementById('btn-salvar-modal');

        if (tipoFormulario === 'codigo') {
            const codigo = document.getElementById('input-codigo').value.trim();
            const recompensa = document.getElementById('input-recompensa').value.trim() || "Recompensa do jogo";
            if (!codigo) return;

            codigos.unshift({ id: Date.now(), jogo, codigo, recompensa, status: "ativo", fonte: "Manual" });
            document.getElementById('input-codigo').value = '';
            document.getElementById('input-recompensa').value = '';
            salvarDados();
            renderizarCodigos();
            renderizarFontes();
            modal.classList.add('escondido');
            mostrarToast("Código adicionado!");

        } else if (tipoFormulario === 'update') {
            const titulo = document.getElementById('input-titulo-update').value.trim();
            const descricao = document.getElementById('input-desc-update').value.trim();
            if (!titulo) return;

            updates.unshift({
                id: Date.now(),
                jogo,
                titulo,
                data: new Date().toLocaleDateString('pt-BR'),
                descricao: descricao || "Sem detalhes adicionais."
            });
            document.getElementById('input-titulo-update').value = '';
            document.getElementById('input-desc-update').value = '';
            salvarDados();
            renderizarUpdates();
            modal.classList.add('escondido');
            mostrarToast("Atualização registrada!");

        } else if (tipoFormulario === 'url') {
            const urlExterna = document.getElementById('input-url-externa').value.trim();
            if (!urlExterna) return;

            btnSalvar.disabled = true;
            btnSalvar.innerText = "Lendo página...";

            try {
                const importados = await importarDeSiteExterno(jogo, url