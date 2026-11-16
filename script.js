const STORAGE_CODIGOS = "central_roblox_codigos_v3";
const STORAGE_UPDATES = "central_roblox_updates_v3";

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

function lerStorageSeguro(chave, padrao) {
    try {
        const salvo = localStorage.getItem(chave);
        return salvo ? JSON.parse(salvo) : padrao;
    } catch (e) {
        return padrao;
    }
}

let codigos = lerStorageSeguro(STORAGE_CODIGOS, []);
let updates = lerStorageSeguro(STORAGE_UPDATES, []);

function salvarDados() {
    try {
        localStorage.setItem(STORAGE_CODIGOS, JSON.stringify(codigos));
        localStorage.setItem(STORAGE_UPDATES, JSON.stringify(updates));
    } catch (e) {
        console.warn("Erro ao salvar no navegador:", e);
    }
}

function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = mensagem;
    toast.style.display = 'block';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.display = 'none';
    }, 2600);
}

function copiarParaAreaTransferencia(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).catch(() => copiarFallback(texto));
    } else {
        copiarFallback(texto);
    }
    mostrarToast(`Código "${texto}" copiado!`);
}

function copiarFallback(texto) {
    const temp = document.createElement("textarea");
    temp.value = texto;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
}

// Fetch com limite de 5 segundos para nunca travar o botão
async function fetchComTimeout(url, tempoMs = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), tempoMs);
    try {
        const resposta = await fetch(url, { signal: controller.signal });
        return resposta;
    } finally {
        clearTimeout(timer);
    }
}

// --- EXTRAÇÃO DIRETA DA API DO FANDOM WIKI ---
async function buscarCodigosWikiFandom(fonte) {
    const endpoint = `https://${fonte.wikiDominio}/api.php?action=parse&page=${encodeURIComponent(fonte.paginaCodigos)}&prop=text&format=json&origin=*`;
    const resposta = await fetchComTimeout(endpoint, 5000);
    if (!resposta.ok) return [];

    const json = await resposta.json();
    if (!json.parse || !json.parse.text) return [];

    const doc = new DOMParser().parseFromString(json.parse.text["*"], "text/html");
    const extraidos = [];

    doc.querySelectorAll("table tr").forEach(tr => {
        const colunas = Array.from(tr.querySelectorAll("td"));
        if (colunas.length < 2) return;

        const textoLinha = tr.innerText.toLowerCase();
        if (textoLinha.includes("expired") || textoLinha.includes("expirado")) return;

        const codeEl = colunas[0].querySelector("code, b, strong") || colunas[0];
        const codigoLimpo = codeEl.innerText.replace(/\[.*?\]/g, "").trim();
        const recompensaLimpa = colunas[1].innerText.replace(/\[.*?\]/g, "").trim();

        if (codigoLimpo && codigoLimpo.length >= 3 && codigoLimpo.length <= 35 && !codigoLimpo.includes(" ")) {
            extraidos.push({
                jogo: fonte.jogo,
                codigo: codigoLimpo,
                recompensa: recompensaLimpa || "Recompensa da Wiki",
                fonte: "Wiki Oficial"
            });
        }
    });

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
    const endpointParse = `https://${fonte.wikiDominio}/api.php?action=parse&page=${encodeURIComponent(fonte.paginaUpdates)}&prop=text&format=json&origin=*`;
    const resParse = await fetchComTimeout(endpointParse, 5000);
    const jsonParse = await resParse.json();
    const listaNovidades = [];

    if (jsonParse.parse && jsonParse.parse.text) {
        const doc = new DOMParser().parseFromString(jsonParse.parse.text["*"], "text/html");
        const titulos = doc.querySelectorAll(".mw-parser-output h2, .mw-parser-output h3");

        titulos.forEach((h, idx) => {
            if (idx >= 5) return;
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

    if (listaNovidades.length === 0) {
        const endpointRecent = `https://${fonte.wikiDominio}/api.php?action=query&list=recentchanges&rcnamespace=0&rclimit=4&format=json&origin=*`;
        const resRecent = await fetchComTimeout(endpointRecent, 5000);
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

// --- LEITOR DE SITES EXTERNOS ---
async function importarDeSiteExterno(jogo, urlPagina) {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlPagina)}`;
    const resposta = await fetchComTimeout(proxyUrl, 8000);
    if (!resposta.ok) throw new Error("Falha ao acessar URL");

    const data = await resposta.json();
    const doc = new DOMParser().parseFromString(data.contents, "text/html");
    const encontrados = [];

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

// --- SINCRONIZAÇÃO PARALELA ---
async function sincronizarTodasWikis() {
    const btnSync = document.getElementById('btn-sincronizar');
    const statusEl = document.getElementById('status-sync');

    if (btnSync) {
        btnSync.disabled = true;
        btnSync.innerText = "Sincronizando...";
    }
    if (statusEl) statusEl.innerText = "Consultando Wikis...";

    let novosCodigosCount = 0;
    const novosUpdatesGerais = [];

    const tarefas = FONTES_JOGOS.map(async (fonte) => {
        const [resCod, resUpd] = await Promise.allSettled([
            buscarCodigosWikiFandom(fonte),
            buscarUpdatesWikiFandom(fonte)
        ]);

        if (resCod.status === "fulfilled") {
            resCod.value.forEach(novo => {
                const jaExiste = codigos.some(
                    c => c.jogo === novo.jogo && c.codigo.toLowerCase() === novo.codigo.toLowerCase()
                );
                if (!jaExiste) {
                    codigos.unshift({
                        id: String(Date.now() + Math.random()),
                        jogo: novo.jogo,
                        codigo: novo.codigo,
                        recompensa: novo.recompensa,
                        status: "ativo",
                        fonte: novo.fonte
                    });
                    novosCodigosCount++;
                }
            });
        }

        if (resUpd.status === "fulfilled") {
            resUpd.value.forEach(u => {
                novosUpdatesGerais.push({
                    id: String(Date.now() + Math.random()),
                    ...u
                });
            });
        }
    });

    await Promise.allSettled(tarefas);

    if (novosUpdatesGerais.length > 0) {
        const manuais = updates.filter(u => u.data !== "Wiki Oficial");
        updates = [...novosUpdatesGerais, ...manuais];
    }

    salvarDados();
    renderizarTudo();

    const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (statusEl) statusEl.innerText = `Atualizado às ${agora}`;
    if (btnSync) {
        btnSync.disabled = false;
        btnSync.innerText = "↻ Sincronizar Wikis";
    }

    mostrarToast(
        novosCodigosCount > 0
            ? `${novosCodigosCount} novo(s) código(s) importado(s)!`
            : "Wikis verificadas!"
    );
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

    if (contador) contador.innerText = `Códigos (${filtrados.length})`;

    if (filtrados.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhum código encontrado. Clique em <strong>↻ Sincronizar Wikis</strong> ou em <strong>+ Adicionar</strong>.</p>`;
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
        lista.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhuma atualização encontrada. Clique em <strong>↻ Sincronizar Wikis</strong> para buscar.</p>`;
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
        const qtdCodigos = codigos.filter(c => c.jogo === f.jogo).length;
        const card = document.createElement('div');
        card.className = 'link-card';
        card.innerHTML = `
            <div>
                <span class="tag-jogo">${f.wikiDominio}</span>
                <h3 style="margin-top: 8px;">${f.jogo}</h3>
                <p class="fonte-status">${qtdCodigos} código(s) salvo(s)</p>
            </div>
            <div class="lista-links-diretos">
                ${f.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="btn-link"><span>${l.nome}</span><span>↗</span></a>`).join('')}
            </div>
        `;
        grid.appendChild(card);
    });
}

function abrirModal() {
    const modal = document.getElementById('modal-novo');
    if (modal) modal.style.display = 'flex';
}

function fecharModal() {
    const modal = document.getElementById('modal-novo');
    if (modal) modal.style.display = 'none';
}

// --- DELEGAÇÃO GLOBAL DE CLIQUES (GARANTE QUE TODOS OS BOTÕES FUNCIONEM) ---
document.addEventListener('click', (e) => {
    const alvo = e.target;

    // 1. Botão Sincronizar
    if (alvo.closest('#btn-sincronizar')) {
        sincronizarTodasWikis();
        return;
    }

    // 2. Botão Abrir Modal
    if (alvo.closest('#btn-abrir-modal')) {
        abrirModal();
        return;
    }

    // 3. Fechar Modal (botão X ou clique fora da caixa)
    if (alvo.closest('#btn-fechar-modal') || alvo.id === 'modal-novo') {
        fecharModal();
        return;
    }

    // 4. Alternar Tema
    if (alvo.closest('#btn-tema')) {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('roblox_tema_light', document.body.classList.contains('light-mode'));
        return;
    }

    // 5. Filtro por Jogo
    const btnJogo = alvo.closest('.jogo-pill');
    if (btnJogo) {
        document.querySelectorAll('.jogo-pill').forEach(b => b.classList.remove('ativo'));
        btnJogo.classList.add('ativo');
        jogoSelecionado = btnJogo.dataset.jogo;
        renderizarCodigos();
        renderizarUpdates();
        return;
    }

    // 6. Filtro por Status
    const btnStatus = alvo.closest('.status-pill');
    if (btnStatus) {
        document.querySelectorAll('.status-pill').forEach(b => b.classList.remove('ativo'));
        btnStatus.classList.add('ativo');
        statusSelecionado = btnStatus.dataset.status;
        renderizarCodigos();
        return;
    }

    // 7. Abas Principais
    const btnAba = alvo.closest('.aba-btn');
    if (btnAba) {
        document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
        document.querySelectorAll('.aba-conteudo').forEach(c => c.classList.remove('ativa'));
        btnAba.classList.add('ativa');
        const secao = document.getElementById(btnAba.dataset.aba);
        if (secao) secao.classList.add('ativa');
        return;
    }

    // 8. Tipo de Registro no Modal
    const btnTipo = alvo.closest('.tipo-btn');
    if (btnTipo) {
        document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('ativo'));
        btnTipo.classList.add('ativo');
        tipoFormulario = btnTipo.dataset.tipo;

        document.getElementById('campos-codigo').style.display = tipoFormulario === 'codigo' ? 'block' : 'none';
        document.getElementById('campos-update').style.display = tipoFormulario === 'update' ? 'block' : 'none';
        document.getElementById('campos-url').style.display = tipoFormulario === 'url' ? 'block' : 'none';
        document.getElementById('btn-salvar-modal').innerText = tipoFormulario === 'url' ? 'Importar da Página' : 'Salvar';
        return;
    }

    // 9. Ações nos Cards (Copiar, Marcar Resgatado, Excluir)
    const btnAcao = alvo.closest('[data-acao]');
    if (btnAcao) {
        const acao = btnAcao.dataset.acao;
        const id = btnAcao.dataset.id;

        if (acao === 'copiar') {
            copiarParaAreaTransferencia(btnAcao.dataset.codigo);
        } else if (acao === 'toggle-status') {
            const item = codigos.find(c => String(c.id) === String(id));
            if (item) {
                item.status = item.status === 'ativo' ? 'resgatado' : 'ativo';
                salvarDados();
                renderizarCodigos();
            }
        } else if (acao === 'excluir-codigo') {
            codigos = codigos.filter(c => String(c.id) !== String(id));
            salvarDados();
            renderizarCodigos();
            renderizarFontes();
        } else if (acao === 'excluir-update') {
            updates = updates.filter(u => String(u.id) !== String(id));
            salvarDados();
            renderizarUpdates();
        }
    }
});

// --- INICIALIZAÇÃO ---
function iniciarCentral() {
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

    const formAdicionar = document.getElementById('form-adicionar');
    if (formAdicionar) {
        formAdicionar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const jogo = document.getElementById('select-jogo').value;
            const btnSalvar = document.getElementById('btn-salvar-modal');

            if (tipoFormulario === 'codigo') {
                const codigo = document.getElementById('input-codigo').value.trim();
                const recompensa = document.getElementById('input-recompensa').value.trim() || "Recompensa do jogo";
                if (!codigo) return;

                codigos.unshift({ id: String(Date.now()), jogo, codigo, recompensa, status: "ativo", fonte: "Manual" });
                document.getElementById('input-codigo').value = '';
                document.getElementById('input-recompensa').value = '';
                salvarDados();
                renderizarTudo();
                fecharModal();
                mostrarToast("Código adicionado!");

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
                salvarDados();
                renderizarUpdates();
                fecharModal();
                mostrarToast("Atualização registrada!");

            } else if (tipoFormulario === 'url') {
                const urlExterna = document.getElementById('input-url-externa').value.trim();
                if (!urlExterna) return;

                btnSalvar.disabled = true;
                btnSalvar.innerText = "Lendo página...";

                try {
                    const importados = await importarDeSiteExterno(jogo, urlExterna);
                    let adicionados = 0;

                    importados.forEach(novo => {
                        const existe = codigos.some(c => c.jogo === jogo && c.codigo.toLowerCase() === novo.codigo.toLowerCase());
                        if (!existe) {
                            codigos.unshift({ id: String(Date.now() + Math.random()), ...novo, status: "ativo" });
                            adicionados++;
                        }
                    });

                    salvarDados();
                    renderizarTudo();
                    document.getElementById('input-url-externa').value = '';
                    fecharModal();
                    mostrarToast(`${adicionados} código(s) extraído(s)!`);
                } catch (erro) {
                    mostrarToast("Não foi possível ler esse link.");
                } finally {
                    btnSalvar.disabled = false;
                    btnSalvar.innerText = "Importar da Página";
                }
            }
        });
    }

    renderizarTudo();

    if (codigos.length === 0) {
        sincronizarTodasWikis();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarCentral);
} else {
    iniciarCentral();
}