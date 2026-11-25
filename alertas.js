
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.26.25/+esm";

// Configuração visual padrão

export const Alerta = Swal.mixin({

    theme: "dark",

    background: "#1e293b",

    color: "#f1f5f9",

    confirmButtonColor: "#2563eb",

    cancelButtonColor: "#475569",

    confirmButtonText: "OK",

    cancelButtonText: "Cancelar",

    reverseButtons: true,

    heightAuto: false,

    customClass: {

        popup: "sg-alerta",

        title: "sg-alerta-titulo",

        confirmButton: "sg-alerta-confirmar",

        cancelButton: "sg-alerta-cancelar"

    }

});

// Mensagem de sucesso

export function sucesso(mensagem, titulo = "Sucesso!") {

    return Alerta.fire({

        icon: "success",

        titleText: titulo,

        text: mensagem,

        iconColor: "#4ade80"

    });

}

// Mensagem de erro

export function erro(mensagem, titulo = "Algo deu errado!") {

    return Alerta.fire({

        icon: "error",

        titleText: titulo,

        text: mensagem,

        iconColor: "#f87171"

    });

}

// Mensagem de atenção

export function aviso(mensagem, titulo = "Atenção!") {

    return Alerta.fire({

        icon: "warning",

        titleText: titulo,

        text: mensagem,

        iconColor: "#fbbf24"

    });

}

// Mensagem informativa

export function informacao(mensagem, titulo = "Informação") {

    return Alerta.fire({

        icon: "info",

        titleText: titulo,

        text: mensagem,

        iconColor: "#60a5fa"

    });

}

// Confirmação de operações

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
            perigoso ? "#dc2626" : "#2563eb",

        iconColor: "#fbbf24",

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

// Janela de carregamento

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

// Fechar janela

export function fecharAlerta() {

    Swal.close();

}
