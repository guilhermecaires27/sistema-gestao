
import {
    PDFDocument,
    StandardFonts
} from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";


// CONFIGURACOES

const MODELOS = {

    abonada: "./modelos/falta-abonada.pdf",

    justificativa: "./modelos/justificativa.pdf"

};

const LIMITE_ANEXO = 10 * 1024 * 1024;

const MESES = [

    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro"

];


// FORMATAR DATA

export function formatarData(data) {

    return data.split("-")
        .reverse()
        .join("/");

}


// SEPARAR DATA

function separarData(data) {

    const [ano, mes, dia] = data.split("-");

    return {

        ano,

        mes,

        dia,

        mesExtenso: MESES[Number(mes) - 1]

    };

}


// CARREGAR MODELO PDF

async function carregarModelo(caminho) {

    const resposta = await fetch(caminho);

    if (!resposta.ok) {

        throw new Error(
            "Não foi possível carregar o modelo PDF."
        );

    }

    const bytes = await resposta.arrayBuffer();

    return await PDFDocument.load(bytes);

}


// PREENCHER CAMPOS DO MODELO

async function preencherModelo(
    documento,
    valores
) {

    const formulario = documento.getForm();

    const fonte = await documento.embedFont(
        StandardFonts.Helvetica
    );

    for (
        const [campo, valor]
        of Object.entries(valores)
    ) {

        try {

            const texto =
                formulario.getTextField(campo);

            texto.setText(String(valor ?? ""));

        } catch {

            throw new Error(
                `Campo "${campo}" inválido ou não encontrado no modelo.`
            );

        }

    }

    formulario.updateFieldAppearances(fonte);

    formulario.flatten();

}


// GERAR FALTA ABONADA

export async function gerarPdfAbonada(dados) {

    const documento = await carregarModelo(
        MODELOS.abonada
    );

    const falta = separarData(
        dados.dataAbonada
    );

    const emissao = separarData(
        dados.dataDocumento
    );

    const analise = separarData(
        dados.dataAnalise
    );

    await preencherModelo(documento, {

        nome: dados.nome,

        registro: dados.registro,

        cargo: dados.cargo,

        falta_dia: falta.dia,

        falta_mes: falta.mes,

        falta_ano: falta.ano,

        documento_dia: emissao.dia,

        documento_mes: emissao.mesExtenso,

        documento_ano: emissao.ano,

        analise_dia: analise.dia,

        analise_mes: analise.mesExtenso,

        analise_ano: analise.ano

    });

    return await documento.save();

}


// FORMATAR HORARIOS

function formatarHorarios(horarios) {

    if (horarios.length === 1) {

        return `no horário de ${horarios[0]}`;

    }

    const primeiros = horarios
        .slice(0, -1)
        .join(", ");

    const ultimo =
        horarios[horarios.length - 1];

    return `nos horários de ${primeiros} e ${ultimo}`;

}


// VALIDAR E INCORPORAR ANEXO

async function adicionarAnexo(
    documento,
    arquivo
) {

    if (!arquivo) return;

    if (
        !arquivo.size ||
        arquivo.size > LIMITE_ANEXO
    ) {

        throw new Error(
            "O anexo deve ter até 10 MB."
        );

    }

    const bytes = new Uint8Array(
        await arquivo.arrayBuffer()
    );

    const png = [

        137, 80, 78, 71,
        13, 10, 26, 10

    ].every(
        (valor, i) => bytes[i] === valor
    );

    const jpg =

        bytes[0] === 255 &&
        bytes[1] === 216 &&
        bytes[2] === 255;

    const pdf = new TextDecoder()
        .decode(bytes.slice(0, 1024))
        .includes("%PDF-");

    const extensao = arquivo.name
        .split(".")
        .pop()
        .toLowerCase()
        .replace("jpeg", "jpg");

    const tipo = png
        ? "png"
        : jpg
        ? "jpg"
        : pdf
        ? "pdf"
        : "";

    if (!tipo || tipo !== extensao) {

        throw new Error(
            "O conteúdo do anexo não corresponde ao formato informado."
        );

    }


    // ANEXO EM PDF

    if (tipo === "pdf") {

        let anexo;

        try {

            anexo = await PDFDocument.load(
                bytes
            );

            const formulario = anexo.getForm();

            if (formulario.getFields().length) {

                formulario.flatten();

            }

        } catch {

            throw new Error(
                "Não foi possível abrir o PDF anexo. Confira se ele está íntegro e sem senha."
            );

        }

        const paginas = await documento.copyPages(

            anexo,

            anexo.getPageIndices()

        );

        paginas.forEach(pagina => {

            documento.addPage(pagina);

        });

        return;

    }


    // ANEXO EM JPG OU PNG

    const imagem = tipo === "png"

        ? await documento.embedPng(bytes)

        : await documento.embedJpg(bytes);


    // Criar pagina A4

    const largura = 595.28;

    const altura = 841.89;

    const margem = 30;

    const pagina = documento.addPage([

        largura,

        altura

    ]);

    const escala = Math.min(

        (largura - margem * 2) / imagem.width,

        (altura - margem * 2) / imagem.height,

        1

    );

    const dimensoes = imagem.scale(escala);

    pagina.drawImage(imagem, {

        x: (largura - dimensoes.width) / 2,

        y: (altura - dimensoes.height) / 2,

        width: dimensoes.width,

        height: dimensoes.height

    });

}


// GERAR JUSTIFICATIVA

export async function gerarPdfJustificativa(dados) {

    const documento = await carregarModelo(
        MODELOS.justificativa
    );

    await preencherModelo(documento, {

        rf: dados.rf,

        nome: dados.nome,

        cargo: dados.cargo,

        data: formatarData(dados.data),

        trechoHorarios: formatarHorarios(
            dados.horarios
        ),

        motivo: dados.motivo

    });

    await adicionarAnexo(

        documento,

        dados.anexo

    );

    return await documento.save();

}


// CRIAR URL TEMPORARIA DO PDF

export function criarUrlPdf(bytes) {

    const arquivo = new Blob(

        [bytes],

        { type: "application/pdf" }

    );

    return URL.createObjectURL(arquivo);

}


// BAIXAR PDF

export function baixarPdf(bytes, nome) {

    const url = criarUrlPdf(bytes);

    const link = document.createElement("a");

    link.href = url;

    link.download = nome;

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {

        URL.revokeObjectURL(url);

    }, 60000);

}
