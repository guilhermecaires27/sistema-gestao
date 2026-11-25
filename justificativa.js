
import { montarLayout } from "./layout.js";

import { supabase } from "./supabase.js";

import {
    aviso,
    erro
} from "./alertas.js";

const $ = id => document.getElementById(id);

const LIMITE_ANEXO = 10 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
    "application/pdf",
    "image/jpeg",
    "image/png"
];

let perfilAtual = null;

let anexoAtual = null;


// DATA ATUAL NO HORARIO DE BRASILIA

function hoje() {

    const partes = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).formatToParts(new Date());

    const obter = tipo =>
        partes.find(p => p.type === tipo).value;

    return [
        obter("year"),
        obter("month"),
        obter("day")
    ].join("-");

}


// CARREGAR DADOS DO FUNCIONARIO LOGADO

async function preencherFuncionario() {

    const {
        data: { user },
        error: erroUsuario
    } = await supabase.auth.getUser();

    if (erroUsuario || !user) {

        throw new Error("Sessão inválida.");

    }

    const {
        data: perfil,
        error: erroPerfil
    } = await supabase
        .from("perfis")
        .select("rf, nome, cargo, ativo")
        .eq("id", user.id)
        .single();

    if (erroPerfil || !perfil || !perfil.ativo) {

        throw new Error(
            "Não foi possível carregar seu perfil."
        );

    }

    perfilAtual = perfil;

    $("rf").value = perfil.rf || "";

    $("nome").value = perfil.nome || "";

    $("cargo").value = perfil.cargo || "";

}


// ATUALIZAR NUMERACAO DOS HORARIOS

function atualizarHorarios() {

    const linhas =
        $("listaHorarios")
            .querySelectorAll(".just-horario");

    linhas.forEach((linha, indice) => {

        linha.querySelector("label").textContent =
            `Horário ${indice + 1} *`;

        const remover =
            linha.querySelector("button");

        if (remover) {

            remover.hidden = indice === 0;

        }

    });

}


// ADICIONAR HORARIO

function adicionarHorario(valor = "", focar = true) {

    const linha = document.createElement("div");

    linha.className = "just-horario";

    const grupo = document.createElement("div");

    const rotulo = document.createElement("label");

    const campo = document.createElement("input");

    campo.type = "time";

    campo.className = "sg-input campo-horario";

    campo.required = true;

    campo.step = "60";

    campo.value = valor;

    campo.id = "horario-" + crypto.randomUUID();

    rotulo.htmlFor = campo.id;

    const remover = document.createElement("button");

    remover.type = "button";

    remover.className = "sg-btn sg-btn-secondary";

    remover.textContent = "Remover";

    remover.addEventListener("click", () => {

        linha.remove();

        atualizarHorarios();

    });

    grupo.append(rotulo, campo);

    linha.append(grupo, remover);

    $("listaHorarios").appendChild(linha);

    atualizarHorarios();

    if (focar) campo.focus();

}


// CONTADOR DE CARACTERES

function atualizarContador() {

    $("contador").textContent =
        `${$("motivo").value.length}/500 caracteres`;

}


// REMOVER ANEXO

function removerAnexo() {

    anexoAtual = null;

    $("anexo").value = "";

    $("infoAnexo").textContent = "";

    $("removerAnexo").hidden = true;

}


// VALIDAR ANEXO

async function selecionarAnexo() {

    const arquivo = $("anexo").files[0];

    if (!arquivo) {

        removerAnexo();

        return;

    }

    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {

        removerAnexo();

        await aviso(
            "Selecione um arquivo JPG, PNG ou PDF."
        );

        return;

    }

    if (
        arquivo.size === 0 ||
        arquivo.size > LIMITE_ANEXO
    ) {

        removerAnexo();

        await aviso(
            "O arquivo deve ter até 10 MB e não pode estar vazio."
        );

        return;

    }

    anexoAtual = arquivo;

    const tamanho =
        (arquivo.size / (1024 * 1024))
            .toFixed(2)
            .replace(".", ",");

    $("infoAnexo").textContent =
        `${arquivo.name} — ${tamanho} MB`;

    $("removerAnexo").hidden = false;

}


// LIMPAR CAMPOS

function limparCampos() {

    $("data").value = hoje();

    $("motivo").value = "";

    $("listaHorarios").replaceChildren();

    adicionarHorario("", false);

    removerAnexo();

    atualizarContador();

    $("data").focus();

}


// OBTER DADOS PARA GERACAO DO DOCUMENTO

export function obterDadosJustificativa() {

    if (!$("formJustificativa").reportValidity()) {

        throw new Error(
            "Preencha todos os campos obrigatórios."
        );

    }

    const horarios = Array.from(

        document.querySelectorAll(".campo-horario"),

        campo => campo.value

    );

    const motivo = $("motivo").value.trim();

    if (!perfilAtual?.cargo?.trim()) {

        throw new Error(
            "Seu cargo não está cadastrado no perfil."
        );

    }

    if (!horarios.length) {

        throw new Error(
            "Informe pelo menos um horário."
        );

    }

    if (
        horarios.some(
            horario =>
                !/^(?:[01]\d|2[0-3]):[0-5]\d$/
                    .test(horario)
        )
    ) {

        throw new Error(
            "Informe todos os horários corretamente."
        );

    }

    if (
        new Set(horarios).size !== horarios.length
    ) {

        throw new Error(
            "Não informe horários repetidos."
        );

    }

    if (!motivo || motivo.length > 500) {

        throw new Error(
            "Informe o motivo com até 500 caracteres."
        );

    }

    return {

        rf: perfilAtual.rf,

        nome: perfilAtual.nome,

        cargo: perfilAtual.cargo,

        data: $("data").value,

        horarios,

        motivo,

        anexo: anexoAtual

    };

}


// INICIALIZAR PAGINA

async function iniciar() {

    try {

        const perfil = await montarLayout({

            titulo: "Justificativa",

            pagina: "justificativa",

            somenteAdmin: false

        });

        if (!perfil) return;

        await preencherFuncionario();

        $("data").value = hoje();

        adicionarHorario("", false);

        $("adicionarHorario").addEventListener(

            "click",

            () => adicionarHorario()

        );

        $("motivo").addEventListener(

            "input",

            atualizarContador

        );

        $("anexo").addEventListener(

            "change",

            selecionarAnexo

        );

        $("removerAnexo").addEventListener(

            "click",

            removerAnexo

        );

        $("limpar").addEventListener(

            "click",

            limparCampos

        );

        $("formJustificativa").addEventListener(

            "submit",

            event => event.preventDefault()

        );

        atualizarContador();

    } catch (e) {

        $("app").hidden = true;

        $("carregando").hidden = false;

        $("carregando").textContent =
            e.message ||
            "Não foi possível carregar a justificativa.";

    }

}

iniciar();
