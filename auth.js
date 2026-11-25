
import { supabase } from "./supabase.js";

export async function realizarLogin(rf, senha) {

    try {

        const { data, error } =
            await supabase.functions.invoke("login-rf", {
                body: {
                    rf: rf,
                    senha: senha
                }
            });

        if (error) {

            let mensagem = "Não foi possível realizar o login.";

            try {
                const resposta = await error.context.json();
                mensagem = resposta.mensagem || mensagem;
            } catch {
                // Mantém a mensagem padrão
            }

            return {
                sucesso: false,
                mensagem
            };

        }

        return data;

    } catch {

        return {
            sucesso: false,
            mensagem: "Erro de comunicação com o servidor."
        };

    }

}
