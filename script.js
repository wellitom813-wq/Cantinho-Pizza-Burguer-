let carrinho = [];

function moeda(valor){
  return valor.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function adicionar(nome, preco){
  const item = carrinho.find(i => i.nome === nome);
  if(item) item.qtd++;
  else carrinho.push({nome,preco,qtd:1});
  atualizarCarrinho();
}

function reduzir(nome){
  const item = carrinho.find(i => i.nome === nome);
  if(!item) return;
  item.qtd--;
  if(item.qtd <= 0) carrinho = carrinho.filter(i => i.nome !== nome);
  atualizarCarrinho();
}

function remover(nome){
  carrinho = carrinho.filter(i => i.nome !== nome);
  atualizarCarrinho();
}

function total(){
  return carrinho.reduce((s,i)=>s+i.preco*i.qtd,0);
}

function qtdTotal(){
  return carrinho.reduce((s,i)=>s+i.qtd,0);
}

function atualizarCarrinho(){
  const count = qtdTotal();
  const valor = total();

  document.getElementById("cartCount").textContent = count;
  document.getElementById("topCartCount").textContent = count;
  document.getElementById("cartTotal").textContent = moeda(valor);
  document.getElementById("drawerTotal").textContent = moeda(valor);
  document.getElementById("previewSubtotal").textContent = moeda(valor);

  const area = document.getElementById("cartItems");

  if(!carrinho.length){
    area.innerHTML = `
      <div class="empty">
        <span>🛒</span>
        <strong>Seu carrinho está vazio</strong>
        <p>Adicione alguns itens para testar o fluxo.</p>
      </div>
    `;
    return;
  }

  area.innerHTML = carrinho.map(item => `
    <div class="cart-item">
      <div>
        <strong>${item.nome}</strong><br>
        <small>${moeda(item.preco)} cada</small>
        <div class="cart-item-actions">
          <button onclick="reduzir('${item.nome}')">−</button>
          <strong>${item.qtd}</strong>
          <button onclick="adicionar('${item.nome}',${item.preco})">+</button>
        </div>
      </div>
      <div style="text-align:right">
        <strong>${moeda(item.preco*item.qtd)}</strong><br>
        <button onclick="remover('${item.nome}')" style="border:0;background:none;color:#ea1d2c;font-size:9px;margin-top:9px">Remover</button>
      </div>
    </div>
  `).join("");
}

function abrirCarrinho(){
  document.getElementById("drawer").classList.add("active");
  document.body.style.overflow = "hidden";
}

function fecharCarrinho(){
  document.getElementById("drawer").classList.remove("active");
  document.body.style.overflow = "";
}

function mostrarCheckout(){
  if(!carrinho.length){
    alert("Adicione algum item primeiro para testar o checkout.");
    return;
  }
  fecharCarrinho();
  document.getElementById("checkoutModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function fecharCheckout(){
  document.getElementById("checkoutModal").classList.remove("active");
  document.body.style.overflow = "";
}

document.querySelectorAll(".category-chip").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".category-chip").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    const filtro = btn.dataset.filter;
    document.querySelectorAll(".product-card").forEach(card=>{
      card.classList.toggle("hidden", filtro !== "todos" && card.dataset.category !== filtro);
    });
  });
});

document.getElementById("busca").addEventListener("input", e=>{
  const termo = e.target.value.toLowerCase().trim();
  document.querySelectorAll(".product-card").forEach(card=>{
    const texto = (card.dataset.name + " " + card.innerText).toLowerCase();
    card.classList.toggle("hidden", termo && !texto.includes(termo));
  });
});

document.querySelectorAll(".delivery-switch button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".delivery-switch button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
  });
});

atualizarCarrinho();
