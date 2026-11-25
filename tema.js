
const CHAVE_TEMA = "sistema-gestao-tema";

export function obterTema() {

    try {

        return localStorage.getItem(CHAVE_TEMA) === "claro"
            ? "claro"
            : "escuro";

    } catch {

        return "escuro";

    }

}

export function aplicarTema(tema) {

    const selecionado =
        tema === "claro" ? "claro" : "escuro";

    document.documentElement.setAttribute(
        "data-tema",
        selecionado
    );

    document.documentElement.style.colorScheme =
        selecionado === "claro"
            ? "light"
            : "dark";

    try {

        localStorage.setItem(
            CHAVE_TEMA,
            selecionado
        );

    } catch {}

    atualizarBotaoTema();

    return selecionado;

}

export function alternarTema() {

    const novoTema =
        obterTema() === "escuro"
            ? "claro"
            : "escuro";

    aplicarTema(novoTema);

}

export function atualizarBotaoTema() {

    const botao =
        document.getElementById("sgAlternarTema");

    if (!botao) return;

    const escuro =
        obterTema() === "escuro";

    botao.innerHTML = escuro

        ? `
            <svg width="21" height="21"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round">

                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2
                         M2 12h2M20 12h2
                         M4.93 4.93l1.42 1.42
                         M17.65 17.65l1.42 1.42
                         M4.93 19.07l1.42-1.42
                         M17.65 6.35l1.42-1.42"/>

            </svg>
        `

        : `
            <svg width="21" height="21"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8">

                <path d="M20.9 13.35A9 9 0 0 1
                         10.65 3.1
                         9 9 0 1 0 20.9 13.35z"/>

            </svg>
        `;

    botao.title = escuro
        ? "Ativar modo claro"
        : "Ativar modo escuro";

    botao.setAttribute(
        "aria-label",
        botao.title
    );

}

export function iniciarTema() {

    aplicarTema(obterTema());

    const botao =
        document.getElementById("sgAlternarTema");

    if (botao) {

        botao.onclick = alternarTema;

    }

}

// Aplicar tema ao carregar o arquivo

aplicarTema(obterTema());

// Sincronizar outras abas do navegador

window.addEventListener("storage", event => {

    if (event.key === CHAVE_TEMA) {

        aplicarTema(obterTema());

    }

});
