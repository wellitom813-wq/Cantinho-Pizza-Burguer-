const NUMERO_WHATSAPP = "5587991532323";

const DIAS_ABERTOS = [0, 2, 3, 5, 6];
const HORA_ABERTURA = 18;
const HORA_FECHAMENTO = 22;

const TAXAS = {
  N1: 4,
  N3: 3,
  N5: 5,
  C2: 6
};

let carrinho = JSON.parse(
  localStorage.getItem("cantinho_carrinho") || "[]"
);

let estoque = {};
let tipoPedido = "Entrega";
let filtroAtual = "todos";
let somenteFavoritos = false;
let modoLoja = "automatico";

const cfg = window.SUPABASE_CONFIG || {};

const sb =
  cfg.url && cfg.key
    ? window.supabase.createClient(cfg.url, cfg.key)
    : null;

function el(id) {
  return document.getElementById(id);
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function salvar() {
  localStorage.setItem(
    "cantinho_carrinho",
    JSON.stringify(carrinho)
  );
}

function escaparJs(texto) {
  return String(texto)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}

function lojaAbertaNoAutomatico() {
  const agora = new Date();
  const dia = agora.getDay();
  const minutos =
    agora.getHours() * 60 +
    agora.getMinutes();

  return (
    DIAS_ABERTOS.includes(dia) &&
    minutos >= HORA_ABERTURA * 60 &&
    minutos < HORA_FECHAMENTO * 60
  );
}

function lojaAberta() {
  if (modoLoja === "aberta") return true;
  if (modoLoja === "fechada") return false;
  return lojaAbertaNoAutomatico();
}

async function carregarStatusLoja({ atualizar = true } = {}) {
  if (!sb) {
    modoLoja = "automatico";
    if (atualizar) atualizarStatus();
    return false;
  }

  const { data, error } = await sb
    .from("loja_config")
    .select("modo")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Erro ao carregar status da loja:", error);
    if (atualizar) atualizarStatus();
    return false;
  }

  if (
    data?.modo === "aberta" ||
    data?.modo === "fechada" ||
    data?.modo === "automatico"
  ) {
    modoLoja = data.modo;
  } else {
    modoLoja = "automatico";
  }

  if (atualizar) atualizarStatus();
  return true;
}

function atualizarStatus() {
  const botaoStatus = el("statusLoja");
  const textoStatus = el("statusTexto");
  const aberta = lojaAberta();

  if (aberta) {
    botaoStatus?.classList.remove("closed");
    if (textoStatus) {
      textoStatus.textContent =
        modoLoja === "aberta"
          ? "Aberto • manual"
          : "Aberto • fecha às 22h";
    }
  } else {
    botaoStatus?.classList.add("closed");
    if (textoStatus) {
      textoStatus.textContent =
        modoLoja === "fechada"
          ? "Fechado • manual"
          : "Fechado";
    }
  }

  atualizarProdutos();
  atualizarBotao();
}

function iniciarRealtimeStatusLoja() {
  if (!sb) return;

  sb
    .channel("cantinho-status-loja-publico")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "loja_config",
        filter: "id=eq.1"
      },
      payload => {
        const novoModo = payload?.new?.modo;

        if (
          novoModo === "aberta" ||
          novoModo === "fechada" ||
          novoModo === "automatico"
        ) {
          modoLoja = novoModo;
          atualizarStatus();
        }
      }
    )
    .subscribe();
}

function disponivel(id) {
  return !(id in estoque) || estoque[id] !== false;
}

async function carregarEstoque() {
  if (!sb) return false;

  const { data, error } = await sb
    .from("produtos_estoque")
    .select("produto_id,disponivel");

  if (error) {
    console.error("Erro ao carregar estoque:", error);
    return false;
  }

  estoque = {};

  (data || []).forEach(item => {
    estoque[item.produto_id] =
      item.disponivel !== false;
  });

  atualizarProdutos();
  atualizarCarrinho();

  return true;
}

function produtosEsgotadosNoCarrinho() {
  return carrinho.filter(
    item => !disponivel(item.id)
  );
}

function atualizarProdutos() {
  const aberta = lojaAberta();

  document
    .querySelectorAll(".product-card")
    .forEach(card => {
      const id = card.dataset.produtoId;
      const ok = disponivel(id);
      const botao = card.querySelector(".add-button");

      card.classList.toggle("sold-out", !ok);

      if (!botao) return;

      if (!ok) {
        botao.disabled = true;
        botao.textContent = "Esgotado";
        return;
      }

      if (!aberta) {
        botao.disabled = true;
        botao.textContent = "Loja fechada";
        return;
      }

      botao.disabled = false;
      botao.textContent = "Adicionar";
    });
}

function rolarCardapio() {
  el("cardapio")?.scrollIntoView({
    behavior: "smooth"
  });
}

function adicionarProduto(id, nome, preco) {
  if (!lojaAberta()) {
    toast("Loja fechada");
    return;
  }

  if (!disponivel(id)) {
    toast("Produto esgotado");
    return;
  }

  const item = carrinho.find(
    produto => produto.id === id
  );

  if (item) {
    item.qtd++;
  } else {
    carrinho.push({
      id,
      nome,
      preco: Number(preco),
      qtd: 1
    });
  }

  salvar();
  atualizarCarrinho();
  toast("Produto adicionado");
}

function reduzirProduto(id) {
  const item = carrinho.find(
    produto => produto.id === id
  );

  if (!item) return;

  item.qtd--;

  if (item.qtd <= 0) {
    carrinho = carrinho.filter(
      produto => produto.id !== id
    );
  }

  salvar();
  atualizarCarrinho();
}

function removerProduto(id) {
  carrinho = carrinho.filter(
    produto => produto.id !== id
  );

  salvar();
  atualizarCarrinho();
}

function subtotal() {
  return carrinho.reduce(
    (soma, item) =>
      soma + item.preco * item.qtd,
    0
  );
}

function quantidade() {
  return carrinho.reduce(
    (soma, item) => soma + item.qtd,
    0
  );
}

function taxa() {
  if (tipoPedido !== "Entrega") {
    return 0;
  }

  const regiao = el("region")?.value;
  return TAXAS[regiao] || 0;
}

function atualizarCarrinho() {
  const qtd = quantidade();
  const sub = subtotal();

  if (el("headerCartCount")) {
    el("headerCartCount").textContent = qtd;
  }

  if (el("floatingCartCount")) {
    el("floatingCartCount").textContent = qtd;
  }

  if (el("floatingCartTotal")) {
    el("floatingCartTotal").textContent = moeda(sub);
  }

  if (el("cartSubtotal")) {
    el("cartSubtotal").textContent = moeda(sub);
  }

  const lista = el("cartList");

  if (!lista) {
    atualizarResumo();
    return;
  }

  if (!carrinho.length) {
    lista.innerHTML =
      '<div class="cart-empty"><strong>Seu carrinho está vazio</strong></div>';

    atualizarResumo();
    return;
  }

  lista.innerHTML = carrinho
    .map(item => {
      const nomeSeguro = escaparJs(item.nome);

      return `
        <article class="cart-item">
          <div>
            <h4>${item.nome}</h4>
            <small>${moeda(item.preco)} cada</small>

            <div class="qty-controls">
              <button onclick="reduzirProduto('${item.id}')">−</button>
              <strong>${item.qtd}</strong>

              <button
                onclick="adicionarProduto('${item.id}','${nomeSeguro}',${item.preco})"
                ${
                  disponivel(item.id) && lojaAberta()
                    ? ""
                    : "disabled"
                }
              >
                +
              </button>

              <button
                class="remove"
                onclick="removerProduto('${item.id}')"
              >
                Remover
              </button>
            </div>
          </div>

          <div class="item-price">
            ${moeda(item.preco * item.qtd)}
          </div>
        </article>
      `;
    })
    .join("");

  atualizarResumo();
}

function abrirCarrinho() {
  el("cartDrawer")?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function fecharCarrinho() {
  el("cartDrawer")?.classList.remove("active");
  document.body.style.overflow = "";
}

async function abrirCheckout() {
  if (!carrinho.length) {
    toast("Adicione um produto");
    return;
  }

  const statusVerificado =
    await carregarStatusLoja({
      atualizar: true
    });

  if (sb && !statusVerificado) {
    toast(
      "Não foi possível confirmar se a loja está aberta"
    );
    return;
  }

  if (!lojaAberta()) {
    toast("Loja fechada");
    return;
  }

  await carregarEstoque();

  const esgotados =
    produtosEsgotadosNoCarrinho();

  if (esgotados.length) {
    alert(
      "Alguns itens do seu pedido estão esgotados:\n\n" +
        esgotados
          .map(item => "• " + item.nome)
          .join("\n") +
        "\n\nRemova esses itens para continuar."
    );

    atualizarCarrinho();
    return;
  }

  el("checkoutModal")?.classList.add("active");
  document.body.style.overflow = "hidden";

  fecharCarrinho();
  atualizarResumo();
}

function fecharCheckout() {
  el("checkoutModal")?.classList.remove("active");
  document.body.style.overflow = "";
}

function selecionarTipo(tipo) {
  tipoPedido = tipo;

  el("deliveryBtn")?.classList.toggle(
    "active",
    tipo === "Entrega"
  );

  el("pickupBtn")?.classList.toggle(
    "active",
    tipo === "Retirada"
  );

  el("regionField")?.classList.toggle(
    "hidden",
    tipo === "Retirada"
  );

  el("addressField")?.classList.toggle(
    "hidden",
    tipo === "Retirada"
  );

  atualizarResumo();
}

function atualizarResumo() {
  if (el("checkoutSubtotal")) {
    el("checkoutSubtotal").textContent =
      moeda(subtotal());
  }

  if (el("checkoutFee")) {
    el("checkoutFee").textContent =
      moeda(taxa());
  }

  if (el("checkoutTotal")) {
    el("checkoutTotal").textContent =
      moeda(subtotal() + taxa());
  }

  atualizarBotao();
}

function atualizarBotao() {
  const botao = el("sendWhatsApp");
  if (!botao) return;

  const aberta = lojaAberta();

  botao.disabled = !aberta;

  botao.textContent = aberta
    ? "💬 Enviar pedido pelo WhatsApp"
    : "🔒 Loja fechada";
}

function favoritos() {
  return JSON.parse(
    localStorage.getItem("cantinho_favoritos") || "[]"
  );
}

function toggleFavorito(botao, id) {
  let lista = favoritos();

  lista = lista.includes(id)
    ? lista.filter(item => item !== id)
    : [...lista, id];

  localStorage.setItem(
    "cantinho_favoritos",
    JSON.stringify(lista)
  );

  restaurarFavoritos();
  aplicarFiltro();
}

function restaurarFavoritos() {
  const lista = favoritos();

  document
    .querySelectorAll(".product-card")
    .forEach(card => {
      const botao = card.querySelector(".heart");
      if (!botao) return;

      const ativo = lista.includes(
        card.dataset.produtoId
      );

      botao.classList.toggle("active", ativo);
      botao.textContent = ativo ? "♥" : "♡";
    });
}

function mostrarFavoritos() {
  somenteFavoritos = !somenteFavoritos;
  aplicarFiltro();
}

function filtrarCategoria(categoria) {
  filtroAtual = categoria;

  document
    .querySelectorAll(".category-nav button")
    .forEach(botao => {
      botao.classList.toggle(
        "active",
        botao.dataset.cat === categoria
      );
    });

  aplicarFiltro();
}

function aplicarFiltro() {
  const termo =
    (el("searchDesktop")?.value || "")
      .toLowerCase();

  const listaFavoritos = favoritos();
  let encontrados = 0;

  document
    .querySelectorAll(".category-section")
    .forEach(secao => {
      let encontradosSecao = 0;

      secao
        .querySelectorAll(".product-card")
        .forEach(card => {
          const categoriaOk =
            filtroAtual === "todos" ||
            card.dataset.category === filtroAtual;

          const pesquisaOk =
            !termo ||
            (
              (card.dataset.name || "") +
              " " +
              card.innerText
            )
              .toLowerCase()
              .includes(termo);

          const favoritoOk =
            !somenteFavoritos ||
            listaFavoritos.includes(
              card.dataset.produtoId
            );

          const mostrar =
            categoriaOk &&
            pesquisaOk &&
            favoritoOk;

          card.classList.toggle(
            "filtered-out",
            !mostrar
          );

          if (mostrar) {
            encontradosSecao++;
            encontrados++;
          }
        });

      secao.classList.toggle(
        "filtered-out",
        encontradosSecao === 0
      );
    });

  el("emptySearch")?.classList.toggle(
    "hidden",
    encontrados !== 0
  );
}

function syncSearch(origem) {
  const destino =
    origem.id === "searchDesktop"
      ? el("searchMobile")
      : el("searchDesktop");

  if (destino) {
    destino.value = origem.value;
  }

  aplicarFiltro();
}

function toast(texto) {
  const toastEl = el("toast");
  if (!toastEl) return;

  toastEl.textContent = texto;
  toastEl.classList.add("active");

  clearTimeout(
    window.cantinhoToastTimer
  );

  window.cantinhoToastTimer =
    setTimeout(() => {
      toastEl.classList.remove("active");
    }, 1500);
}

async function finalizarPedido() {
  const statusVerificado =
    await carregarStatusLoja({
      atualizar: true
    });

  if (sb && !statusVerificado) {
    alert(
      "Não foi possível confirmar o status da loja agora. Tente novamente em alguns segundos."
    );
    return;
  }

  if (!lojaAberta()) {
    alert(
      "🔴 A loja está fechada no momento."
    );
    return;
  }

  const estoqueVerificado =
    await carregarEstoque();

  if (sb && !estoqueVerificado) {
    alert(
      "Não foi possível confirmar o estoque agora. Tente novamente em alguns segundos."
    );
    return;
  }

  const esgotados =
    produtosEsgotadosNoCarrinho();

  if (esgotados.length) {
    alert(
      "Alguns itens do seu pedido estão esgotados:\n\n" +
        esgotados
          .map(item => "• " + item.nome)
          .join("\n") +
        "\n\nRemova esses itens para continuar."
    );

    atualizarCarrinho();
    return;
  }

  if (!carrinho.length) {
    alert("Seu carrinho está vazio.");
    return;
  }

  if (
    NUMERO_WHATSAPP ===
    "COLOQUE_SEU_NUMERO_AQUI"
  ) {
    alert(
      "Configure o WhatsApp no script.js."
    );
    return;
  }

  const nome =
    el("customerName")?.value.trim();

  const telefone =
    el("customerPhone")?.value.trim();

  const regiao =
    el("region")?.value;

  const endereco =
    el("address")?.value.trim();

  const pagamento =
    el("payment")?.value;

  const troco =
    el("changeFor")?.value.trim();

  const observacao =
    el("notes")?.value.trim();

  if (!nome || !telefone || !pagamento) {
    alert(
      "Preencha nome, telefone e pagamento."
    );
    return;
  }

  if (
    tipoPedido === "Entrega" &&
    (!regiao || !endereco)
  ) {
    alert(
      "Preencha região e endereço."
    );
    return;
  }

  let mensagem =
    "🍕 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*\n\n";

  mensagem +=
    `👤 *Cliente:* ${nome}\n`;

  mensagem +=
    `📱 *Telefone:* ${telefone}\n`;

  mensagem +=
    `📦 *Recebimento:* ${tipoPedido}\n`;

  if (tipoPedido === "Entrega") {
    mensagem +=
      `🗺️ *Região:* ${regiao}\n`;

    mensagem +=
      `📍 *Endereço:* ${endereco}\n`;
  }

  mensagem += "\n🧾 *ITENS*\n";

  carrinho.forEach(item => {
    mensagem +=
      `${item.qtd}x ${item.nome} — ${moeda(
        item.preco * item.qtd
      )}\n`;
  });

  mensagem +=
    `\n💵 *Subtotal:* ${moeda(
      subtotal()
    )}\n`;

  if (tipoPedido === "Entrega") {
    mensagem +=
      `🛵 *Taxa:* ${moeda(
        taxa()
      )}\n`;
  }

  mensagem +=
    `💰 *TOTAL:* ${moeda(
      subtotal() + taxa()
    )}\n`;

  mensagem +=
    `💳 *Pagamento:* ${pagamento}\n`;

  if (troco) {
    mensagem +=
      `💵 *Troco para:* ${troco}\n`;
  }

  if (observacao) {
    mensagem +=
      `📝 *Obs:* ${observacao}\n`;
  }

  window.open(
    `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(
      mensagem
    )}`,
    "_blank"
  );
}

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    document
      .querySelectorAll(".category-nav button")
      .forEach(botao => {
        botao.addEventListener(
          "click",
          () =>
            filtrarCategoria(
              botao.dataset.cat
            )
        );
      });

    el("searchDesktop")?.addEventListener(
      "input",
      evento =>
        syncSearch(evento.target)
    );

    el("searchMobile")?.addEventListener(
      "input",
      evento =>
        syncSearch(evento.target)
    );

    el("region")?.addEventListener(
      "change",
      atualizarResumo
    );

    el("payment")?.addEventListener(
      "change",
      () => {
        el("changeField")?.classList.toggle(
          "hidden",
          el("payment")?.value !== "Dinheiro"
        );
      }
    );

    restaurarFavoritos();
    atualizarCarrinho();
    aplicarFiltro();

    await carregarStatusLoja({
      atualizar: false
    });

    await carregarEstoque();

    atualizarStatus();
    iniciarRealtimeStatusLoja();

    setInterval(
      () =>
        carregarStatusLoja({
          atualizar: true
        }),
      15000
    );

    setInterval(
      carregarEstoque,
      60000
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (!document.hidden) {
          carregarStatusLoja({
            atualizar: true
          });

          carregarEstoque();
        }
      }
    );
  }
);
