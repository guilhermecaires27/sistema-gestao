
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.26.25/+esm";

// Tema Bulma

export const Alerta = Swal.mixin({

    theme: "bulma-dark",

    confirmButtonText: "OK",

    cancelButtonText: "Cancelar",

    reverseButtons: true,

    heightAuto: false

});

// Sucesso

export function sucesso(mensagem, titulo = "Sucesso!") {

    return Alerta.fire({
        icon: "success",
        titleText: titulo,
        text: mensagem
    });

}

// Erro

export function erro(mensagem, titulo = "Algo deu errado!") {

    return Alerta.fire({
        icon: "error",
        titleText: titulo,
        text: mensagem
    });

}

// Atenção

export function aviso(mensagem, titulo = "Atenção!") {

    return Alerta.fire({
        icon: "warning",
        titleText: titulo,
        text: mensagem
    });

}

// Informação

export function informacao(mensagem, titulo = "Informação") {

    return Alerta.fire({
        icon: "info",
        titleText: titulo,
        text: mensagem
    });

}

// Confirmação

export async function confirmar(
    titulo,
    mensagem,
    perigoso = false
) {

    const resultado = await Alerta.fire({

        icon: "warning",

        titleText: titulo,

        text: mensagem,

        showCancelButton: true,

        confirmButtonText: "Confirmar",

        cancelButtonText: "Cancelar",

        confirmButtonColor:
            perigoso ? "#f14668" : undefined,

        focusCancel: true

    });

    return resultado.isConfirmed;

}

// Notificação flutuante

export function notificacao(
    mensagem,
    tipo = "success"
) {

    return Alerta.fire({

        toast: true,

        position: "top-end",

        icon: tipo,

        titleText: mensagem,

        showConfirmButton: false,

        timer: 3500,

        timerProgressBar: true,

        didOpen: elemento => {

            elemento.addEventListener(
                "mouseenter",
                Swal.stopTimer
            );

            elemento.addEventListener(
                "mouseleave",
                Swal.resumeTimer
            );

        }

    });

}

// Carregamento

export function carregando(
    mensagem = "Aguarde um momento..."
) {

    Alerta.fire({

        titleText: "Processando...",

        text: mensagem,

        allowOutsideClick: false,

        allowEscapeKey: false,

        showConfirmButton: false,

        didOpen: () => {

            Swal.showLoading();

        }

    });

}

// Fechar alerta

export function fecharAlerta() {

    Swal.close();

}
