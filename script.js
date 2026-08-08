const NUMERO_WHATSAPP = "COLOQUE_SEU_NUMERO_AQUI";
const DIAS_ABERTOS = [0,2,3,5,6];
const HORA_ABERTURA = 4;
const HORA_FECHAMENTO = 22;
const TAXAS = {N1:4,N3:3,N5:5,C2:6};

let carrinho = carregarCarrinho();
let estoque = {};
let tipoPedido = "Entrega";
let filtroAtual = "todos";
let somenteFavoritos = false;

const cfg = window.SUPABASE_CONFIG || {};
const sb = cfg.url && cfg.key && window.supabase
  ? window.supabase.createClient(cfg.url,cfg.key)
  : null;

function moeda(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function carregarCarrinho(){try{const s=JSON.parse(localStorage.getItem("cantinho_carrinho")||"[]");return Array.isArray(s)?s:[]}catch{return []}}
function salvarCarrinho(){localStorage.setItem("cantinho_carrinho",JSON.stringify(carrinho));}

function lojaAberta(){
  const a=new Date(),d=a.getDay(),m=a.getHours()*60+a.getMinutes();
  return DIAS_ABERTOS.includes(d)&&m>=HORA_ABERTURA*60&&m<HORA_FECHAMENTO*60;
}
function proximaAbertura(){
  const a=new Date(),d=a.getDay(),m=a.getHours()*60+a.getMinutes();
  if(DIAS_ABERTOS.includes(d)&&m<HORA_ABERTURA*60)return "Abre hoje às 04h";
  const nomes=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
  for(let i=1;i<=7;i++){const x=(d+i)%7;if(DIAS_ABERTOS.includes(x))return `Abre ${nomes[x]} às 04h`;}
  return "Fechado";
}
function atualizarStatus(){
  const box=document.getElementById("headerStatus"),txt=document.getElementById("headerStatusText");
  if(lojaAberta()){box?.classList.remove("closed");if(txt)txt.textContent="Aberto • fecha às 22h";}
  else{box?.classList.add("closed");if(txt)txt.textContent=proximaAbertura();}
  atualizarProdutos();atualizarBotaoWhatsApp();
}
function disponivel(id){return !(id in estoque)||estoque[id]!==false;}
function setSystemMessage(t,e=false){
  const el=document.getElementById("stockMessage");if(!el)return;
  if(!t){el.className="system-message hidden";return;}
  el.textContent=t;el.className="system-message"+(e?" error":"");
}
async function carregarEstoque(){
  if(!sb){setSystemMessage("Estoque online ainda não configurado.",true);atualizarProdutos();return false;}
  const {data,error}=await sb.from("produtos_estoque").select("produto_id,disponivel");
  if(error){console.error(error);setSystemMessage("Não foi possível sincronizar o estoque agora.",true);atualizarProdutos();return false;}
  estoque={};(data||[]).forEach(i=>estoque[i.produto_id]=i.disponivel!==false);
  setSystemMessage("");atualizarProdutos();atualizarCarrinho();return true;
}
function atualizarProdutos(){
  const aberta=lojaAberta();
  document.querySelectorAll(".product-card").forEach(card=>{
    const id=card.dataset.produtoId,ok=disponivel(id),btn=card.querySelector(".add-button");
    card.classList.toggle("sold-out",!ok);
    if(!btn)return;
    if(!ok){btn.disabled=true;btn.textContent="Esgotado";}
    else if(!aberta){btn.disabled=true;btn.textContent="Loja fechada";}
    else{btn.disabled=false;btn.textContent="Adicionar";}
  });
}
function adicionarProduto(id,nome,preco){
  if(!lojaAberta())return toast("🔴 Loja fechada no momento");
  if(!disponivel(id))return toast(`🔴 ${nome} está esgotado`);
  const item=carrinho.find(i=>i.id===id);
  if(item)item.qtd++;else carrinho.push({id,nome,preco:Number(preco),qtd:1});
  salvarCarrinho();atualizarCarrinho();toast("✅ Produto adicionado ao pedido");
}
function reduzirProduto(id){
  const item=carrinho.find(i=>i.id===id);if(!item)return;
  item.qtd--;if(item.qtd<=0)carrinho=carrinho.filter(i=>i.id!==id);
  salvarCarrinho();atualizarCarrinho();
}
function removerProduto(id){carrinho=carrinho.filter(i=>i.id!==id);salvarCarrinho();atualizarCarrinho();}
function subtotal(){return carrinho.reduce((s,i)=>s+i.preco*i.qtd,0);}
function quantidade(){return carrinho.reduce((s,i)=>s+i.qtd,0);}
function taxaEntrega(){if(tipoPedido!=="Entrega")return 0;return TAXAS[document.getElementById("region")?.value]||0;}

function atualizarCarrinho(){
  const qtd=quantidade(),sub=subtotal();
  document.getElementById("headerCartCount").textContent=qtd;
  document.getElementById("floatingCartCount").textContent=qtd;
  document.getElementById("floatingCartTotal").textContent=moeda(sub);
  document.getElementById("cartSubtotal").textContent=moeda(sub);
  const lista=document.getElementById("cartList");

  if(!carrinho.length){
    lista.innerHTML='<div class="cart-empty"><div>🛒</div><strong>Seu carrinho está vazio</strong><span>Adicione produtos do cardápio para começar.</span></div>';
  }else{
    lista.innerHTML=carrinho.map(item=>{
      const esgotado=!disponivel(item.id);
      const safeName=item.nome.replaceAll("'","");
      return `<article class="cart-item">
        <div><h4>${item.nome}</h4><small>${moeda(item.preco)} cada</small>${esgotado?'<div class="item-warning">🔴 ESGOTADO</div>':''}
        <div class="qty-controls"><button onclick="reduzirProduto('${item.id}')">−</button><strong>${item.qtd}</strong><button onclick="adicionarProduto('${item.id}','${safeName}',${item.preco})" ${esgotado?"disabled":""}>+</button><button class="remove" onclick="removerProduto('${item.id}')">Remover</button></div></div>
        <div class="item-price">${moeda(item.preco*item.qtd)}</div></article>`;
    }).join("");
  }
  atualizarResumoCheckout();
}
function abrirCarrinho(){document.getElementById("cartDrawer").classList.add("active");document.body.style.overflow="hidden";}
function fecharCarrinho(){document.getElementById("cartDrawer").classList.remove("active");document.body.style.overflow="";}

async function abrirCheckout(){
  if(!lojaAberta())return toast("🔴 A loja está fechada");
  if(!carrinho.length)return toast("Adicione algum produto primeiro");
  await carregarEstoque();
  const esg=carrinho.filter(i=>!disponivel(i.id));
  if(esg.length){alert("Alguns produtos do carrinho estão esgotados:\n\n"+esg.map(i=>"• "+i.nome).join("\n")+"\n\nRemova-os para continuar.");return;}
  fecharCarrinho();document.getElementById("checkoutModal").classList.add("active");document.body.style.overflow="hidden";atualizarResumoCheckout();
}
function fecharCheckout(){document.getElementById("checkoutModal").classList.remove("active");document.body.style.overflow="";}
function selecionarTipo(tipo){
  tipoPedido=tipo;
  document.getElementById("deliveryBtn").classList.toggle("active",tipo==="Entrega");
  document.getElementById("pickupBtn").classList.toggle("active",tipo==="Retirada");
  document.getElementById("regionField").classList.toggle("hidden",tipo==="Retirada");
  document.getElementById("addressField").classList.toggle("hidden",tipo==="Retirada");
  if(tipo==="Retirada"){document.getElementById("region").value="";document.getElementById("address").value="";}
  atualizarResumoCheckout();
}
function atualizarResumoCheckout(){
  const sub=subtotal(),taxa=taxaEntrega();
  document.getElementById("checkoutSubtotal").textContent=moeda(sub);
  document.getElementById("checkoutFee").textContent=moeda(taxa);
  document.getElementById("checkoutTotal").textContent=moeda(sub+taxa);
  atualizarBotaoWhatsApp();
}
function atualizarBotaoWhatsApp(){
  const btn=document.getElementById("sendWhatsApp");if(!btn)return;
  if(lojaAberta()){btn.disabled=false;btn.textContent="💬 Enviar pedido pelo WhatsApp";}
  else{btn.disabled=true;btn.textContent="🔒 Loja fechada";}
}
function favoritos(){try{return JSON.parse(localStorage.getItem("cantinho_favoritos")||"[]")}catch{return []}}
function toggleFavorito(btn,id){
  let lista=favoritos();lista=lista.includes(id)?lista.filter(x=>x!==id):[...lista,id];
  localStorage.setItem("cantinho_favoritos",JSON.stringify(lista));restaurarFavoritos();aplicarFiltros();
}
function restaurarFavoritos(){
  const lista=favoritos();
  document.querySelectorAll(".product-card").forEach(card=>{
    const btn=card.querySelector(".heart"),ativo=lista.includes(card.dataset.produtoId);
    btn.classList.toggle("active",ativo);btn.textContent=ativo?"♥":"♡";
  });
}
function mostrarFavoritos(){
  somenteFavoritos=!somenteFavoritos;
  document.querySelectorAll(".round-button").forEach(btn=>btn.classList.toggle("active",somenteFavoritos));
  aplicarFiltros();toast(somenteFavoritos?"Mostrando seus favoritos":"Mostrando todo o cardápio");rolarCardapio();
}
function syncSearchInputs(source){
  const value=source.value;
  if(source.id==="searchDesktop")document.getElementById("searchMobile").value=value;
  else document.getElementById("searchDesktop").value=value;
  aplicarFiltros();
}
function aplicarFiltros(){
  const termo=document.getElementById("searchDesktop").value.toLowerCase().trim(),favs=favoritos();let visiveis=0;
  document.querySelectorAll(".product-card").forEach(card=>{
    const categoriaOk=filtroAtual==="todos"||card.dataset.category===filtroAtual;
    const texto=(card.dataset.name+" "+card.innerText).toLowerCase();
    const buscaOk=!termo||texto.includes(termo);
    const favoritoOk=!somenteFavoritos||favs.includes(card.dataset.produtoId);
    const mostrar=categoriaOk&&buscaOk&&favoritoOk;
    card.classList.toggle("hidden-card",!mostrar);if(mostrar)visiveis++;
  });
  document.getElementById("emptySearch").classList.toggle("hidden",visiveis!==0);
}
function filtrarCategoria(cat){
  filtroAtual=cat;document.querySelectorAll(".category").forEach(btn=>btn.classList.toggle("active",btn.dataset.filter===cat));
  aplicarFiltros();rolarCardapio();
}
function limparFiltros(){
  filtroAtual="todos";somenteFavoritos=false;
  document.getElementById("searchDesktop").value="";document.getElementById("searchMobile").value="";
  document.querySelectorAll(".category").forEach(btn=>btn.classList.toggle("active",btn.dataset.filter==="todos"));
  document.querySelectorAll(".round-button").forEach(btn=>btn.classList.remove("active"));aplicarFiltros();
}
function buscarProduto(termo){
  filtroAtual="todos";document.getElementById("searchDesktop").value=termo;document.getElementById("searchMobile").value=termo;
  document.querySelectorAll(".category").forEach(btn=>btn.classList.toggle("active",btn.dataset.filter==="todos"));
  aplicarFiltros();rolarCardapio();
}
function rolarCardapio(){document.getElementById("cardapio").scrollIntoView({behavior:"smooth",block:"start"});}
function formatarTelefone(){
  const campo=document.getElementById("customerPhone");
  campo.addEventListener("input",()=>{
    let v=campo.value.replace(/\D/g,"").slice(0,11);
    if(v.length>10)v=v.replace(/^(\d{2})(\d{5})(\d{4})$/,"($1) $2-$3");
    else if(v.length>6)v=v.replace(/^(\d{2})(\d{4})(\d{0,4})$/,"($1) $2-$3");
    else if(v.length>2)v=v.replace(/^(\d{2})(\d+)/,"($1) $2");
    campo.value=v;
  });
}
async function finalizarPedido(){
  if(!lojaAberta())return alert("A loja está fechada no momento.");
  if(!carrinho.length)return alert("Seu carrinho está vazio.");
  const ok=await carregarEstoque();
  if(sb&&!ok)return alert("Não foi possível confirmar o estoque agora. Tente novamente.");
  const esgotados=carrinho.filter(i=>!disponivel(i.id));
  if(esgotados.length)return alert("Alguns produtos acabaram antes da finalização:\n\n"+esgotados.map(i=>"• "+i.nome).join("\n"));

  const nome=document.getElementById("customerName").value.trim();
  const telefone=document.getElementById("customerPhone").value.trim();
  const regiao=document.getElementById("region").value;
  const endereco=document.getElementById("address").value.trim();
  const pagamento=document.getElementById("payment").value;
  const troco=document.getElementById("changeFor").value.trim();
  const observacoes=document.getElementById("notes").value.trim();

  if(!nome)return alert("Digite seu nome.");
  if(!telefone)return alert("Digite seu telefone.");
  if(tipoPedido==="Entrega"&&!regiao)return alert("Selecione sua região.");
  if(tipoPedido==="Entrega"&&!endereco)return alert("Digite o endereço.");
  if(!pagamento)return alert("Selecione a forma de pagamento.");
  if(NUMERO_WHATSAPP==="COLOQUE_SEU_NUMERO_AQUI")return alert("Configure o número do WhatsApp no começo do arquivo script.js.");

  const sub=subtotal(),taxa=taxaEntrega(),total=sub+taxa;
  let msg="🍕 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*\n\n";
  msg+=`👤 *Cliente:* ${nome}\n📱 *Telefone:* ${telefone}\n📦 *Recebimento:* ${tipoPedido}\n`;
  if(tipoPedido==="Entrega")msg+=`🗺️ *Região:* ${regiao}\n📍 *Endereço:* ${endereco}\n`;
  msg+="\n🧾 *ITENS DO PEDIDO*\n━━━━━━━━━━━━━━\n";
  carrinho.forEach(item=>{msg+=`\n${item.qtd}x ${item.nome}\n${moeda(item.preco*item.qtd)}\n`;});
  msg+=`\n━━━━━━━━━━━━━━\n💵 *Subtotal:* ${moeda(sub)}\n`;
  if(tipoPedido==="Entrega")msg+=`🛵 *Taxa (${regiao}):* ${moeda(taxa)}\n`;
  msg+=`💰 *TOTAL:* ${moeda(total)}\n\n💳 *Pagamento:* ${pagamento}\n`;
  if(pagamento==="Dinheiro"&&troco)msg+=`💵 *Troco para:* ${troco}\n`;
  if(observacoes)msg+=`\n📝 *Observações:*\n${observacoes}\n`;
  msg+="\n✅ Pedido realizado pelo site.";

  window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`,"_blank");
}
function toast(texto){
  const t=document.getElementById("toast");t.textContent=texto;t.classList.add("active");
  clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove("active"),1800);
}
function iniciarRealtime(){
  if(!sb)return;
  sb.channel("estoque-premium").on("postgres_changes",{event:"*",schema:"public",table:"produtos_estoque"},payload=>{
    if(payload.new?.produto_id)estoque[payload.new.produto_id]=payload.new.disponivel!==false;
    if(payload.eventType==="DELETE"&&payload.old?.produto_id)delete estoque[payload.old.produto_id];
    atualizarProdutos();atualizarCarrinho();
  }).subscribe();
}

document.addEventListener("DOMContentLoaded",async()=>{
  document.querySelectorAll(".category").forEach(btn=>{
    btn.addEventListener("click",()=>{
      filtroAtual=btn.dataset.filter;
      document.querySelectorAll(".category").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");aplicarFiltros();
    });
  });
  document.getElementById("searchDesktop").addEventListener("input",e=>syncSearchInputs(e.target));
  document.getElementById("searchMobile").addEventListener("input",e=>syncSearchInputs(e.target));
  document.getElementById("region").addEventListener("change",atualizarResumoCheckout);
  document.getElementById("payment").addEventListener("change",()=>{
    const dinheiro=document.getElementById("payment").value==="Dinheiro";
    document.getElementById("changeField").classList.toggle("hidden",!dinheiro);
    if(!dinheiro)document.getElementById("changeFor").value="";
  });

  formatarTelefone();restaurarFavoritos();atualizarStatus();atualizarCarrinho();aplicarFiltros();
  await carregarEstoque();iniciarRealtime();
  setInterval(atualizarStatus,30000);setInterval(carregarEstoque,60000);
});
