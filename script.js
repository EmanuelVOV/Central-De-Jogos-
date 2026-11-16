const STORAGE_CODIGOS = "roblox_mem_codigos_v1";
const STORAGE_UPDATES = "roblox_mem_updates_v1";
const STORAGE_JA_LEU = "roblox_mem_ja_leu_v1";

let jogoSelecionado = "todos";
let statusSelecionado = "todos";
let tipoFormulario = "codigo";

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

// Base inicial já salva na memória caso alguma Wiki esteja offline
const baseInicialCodigos = [
    { id: "init-1", jogo: "Blox Fruits", codigo: "SUB2GAMERROBOT_EXP1", recompensa: "20 minutos de 2x EXP", status: "ativo", fonte: "Memória Base" },
    { id: "init-2", jogo: "Blox Fruits", codigo: "KITT_RESET", recompensa: "Reembolso de Status (Stat Reset)", status: "ativo", fonte: "Memória Base" },
    { id: "init-3", jogo: "Blox Fruits", codigo: "SUB2OFFICIALNOOBIE", recompensa: "20 minutos de 2x EXP", status: "ativo", fonte: "Memória Base" },
    { id: "init-4", jogo: "Jujutsu Shenanigans", codigo: "JJS_UPDATE", recompensa: "Recompensa de atualização", status: "ativo", fonte: "Memória Base" }
];

const baseInicialUpdates = [
    {
        id: "upd-1",
        jogo: "Blox Fruits",
        titulo: "Rotação da Loja & Eventos Marítimos",
        data: "Memória Base",
        descricao: "Estoque de frutas atualiza a cada 4 horas. Eventos de Sea Beasts e ilhas especiais rendem Beli e Fragmentos."
    },
    {
        id: "upd-2",
        jogo: "Jujutsu Shenanigans",
        titulo: "Ajustes de Movesets & Destruição",
        data: "Memória Base",
        descricao: "Balanceamento de dano, correções de hitbox nos modos ranqueados e melhorias na física do cenário."
    }
];

function lerStorage(chave, padrao) {
    try {
        const raw = localStorage.getItem(chave);
        return raw ? JSON.parse(raw) : padrao;
    } catch (e) {
        return padrao;
    }
}

let codigos = lerStorage(STORAGE_CODIGOS, baseInicialCodigos);
let updates = lerStorage(STORAGE_UPDATES, baseInicialUpdates);

function salvarNaMemoria() {
    try {
        localStorage.setItem(STORAGE_CODIGOS, JSON.stringify(codigos));
        localStorage.setItem(STORAGE_UPDATES, JSON.stringify(updates));
    } catch (e) {
        console.warn("Erro ao salvar na memória:", e);
    }
}

function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.display = 'none'; }, 2400);
}

function copiarTexto(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).catch(() => {});
    } else {
        const el = document.createElement("textarea");
        el.value = texto;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
    }
    mostrarToast(`Copiado: ${texto}`);
}

async function fetchRapido(url, ms = 4000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// --- LEITURA ÚNICA DAS WIKIS ---
async function lerWikisUmaVez(forcar = false) {
    const statusEl = document.getElementById('status-memoria');
    const btnLer = document.getElementById('btn-ler-novamente');
    const jaLeu = localStorage.getItem(STORAGE_JA_LEU);

    // Se já leu antes e não foi clicado para atualizar, usa 100% da memória local
    if (jaLeu && !forcar) {
        if (statusEl) statusEl.innerText = `● Carregado da memória (${jaLeu})`;
        renderizarTudo();
        return;
    }

    if (btnLer) {
        btnLer.disabled = true;
        btnLer.innerText = "Lendo Wikis...";
    }
    if (statusEl) statusEl.innerText = "⏳ Lendo Wikis para salvar na memória...";

    let novosAdicionados = 0;
    const updatesExtraidos = [];

    const promessas = FONTES_JOGOS.map(async (fonte) => {
        // 1. Buscar Códigos na Wiki
        try {
            const urlCod = `https://${fonte.wikiDominio}/api.php?action=parse&page=${encodeURIComponent(fonte.paginaCodigos)}&prop=text&format=json&origin=*`;
            const res = await fetchRapido(urlCod, 4000);
            if (res.ok) {
                const json = await res.json();
                const html = json?.parse?.text?.["*"];
                if (html) {
                    const doc = new DOMParser().parseFromString(html, "text/html");
                    doc.querySelectorAll("table tr").forEach(tr => {
                        const cols = tr.querySelectorAll("td");
                        if (cols.length < 2) return;
                        if (tr.innerText.toLowerCase().includes("expired")) return;

                        const codeEl = cols[0].querySelector("code, b, strong") || cols[0];
                        const cod = codeEl.innerText.replace(/\[.*?\]/g, "").trim();
                        const rec = cols[1].innerText.replace(/\[.*?\]/g, "").trim();

                        if (cod.length >= 3 && cod.length <= 35 && !cod.includes(" ")) {
                            const existe = codigos.some(c => c.jogo === fonte.jogo && c.codigo.toLowerCase() === cod.toLowerCase());
                            if (!existe) {
                                codigos.unshift({
                                    id: String(Date.now() + Math.random()),
                                    jogo: fonte.jogo,
                                    codigo: cod,
                                    recompensa: rec || "Recompensa da Wiki",
                                    status: "ativo",
                                    fonte: "Wiki"
                                });
                                novosAdicionados++;
                            }
                        }
                    });
                }
            }
        } catch (e) {
            // Ignora falha individual se a Wiki não responder a tempo
        }

        // 2. Buscar Updates na Wiki
        try {
            const urlUpd = `https://${fonte.wikiDominio}/api.php?action=parse&page=${encodeURIComponent(fonte.paginaUpdates)}&prop=text&format=json&origin=*`;
            const resUpd = await fetchRapido(urlUpd, 4000);
            if (resUpd.ok) {
                const jsonUpd = await resUpd.json();
                const htmlUpd = jsonUpd?.parse?.text?.["*"];
                if (htmlUpd) {
                    const doc = new DOMParser().parseFromString(htmlUpd, "text/html");
                    doc.querySelectorAll(".mw-parser-output h2, .mw-parser-output h3").forEach((h, i) => {
                        if (i >= 4) return;
                        const titulo = h.innerText.replace(/\[.*?\]/g, "").trim();
                        if (!titulo || titulo.toLowerCase().includes("contents")) return;

                        let desc = "";
                        let prox = h.nextElementSibling;
                        while (prox && !["H2", "H3"].includes(prox.tagName) && desc.length < 280) {
                            if (prox.tagName === "UL" || prox.tagName === "P") {
                                desc += prox.innerText.replace(/\[.*?\]/g, "").trim() + "\n";
                            }
                            prox = prox.nextElementSibling;
                        }

                        if (desc.trim()) {
                            updatesExtraidos.push({
                                id: String(Date.now() + Math.random()),
                                jogo: fonte.jogo,
                                titulo,
                                data: "Wiki",
                                descricao: desc.trim().slice(0, 300)
                            });
                        }
                    });
                }
            }
        } catch (e) {}
    });

    await Promise.allSettled(promessas);

    if (updatesExtraidos.length > 0) {
        const antigosManuais = updates.filter(u => u.data !== "Wiki");
        updates = [...updatesExtraidos, ...antigosManuais];
    }

    // Marca na memória que a leitura já foi feita e grava os dados
    const dataLeitura = new Date().toLocaleDateString("pt-BR");
    localStorage.setItem(STORAGE_JA_LEU, dataLeitura);
    salvarNaMemoria();
    renderizarTudo();

    if (statusEl) statusEl.innerText = `● Salvo na memória (${dataLeitura})`;
    if (btnLer) {
        btnLer.disabled = false;
        btnLer.innerText = "↻ Atualizar Wikis";
    }

    if (forcar) {
        mostrarToast(novosAdicionados > 0 ? `${novosAdicionados} código(s) salvo(s) na memória!` : "Memória atualizada!");
    }
}

// --- RENDERIZAÇÃO ---
function renderizarTudo() {
    renderizarCodigos();
    renderizarUpdates();
    renderizarFontes();
}

function renderizarCodigos() {
    const grid = document.getElementById('grid-codigos');
    const contador = document.getElementById('contador-codigos');
    const inputBusca = document.getElementById('input-busca');
    if (!grid) return;

    const busca = inputBusca ? inputBusca.value.toLowerCase().trim() : "";
    grid.innerHTML = '';

    const filtrados = codigos.filter(item => {
        const matchJogo = jogoSelecionado === "todos" || item.jogo === jogoSelecionado;
        const matchStatus = statusSelecionado === "todos" || item.status === statusSelecionado;
        const matchBusca = item.codigo.toLowerCase().includes(busca) ||
                           item.recompensa.toLowerCase().includes(busca) ||
                           item.jogo.toLowerCase().includes(busca);
        return matchJogo && matchStatus && matchBusca;
    });

    if (contador) contador.innerText = `Códigos na Memória (${filtrados.length})`;

    if (filtrados.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhum código encontrado para este filtro.</p>`;
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
                <button type="button" class="btn-copiar" data-acao="copiar" data-codigo="${item.codigo}">Copiar</button>
            </div>

            <p class="recompensa-texto">${item.recompensa}</p>

            <div class="card-rodape">
                <button type="button" class="btn-check" data-acao="toggle-status" data-id="${item.id}">
                    ${isResgatado ? '↺ Desmarcar' : '✓ Marcar resgatado'}
                </button>
                <span class="tag-fonte">${item.fonte || 'Manual'}</span>
                <button type="button" class="btn-excluir" data-acao="excluir-codigo" data-id="${item.id}">Remover</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderizarUpdates() {
    const lista = document.getElementById('lista-updates');
    const inputBusca = document.getElementById('input-busca');
    if (!lista) return;

    const busca = inputBusca ? inputBusca.value.toLowerCase().trim() : "";
    lista.innerHTML = '';

    const filtrados = updates.filter(u => {
        const matchJogo = jogoSelecionado === "todos" || u.jogo === jogoSelecionado;
        const matchBusca = u.titulo.toLowerCase().includes(busca) ||
                           u.descricao.toLowerCase().includes(busca) ||
                           u.jogo.toLowerCase().includes(busca);
        return matchJogo && matchBusca;
    });

    if (filtrados.length === 0) {
        lista.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhuma atualização encontrada.</p>`;
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
                    <button type="button" class="btn-excluir" data-acao="excluir-update" data-id="${u.id}">Remover</button>
                </div>
            </div>
            <h3>${u.titulo}</h3>
            <p>${u.descricao}</p>
        `;
        lista.appendChild(card);
    });
}

function renderizarFontes() {
    const grid = document.getElementById('grid-fontes');
    if (!grid) return;
    grid.innerHTML = '';

    FONTES_JOGOS.forEach(f => {
        const qtd = codigos.filter(c => c.jogo === f.jogo).length;
        const card = document.createElement('div');
        card.className = 'link-card';
        card.innerHTML = `
            <div>
                <span class="tag-jogo">${f.wikiDominio}</span>
                <h3 style="margin-top: 8px;">${f.jogo}</h3>
                <p class="fonte-status">${qtd} código(s) na memória</p>
            </div>
            <div class="lista-links-diretos">
                ${f.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="btn-link"><span>${l.nome}</span><span>↗</span></a>`).join('')}
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- EVENTOS GLOBAIS ---
document.addEventListener('click', (e) => {
    const alvo = e.target;

    if (alvo.closest('#btn-ler-novamente')) {
        lerWikisUmaVez(true);
        return;
    }

    if (alvo.closest('#btn-abrir-modal')) {
        document.getElementById('modal-novo').style.display = 'flex';
        return;
    }

    if (alvo.closest('#btn-fechar-modal') || alvo.id === 'modal-novo') {
        document.getElementById('modal-novo').style.display = 'none';
        return;
    }

    if (alvo.closest('#btn-tema')) {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('roblox_tema_light', document.body.classList.contains('light-mode'));
        return;
    }

    const btnJogo = alvo.closest('.jogo-pill');
    if (btnJogo) {
        document.querySelectorAll('.jogo-pill').forEach(b => b.classList.remove('ativo'));
        btnJogo.classList.add('ativo');
        jogoSelecionado = btnJogo.dataset.jogo;
        renderizarCodigos();
        renderizarUpdates();
        return;
    }

    const btnStatus = alvo.closest('.status-pill');
    if (btnStatus) {
        document.querySelectorAll('.status-pill').forEach(b => b.classList.remove('ativo'));
        btnStatus.classList.add('ativo');
        statusSelecionado = btnStatus.dataset.status;
        renderizarCodigos();
        return;
    }

    const btnAba = alvo.closest('.aba-btn');
    if (btnAba) {
        document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
        document.querySelectorAll('.aba-conteudo').forEach(c => c.classList.remove('ativa'));
        btnAba.classList.add('ativa');
        document.getElementById(btnAba.dataset.aba).classList.add('ativa');
        return;
    }

    const btnTipo = alvo.closest('.tipo-btn');
    if (btnTipo) {
        document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('ativo'));
        btnTipo.classList.add('ativo');
        tipoFormulario = btnTipo.dataset.tipo;

        document.getElementById('campos-codigo').style.display = tipoFormulario === 'codigo' ? 'block' : 'none';
        document.getElementById('campos-lote').style.display = tipoFormulario === 'lote' ? 'block' : 'none';
        document.getElementById('campos-update').style.display = tipoFormulario === 'update' ? 'block' : 'none';
        return;
    }

    const btnAcao = alvo.closest('[data-acao]');
    if (btnAcao) {
        const acao = btnAcao.dataset.acao;
        const id = btnAcao.dataset.id;

        if (acao === 'copiar') {
            copiarTexto(btnAcao.dataset.codigo);
        } else if (acao === 'toggle-status') {
            const item = codigos.find(c => String(c.id) === String(id));
            if (item) {
                item.status = item.status === 'ativo' ? 'resgatado' : 'ativo';
                salvarNaMemoria();
                renderizarCodigos();
            }
        } else if (acao === 'excluir-codigo') {
            codigos = codigos.filter(c => String(c.id) !== String(id));
            salvarNaMemoria();
            renderizarCodigos();
            renderizarFontes();
        } else if (acao === 'excluir-update') {
            updates = updates.filter(u => String(u.id) !== String(id));
            salvarNaMemoria();
            renderizarUpdates();
        }
    }
});

// --- INICIALIZAÇÃO ---
function iniciar() {
    if (localStorage.getItem('roblox_tema_light') === 'true') {
        document.body.classList.add('light-mode');
    }

    const inputBusca = document.getElementById('input-busca');
    if (inputBusca) {
        inputBusca.addEventListener('input', () => {
            renderizarCodigos();
            renderizarUpdates();
        });
    }

    const form = document.getElementById('form-adicionar');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const jogo = document.getElementById('select-jogo').value;

            if (tipoFormulario === 'codigo') {
                const codigo = document.getElementById('input-codigo').value.trim();
                const recompensa = document.getElementById('input-recompensa').value.trim() || "Recompensa do jogo";
                if (!codigo) return;

                codigos.unshift({ id: String(Date.now()), jogo, codigo, recompensa, status: "ativo", fonte: "Manual" });
                document.getElementById('input-codigo').value = '';
                document.getElementById('input-recompensa').value = '';
                mostrarToast("Código guardado na memória!");

            } else if (tipoFormulario === 'lote') {
                const textoBruto = document.getElementById('input-lote').value;
                const linhas = textoBruto.split('\n').map(l => l.trim()).filter(Boolean);
                let count = 0;

                linhas.forEach(linha => {
                    // Separa "CODIGO - Recompensa" ou "CODIGO: Recompensa"
                    const partes = linha.split(/\s*[-–:]\s*/);
                    const cod = partes[0].trim();
                    const rec = partes.slice(1).join(" - ").trim() || "Recompensa do jogo";

                    if (cod && !cod.includes(" ")) {
                        const existe = codigos.some(c => c.jogo === jogo && c.codigo.toLowerCase() === cod.toLowerCase());
                        if (!existe) {
                            codigos.unshift({ id: String(Date.now() + Math.random()), jogo, codigo: cod, recompensa: rec, status: "ativo", fonte: "Lista" });
                            count++;
                        }
                    }
                });

                document.getElementById('input-lote').value = '';
                mostrarToast(`${count} código(s) guardado(s) na memória!`);

            } else if (tipoFormulario === 'update') {
                const titulo = document.getElementById('input-titulo-update').value.trim();
                const descricao = document.getElementById('input-desc-update').value.trim();
                if (!titulo) return;

                updates.unshift({
                    id: String(Date.now()),
                    jogo,
                    titulo,
                    data: new Date().toLocaleDateString('pt-BR'),
                    descricao: descricao || "Sem detalhes adicionais."
                });
                document.getElementById('input-titulo-update').value = '';
                document.getElementById('input-desc-update').value = '';
                mostrarToast("Atualização salva na memória!");
            }

            salvarNaMemoria();
            renderizarTudo();
            document.getElementById('modal-novo').style.display = 'none';
        });
    }

    // Executa a leitura única (ou carrega direto da memória se já foi lido antes)
    lerWikisUmaVez(false);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
} else {
    iniciar();
}