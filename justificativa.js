import { montarLayout } from './layout.js';
import { supabase } from './supabase.js';
import { aviso, erro, sucesso, carregando, fecharAlerta } from './alertas.js';
import { hoje, gerarPdfJustificativa, exibirPdf, limparPdf } from './pdf.js';
const $=id=>document.getElementById(id);
let perfil, ocupado=false;
function renumerar(){document.querySelectorAll('#listaHorarios .just-horario').forEach((l,i)=>{l.querySelector('label').textContent=`Horário ${i+1} *`;l.querySelector('button').hidden=i===0;});}
function adicionarHorario(foco=true){
    const linha=document.createElement('div');linha.className='just-horario';
    const grupo=document.createElement('div'), label=document.createElement('label'), campo=document.createElement('input'), botao=document.createElement('button');
    campo.type='time';campo.required=true;campo.step='60';campo.className='sg-input campo-horario';campo.id='horario-'+crypto.randomUUID();label.htmlFor=campo.id;
    botao.type='button';botao.className='sg-btn sg-btn-secondary';botao.textContent='Remover';botao.onclick=()=>{linha.remove();renumerar();limparPdf();};
    grupo.append(label,campo);linha.append(grupo,botao);$('listaHorarios').append(linha);renumerar();limparPdf();if(foco)campo.focus();
}
function contador(){$('contador').textContent=`${$('motivo').value.length}/500 caracteres`;}
function removerAnexo(){$('anexo').value='';$('infoAnexo').textContent='';$('removerAnexo').hidden=true;limparPdf();}
async function selecionarAnexo(){const f=$('anexo').files[0];limparPdf();if(!f){removerAnexo();return;}if(!/\.(jpe?g|png|pdf)$/i.test(f.name)||!f.size||f.size>10*1024*1024){removerAnexo();await aviso('Selecione JPG, JPEG, PNG ou PDF de até 10 MB.');return;}$('infoAnexo').textContent=f.name;$('removerAnexo').hidden=false;}
function limpar(){$('data').value=hoje();$('motivo').value='';$('listaHorarios').replaceChildren();adicionarHorario(false);removerAnexo();contador();}
export function obterDadosJustificativa(){
    if(!$('formJustificativa').reportValidity())throw new Error('Preencha todos os campos.');
    const horarios=Array.from(document.querySelectorAll('.campo-horario'),e=>e.value), motivo=$('motivo').value.trim();
    if(!perfil?.cargo?.trim())throw new Error('Seu cargo não está cadastrado.');
    if(!horarios.length||horarios.some(h=>!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(h)))throw new Error('Informe os horários corretamente.');
    if(new Set(horarios).size!==horarios.length)throw new Error('Não informe horários repetidos.');
    if(!motivo||motivo.length>500)throw new Error('Informe o motivo com até 500 caracteres.');
    return {rf:perfil.rf,nome:perfil.nome,cargo:perfil.cargo,data:$('data').value,horarios,motivo,anexo:$('anexo').files[0]||null};
}
async function gerar(e){e.preventDefault();if(ocupado)return;let controles=[];try{
    const dados=obterDadosJustificativa();ocupado=true;controles=[...$('formJustificativa').querySelectorAll('input,textarea,button')];controles.forEach(c=>c.disabled=true);limparPdf();carregando('Gerando PDF...');
    const {data,error}=await supabase.rpc('acesso_autorizado');if(error||data!==true)throw new Error('Sessão inválida. Entre novamente.');
    const bytes=await gerarPdfJustificativa(dados);exibirPdf(bytes,`Justificativa_${dados.data}_${dados.rf}.pdf`,$('formJustificativa'));fecharAlerta();await sucesso('PDF pronto para baixar ou imprimir.');
}catch(e){fecharAlerta();await erro(e.message||'Não foi possível gerar o PDF.');}finally{ocupado=false;controles.forEach(c=>c.disabled=false);}}
async function iniciar(){try{
    if(!await montarLayout({titulo:'Justificativa',pagina:'justificativa',somenteAdmin:false}))return;
    const {data:{user},error:e}=await supabase.auth.getUser();if(e||!user)throw new Error('Sessão inválida.');
    const {data,error}=await supabase.from('perfis').select('rf,nome,cargo,ativo').eq('id',user.id).single();if(error||!data?.ativo)throw new Error('Perfil não localizado.');perfil=data;
    $('rf').value=perfil.rf;$('nome').value=perfil.nome;$('cargo').value=perfil.cargo||'';
    $('data').value=hoje();adicionarHorario(false);contador();
    $('adicionarHorario').onclick=()=>adicionarHorario();$('motivo').addEventListener('input',contador);$('anexo').onchange=selecionarAnexo;$('removerAnexo').onclick=removerAnexo;$('limpar').onclick=limpar;
    $('formJustificativa').addEventListener('input',limparPdf);$('formJustificativa').addEventListener('submit',gerar);$('gerarPdf').type='submit';$('gerarPdf').disabled=false;
    import("./documentos-solicitacoes.js").then(m=>m.iniciarEnvioDocumento("justificativa","data")).catch(e=>{const painel=$("docEnvio");painel.hidden=false;painel.textContent="Não foi possível carregar o envio de documentos: "+e.message;});
}catch(e){$('app').hidden=true;$('carregando').hidden=false;$('carregando').textContent=e.message;}}
iniciar();
