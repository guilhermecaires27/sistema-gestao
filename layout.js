
import { obterPerfil, sair } from "./auth.js";

const PERMISSOES = {
    superadmin: "Administrador principal",
    admin: "Administrador",
    usuario: "Usuário comum"
};

const ICONES = {

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

    link.appendChild(
        document.createTextNode(texto)
    );

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

    const administrador =
        ["admin", "superadmin"].includes(perfil.perfil);

    if (somenteAdmin && !administrador) {

        window.location.replace("dashboard.html");

        return null;

    }

    document.body.classList.add("sg-body");

    const conteudo = document.createDocumentFragment();

    while (app.firstChild) {

        conteudo.appendChild(app.firstChild);

    }

    app.innerHTML = `

        <div class="sg-overlay"
             id="sgOverlay"
             hidden>
        </div>

        <aside class="sg-sidebar" id="sgSidebar">

            <div class="sg-marca">

                <div class="sg-marca-icone">
                    ${icone("sistema")}
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
                        id="sgSair">

                    ${icone("sair")}

                    Sair do sistema

                </button>

                <p class="sg-versao">
                    Sistema de Gestão • Versão 1.0
                </p>

            </div>

        </aside>

        <div class="sg-conteudo">

            <header class="sg-topbar">

                <button class="sg-btn sg-btn-secondary sg-abrir-menu"
                        id="sgAbrirMenu"
                        aria-label="Abrir menu"
                        aria-expanded="false">

                    ${icone("menu")}

                </button>

                <h2 id="sgTitulo"></h2>

                <div class="sg-usuario">

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

    $("sgPagina").appendChild(conteudo);

    $("sgTitulo").textContent = titulo;

    $("sgNome").textContent = perfil.nome;

    $("sgNivel").textContent =
        PERMISSOES[perfil.perfil] || "Usuário comum";

    $("sgAvatar").textContent = iniciais(perfil.nome);

    const menuPrincipal = [

        {
            texto: "Início",
            href: "dashboard.html",
            simbolo: "inicio",
            pagina: "inicio"
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

    const menuAdmin = [

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

    for (const item of menuPrincipal) {

        $("sgMenuPrincipal").appendChild(

            criarLink({
                ...item,
                paginaAtual: pagina
            })

        );

    }

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
        "click", fecharMenu
    );

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            fecharMenu();

        }

    });

    document.querySelectorAll(".sg-menu a")
        .forEach(link => {

            link.addEventListener(
                "click", fecharMenu
            );

        });

    $("sgSair").addEventListener("click", sair);

    const carregando =
        document.getElementById("carregando");

    if (carregando) {

        carregando.hidden = true;

    }

    app.hidden = false;

    return perfil;

}
