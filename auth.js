
import { supabase } from "./supabase.js";

// Executar funções do servidor

async function executarFuncao(nome, body) {

    const { data, error } =
        await supabase.functions.invoke(nome, { body });

    if (error) {

        let mensagem = "Não foi possível concluir a operação.";

        try {
            const resposta = await error.context.json();
            mensagem = resposta.mensagem || mensagem;
        } catch {}

        return {
            sucesso: false,
            mensagem
        };

    }

    return data;

}

// Realizar login

export async function realizarLogin(rf, senha) {

    const resultado = await executarFuncao(
        "login-rf",
        { rf, senha }
    );

    if (!resultado.sucesso) {
        return resultado;
    }

    const { error } = await supabase.auth.setSession(
        resultado.sessao
    );

    if (error) {
        return {
            sucesso: false,
            mensagem: "Não foi possível iniciar a sessão."
        };
    }

    return {
        sucesso: true,
        primeiro_acesso: resultado.primeiro_acesso
    };

}

// Alterar senha

export async function alterarSenha(senha, confirmarSenha) {

    return await executarFuncao(
        "alterar-senha",
        { senha, confirmarSenha }
    );

}

// Verificar sessão e obter perfil

export async function obterPerfil() {

    const { data: autorizado, error: erroAcesso } =
        await supabase.rpc("acesso_autorizado");

    if (erroAcesso || !autorizado) {
        return null;
    }

    const { data: identidade, error: erroUsuario } =
        await supabase.auth.getUser();

    if (erroUsuario || !identidade.user) {
        return null;
    }

    const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", identidade.user.id)
        .single();

    if (error || !data) {
        return null;
    }

    return data;

}

// Encerrar sessão

export async function sair() {

    const { error } =
        await supabase.rpc("encerrar_sessao");

    if (error) {
        console.warn("Não foi possível encerrar a sessão no servidor.");
    }

    await supabase.auth.signOut({
        scope: "local"
    });

    window.location.replace("index.html");

}
