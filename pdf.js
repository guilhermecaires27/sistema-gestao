import { PDFDocument, StandardFonts, rgb } from 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm';

export function hoje() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));
    return `${p.year}-${p.month}-${p.day}`;
}
export function formatarData(d) { return d.split('-').reverse().join('/'); }
function dataExtenso(d) {
    return new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
}
async function modelo(nome) {
    const r=await fetch(new URL(`./modelos/${nome}.pdf`, import.meta.url));
    if(!r.ok) throw new Error('Modelo PDF não localizado: '+nome);
    return PDFDocument.load(await r.arrayBuffer());
}
// Ajusta as linhas ao espaço reservado, sem cortar nomes ou motivos longos.
function bloco(p,fonte,texto,x,topo,largura,altura,tamanho=12) {
    let linhas, passo;
    const palavras=texto.trim().split(/\s+/);
    for(;tamanho>=8;tamanho-=0.25) {
        linhas=[]; let linha='';
        for(const palavra of palavras) {
            const candidato=linha?linha+' '+palavra:palavra;
            if(fonte.widthOfTextAtSize(candidato,tamanho)<=largura) linha=candidato;
            else {
                if(linha) linhas.push(linha);
                linha='';
                for(const c of palavra) {
                    if(fonte.widthOfTextAtSize(linha+c,tamanho)>largura) {linhas.push(linha);linha='';}
                    linha+=c;
                }
            }
        }
        if(linha)linhas.push(linha);
        passo=tamanho*1.48;
        if(linhas.length*passo<=altura) break;
    }
    if(tamanho<8)throw new Error('O texto não cabe no modelo. Reduza o tamanho do motivo ou a quantidade de horários.');
    linhas.forEach((l,i)=>p.drawText(l,{x,y:p.getHeight()-topo-tamanho-i*passo,size:tamanho,font:fonte,color:rgb(0,0,0)}));
}
export async function gerarPdfAbonada(d) {
    const doc=await modelo('falta-abonada'), p=doc.getPage(0), fonte=await doc.embedFont(StandardFonts.Helvetica);
    bloco(p,fonte,`Eu, ${d.nome}, matrícula funcional ${d.registro}, funcionário (a) público(a) municipal titular no cargo de ${d.cargo}, lotado(a) na Secretaria Municipal de Administração, vem mui respeitosamente requerer, nos termos do Art. 141-A da Lei Complementar nº 15 de 28 de maio de 1992, que dispõe sobre o ABONO de minha falta do dia ${formatarData(d.dataAbonada)}, para tratar de interesses particulares.`,71,132,470,112);
    bloco(p,fonte,`Praia Grande, ${dataExtenso(d.dataDocumento)}`,71,269,470,22);
    bloco(p,fonte,`Praia Grande, ${dataExtenso(d.dataAnalise)}`,71,662,470,22);
    return doc.save();
}
async function anexar(doc,arquivo) {
    if(!arquivo)return;
    if(!arquivo.size || arquivo.size>10*1024*1024)throw new Error('Anexo vazio ou maior que 10 MB.');
    const bytes=new Uint8Array(await arquivo.arrayBuffer());
    const png=[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
    const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    const pdf=new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-');
    const tipo=png?'png':jpg?'jpg':pdf?'pdf':'';
    if(!tipo || tipo!==arquivo.name.split('.').pop().toLowerCase().replace('jpeg','jpg'))throw new Error('Formato de anexo inválido.');
    if(pdf){
        const a=await PDFDocument.load(bytes);
        if(!a.getPageCount())throw new Error('PDF sem páginas.');
        if(a.getForm().getFields().length)a.getForm().flatten();
        for(const p of await doc.copyPages(a,a.getPageIndices()))doc.addPage(p);
    } else {
        const img=png?await doc.embedPng(bytes):await doc.embedJpg(bytes);
        const p=doc.addPage([595.28,841.89]);
        const {width,height}=img.scale(Math.min((p.getWidth()-60)/img.width,(p.getHeight()-60)/img.height));
        p.drawImage(img,{x:(p.getWidth()-width)/2,y:(p.getHeight()-height)/2,width,height});
    }
}
export async function gerarPdfJustificativa(d){
    const doc=await modelo('justificativa'), p=doc.getPage(0), fonte=await doc.embedFont(StandardFonts.Helvetica);
    const h=d.horarios.length===1?'no horário de '+d.horarios[0]:'nos horários de '+d.horarios.slice(0,-1).join(', ')+' e '+d.horarios.at(-1);
    const texto=`Eu, Lidiane Santana Da Silva, RF 44.695, Diretora da Divisão Administrativa, lotado na Secretaria de Administração, autorizo a justificativa do ponto eletrônico referente ao dia ${formatarData(d.data)}, ${h} do (a) servidor (a) ${d.nome}, RF ${d.rf}, ocupante do cargo/função de ${d.cargo}, em face de ${d.motivo}.`;
    bloco(p,fonte,texto,71,178,471,132,12);
    await anexar(doc,d.anexo);
    return doc.save();
}
export function criarUrlPdf(bytes){return URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));}
export function exibirPdf(bytes,nome,form){
    const antigo=document.getElementById('resultadoPdf');
    if(antigo){URL.revokeObjectURL(antigo.dataset.url);antigo.remove();}
    const url=criarUrlPdf(bytes), caixa=document.createElement('div');
    caixa.id='resultadoPdf';caixa.dataset.url=url;caixa.className='form-acoes';
    caixa.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;';
    const download=document.createElement('a');download.href=url;download.download=nome;download.className='sg-btn';download.textContent='Baixar PDF';
    const abrir=document.createElement('a');abrir.href=url;abrir.target='_blank';abrir.rel='noopener noreferrer';abrir.className='sg-btn sg-btn-secondary';abrir.textContent='Abrir PDF para imprimir';
    caixa.append(download,abrir);form.append(caixa);
}
export function limparPdf(){const el=document.getElementById('resultadoPdf');if(el){URL.revokeObjectURL(el.dataset.url);el.remove();}}
