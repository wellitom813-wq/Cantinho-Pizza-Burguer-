const NUMERO_WHATSAPP = "COLOQUE_SEU_NUMERO_AQUI";
const DIAS_ABERTOS = [0,2,3,5,6];
const HORA_ABERTURA = 18;
const HORA_FECHAMENTO = 22;
const TAXAS = {N1:4,N3:3,N5:5,C2:6};

let carrinho = [];
let estoque = {};
let tipoPedido = "Entrega";
let filtroAtual = "todos";
let somenteFavoritos = false;

const cfg = window.SUPABASE_CONFIG || {};
const sb = cfg.url && cfg.key ? window.supabase.createClient(cfg.url,cfg.key) : null;

function moeda(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function lojaAberta(){
  const a=new Date(),d=a.getDay(),m=a.getHours()*60+a.getMinutes();
  return DIAS_ABERTOS.includes(d)&&m>=HORA_ABERTURA*60&&m<HORA_FECHAMENTO*60;
}
function proximaAbertura(){
  const a=new Date(),d=a.getDay(),m=a.getHours()*60+a.getMinutes();
  if(DIAS_ABERTOS.includes(d)&&m<HORA_ABERTURA*60)return "Abre hoje às 18h";
  const nomes=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
  for(let i=1;i<=7;i++){const x=(d+i)%7;if(DIAS_ABERTOS.includes(x))return `Abre ${nomes[x]} às 18h`}
  return "Fechado";
}
function atualizarStatus(){
  const box=document.getElementById("statusLoja"),txt=document.getElementById("statusTexto");
  if(lojaAberta()){box?.classList.remove("closed");if(txt)txt.textContent="Aberto • fecha às 22h"}
  else{box?.classList.add("closed");if(txt)txt.textContent=proximaAbertura()}
  atualizarProdutos(); atualizarBotaoFinalizar();
}
function disponivel(id){return !(id in estoque)||estoque[id]!==false}
async function carregarEstoque(){
  if(!sb){atualizarProdutos();return false}
  const {data,error}=await sb.from("produtos_estoque").select("produto_id,disponivel");
  const aviso=document.getElementById("estoqueAviso");
  if(error){
    console.error(error);
    aviso.textContent="Não foi possível sincronizar o estoque agora.";
    aviso.className="sync-notice error";
    atualizarProdutos();return false
  }
  estoque={};(data||[]).forEach(i=>estoque[i.produto_id]=i.disponivel!==false);
  aviso.className="sync-notice hidden"; atualizarProdutos(); atualizarCarrinho(); return true;
}
function atualizarProdutos(){
  document.querySelectorAll(".product-card").forEach(card=>{
    const id=card.dataset.produtoId,ok=disponivel(id),btn=card.querySelector(".add-btn");
    card.classList.toggle("sold-out",!ok);
    if(!btn)return;
    if(!ok){btn.disabled=true;btn.textContent="×";btn.title="Produto esgotado"}
    else if(!lojaAberta()){btn.disabled=true;btn.textContent="🔒";btn.title="Loja fechada"}
    else{btn.disabled=false;btn.textContent="+";btn.title="Adicionar"}
  });
}
function adicionarProduto(id,nome,preco){
  if(!lojaAberta())return toast("🔴 Loja fechada");
  if(!disponivel(id))return toast(`🔴 ${nome} está esgotado`);
  const p=carrinho.find(i=>i.id===id);
  if(p)p.qtd++;else carrinho.push({id,nome,preco:Number(preco),qtd:1});
  atualizarCarrinho();toast("✅ Produto adicionado");
}
function reduzir(id){const p=carrinho.find(i=>i.id===id);if(!p)return;p.qtd--;if(p.qtd<=0)carrinho=carrinho.filter(i=>i.id!==id);atualizarCarrinho()}
function remover(id){carrinho=carrinho.filter(i=>i.id!==id);atualizarCarrinho()}
function subtotal(){return carrinho.reduce((s,i)=>s+i.preco*i.qtd,0)}
function quantidade(){return carrinho.reduce((s,i)=>s+i.qtd,0)}
function taxa(){if(tipoPedido!=="Entrega")return 0;return TAXAS[document.getElementById("regiao")?.value]||0}
function atualizarCarrinho(){
  const q=quantidade(),sub=subtotal();
  document.getElementById("cartCount").textContent=q;
  document.getElementById("topCartCount").textContent=q;
  document.getElementById("cartTotal").textContent=moeda(sub);
  document.getElementById("drawerTotal").textContent=moeda(sub);
  const area=document.getElementById("cartItems");
  if(!carrinho.length){area.innerHTML='<div class="empty"><span>🛒</span><strong>Seu carrinho está vazio</strong><p>Adicione produtos para continuar.</p></div>'}
  else area.innerHTML=carrinho.map(i=>`
    <div class="cart-item">
      <div><strong>${i.nome}</strong><br><small>${moeda(i.preco)} cada</small>${!disponivel(i.id)?'<div class="warn">🔴 ESGOTADO</div>':''}
        <div class="cart-item-actions">
          <button onclick="reduzir('${i.id}')">−</button><strong>${i.qtd}</strong>
          <button onclick="adicionarProduto('${i.id}','${i.nome.replaceAll("'","")}',${i.preco})" ${!disponivel(i.id)?"disabled":""}>+</button>
        </div>
      </div>
      <div style="text-align:right"><strong>${moeda(i.preco*i.qtd)}</strong><br><button onclick="remover('${i.id}')" style="border:0;background:none;color:#ea1d2c;font-size:8px;margin-top:8px">Remover</button></div>
    </div>`).join("");
  atualizarResumo();
}
function abrirCarrinho(){document.getElementById("drawer").classList.add("active");document.body.style.overflow="hidden"}
function fecharCarrinho(){document.getElementById("drawer").classList.remove("active");document.body.style.overflow=""}
async function abrirCheckout(){
  if(!lojaAberta())return toast("🔴 Loja fechada");
  if(!carrinho.length)return toast("Adicione algum produto primeiro");
  await carregarEstoque();
  const esg=carrinho.filter(i=>!disponivel(i.id));
  if(esg.length)return alert("Produtos esgotados:\n\n"+esg.map(i=>"• "+i.nome).join("\n"));
  fecharCarrinho();document.getElementById("checkoutModal").classList.add("active");document.body.style.overflow="hidden";atualizarResumo()
}
function fecharCheckout(){document.getElementById("checkoutModal").classList.remove("active");document.body.style.overflow=""}
function selecionarTipo(t){
  tipoPedido=t;
  document.getElementById("btnEntrega").classList.toggle("active",t==="Entrega");
  document.getElementById("btnRetirada").classList.toggle("active",t==="Retirada");
  document.getElementById("campoRegiao").classList.toggle("hidden",t==="Retirada");
  document.getElementById("campoEndereco").classList.toggle("hidden",t==="Retirada");
  if(t==="Retirada"){document.getElementById("regiao").value="";document.getElementById("endereco").value=""}
  atualizarResumo();
}
function atualizarResumo(){
  document.getElementById("checkoutSubtotal").textContent=moeda(subtotal());
  document.getElementById("checkoutTaxa").textContent=moeda(taxa());
  document.getElementById("checkoutTotal").textContent=moeda(subtotal()+taxa());
  atualizarBotaoFinalizar();
}
function atualizarBotaoFinalizar(){
  const b=document.getElementById("finalizarBtn");if(!b)return;
  b.disabled=!lojaAberta();b.textContent=lojaAberta()?"💬 Finalizar pelo WhatsApp":"🔒 Loja fechada";
}
function favoritos(){try{return JSON.parse(localStorage.getItem("cantinho_favoritos")||"[]")}catch{return []}}
function toggleFavorito(btn,id){
  let f=favoritos();f=f.includes(id)?f.filter(x=>x!==id):[...f,id];
  localStorage.setItem("cantinho_favoritos",JSON.stringify(f));restaurarFavoritos();aplicarFiltros();
}
function restaurarFavoritos(){
  const f=favoritos();document.querySelectorAll(".product-card").forEach(c=>{const b=c.querySelector(".favorite-btn"),a=f.includes(c.dataset.produtoId);b.classList.toggle("active",a);b.textContent=a?"♥":"♡"})
}
function mostrarFavoritos(){somenteFavoritos=!somenteFavoritos;aplicarFiltros();toast(somenteFavoritos?"Mostrando favoritos":"Mostrando todo o cardápio")}
function aplicarFiltros(){
  const termo=document.getElementById("busca").value.toLowerCase().trim(),f=favoritos();let n=0;
  document.querySelectorAll(".product-card").forEach(c=>{
    const cat=filtroAtual==="todos"||c.dataset.category===filtroAtual;
    const busca=!termo||(c.dataset.name+" "+c.innerText).toLowerCase().includes(termo);
    const fav=!somenteFavoritos||f.includes(c.dataset.produtoId);
    const show=cat&&busca&&fav;c.classList.toggle("hidden",!show);if(show)n++;
  });
  document.getElementById("nenhumResultado").classList.toggle("hidden",n!==0);
}
function filtrarCategoria(cat){
  filtroAtual=cat;document.querySelectorAll(".category-chip").forEach(b=>b.classList.toggle("active",b.dataset.filter===cat));
  aplicarFiltros();document.querySelector(".menu-section").scrollIntoView({behavior:"smooth"})
}
function limparFiltros(){filtroAtual="todos";somenteFavoritos=false;document.getElementById("busca").value="";document.querySelectorAll(".category-chip").forEach(b=>b.classList.toggle("active",b.dataset.filter==="todos"));aplicarFiltros()}
function buscarProduto(t){document.getElementById("busca").value=t;filtroAtual="todos";aplicarFiltros();document.querySelector(".menu-section").scrollIntoView({behavior:"smooth"})}
function toast(t){const x=document.getElementById("toast");x.textContent=t;x.classList.add("active");clearTimeout(window._t);window._t=setTimeout(()=>x.classList.remove("active"),1700)}
async function finalizarPedido(){
  if(!lojaAberta())return alert("A loja está fechada.");
  if(!carrinho.length)return alert("Seu carrinho está vazio.");
  const ok=await carregarEstoque();if(sb&&!ok)return alert("Não foi possível confirmar o estoque.");
  const esg=carrinho.filter(i=>!disponivel(i.id));if(esg.length)return alert("Produtos esgotados:\n\n"+esg.map(i=>"• "+i.nome).join("\n"));
  const nome=document.getElementById("nome").value.trim(),tel=document.getElementById("telefone").value.trim(),reg=document.getElementById("regiao").value,end=document.getElementById("endereco").value.trim(),pag=document.getElementById("pagamento").value,troco=document.getElementById("troco").value.trim(),obs=document.getElementById("observacoes").value.trim();
  if(!nome)return alert("Digite seu nome.");if(!tel)return alert("Digite seu telefone.");if(tipoPedido==="Entrega"&&!reg)return alert("Selecione sua região.");if(tipoPedido==="Entrega"&&!end)return alert("Digite o endereço.");if(!pag)return alert("Selecione o pagamento.");
  if(NUMERO_WHATSAPP==="COLOQUE_SEU_NUMERO_AQUI")return alert("Configure o WhatsApp no começo do script.js.");
  let m="🍕 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*\n\n";
  m+=`👤 *Cliente:* ${nome}\n📱 *Telefone:* ${tel}\n📦 *Recebimento:* ${tipoPedido}\n`;
  if(tipoPedido==="Entrega")m+=`🗺️ *Região:* ${reg}\n📍 *Endereço:* ${end}\n`;
  m+="\n🧾 *ITENS DO PEDIDO*\n━━━━━━━━━━━━━━\n";
  carrinho.forEach(i=>m+=`\n${i.qtd}x ${i.nome}\n${moeda(i.preco*i.qtd)}\n`);
  m+=`\n━━━━━━━━━━━━━━\n💵 *Subtotal:* ${moeda(subtotal())}\n`;
  if(tipoPedido==="Entrega")m+=`🛵 *Taxa (${reg}):* ${moeda(taxa())}\n`;
  m+=`💰 *TOTAL:* ${moeda(subtotal()+taxa())}\n\n💳 *Pagamento:* ${pag}\n`;
  if(pag==="Dinheiro"&&troco)m+=`💵 *Troco para:* ${troco}\n`;if(obs)m+=`\n📝 *Observações:*\n${obs}\n`;
  window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(m)}`,"_blank");
}
function iniciarRealtime(){if(!sb)return;sb.channel("estoque-site").on("postgres_changes",{event:"*",schema:"public",table:"produtos_estoque"},p=>{if(p.new?.produto_id)estoque[p.new.produto_id]=p.new.disponivel!==false;atualizarProdutos();atualizarCarrinho()}).subscribe()}
document.addEventListener("DOMContentLoaded",async()=>{
  document.querySelectorAll(".category-chip").forEach(b=>b.addEventListener("click",()=>{filtroAtual=b.dataset.filter;document.querySelectorAll(".category-chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");aplicarFiltros()}));
  document.getElementById("busca").addEventListener("input",aplicarFiltros);
  document.getElementById("regiao").addEventListener("change",atualizarResumo);
  document.getElementById("pagamento").addEventListener("change",()=>{const d=document.getElementById("pagamento").value==="Dinheiro";document.getElementById("campoTroco").classList.toggle("hidden",!d)});
  restaurarFavoritos();atualizarStatus();atualizarCarrinho();aplicarFiltros();await carregarEstoque();iniciarRealtime();
  setInterval(atualizarStatus,30000);setInterval(carregarEstoque,60000);
});
