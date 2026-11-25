
import { montarLayout } from "./layout.js";

import { supabase } from "./supabase.js";

import {
    confirmar,
    sucesso,
    erro,
    aviso,
    notificacao,
    carregando,
    fecharAlerta
} from "./alertas.js";

const $ = id => document.getElementById(id);

let processando = false;

// Data atual no horário de Brasília

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

// Atualizar datas automáticas

function atualizarDatas() {

    $("dataDocumento").value = hoje();

    $("dataAnalise").value = hoje();

}

// Controlar estado do formulário

function bloquearFormulario(valor) {

    processando = valor;

    $("consultar").disabled = valor;

    $("registrar").disabled = valor;

    $("limpar").disabled = valor;

    $("registro").readOnly = valor;

    $("nome").readOnly = valor;

    $("cargo").readOnly = valor;

    $("dataAbonada").disabled = valor;

}

// Limpar formulário

function limparCampos() {

    if (processando) return;

    $("formAbonada").reset();

    $("statusConsulta").textContent = "";

    $("statusConsulta").className = "";

    atualizarDatas();

    $("registro").focus();

}

// Consultar funcionário

async function consultarFuncionario() {

    if (processando) return;

    const rf = $("registro").value.trim();

    if (!/^\d{1,6}$/.test(rf)) {

        await aviso(
            "Informe um registro funcional válido."
        );

        $("registro").focus();

        return;

    }

    bloquearFormulario(true);

    $("statusConsulta").textContent = "";

    $("nome").value = "";

    $("cargo").value = "";

    $("secretaria").value = "";

    carregando("Consultando o Crachá Digital...");

    try {

        const {
            data,
            error
        } = await supabase.functions.invoke(

            "consultar-funcionario",

            {
                body: { rf }
            }

        );

        if (error) {

            let mensagem =
                "Não foi possível consultar o funcionário.";

            try {

                const resposta =
                    await error.context.json();

                mensagem =
                    resposta.mensagem || mensagem;

            } catch {}

            throw new Error(mensagem);

        }

        if (!data?.sucesso || !data.funcionario) {

            throw new Error(
                data?.mensagem ||
                "Funcionário não localizado."
            );

        }

        const funcionario = data.funcionario;

        $("registro").value =
            funcionario.registro;

        $("nome").value =
            funcionario.nome;

        $("cargo").value =
            funcionario.cargo || "";

        $("secretaria").value =
            funcionario.secretaria || "";

        $("statusConsulta").textContent =
            "Funcionário localizado no Crachá Digital.";

        $("statusConsulta").className =
            "texto-sucesso";

        fecharAlerta();

        notificacao(
            "Funcionário localizado com sucesso!"
        );

    } catch (e) {

        fecharAlerta();

        $("statusConsulta").textContent =
            e.message;

        $("statusConsulta").className =
            "texto-erro";

        await erro(e.message);

    } finally {

        bloquearFormulario(false);

    }

}

// Obter dados do formulário

function obterDados() {

    return {

        registro:
            $("registro").value.trim(),

        nome:
            $("nome").value.trim(),

        cargo:
            $("cargo").value.trim(),

        data_abonada:
            $("dataAbonada").value

    };

}

// Formatar data para exibição

function formatarData(data) {

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;

}

// Registrar falta abonada

async function registrarAbonada(event) {

    event.preventDefault();

    if (processando) return;

    if (!$("formAbonada").reportValidity()) {

        return;

    }

    const dados = obterDados();

    if (
        !/^\d{1,6}$/.test(dados.registro) ||
        !dados.nome ||
        !dados.cargo ||
        !dados.data_abonada
    ) {

        await aviso(
            "Preencha todos os campos obrigatórios."
        );

        return;

    }

    const confirmado = await confirmar(

        "Registrar falta abonada?",

        `${dados.nome}\n` +
        `RF: ${dados.registro}\n` +
        `Data: ${formatarData(dados.data_abonada)}`

    );

    if (!confirmado || processando) return;

    bloquearFormulario(true);

    carregando("Registrando falta abonada...");

    try {

        const {
            data,
            error
        } = await supabase

            .from("faltas_abonadas")

            .insert(dados)

            .select("id")

            .single();

        if (error) {

            throw new Error(
                "Não foi possível salvar o registro."
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

// Inicializar módulo

async function iniciar() {

    try {

        const perfil = await montarLayout({

            titulo: "Falta Abonada",

            pagina: "falta-abonada",

            somenteAdmin: true

        });

        if (!perfil) return;

        atualizarDatas();

        $("registro").addEventListener(
            "input",
            event => {

                event.target.value =
                    event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                $("nome").value = "";

                $("cargo").value = "";

                $("secretaria").value = "";

                $("statusConsulta").textContent = "";

            }
        );

        $("registro").addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    consultarFuncionario();

                }

            }
        );

        $("consultar").addEventListener(
            "click",
            consultarFuncionario
        );

        $("limpar").addEventListener(
            "click",
            limparCampos
        );

        $("formAbonada").addEventListener(
            "submit",
            registrarAbonada
        );

        $("registro").focus();

    } catch {

        $("app").hidden = true;

        $("carregando").hidden = false;

        $("carregando").textContent =
            "Não foi possível carregar o módulo.";

    }

}

iniciar();
