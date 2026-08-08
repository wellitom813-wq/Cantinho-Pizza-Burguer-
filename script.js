/* CANTINHO PIZZA BURGUER - SITE PÚBLICO */
const NUMERO_WHATSAPP = "COLOQUE_SEU_NUMERO_AQUI";
const DIAS_ABERTOS = [0,2,3,5,6];
const HORA_ABERTURA = 18;
const HORA_FECHAMENTO = 22;
const TAXAS_ENTREGA = {N1:4,N3:3,N5:5,C2:6};

let carrinho = [];
let estoqueProdutos = {};

const cfg = window.SUPABASE_CONFIG || {};
const supabaseClient =
  cfg.url && cfg.key && window.supabase
    ? window.supabase.createClient(cfg.url,cfg.key)
    : null;

function lojaEstaAberta(){
  const agora=new Date();
  const dia=agora.getDay();
  const min=agora.getHours()*60+agora.getMinutes();
  return DIAS_ABERTOS.includes(dia) && min>=HORA_ABERTURA*60 && min<HORA_FECHAMENTO*60;
}

function produtoDisponivel(id){
  return !(id in estoqueProdutos) || estoqueProdutos[id]!==false;
}

function formatarMoeda(v){
  return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

async function carregarEstoque(){
  if(!supabaseClient){ atualizarVisualProdutos(); return false; }
  const {data,error}=await supabaseClient.from("produtos_estoque").select("produto_id,disponivel");
  if(error){ console.error(error); atualizarVisualProdutos(); return false; }
  estoqueProdutos={};
  (data||[]).forEach(i=>estoqueProdutos[i.produto_id]=i.disponivel!==false);
  atualizarVisualProdutos();
  return true;
}

function atualizarVisualProdutos(){
  const aberta=lojaEstaAberta();
  document.querySelectorAll(".produto[data-produto-id]").forEach(card=>{
    const id=card.dataset.produtoId;
    const disponivel=produtoDisponivel(id);
    const btn=card.querySelector(".btn-adicionar");
    card.classList.toggle("esgotado",!disponivel);
    if(!btn)return;
    if(!disponivel){
      btn.disabled=true;
      btn.className="btn-adicionar esgotado";
      btn.textContent="Produto esgotado";
    }else if(!aberta){
      btn.disabled=true;
      btn.className="btn-adicionar loja-fechada";
      btn.textContent="Loja fechada";
    }else{
      btn.disabled=false;
      btn.className="btn-adicionar";
      btn.textContent="Adicionar +";
    }
  });
  const w=document.querySelector(".btn-whatsapp");
  if(w){
    w.disabled=!aberta;
    w.textContent=aberta?"💬 Finalizar pedido pelo WhatsApp":"🔒 Loja fechada";
  }
}

function atualizarStatusLoja(){
  const box=document.querySelector(".status-loja");
  const txt=document.querySelector(".status-texto");
  if(!box||!txt)return;
  if(lojaEstaAberta()){
    box.classList.remove("fechado");
    txt.textContent="Aberto • Fecha às 22h";
  }else{
    box.classList.add("fechado");
    const agora=new Date(),dia=agora.getDay(),min=agora.getHours()*60+agora.getMinutes();
    if(DIAS_ABERTOS.includes(dia)&&min<HORA_ABERTURA*60){
      txt.textContent="Fechado • Abre hoje às 18h";
    }else{
      const nomes=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
      let proximo="";
      for(let i=1;i<=7;i++){ const d=(dia+i)%7; if(DIAS_ABERTOS.includes(d)){proximo=nomes[d];break;} }
      txt.textContent=`Fechado • Abre ${proximo} às 18h`;
    }
  }
  atualizarVisualProdutos();
}

function adicionarProduto(id,nome,preco){
  if(!lojaEstaAberta()){ alert("🔴 Loja fechada. Pedidos somente das 18h às 22h nos dias de funcionamento."); return; }
  if(!produtoDisponivel(id)){ alert(`🔴 ${nome} está esgotado no momento.`); return; }
  const item=carrinho.find(i=>i.id===id);
  if(item)item.quantidade++;
  else carrinho.push({id,nome,preco,quantidade:1});
  atualizarCarrinho(); mostrarToast();
}

function removerProduto(id){
  const p=carrinho.find(i=>i.id===id);
  if(!p)return;
  p.quantidade--;
  if(p.quantidade<=0)carrinho=carrinho.filter(i=>i.id!==id);
  atualizarCarrinho();
}

function excluirProduto(id){
  carrinho=carrinho.filter(i=>i.id!==id);
  atualizarCarrinho();
}

function calcularTotal(){
  return carrinho.reduce((t,i)=>t+i.preco*i.quantidade,0);
}
function calcularQtd(){
  return carrinho.reduce((t,i)=>t+i.quantidade,0);
}
function obterTaxa(){
  const tipo=document.getElementById("tipoPedido")?.value;
  const reg=document.getElementById("regiao")?.value;
  return tipo==="Entrega"&&reg ? (TAXAS_ENTREGA[reg]||0) : 0;
}

function atualizarResumo(){
  const sub=calcularTotal(),taxa=obterTaxa(),total=sub+taxa;
  document.getElementById("subtotalPedido").textContent=formatarMoeda(sub);
  document.getElementById("taxaEntrega").textContent=formatarMoeda(taxa);
  document.getElementById("totalFinalPedido").textContent=formatarMoeda(total);
}

function atualizarCarrinho(){
  document.getElementById("quantidadeCarrinho").textContent=calcularQtd();
  document.getElementById("totalCarrinho").textContent=formatarMoeda(calcularTotal());
  document.getElementById("totalModal").textContent=formatarMoeda(calcularTotal());
  const lista=document.getElementById("listaCarrinho");
  if(!carrinho.length){
    lista.innerHTML='<div style="text-align:center;color:#888;padding:60px 10px">🛒<br><br>Seu carrinho está vazio.</div>';
  }else{
    lista.innerHTML=carrinho.map(i=>`
      <div style="padding:13px 0;border-bottom:1px solid #252525">
        <div style="display:flex;justify-content:space-between;gap:10px">
          <strong>${i.nome}</strong><strong style="color:#ff812d">${formatarMoeda(i.preco*i.quantidade)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
          <div>
            <button onclick="removerProduto('${i.id}')" style="width:34px;height:34px;background:#292929;color:white;border:0;border-radius:8px">−</button>
            <strong style="padding:0 10px">${i.quantidade}</strong>
            <button onclick="adicionarProduto('${i.id}','${i.nome.replaceAll("'","")} ',${i.preco})" style="width:34px;height:34px;background:#ff4f13;color:white;border:0;border-radius:8px">+</button>
          </div>
          <button onclick="excluirProduto('${i.id}')" style="background:none;color:#ff7373;border:0">Remover</button>
        </div>
      </div>`).join("");
  }
  atualizarResumo();
}

function abrirCarrinho(){
  document.getElementById("modalCarrinho").classList.add("ativo");
  document.body.style.overflow="hidden";
}
function fecharCarrinho(){
  document.getElementById("modalCarrinho").classList.remove("ativo");
  document.body.style.overflow="";
}

async function irParaFinalizacao(){
  if(!lojaEstaAberta()){alert("🔴 A loja está fechada no momento.");return;}
  if(!carrinho.length){alert("Adicione pelo menos um produto.");return;}
  await carregarEstoque();
  const esgotados=carrinho.filter(i=>!produtoDisponivel(i.id));
  if(esgotados.length){
    alert("Alguns produtos acabaram:\n\n"+esgotados.map(i=>"• "+i.nome).join("\n"));
    return;
  }
  fecharCarrinho();
  const f=document.getElementById("finalizacao");
  f.classList.add("ativo");
  atualizarResumo();
  f.scrollIntoView({behavior:"smooth"});
}

function mostrarToast(){
  const t=document.getElementById("toast");
  t.classList.add("ativo");
  clearTimeout(window._toast);
  window._toast=setTimeout(()=>t.classList.remove("ativo"),1600);
}

function configurarFormulario(){
  const tipo=document.getElementById("tipoPedido");
  const reg=document.getElementById("regiao");
  const endereco=document.getElementById("endereco");
  const campoReg=document.getElementById("campoRegiao");
  const pagamento=document.getElementById("pagamento");
  const troco=document.getElementById("troco");

  function recebimento(){
    const retirada=tipo.value==="Retirada";
    campoReg.style.display=retirada?"none":"flex";
    endereco.disabled=retirada;
    if(retirada){reg.value="";endereco.value="";}
    atualizarResumo();
  }
  tipo.addEventListener("change",recebimento);
  reg.addEventListener("change",atualizarResumo);
  pagamento.addEventListener("change",()=>{
    const dinheiro=pagamento.value==="Dinheiro";
    troco.disabled=!dinheiro;
    if(!dinheiro)troco.value="";
  });
  recebimento();
  troco.disabled=true;
}

async function finalizarPedido(){
  if(!lojaEstaAberta()){alert("🔴 A loja está fechada no momento.");return;}
  if(!carrinho.length){alert("Seu carrinho está vazio.");return;}

  const ok=await carregarEstoque();
  if(supabaseClient&&!ok){alert("Não foi possível confirmar o estoque agora. Tente novamente.");return;}
  const esgotados=carrinho.filter(i=>!produtoDisponivel(i.id));
  if(esgotados.length){alert("Produtos esgotados:\n\n"+esgotados.map(i=>"• "+i.nome).join("\n"));return;}

  const nome=document.getElementById("nome").value.trim();
  const telefone=document.getElementById("telefone").value.trim();
  const tipo=document.getElementById("tipoPedido").value;
  const regiao=document.getElementById("regiao").value;
  const endereco=document.getElementById("endereco").value.trim();
  const pagamento=document.getElementById("pagamento").value;
  const troco=document.getElementById("troco").value.trim();
  const obs=document.getElementById("observacoes").value.trim();

  if(!nome)return alert("Digite seu nome.");
  if(!telefone)return alert("Digite seu telefone.");
  if(tipo==="Entrega"&&!regiao)return alert("Selecione sua região.");
  if(tipo==="Entrega"&&!endereco)return alert("Digite o endereço.");
  if(!pagamento)return alert("Selecione a forma de pagamento.");
  if(NUMERO_WHATSAPP==="COLOQUE_SEU_NUMERO_AQUI")return alert("Configure o número do WhatsApp no arquivo script.js.");

  const sub=calcularTotal(),taxa=obterTaxa(),total=sub+taxa;
  let m="🍕 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*\n\n";
  m+=`👤 *Cliente:* ${nome}\n📱 *Telefone:* ${telefone}\n📦 *Tipo:* ${tipo}\n`;
  if(tipo==="Entrega")m+=`🗺️ *Região:* ${regiao}\n📍 *Endereço:* ${endereco}\n`;
  m+="\n🧾 *ITENS*\n━━━━━━━━━━━━━━\n";
  carrinho.forEach(i=>m+=`\n${i.quantidade}x ${i.nome} — ${formatarMoeda(i.preco*i.quantidade)}\n`);
  m+=`\n━━━━━━━━━━━━━━\n💵 *Subtotal:* ${formatarMoeda(sub)}\n`;
  if(tipo==="Entrega")m+=`🛵 *Taxa ${regiao}:* ${formatarMoeda(taxa)}\n`;
  m+=`💰 *TOTAL:* ${formatarMoeda(total)}\n\n💳 *Pagamento:* ${pagamento}\n`;
  if(pagamento==="Dinheiro"&&troco)m+=`💵 *Troco para:* ${troco}\n`;
  if(obs)m+=`\n📝 *Observações:* ${obs}\n`;

  window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(m)}`,"_blank");
}

async function iniciarRealtime(){
  if(!supabaseClient)return;
  supabaseClient.channel("estoque-loja")
    .on("postgres_changes",{event:"*",schema:"public",table:"produtos_estoque"},payload=>{
      if(payload.new?.produto_id)estoqueProdutos[payload.new.produto_id]=payload.new.disponivel!==false;
      atualizarVisualProdutos();
    }).subscribe();
}

document.addEventListener("DOMContentLoaded",async()=>{
  configurarFormulario();
  atualizarCarrinho();
  atualizarStatusLoja();
  await carregarEstoque();
  iniciarRealtime();
  setInterval(atualizarStatusLoja,30000);
  setInterval(carregarEstoque,60000);
});
