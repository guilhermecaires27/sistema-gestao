import { montarLayout } from './layout.js';
import { supabase } from './supabase.js';
import { confirmar, sucesso, erro, aviso, carregando, fecharAlerta } from './alertas.js';
import { hoje, formatarData, gerarPdfAbonada, exibirPdf, limparPdf } from './pdf.js';
const $=id=>document.getElementById(id);
let perfil, ocupado=false;
function datas(){ $('dataDocumento').value=hoje();$('dataAnalise').value=hoje(); }
function bloquear(v){ocupado=v;for(const id of ['registrar','gerarPdf','limpar','dataAbonada'])$(id).disabled=v;}
async function carregarPerfil(){
    const {data:{user},error:e}=await supabase.auth.getUser();if(e||!user)throw new Error('Sessão inválida.');
    const {data,error}=await supabase.from('perfis').select('id,rf,nome,cargo,secretaria,ativo').eq('id',user.id).single();
    if(error||!data?.ativo)throw new Error('Perfil não localizado.');return data;
}
async function salvar(d){
    // A função SQL anterior impede duplicatas. Reemissão usa o registro existente.
    const consulta=()=>supabase.from('faltas_abonadas').select('id,registro,nome,cargo,data_abonada,data_documento,data_analise').eq('registrado_por',perfil.id).eq('registro',perfil.rf).eq('data_abonada',d).limit(1).maybeSingle();
    let r=await consulta();if(r.error)throw r.error;if(r.data)return r.data;
    const {error}=await supabase.rpc('registrar_falta_abonada',{p_data_abonada:d});
    r=await consulta();if(r.error)throw r.error;if(!r.data)throw new Error(error?.message||'Não foi possível registrar a falta.');return r.data;
}
function dadosRegistro(r){return {nome:r.nome,registro:r.registro,cargo:r.cargo,dataAbonada:r.data_abonada,dataDocumento:r.data_documento,dataAnalise:r.data_analise};}
async function executar(pdf){
    if(ocupado)return;const data=$('dataAbonada').value;
    if(!data||!perfil?.cargo?.trim()){await aviso('Informe a data e confira o cargo no perfil.');return;}
    bloquear(true);
    try{
        if(!await confirmar(pdf?'Gerar PDF da falta abonada?':'Registrar falta abonada?',`Data: ${formatarData(data)}`))return;
        carregando(pdf?'Gerando PDF...':'Registrando falta abonada...');
        limparPdf();
        // Valida o modelo antes de registrar, para não gravar se a geração inicial falhar.
        if(pdf)await gerarPdfAbonada({nome:perfil.nome,registro:perfil.rf,cargo:perfil.cargo,dataAbonada:data,dataDocumento:hoje(),dataAnalise:hoje()});
        const r=await salvar(data);
        if(pdf){const bytes=await gerarPdfAbonada(dadosRegistro(r));exibirPdf(bytes,`Falta_Abonada_${data}_${r.registro}.pdf`,$('formAbonada'));}
        fecharAlerta();await sucesso(pdf?'PDF pronto para baixar ou imprimir.':'Falta abonada registrada.');
    }catch(e){fecharAlerta();await erro(e.message||'Não foi possível concluir.');}finally{bloquear(false);}
}
async function iniciar(){try{
    if(!await montarLayout({titulo:'Falta Abonada',pagina:'falta-abonada',somenteAdmin:false}))return;
    perfil=await carregarPerfil();$('registro').value=perfil.rf;$('nome').value=perfil.nome;$('cargo').value=perfil.cargo||'';$('secretaria').value=perfil.secretaria||'';datas();
    $('formAbonada').addEventListener('submit',e=>{e.preventDefault();executar(false);});
    $('gerarPdf').type='button';$('gerarPdf').addEventListener('click',()=>executar(true));$('gerarPdf').disabled=false;
    $('limpar').addEventListener('click',()=>{if(!ocupado){$('dataAbonada').value='';datas();limparPdf();}});
    $('dataAbonada').addEventListener('input',limparPdf);
}catch(e){$('app').hidden=true;$('carregando').hidden=false;$('carregando').textContent=e.message;}}
iniciar();
