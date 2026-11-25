
import { montarLayout } from "./layout.js";

import { supabase } from "./supabase.js";

import {
    confirmar,
    sucesso,
    erro,
    aviso,
    carregando,
    fecharAlerta
} from "./alertas.js";

const $ = id => document.getElementById(id);

let processando = false;

// Data atual no horario de Brasilia

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

// Preencher datas automaticas

function atualizarDatas() {

    $("dataDocumento").value = hoje();

    $("dataAnalise").value = hoje();

}

// Preencher dados do usuario logado

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
        .select("rf, nome, cargo, secretaria, ativo")
        .eq("id", user.id)
        .single();

    if (
        erroPerfil ||
        !perfil ||
        !perfil.ativo
    ) {

        throw new Error(
            "Não foi possível carregar seu perfil."
        );

    }

    $("registro").value = perfil.rf || "";

    $("nome").value = perfil.nome || "";

    $("cargo").value = perfil.cargo || "";

    $("secretaria").value =
        perfil.secretaria || "";

}

// Bloquear formulario durante processamento

function bloquearFormulario(valor) {

    processando = valor;

    $("registrar").disabled = valor;

    $("limpar").disabled = valor;

    $("dataAbonada").disabled = valor;

}

// Limpar somente a data da falta

function limparCampos() {

    if (processando) return;

    $("dataAbonada").value = "";

    atualizarDatas();

    $("dataAbonada").focus();

}

// Formatar data

function formatarData(data) {

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;

}

// Registrar falta abonada

async function registrarAbonada(event) {

    event.preventDefault();

    if (processando) return;

    const dataAbonada = $("dataAbonada").value;

    if (!dataAbonada) {

        await aviso(
            "Informe a data da falta abonada."
        );

        return;

    }

    if (!$("cargo").value.trim()) {

        await aviso(
            "Seu cargo não está cadastrado no perfil."
        );

        return;

    }

    bloquearFormulario(true);

    try {

        const confirmado = await confirmar(

            "Registrar falta abonada?",

            `${$("nome").value}\n` +
            `RF: ${$("registro").value}\n` +
            `Data: ${formatarData(dataAbonada)}`

        );

        if (!confirmado) return;

        carregando(
            "Registrando falta abonada..."
        );

        // O banco recupera os dados do usuario.
        // Somente a data e enviada pelo formulario.

        const {
            data,
            error
        } = await supabase.rpc(

            "registrar_falta_abonada",

            {
                p_data_abonada: dataAbonada
            }

        );

        if (error) {

            throw new Error(
                error.message ||
                "Não foi possível registrar a falta."
            );

        }

        fecharAlerta();

        await sucesso(
            "A falta abonada foi registrada com sucesso."
        );

        bloquearFormulario(false);

        limparCampos();

    } catch (e) {

        fecharAlerta();

        await erro(e.message);

    } finally {

        bloquearFormulario(false);

    }

}

// Inicializar pagina

async function iniciar() {

    try {

        const perfil = await montarLayout({

            titulo: "Falta Abonada",

            pagina: "falta-abonada",

            somenteAdmin: false

        });

        if (!perfil) return;

        await preencherFuncionario();

        atualizarDatas();

        $("limpar").addEventListener(

            "click",

            limparCampos

        );

        $("formAbonada").addEventListener(

            "submit",

            registrarAbonada

        );

        $("dataAbonada").focus();

    } catch (e) {

        $("app").hidden = true;

        $("carregando").hidden = false;

        $("carregando").textContent =
            e.message ||
            "Não foi possível carregar o módulo.";

    }

}

iniciar();
