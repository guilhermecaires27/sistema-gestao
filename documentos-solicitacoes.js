import { supabase } from "./supabase.js";
import { confirmar, sucesso, erro, Alerta } from "./alertas.js";

const BUCKET="documentos-solicitacoes";
const LIMITE=10*1024*1024;
const TIPOS={abonada:"Falta abonada",justificativa:"Justificativa"};
const ESTADOS={pendente:"Pendente",em_analise:"Em análise",aprovado:"Aprovado",recusado:"Recusado"};
const $=id=>document.getElementById(id);
const el=(tag,classe,texto)=>{const n=document.createElement(tag);if(classe)n.className=classe;if(texto!==undefined)n.textContent=texto;return n;};
const fmt=d=>d?d.split("-").reverse().join("/"):"—";
const fmtHora=d=>new Date(d).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});
const btn=(texto,acao,classe="sg-btn sg-btn-secondary")=>{const b=el("button",classe,texto);b.type="button";b.onclick=acao;return b;};

async function validarPDF(f){
    if(!f||!f.name.toLowerCase().endsWith(".pdf")||!f.size||f.size>LIMITE)throw Error("Selecione um PDF de até 10 MB.");
    const inicio=new TextDecoder().decode(await f.slice(0,1024).arrayBuffer());
    if(!inicio.includes("%PDF-"))throw Error("O arquivo selecionado não parece ser um PDF válido.");
}
async function baixar(r,b){
    if(b.disabled)return;b.disabled=true;
    try{
        const {data,error}=await supabase.storage.from(BUCKET).download(r.arquivo);
        if(error||!data)throw Error(error?.message||"PDF indisponível.");
        const url=URL.createObjectURL(new Blob([data],{type:"application/pdf"}));
        const a=el("a");a.href=url;a.download=(r.tipo==="abonada"?"Falta_Abonada":"Justificativa")+"_"+r.data_referencia+".pdf";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){await erro(e.message);}finally{b.disabled=false;}
}

function listaDocumentos({raiz,status,anterior,proxima,carregarConsulta,admin=false}){
    let pagina=0,versao=0,ocupado=false;const tamanho=30;
    async function carregar(reset=false){
        if(reset)pagina=0;
        const v=++versao;status.textContent="Carregando...";anterior.disabled=true;proxima.disabled=true;
        try{
            let q=supabase.from("solicitacoes_documentos").select("id,usuario_id,tipo,rf,nome,secretaria,data_referencia,arquivo,status,motivo_decisao,criado_em,atualizado_em",{count:"exact"});
            q=carregarConsulta(q);
            const {data,error,count}=await q.order("criado_em",{ascending:false}).order("id",{ascending:false}).range(pagina*tamanho,(pagina+1)*tamanho-1);
            if(v!==versao)return;
            if(error)throw error;
            if(!data.length&&pagina>0){pagina--;return carregar();}
            raiz.replaceChildren();status.textContent=count?count+" solicitação(ões)":"Nenhuma solicitação encontrada.";
            anterior.disabled=pagina===0;proxima.disabled=(pagina+1)*tamanho>=(count||0);
            for(const r of data){
                const card=el("article","doc-solicitacao"), topo=el("div","doc-topo"), info=el("div");
                info.append(el("strong","",TIPOS[r.tipo]+" • "+fmt(r.data_referencia)));
                if(admin)info.append(el("p","doc-muted",r.nome+" • RF "+r.rf+(r.secretaria?" • "+r.secretaria:"")));
                info.append(el("p","doc-muted","Enviado em "+fmtHora(r.criado_em)));
                const etiqueta=el("span","doc-status doc-"+r.status,ESTADOS[r.status]||r.status);topo.append(info,etiqueta);card.append(topo);
                if(r.motivo_decisao)card.append(el("p","doc-motivo","Motivo: "+r.motivo_decisao));
                const acoes=el("div","doc-acoes");const baixarBtn=btn("Baixar PDF",()=>baixar(r,baixarBtn));acoes.append(baixarBtn);
                if(admin&&["pendente","em_analise"].includes(r.status)){
                    for(const [estado,label] of [["em_analise","Analisar"],["aprovado","Aprovar"],["recusado","Recusar"]]){
                        if(estado===r.status)continue;
                        const b=btn(label,()=>decidir(r,estado,b),estado==="aprovado"?"sg-btn sg-btn-success":estado==="recusado"?"sg-btn sg-btn-danger":"sg-btn sg-btn-secondary");
                        acoes.append(b);
                    }
                }
                card.append(acoes);raiz.append(card);
            }
        }catch(e){if(v===versao){raiz.replaceChildren();status.textContent="Não foi possível consultar: "+e.message;}}
    }
    async function decidir(r,estado,b){
        if(!admin||ocupado)return;ocupado=true;b.disabled=true;
        try{
            let motivo=null;
            if(estado==="recusado"){
                const resp=await Alerta.fire({titleText:"Motivo da recusa",input:"textarea",inputAttributes:{maxlength:"500"},showCancelButton:true,confirmButtonText:"Recusar",cancelButtonText:"Cancelar",inputValidator:v=>!v?.trim()?"Informe o motivo.":undefined});
                if(!resp.isConfirmed)return;motivo=resp.value.trim();
            }else if(!await confirmar(estado==="aprovado"?"Aprovar documento?":"Iniciar análise?",TIPOS[r.tipo]+" — "+r.nome+" — "+fmt(r.data_referencia)))return;
            const {error}=await supabase.rpc("decidir_documento_solicitacao",{p_id:r.id,p_status:estado,p_motivo:motivo,p_revisao:r.atualizado_em});
            if(error)throw error;
            await sucesso("Situação atualizada. O funcionário receberá uma notificação.");await carregar();
        }catch(e){await erro(e.message);}finally{ocupado=false;b.disabled=false;}
    }
    anterior.onclick=()=>{pagina=Math.max(0,pagina-1);carregar();};proxima.onclick=()=>{pagina++;carregar();};
    return carregar;
}

export async function iniciarEnvioDocumento(tipo,campoData){
    const raiz=$("docEnvio");if(!raiz)return;
    const {data:{user},error}=await supabase.auth.getUser();
    if(error||!user){raiz.textContent="Sessão inválida. Entre novamente.";return;}
    const campo=$("docData"),arquivo=$("docArquivo"),enviar=$("docEnviar"),form=$("docForm");
    campo.value=$(campoData).value||"";
    $(campoData).addEventListener("input",()=>{if(!enviar.disabled)campo.value=$(campoData).value;});
    const atualizar=listaDocumentos({raiz:$("docLista"),status:$("docStatus"),anterior:$("docAnterior"),proxima:$("docProxima"),carregarConsulta:q=>q.eq("usuario_id",user.id).eq("tipo",tipo)});
    $("docAtualizar").onclick=()=>atualizar(true);
    let ocupado=false;
    form.onsubmit=async e=>{
        e.preventDefault();if(ocupado)return;
        const data=campo.value,f=arquivo.files[0];let path=null;ocupado=true;enviar.disabled=true;campo.disabled=true;arquivo.disabled=true;
        try{
            if(!data)throw Error("Informe a data a que o PDF se refere.");
            await validarPDF(f);
            if(!await confirmar("Enviar documento para análise?",TIPOS[tipo]+" — "+fmt(data)))return;
            path=user.id+"/"+crypto.randomUUID()+".pdf";
            const {error:uploadError}=await supabase.storage.from(BUCKET).upload(path,f,{contentType:"application/pdf",upsert:false});
            if(uploadError)throw uploadError;
            const {error:rpcError}=await supabase.rpc("enviar_documento_solicitacao",{p_tipo:tipo,p_data:data,p_arquivo:path});
            if(rpcError)throw rpcError;
            path=null;arquivo.value="";await sucesso("PDF enviado para análise.");await atualizar(true);
        }catch(e){
            if(path){try{await supabase.storage.from(BUCKET).remove([path]);}catch{}}
            await erro(e.message||"Não foi possível enviar o documento.");
            await atualizar(true);
        }finally{ocupado=false;enviar.disabled=false;campo.disabled=false;arquivo.disabled=false;}
    };
    raiz.hidden=false;await atualizar();
}
export async function iniciarAdministracaoDocumentos(){
    const atualizar=listaDocumentos({raiz:$("docLista"),status:$("docStatus"),anterior:$("docAnterior"),proxima:$("docProxima"),admin:true,carregarConsulta:q=>{
        const tipo=$("docTipo").value,status=$("docFiltro").value;
        if(tipo)q=q.eq("tipo",tipo);
        if(status==="pendentes")q=q.in("status",["pendente","em_analise"]);else if(status)q=q.eq("status",status);
        const busca=$("docBusca").value.trim().replace(/[%,().*]/g," ");
        if(busca)q=q.or("rf.ilike.%"+busca+"%,nome.ilike.%"+busca+"%");
        return q;
    }});
    $("docAtualizar").onclick=()=>atualizar(true);$("docTipo").onchange=()=>atualizar(true);$("docFiltro").onchange=()=>atualizar(true);
    let timer;$("docBusca").oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>atualizar(true),300);};
    await atualizar();
}
