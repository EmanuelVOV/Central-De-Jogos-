const STORAGE_CODIGOS = "roblox_mem_codigos_v2";
const STORAGE_UPDATES = "roblox_mem_updates_v2";
const STORAGE_JA_LEU = "roblox_mem_ja_leu_v2";

let jogoSelecionado = "todos";
let statusSelecionado = "todos";
let tipoFormulario = "codigo";

const FONTES_JOGOS = [
    {
        jogo: "Blox Fruits",
        wikiDominio: "blox-fruits.fandom.com",
        paginaCodigos: "Codes",
        paginasUpdates: ["Updates", "Update_Log", "Changelog"],
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
        paginasUpdates: ["Updates", "Update_Log", "Changelog"],
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
        paginasUpdates: ["Updates", "Update_Log", "Changelog"],
        links: [
            { nome: "Wiki Oficial • Códigos", url: "https://stand-out.fandom.com/wiki/Codes" },
            { nome: "Wiki Oficial • Página Principal", url: "https://stand-out.fandom.com/wiki/Stand_Out_Wiki" }
        ]
    },
    {
        jogo: "A Bizarre Run",
        wikiDominio: "a-bizarre-run.fandom.com",
        paginaCodigos: "Codes",
        paginasUpdates: ["Updates", "Update_Log", "Changelog"],
        links: [
            { nome: "Wiki Oficial • Códigos", url: "https://a-bizarre-run.fandom.com/wiki/Codes" },
            { nome: "Wiki Oficial • Página Principal", url: "https://a-bizarre-run.fandom.com/wiki/A_Bizarre_Run_Wiki" }
        ]
    }
];

const baseInicialCodigos = [
    { id: "init-1", jogo: "Blox Fruits", codigo: "SUB2GAMERROBOT_EXP1", recompensa: "20 minutos de 2x EXP", status: "ativo", fonte: "Memória Base" },
    { id: "init-2", jogo: "Blox Fruits", codigo: "KITT_RESET", recompensa: "Reembolso de Status (Stat Reset)", status: "ativo", fonte: "Memória Base" },
    { id: "init-3", jogo: "Blox Fruits", codigo: "SUB2OFFICIALNOOBIE", recompensa: "20 minutos de 2x EXP", status: "ativo", fonte: "Memória Base" },
    { id: "init-4", jogo: "Jujutsu Shenanigans", codigo: "JJS_UPDATE", recompensa: "Recompensa de atualização", status: "ativo", fonte: "Memória Base" }
];

const baseInicialUpdates = [
    {
        id: "upd-base-1",
        jogo: "Blox Fruits",
        titulo: "Sistemas Ativos & Rotação de Conteúdo",
        data: "Memória Base",
        html: `
            <h4>Mecânicas Principais</h4>
            <ul>
                <li><strong>Blox Fruit Dealer:</strong> O estoque de frutas físicas e da loja gira automaticamente a cada 4 horas.</li>
                <li><strong>Eventos Marítimos:</strong> Sea Beasts, Navios Fantasmas e Terrosharks concedem Beli, Fragmentos e materiais de encantamento.</li>
            </ul>
        `
    },
    {
        id: "upd-base-2",
        jogo: "Jujutsu Shenanigans",
        titulo: "Notas de Combate & Movesets",
        data: "Memória Base",
        html: `
            <h4>Destaques da Jogabilidade</h4>
            <ul>
                <li><strong>Destruição Dinâmica:</strong> Colisões de habilidades interagem diretamente com paredes e pisos da arena.</li>
                <li><strong>Modo Ranqueado:</strong> Ajustes frequentes de hitbox, tempo de recarga (cooldown) e Awakening dos personagens.</li>
            </ul>
        `
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

// Migra códigos já salvos da v1 para manter seu progresso de códigos resgatados
const codigosAntigos = lerStorage("roblox_mem_codigos_v1", null);
let codigos = lerStorage(STORAGE_CODIGOS, codigosAntigos || baseInicialCodigos);
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

function escaparHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Converte uma lista <ul> ou <ol> da Wiki mantendo sub-listas e negritos
function converterListaWikiParaHTML(listaEl) {
    const itens = Array.from(listaEl.children).filter(el => el.tagName === "LI");
    if (itens.length === 0) return "";

    let html = "<ul>";
    itens.forEach(li => {
        const clone = li.cloneNode(true);
        const subListas = Array.from(clone.querySelectorAll(":scope > ul, :scope > ol"));
        subListas.forEach(sub => sub.remove());

        // Remove referências [1], [2]
        clone.querySelectorAll("sup.reference").forEach(sup => sup.remove());

        let textoItem = clone.innerText.replace(/\[.*?\]/g, "").trim();
        // Destaca o prefixo antes de ":" se houver (ex: "New Fruit: Gas")
        if (textoItem.includes(":")) {
            const idx = textoItem.indexOf(":");
            const chave = textoItem.slice(0, idx).trim();
            const resto = textoItem.slice(idx + 1).trim();
            if (chave.length > 0 && chave.length <= 45) {
                textoItem = `<strong>${escaparHTML(chave)}:</strong> ${escaparHTML(resto)}`;
            } else {
                textoItem = escaparHTML(textoItem);
            }
        } else {
            textoItem = escaparHTML(textoItem);
        }

        let subHTML = "";
        subListas.forEach(sub => {
            subHTML += converterListaWikiParaHTML(sub);
        });

        if (textoItem || subHTML) {
            html += `<li>${textoItem}${subHTML}</li>`;
        }
    });
    html += "</ul>";
    return html;
}

// Converte o bloco completo de um update da Wiki em HTML estruturado
function extrairBlocoUpdateCompleto(elementosIrmaos) {
    let htmlFinal = "";

    elementosIrmaos.forEach(el => {
        const tag = el.tagName;

        if (tag === "H3" || tag === "H4") {
            const subtitulo = el.innerText.replace(/\[.*?\]/g, "").trim();
            if (subtitulo) {
                htmlFinal += `<h4>${escaparHTML(subtitulo)}</h4>`;
            }
        } else if (tag === "P") {
            const paragrafo = el.innerText.replace(/\[.*?\]/g, "").trim();
            if (paragrafo) {
                htmlFinal += `<p>${escaparHTML(paragrafo)}</p>`;
            }
        } else if (tag === "UL" || tag === "OL") {
            htmlFinal += converterListaWikiParaHTML(el);
        } else if (tag === "TABLE") {
            const linhas = Array.from(el.querySelectorAll("tr"));
            if (linhas.length > 0) {
                htmlFinal += "<ul>";
                linhas.forEach(tr => {
                    const cols = Array.from(tr.querySelectorAll("td, th")).map(c => c.innerText.replace(/\[.*?\]/g, "").trim()).filter(Boolean);
                    if (cols.length >= 2) {
                        htmlFinal += `<li><strong>${escaparHTML(cols[0])}:</strong> ${escaparHTML(cols.slice(1).join(" • "))}</li>`;
                    } else if (cols.length === 1) {
                        htmlFinal += `<li>${escaparHTML(cols[0])}</li>`;
                    }
                });
                htmlFinal += "</ul>";
            }
        }
    });

    return htmlFinal;
}

async function fetchRapido(url, ms = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// --- LEITURA ÚNICA DAS WIKIS (CÓDIGOS + PATCH NOTES COMPLETOS) ---
async function lerWikisUmaVez(forcar = false) {
    const statusEl = document.getElementById('status-memoria');
    const btnLer = document.getElementById('btn-ler-novamente');
    const jaLeu = localStorage.getItem(STORAGE_JA_LEU);

    if (jaLeu && !forcar) {
        if (statusEl) statusEl.innerText = `● Carregado da memória (${jaLeu})`;
        renderizarTudo();
        return;
    }

    if (btnLer) {
        btnLer.disabled = true;
        btnLer.innerText = "Lendo Wikis...";
    }
    if (statusEl) statusEl.innerText = "⏳ Extraindo códigos e patch notes das Wikis...";

    let novosAdicionados = 0;
    const updatesExtraidos = [];

    const promessas = FONTES_JOGOS.map(async (fonte) => {
        // 1. Buscar Códigos na Wiki
        try {
            const urlCod = `https://${fonte.wikiDominio}/api.php?action=parse&page=${encodeURIComponent(fonte.paginaCodigos)}&prop=text&format=json&origin=*`;
            const res = await fetchRapido(urlCod, 5000);
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
        } catch (e) {}

        // 2. Buscar Updates Completos na Wiki (testa Updates, Update_Log, Changelog)
        for (const nomePagina of fonte.paginasUpdates) {
            try {
                const urlUpd = `https://${fonte.wikiDominio}/api.php?action=parse&page=${encodeURIComponent(nomePagina)}&prop=text&format=json&origin=*`;
                const resUpd = await fetchRapido(urlUpd, 5000);
                if (!resUpd.ok) continue;

                const jsonUpd = await resUpd.json();
                const htmlUpd = jsonUpd?.parse?.text?.["*"];
                if (!htmlUpd) continue;

                const doc = new DOMParser().parseFromString(htmlUpd, "text/html");
                const root = doc.querySelector(".mw-parser-output");
                if (!root) continue;

                const cabecalhosH2 = Array.from(root.querySelectorAll(":scope > h2"));
                let encontradosNestaPagina = 0;

                cabecalhosH2.forEach(h2 => {
                    if (encontradosNestaPagina >= 6) return;

                    const titulo = h2.innerText.replace(/\[.*?\]/g, "").trim();
                    const tituloLower = titulo.toLowerCase();
                    if (!titulo || ["contents", "navigation", "trivia", "gallery", "references", "site navigation"].includes(tituloLower)) {
                        return;
                    }

                    // Coleta todos os elementos irmãos até o próximo H2
                    const irmaos = [];
                    let prox = h2.nextElementSibling;
                    while (prox && prox.tagName !== "H2") {
                        irmaos.push(prox);
                        prox = prox.nextElementSibling;
                    }

                    // Caso o H2 seja apenas um ano (ex: "2026"), extrai os H3 internos como updates individuais
                    if (/^20\d{2}$/.test(titulo)) {
                        irmaos.forEach(el => {
                            if (el.tagName === "H3" && encontradosNestaPagina < 6) {
                                const subTitulo = el.innerText.replace(/\[.*?\]/g, "").trim();
                                const subIrmaos = [];
                                let p2 = el.nextElementSibling;
                                while (p2 && p2.tagName !== "H2" && p2.tagName !== "H3") {
                                    subIrmaos.push(p2);
                                    p2 = p2.nextElementSibling;
                                }
                                const blocoHTML = extrairBlocoUpdateCompleto(subIrmaos);
                                if (blocoHTML.trim()) {
                                    updatesExtraidos.push({
                                        id: String(Date.now() + Math.random()),
                                        jogo: fonte.jogo,
                                        titulo: `${subTitulo} (${titulo})`,
                                        data: `Wiki (${nomePagina})`,
                                        html: blocoHTML
                                    });
                                    encontradosNestaPagina++;
                                }
                            }
                        });
                    } else {
                        const blocoHTML = extrairBlocoUpdateCompleto(irmaos);
                        if (blocoHTML.trim()) {
                            updatesExtraidos.push({
                                id: String(Date.now() + Math.random()),
                                jogo: fonte.jogo,
                                titulo,
                                data: `Wiki (${nomePagina})`,
                                html: blocoHTML
                            });
                            encontradosNestaPagina++;
                        }
                    }
                });

                if (encontradosNestaPagina > 0) break; // Achou a página válida de updates deste jogo
            } catch (e) {}
        }
    });

    await Promise.allSettled(promessas);

    if (updatesExtraidos.length > 0) {
        const antigosManuais = updates.filter(u => !u.data.startsWith("Wiki"));
        updates = [...updatesExtraidos, ...antigosManuais];
    }

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
        mostrarToast(novosAdicionados > 0 ? `${novosAdicionados} novo(s) código(s) e patch notes atualizados!` : "Patch notes e memória atualizados!");
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
    const contador = document.getElementById('contador-updates');
    const inputBusca = document.getElementById('input-busca');
    if (!lista) return;

    const busca = inputBusca ? inputBusca.value.toLowerCase().trim() : "";
    lista.innerHTML = '';

    const filtrados = updates.filter(u => {
        const matchJogo = jogoSelecionado === "todos" || u.jogo === jogoSelecionado;
        const textoPlano = (u.html || u.descricao || "").replace(/<[^>]*>/g, " ").toLowerCase();
        const matchBusca = u.titulo.toLowerCase().includes(busca) ||
                           textoPlano.includes(busca) ||
                           u.jogo.toLowerCase().includes(busca);
        return matchJogo && matchBusca;
    });

    if (contador) contador.innerText = `Notas de Atualização Completas (${filtrados.length})`;

    if (filtrados.length === 0) {
        lista.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhuma atualização encontrada.</p>`;
        return;
    }

    filtrados.forEach(u => {
        const conteudoHTML = u.html || `<p>${escaparHTML(u.descricao || "")}</p>`;
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
            <h3 class="update-titulo">${escaparHTML(u.titulo)}</h3>
            <div class="update-corpo">${conteudoHTML}</div>
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
                const textoBruto = document.getElementById('input-desc-update').value.trim();
                if (!titulo) return;

                const linhas = textoBruto.split('\n').map(l => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
                const htmlFormatado = linhas.length > 0
                    ? `<ul>${linhas.map(l => `<li>${escaparHTML(l)}</li>`).join("")}</ul>`
                    : "<p>Sem detalhes adicionais.</p>";

                updates.unshift({
                    id: String(Date.now()),
                    jogo,
                    titulo,
                    data: new Date().toLocaleDateString('pt-BR'),
                    html: htmlFormatado
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

    lerWikisUmaVez(false);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
} else {
    iniciar();
}