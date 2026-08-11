(() => {
  "use strict";

  const cfg = window.SUPABASE_CONFIG || window.supabaseConfig || {};
  const URL = cfg.url || window.SUPABASE_URL;
  const KEY = cfg.key || cfg.anonKey || window.SUPABASE_ANON_KEY || window.SUPABASE_PUBLISHABLE_KEY;
  const sb = window.supabase && URL && KEY ? window.supabase.createClient(URL, KEY) : null;
  const $ = (id) => document.getElementById(id);

  let produtos = [];
  let categorias = [];
  let config = {
    whatsapp: "",
    hora_abertura: "18:00",
    hora_fechamento: "22:00",
    dias_abertos: [0,2,3,5,6],
    taxa_n1: 4,
    taxa_n3: 3,
    taxa_n5: 5,
    taxa_c2: 6,
    modo_loja: "automatico"
  };
  let carrinho = JSON.parse(localStorage.getItem("cantinho_carrinho") || "[]");

  function moeda(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
  function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
  function js(v){return String(v??"").replaceAll("\\","\\\\").replaceAll("'","\\'").replaceAll("\n"," ")}
  function slug(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}
  function salvarCarrinho(){localStorage.setItem("cantinho_carrinho",JSON.stringify(carrinho))}

  function minutos(hora){const [h,m]=String(hora||"00:00").slice(0,5).split(":").map(Number);return h*60+m}
  function lojaAberta(){
    if(config.modo_loja==="aberta")return true;
    if(config.modo_loja==="fechada")return false;
    const agora=new Date(),dia=agora.getDay(),atual=agora.getHours()*60+agora.getMinutes();
    return (config.dias_abertos||[]).map(Number).includes(dia)&&atual>=minutos(config.hora_abertura)&&atual<minutos(config.hora_fechamento);
  }

  function atualizarStatus(){
    const box=document.querySelector(".status-loja"),texto=box?.querySelector("span:last-child");
    if(!box||!texto)return;
    const aberta=lojaAberta();
    box.classList.toggle("fechado",!aberta);
    if(config.modo_loja==="aberta")texto.textContent="Aberto agora";
    else if(config.modo_loja==="fechada")texto.textContent="Fechado agora";
    else texto.textContent=aberta?`Aberto • fecha às ${String(config.hora_fechamento).slice(0,5)}`:`Fechado • abre às ${String(config.hora_abertura).slice(0,5)}`;
    document.querySelectorAll(".produto").forEach(card=>{
      const id=card.dataset.produtoId,p=produtos.find(x=>x.produto_id===id),btn=card.querySelector(".btn-adicionar");
      if(!p||!btn)return;
      card.classList.toggle("esgotado",p.disponivel===false);
      if(p.disponivel===false){btn.disabled=true;btn.textContent="Esgotado"}
      else if(!aberta){btn.disabled=true;btn.textContent="Loja fechada"}
      else{btn.disabled=false;btn.textContent="Adicionar +"}
    });
  }

  function prepararMain(){
    const main=document.querySelector("main");
    if(!main)return null;
    let container=$("sectionsContainer");
    if(!container){
      container=document.createElement("div");container.id="sectionsContainer";
      const finalizacao=$("finalizacao");
      main.querySelectorAll(":scope > .secao").forEach(s=>s.remove());
      if(finalizacao)main.insertBefore(container,finalizacao);else main.prepend(container);
    }
    return container;
  }

  function renderCardapio(){
    const container=prepararMain();if(!container)return;
    const ativas=categorias.filter(c=>c.ativo!==false).sort((a,b)=>(a.ordem||0)-(b.ordem||0));
    const nav=document.querySelector(".categorias");
    if(nav)nav.innerHTML=ativas.map(c=>`<a href="#${esc(slug(c.slug||c.nome))}">${esc(c.emoji||"🍽️")} ${esc(c.nome)}</a>`).join("");
    container.innerHTML=ativas.map(c=>{
      const itens=produtos.filter(p=>p.ativo!==false&&p.categoria===c.slug).sort((a,b)=>(a.ordem||0)-(b.ordem||0)||(a.nome||"").localeCompare(b.nome||""));
      if(!itens.length)return"";
      return `<section class="secao" id="${esc(slug(c.slug||c.nome))}"><h2>${esc(c.emoji||"🍽️")} ${esc(c.nome)}</h2><div class="grade-produtos">${itens.map(p=>`
      <article class="produto ${p.disponivel===false?"esgotado":""}" data-produto-id="${esc(p.produto_id)}">
        <div class="imagem-wrap"><img src="${esc(p.imagem_url||"")}" alt="${esc(p.nome)}" loading="lazy"><span class="selo-esgotado">ESGOTADO</span></div>
        <div class="produto-info"><h3>${esc(p.nome)}</h3>${p.descricao?`<p>${esc(p.descricao)}</p>`:""}<div class="produto-rodape"><strong>${moeda(p.preco)}</strong><button class="btn-adicionar" onclick="adicionarProduto('${js(p.produto_id)}','${js(p.nome)}',${Number(p.preco||0)})">Adicionar +</button></div></div>
      </article>`).join("")}</div></section>`;
    }).join("");
    atualizarStatus();
  }

  function reconciliarCarrinho(){
    const mapa=new Map(produtos.filter(p=>p.ativo!==false).map(p=>[p.produto_id,p]));
    carrinho=carrinho.filter(i=>mapa.has(i.id)).map(i=>{const p=mapa.get(i.id);return{...i,nome:p.nome,preco:Number(p.preco||0)}});
    salvarCarrinho();atualizarCarrinho();
  }

  async function carregarDados(){
    if(!sb){console.error("Supabase não configurado.");atualizarStatus();return false}
    const [p,c,f]=await Promise.all([
      sb.from("produtos_estoque").select("produto_id,nome,preco,descricao,categoria,imagem_url,disponivel,ativo,destaque,ordem"),
      sb.from("categorias_cardapio").select("slug,nome,emoji,ordem,ativo"),
      sb.from("config_cardapio").select("whatsapp,hora_abertura,hora_fechamento,dias_abertos,taxa_n1,taxa_n3,taxa_n5,taxa_c2,modo_loja").eq("id",1).single()
    ]);
    if(p.error){console.error(p.error);return false}if(c.error){console.error(c.error);return false}if(f.error){console.error(f.error);return false}
    produtos=p.data||[];categorias=c.data||[];config={...config,...f.data};
    atualizarSelectRegiao();renderCardapio();reconciliarCarrinho();return true;
  }

  function atualizarSelectRegiao(){
    const r=$("regiao");if(!r)return;const v=r.value;
    const taxas={N1:Number(config.taxa_n1||0),N3:Number(config.taxa_n3||0),N5:Number(config.taxa_n5||0),C2:Number(config.taxa_c2||0)};
    r.innerHTML=`<option value="">Selecione sua região</option>`+Object.entries(taxas).map(([k,val])=>`<option value="${k}">${k} — ${moeda(val)}</option>`).join("");r.value=v;
  }

  function produtoPorId(id){return produtos.find(p=>p.produto_id===id&&p.ativo!==false)}
  window.adicionarProduto=function(id,nome,preco){
    const p=produtoPorId(id);if(!lojaAberta())return toast("Loja fechada");if(!p||p.disponivel===false)return toast("Produto esgotado");
    const item=carrinho.find(x=>x.id===id);if(item)item.qtd++;else carrinho.push({id,nome:p.nome||nome,preco:Number(p.preco??preco),qtd:1});
    salvarCarrinho();atualizarCarrinho();toast("Produto adicionado!")
  };
  window.reduzirProduto=function(id){const i=carrinho.find(x=>x.id===id);if(!i)return;i.qtd--;if(i.qtd<=0)carrinho=carrinho.filter(x=>x.id!==id);salvarCarrinho();atualizarCarrinho()};
  window.aumentarProduto=function(id){const p=produtoPorId(id);if(!p||p.disponivel===false)return toast("Produto esgotado");const i=carrinho.find(x=>x.id===id);if(i)i.qtd++;salvarCarrinho();atualizarCarrinho()};
  window.removerProduto=function(id){carrinho=carrinho.filter(x=>x.id!==id);salvarCarrinho();atualizarCarrinho()};

  function subtotal(){return carrinho.reduce((s,i)=>s+Number(i.preco||0)*Number(i.qtd||0),0)}
  function taxaAtual(){if($("tipoPedido")?.value==="Retirada")return 0;const k=$("regiao")?.value;return Number({N1:config.taxa_n1,N3:config.taxa_n3,N5:config.taxa_n5,C2:config.taxa_c2}[k]||0)}
  function atualizarCarrinho(){
    const qtd=carrinho.reduce((s,i)=>s+i.qtd,0),sub=subtotal();if($("quantidadeCarrinho"))$("quantidadeCarrinho").textContent=qtd;if($("totalCarrinho"))$("totalCarrinho").textContent=moeda(sub);if($("totalModal"))$("totalModal").textContent=moeda(sub);
    const lista=$("listaCarrinho");if(lista)lista.innerHTML=carrinho.length?carrinho.map(i=>`<div class="linha" style="gap:10px;align-items:center"><div style="flex:1"><strong>${esc(i.nome)}</strong><br><small>${moeda(i.preco)} × ${i.qtd}</small></div><button onclick="reduzirProduto('${js(i.id)}')">−</button><button onclick="aumentarProduto('${js(i.id)}')">+</button><button onclick="removerProduto('${js(i.id)}')">✕</button></div>`).join(""):`<p>Seu carrinho está vazio.</p>`;
    atualizarResumoFinal();
  }

  window.abrirCarrinho=function(){$("modalCarrinho")?.classList.add("ativo")};
  window.fecharCarrinho=function(){$("modalCarrinho")?.classList.remove("ativo")};
  window.irParaFinalizacao=function(){if(!carrinho.length)return toast("Carrinho vazio");window.fecharCarrinho();$("finalizacao")?.classList.add("ativo");$("finalizacao")?.scrollIntoView({behavior:"smooth"});atualizarResumoFinal()};

  function atualizarResumoFinal(){const sub=subtotal(),taxa=taxaAtual();if($("subtotalPedido"))$("subtotalPedido").textContent=moeda(sub);if($("taxaEntrega"))$("taxaEntrega").textContent=moeda(taxa);if($("totalFinalPedido"))$("totalFinalPedido").textContent=moeda(sub+taxa)}

  function numeroWhatsapp(){let n=String(config.whatsapp||"").replace(/\D/g,"");if(n.length===10||n.length===11)n="55"+n;return n}
  window.finalizarPedido=function(){
    if(!lojaAberta())return toast("A loja está fechada");if(!carrinho.length)return toast("Carrinho vazio");
    const indisponiveis=carrinho.filter(i=>produtoPorId(i.id)?.disponivel===false);if(indisponiveis.length)return toast("Remova os produtos esgotados do pedido");
    const nome=$("nome")?.value.trim(),telefone=$("telefone")?.value.trim(),tipo=$("tipoPedido")?.value||"Entrega",regiao=$("regiao")?.value||"",endereco=$("endereco")?.value.trim(),pagamento=$("pagamento")?.value||"",troco=$("troco")?.value.trim(),obs=$("observacoes")?.value.trim();
    if(!nome)return toast("Informe seu nome");if(tipo==="Entrega"&&!regiao)return toast("Selecione sua região");if(tipo==="Entrega"&&!endereco)return toast("Informe o endereço");if(!pagamento)return toast("Selecione a forma de pagamento");
    const taxa=taxaAtual(),sub=subtotal(),total=sub+taxa;let texto=`🍕 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*\n\n👤 *Cliente:* ${nome}\n📞 *Telefone:* ${telefone||"Não informado"}\n🚚 *Tipo:* ${tipo}\n`;
    if(tipo==="Entrega")texto+=`📍 *Região:* ${regiao}\n🏠 *Endereço:* ${endereco}\n`;
    texto+=`\n🛒 *ITENS:*\n`+carrinho.map(i=>`• ${i.qtd}x ${i.nome} — ${moeda(i.preco*i.qtd)}`).join("\n");
    texto+=`\n\n💵 *Subtotal:* ${moeda(sub)}\n🚚 *Taxa:* ${moeda(taxa)}\n💰 *TOTAL:* ${moeda(total)}\n💳 *Pagamento:* ${pagamento}`;
    if(troco)texto+=`\n💵 *Troco para:* ${troco}`;if(obs)texto+=`\n📝 *Observações:* ${obs}`;
    const n=numeroWhatsapp();if(n.length<12)return toast("Configure o WhatsApp no painel administrador");
    window.open(`https://wa.me/${n}?text=${encodeURIComponent(texto)}`,"_blank");
  };

  function toast(texto){const t=$("toast");if(!t){alert(texto);return}t.textContent=texto;t.classList.add("ativo");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("ativo"),2200)}

  function binds(){
    $("tipoPedido")?.addEventListener("change",()=>{const entrega=$("tipoPedido").value==="Entrega";if($("campoRegiao"))$("campoRegiao").style.display=entrega?"block":"none";if($("endereco"))$("endereco").style.display=entrega?"block":"none";atualizarResumoFinal()});
    $("regiao")?.addEventListener("change",atualizarResumoFinal);
    $("modalCarrinho")?.addEventListener("click",e=>{if(e.target===$("modalCarrinho"))window.fecharCarrinho()});
  }

  function iniciarRealtime(){if(!sb)return;sb.channel("cantinho-publico-total")
    .on("postgres_changes",{event:"*",schema:"public",table:"produtos_estoque"},carregarDados)
    .on("postgres_changes",{event:"*",schema:"public",table:"categorias_cardapio"},carregarDados)
    .on("postgres_changes",{event:"*",schema:"public",table:"config_cardapio"},carregarDados)
    .subscribe();}

  async function init(){binds();atualizarCarrinho();await carregarDados();iniciarRealtime();setInterval(atualizarStatus,30000)}
  document.addEventListener("DOMContentLoaded",init);
})();
