
import { supabase } from "./supabase.js";
import { iniciarTema } from "./tema.js";
import { obterPerfil, sair } from "./auth.js";
import { confirmar } from "./alertas.js";

const PERMISSOES = {
    superadmin: "Administrador principal",
    admin: "Administrador",
    usuario: "Usuário comum"
};

const ICONES = {
    recolher: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m7-11-3 3 3 3"/>`,
    notificacoes: `<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>`,

    ferias: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 15h2M14 15h2"/>`,

    abonada: `
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6"/>
        <path d="M8 13h8M8 17h8"/>
    `,

    justificativa: `
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6"/>
        <path d="m8 15 3 3 5-5"/>
    `,

    avisos: `
        <path d="m3 11 18-7v16L3 14v-3z"/>
        <path d="m7 15 2 6h4l-2-5"/>
    `,

    sistema: `
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/>
        <path d="m9 12 2 2 4-4"/>
    `,

    inicio: `
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
    `,

    perfil: `
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21v-2a8 8 0 0 1 16 0v2"/>
    `,

    usuarios: `
        <circle cx="9" cy="7" r="4"/>
        <path d="M2 21v-3a7 7 0 0 1 14 0v3"/>
        <path d="M17 4a4 4 0 0 1 0 8M19 14a6 6 0 0 1 3 6"/>
    `,

    historico: `
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v5l3 2"/>
    `,

    cracha: `
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <circle cx="8" cy="11" r="2"/>
        <path d="M5 16c0-4 6-4 6 0M14 10h5M14 14h5"/>
    `,

    senha: `
        <rect x="4" y="11" width="16" height="11" rx="2"/>
        <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    `,

    sair: `
        <path d="M10 3H4v18h6"/>
        <path d="M10 12h11m-4-4 4 4-4 4"/>
    `,

    menu: `
        <path d="M4 6h16M4 12h16M4 18h16"/>
    `

};


// GERAR ICONES

function icone(nome) {

    return `
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true">

            ${ICONES[nome] || ""}

        </svg>
    `;

}


// INICIAIS DO USUARIO

function iniciais(nome) {

    const partes = String(nome || "Usuário")
        .trim()
        .split(/\s+/);

    return (
        (partes[0]?.[0] || "") +
        (
            partes.length > 1
                ? partes.at(-1)[0]
                : ""
        )
    ).toUpperCase();

}


// CRIAR LINKS DO MENU

function criarLink({

    texto,
    href,
    simbolo,
    pagina,
    paginaAtual,
    externo = false

}) {

    const link = document.createElement("a");

    link.href = href;

    link.innerHTML = icone(simbolo);

    const rotulo = document.createElement("span");
    rotulo.className = "sg-menu-texto";
    rotulo.textContent = texto;
    link.appendChild(rotulo);
    link.title = texto;
    link.setAttribute("aria-label", texto);

    if (pagina && pagina === paginaAtual) {

        link.classList.add("ativo");

        link.setAttribute("aria-current", "page");

    }

    if (externo) {

        link.target = "_blank";

        link.rel = "noopener noreferrer";

    }

    return link;

}


// MONTAR LAYOUT PRINCIPAL

export async function montarLayout({

    titulo = "Sistema de Gestão",

    pagina = "inicio",

    somenteAdmin = false

} = {}) {

    const app = document.getElementById("app");

    if (!app) {

        throw new Error("Elemento app não encontrado.");

    }

    app.hidden = true;

    let perfil;

    try {

        perfil = await obterPerfil();

    } catch {

        window.location.replace("index.html");

        return null;

    }

    if (!perfil) {

        window.location.replace("index.html");

        return null;

    }


    // VERIFICAR PERMISSOES

    const administrador =
        ["admin", "superadmin"].includes(perfil.perfil);

    if (somenteAdmin && !administrador) {

        window.location.replace("dashboard.html");

        return null;

    }


    // PREPARAR CONTEUDO DA PAGINA

    document.body.classList.add("sg-body");

    const conteudo = document.createDocumentFragment();

    while (app.firstChild) {

        conteudo.appendChild(app.firstChild);

    }


    // ESTRUTURA DO LAYOUT

    app.innerHTML = `

        <div class="sg-overlay"
             id="sgOverlay"
             hidden>
        </div>

        <aside class="sg-sidebar" id="sgSidebar">

            <div class="sg-marca">

                <div class="sg-marca-icone">

                    <img src="https://www2.praiagrande.sp.gov.br/img/jpg/brasao_prefeitura.png" alt="Brasão de Praia Grande" width="34" height="34" style="width:80%;height:80%;object-fit:contain;display:block" referrerpolicy="no-referrer">

                </div>

                <div>

                    <h2>Sistema de Gestão</h2>

                    <p>Portal de serviços</p>

                </div>

            </div>

            <nav class="sg-menu">

                <p class="sg-menu-titulo">

                    PRINCIPAL

                </p>

                <div id="sgMenuPrincipal"></div>

                <div id="sgAreaAdmin" hidden>

                    <p class="sg-menu-titulo">

                        ADMINISTRAÇÃO

                    </p>

                    <div id="sgMenuAdmin"></div>

                </div>

            </nav>

            <div class="sg-sidebar-footer">

                <button class="sg-btn sg-btn-sair"
                        id="sgSair" title="Sair do sistema" aria-label="Sair do sistema">

                    ${icone("sair")}

                    <span class="sg-menu-texto">Sair do sistema</span>

                </button>

                <p class="sg-versao">

                    Sistema de Gestão • Versão 1.0

                </p>

            </div>

        </aside>

        <div class="sg-conteudo">

            <header class="sg-topbar">

                <div class="sg-topbar-inicio">
                <button type="button" class="sg-recolher-menu" id="sgRecolherMenu" aria-controls="sgSidebar" aria-expanded="true" title="Recolher menu" aria-label="Recolher menu">${icone("recolher")}</button>
                <button
                    class="sg-btn sg-btn-secondary sg-abrir-menu"
                    id="sgAbrirMenu"
                    aria-label="Abrir menu"
                    aria-expanded="false">

                    ${icone("menu")}

                </button>

                <h2 id="sgTitulo"></h2>
                </div>

                <div class="sg-usuario">
                    <a href="notificacoes.html" id="sgNotificacoes" aria-label="Notificações" title="Notificações" style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;flex-shrink:0;color:var(--layout-text);text-decoration:none">${icone("notificacoes")}<span id="sgNotificacoesTotal" hidden style="position:absolute;top:0;right:0;background:#dc2626;color:white;font-size:10px;min-width:16px;height:16px;border-radius:10px;display:grid;place-items:center;padding:0 3px"></span></a>

                    <button
                        type="button"
                        class="sg-tema"
                        id="sgAlternarTema"
                        aria-label="Alternar tema">

                        ☀

                    </button>

                    <div class="sg-usuario-info">

                        <strong id="sgNome"></strong>

                        <span id="sgNivel"></span>

                    </div>

                    <div class="sg-avatar"
                         id="sgAvatar">
                    </div>

                </div>

            </header>

            <main class="sg-pagina"
                  id="sgPagina">
            </main>

        </div>

    `;

    const $ = id => document.getElementById(id);


    // PREENCHER DADOS DO USUARIO

    $("sgPagina").appendChild(conteudo);

    $("sgTitulo").textContent = titulo;

    $("sgNome").textContent = perfil.nome;

    $("sgNivel").textContent =
        PERMISSOES[perfil.perfil] || "Usuário comum";

    $("sgAvatar").textContent =
        iniciais(perfil.nome);


    // MENU PRINCIPAL

    const menuPrincipal = [
        {texto:"Notificações",href:"notificacoes.html",simbolo:"notificacoes",pagina:"notificacoes"},

        {
            texto: "Mural de avisos",
            href: "avisos.html",
            simbolo: "avisos",
            pagina: "avisos"
        },

        {
            texto: "Início",
            href: "dashboard.html",
            simbolo: "inicio",
            pagina: "inicio"
        },

        {
            texto: "Falta Abonada",
            href: "falta-abonada.html",
            simbolo: "abonada",
            pagina: "falta-abonada"
        },

        {
            texto: "Justificativa",
            href: "justificativa.html",
            simbolo: "justificativa",
            pagina: "justificativa"
        },

        {
            texto: "Férias",
            href: "ferias.html",
            simbolo: "ferias",
            pagina: "ferias"
        },

        {
            texto: "Meu perfil",
            href: "dashboard.html#meuPerfil",
            simbolo: "perfil"
        },

        {
            texto: "Crachá Digital",
            href:
                "https://crachadigital.praiagrande.sp.gov.br/?rf=" +
                encodeURIComponent(perfil.rf),
            simbolo: "cracha",
            externo: true
        },

        {
            texto: "Alterar senha",
            href: "alterar-senha.html",
            simbolo: "senha",
            pagina: "senha"
        }

    ];


    // MENU ADMINISTRATIVO

    const menuAdmin = [
        {texto:"Calendário de férias",href:"calendario-ferias.html",simbolo:"ferias",pagina:"calendario-ferias"},
        {texto:"Painel administrativo",href:"painel-admin.html",simbolo:"inicio",pagina:"painel-admin"},

        {
            texto: "Gerenciar usuários",
            href: "admin.html",
            simbolo: "usuarios",
            pagina: "usuarios"
        },

        {
            texto: "Histórico de acessos",
            href: "historico.html",
            simbolo: "historico",
            pagina: "historico"
        }

    ];


    // CARREGAR MENU PRINCIPAL

    for (const item of menuPrincipal) {

        $("sgMenuPrincipal").appendChild(

            criarLink({
                ...item,
                paginaAtual: pagina
            })

        );

    }


    // CARREGAR MENU ADMINISTRATIVO

    if (administrador) {

        $("sgAreaAdmin").hidden = false;

        for (const item of menuAdmin) {

            $("sgMenuAdmin").appendChild(

                criarLink({
                    ...item,
                    paginaAtual: pagina
                })

            );

        }

    }


    // MENU COMPACTO NO DESKTOP
    function aplicarMenuCompacto(recolhido) {
        document.body.classList.toggle("sg-menu-recolhido", recolhido);
        const botao = $("sgRecolherMenu");
        const texto = recolhido ? "Expandir menu" : "Recolher menu";
        botao.setAttribute("aria-expanded", String(!recolhido));
        botao.setAttribute("aria-label", texto);
        botao.title = texto;
    }
    let menuCompacto = false;
    try { menuCompacto = localStorage.getItem("sg-menu-compacto") === "1"; } catch {}
    aplicarMenuCompacto(menuCompacto);
    $("sgRecolherMenu").addEventListener("click", () => {
        menuCompacto = !document.body.classList.contains("sg-menu-recolhido");
        aplicarMenuCompacto(menuCompacto);
        try { localStorage.setItem("sg-menu-compacto", menuCompacto ? "1" : "0"); } catch {}
    });

    // MENU RESPONSIVO

    function fecharMenu() {

        $("sgSidebar").classList.remove("aberto");

        $("sgOverlay").hidden = true;

        $("sgAbrirMenu").setAttribute(
            "aria-expanded", "false"
        );

    }

    $("sgAbrirMenu").addEventListener("click", () => {

        const aberto = $("sgSidebar")
            .classList.toggle("aberto");

        $("sgOverlay").hidden = !aberto;

        $("sgAbrirMenu").setAttribute(
            "aria-expanded",
            String(aberto)
        );

    });

    $("sgOverlay").addEventListener(

        "click",

        fecharMenu

    );

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            fecharMenu();

        }

    });

    document.querySelectorAll(".sg-menu a")
        .forEach(link => {

            link.addEventListener(

                "click",

                fecharMenu

            );

        });


    // SAIR DO SISTEMA

    $("sgSair").addEventListener("click", async () => {

        const confirmado = await confirmar(

            "Sair do sistema?",

            "Você será redirecionado para a página de login."

        );

        if (confirmado) {

            await sair();

        }

    });


    // FINALIZAR CARREGAMENTO

    const carregando =
        document.getElementById("carregando");

    if (carregando) {

        carregando.hidden = true;

    }


    // INICIALIZAR TEMA

    iniciarTema();


    // EXIBIR PAGINA

    app.hidden = false;
    async function atualizarNotificacoes(){
        try {
            const {count,error}=await supabase.from("notificacoes_portal").select("id",{count:"exact",head:true}).is("lida_em",null);
            if(error)return;
            const n=count||0,b=$("sgNotificacoesTotal");
            b.textContent=n>99?"99+":String(n);
            b.hidden=!n;
            b.style.display=n?"grid":"none";
            $("sgNotificacoes").setAttribute("aria-label",n+" notificações não lidas");
        } catch {}
    }
    atualizarNotificacoes();
    window.addEventListener("sg-notificacoes-atualizar",atualizarNotificacoes);
    window.addEventListener("focus",atualizarNotificacoes);
    const intervalo=setInterval(()=>{if(!document.hidden)atualizarNotificacoes();},30000);
    window.addEventListener("pagehide",()=>clearInterval(intervalo),{once:true});
    return perfil;

}
