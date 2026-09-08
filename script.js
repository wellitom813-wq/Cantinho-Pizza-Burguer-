/* ============================================================
   CANTINHO PIZZA BURGUER
   SCRIPT PÚBLICO — CARDÁPIO 100% CONTROLADO PELO ADMIN
   COMPATIBILIDADE: EMOJIS CODIFICADOS EM UNICODE (SEGURO EM NOTEBOOK/CELULAR)
============================================================ */

const PADRAO_DIAS_ABERTOS = [0, 2, 3, 5, 6];

let configCardapio = {
  whatsapp: "COLOQUE_SEU_NUMERO_AQUI",
  hora_abertura: "18:00:00",
  hora_fechamento: "22:00:00",
  dias_abertos: PADRAO_DIAS_ABERTOS,
  taxa_n1: 4,
  taxa_n3: 3,
  taxa_n5: 5,
  taxa_c2: 6
};

let categoriasCardapio = [];
let produtosCardapio = [];
let produtosPorId = {};

let carrinho = JSON.parse(
  localStorage.getItem("cantinho_carrinho") || "[]"
);

let tipoPedido = "Entrega";
let filtroAtual = "todos";
let somenteFavoritos = false;
let modoLoja = "automatico";

const cfg =
  window.SUPABASE_CONFIG ||
  window.supabaseConfig ||
  {};

const SUPABASE_URL =
  cfg.url ||
  window.SUPABASE_URL;

const SUPABASE_KEY =
  cfg.key ||
  cfg.anonKey ||
  window.SUPABASE_ANON_KEY ||
  window.SUPABASE_PUBLISHABLE_KEY;

const sb =
  window.supabase &&
  SUPABASE_URL &&
  SUPABASE_KEY
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      )
    : null;


/* ============================================================
   UTILIDADES
============================================================ */

function el(id) {
  return document.getElementById(id);
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );
}

function escaparHtml(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escaparJs(texto) {
  return String(texto ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}

function slugSeguro(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function salvarCarrinho() {
  localStorage.setItem(
    "cantinho_carrinho",
    JSON.stringify(carrinho)
  );
}


/* ============================================================
   CONFIGURAÇÕES
============================================================ */

function taxasAtuais() {
  return {
    N1: Number(configCardapio.taxa_n1 || 0),
    N3: Number(configCardapio.taxa_n3 || 0),
    N5: Number(configCardapio.taxa_n5 || 0),
    C2: Number(configCardapio.taxa_c2 || 0)
  };
}

function minutosDeHora(hora) {
  const partes =
    String(hora || "00:00")
      .split(":");

  const h =
    Number(partes[0] || 0);

  const m =
    Number(partes[1] || 0);

  return h * 60 + m;
}

function horaCurta(hora) {
  return String(hora || "")
    .slice(0, 5);
}

async function carregarConfigCardapio({
  atualizar = true
} = {}) {
  if (!sb) {
    if (atualizar) {
      atualizarStatus();
      atualizarResumo();
    }

    return false;
  }

  const {
    data,
    error
  } =
    await sb
      .from("config_cardapio")
      .select(
        "whatsapp,hora_abertura,hora_fechamento,dias_abertos,taxa_n1,taxa_n3,taxa_n5,taxa_c2"
      )
      .eq("id", 1)
      .single();

  if (error) {
    console.error(
      "Erro ao carregar config_cardapio:",
      error
    );

    return false;
  }

  if (data) {
    configCardapio = {
      ...configCardapio,
      ...data,
      dias_abertos:
        Array.isArray(data.dias_abertos)
          ? data.dias_abertos.map(Number)
          : PADRAO_DIAS_ABERTOS
    };
  }

  atualizarTaxasNoHtml();

  if (atualizar) {
    atualizarStatus();
    atualizarResumo();
  }

  return true;
}

function atualizarTaxasNoHtml() {
  const taxas =
    taxasAtuais();

  const cards =
    document.querySelectorAll(
      ".fee-grid article"
    );

  cards.forEach(card => {
    const codigo =
      card
        .querySelector("strong")
        ?.textContent
        ?.trim();

    const span =
      card.querySelector("span");

    if (
      codigo &&
      span &&
      codigo in taxas
    ) {
      span.textContent =
        moeda(taxas[codigo]);
    }
  });

  const select =
    el("region");

  if (select) {
    Array
      .from(select.options)
      .forEach(option => {
        const codigo =
          option.value;

        if (
          codigo &&
          codigo in taxas
        ) {
          option.textContent =
            `${codigo} — ${moeda(
              taxas[codigo]
            )}`;
        }
      });
  }
}


/* ============================================================
   STATUS DA LOJA
============================================================ */

function lojaAbertaNoAutomatico() {
  const agora =
    new Date();

  const dia =
    agora.getDay();

  const minutos =
    agora.getHours() * 60 +
    agora.getMinutes();

  const inicio =
    minutosDeHora(
      configCardapio.hora_abertura
    );

  const fim =
    minutosDeHora(
      configCardapio.hora_fechamento
    );

  const dias =
    Array.isArray(
      configCardapio.dias_abertos
    )
      ? configCardapio.dias_abertos
      : PADRAO_DIAS_ABERTOS;

  return (
    dias.includes(dia) &&
    minutos >= inicio &&
    minutos < fim
  );
}

function lojaAberta() {
  if (modoLoja === "aberta") {
    return true;
  }

  if (modoLoja === "fechada") {
    return false;
  }

  return lojaAbertaNoAutomatico();
}

async function carregarStatusLoja({
  atualizar = true
} = {}) {
  if (!sb) {
    modoLoja =
      "automatico";

    if (atualizar) {
      atualizarStatus();
    }

    return false;
  }

  const {
    data,
    error
  } =
    await sb
      .from("loja_config")
      .select("modo")
      .eq("id", 1)
      .single();

  if (error) {
    console.error(
      "Erro ao carregar loja_config:",
      error
    );

    if (atualizar) {
      atualizarStatus();
    }

    return false;
  }

  if (
    [
      "automatico",
      "aberta",
      "fechada"
    ].includes(
      data?.modo
    )
  ) {
    modoLoja =
      data.modo;
  }

  if (atualizar) {
    atualizarStatus();
  }

  return true;
}

function atualizarStatus() {
  const botao =
    el("statusLoja");

  const texto =
    el("statusTexto");

  const aberta =
    lojaAberta();

  botao?.classList.toggle(
    "closed",
    !aberta
  );

  if (texto) {
    if (modoLoja === "aberta") {
      texto.textContent =
        "Aberto • manual";
    }
    else if (
      modoLoja === "fechada"
    ) {
      texto.textContent =
        "Fechado • manual";
    }
    else if (aberta) {
      texto.textContent =
        `Aberto • fecha às ${horaCurta(
          configCardapio.hora_fechamento
        )}`;
    }
    else {
      texto.textContent =
        "Fechado";
    }
  }

  atualizarProdutosVisual();
  atualizarBotaoWhatsApp();
}


/* ============================================================
   CARDÁPIO DO SUPABASE
============================================================ */

async function carregarCardapio({
  renderizar = true
} = {}) {
  if (!sb) {
    return false;
  }

  const [
    categoriasResp,
    produtosResp
  ] =
    await Promise.all([
      sb
        .from("categorias_cardapio")
        .select(
          "slug,nome,emoji,ordem,ativo"
        )
        .order("ordem", {
          ascending: true
        })
        .order("nome", {
          ascending: true
        }),

      sb
        .from("produtos_estoque")
        .select(
          "produto_id,nome,preco,descricao,categoria,imagem_url,disponivel,ativo,destaque,ordem"
        )
        .order("ordem", {
          ascending: true
        })
        .order("nome", {
          ascending: true
        })
    ]);

  if (
    categoriasResp.error ||
    produtosResp.error
  ) {
    console.error(
      "Erro ao carregar cardápio:",
      categoriasResp.error ||
      produtosResp.error
    );

    return false;
  }

  categoriasCardapio =
    (categoriasResp.data || [])
      .filter(
        categoria =>
          categoria.ativo !== false
      );

  produtosCardapio =
    (produtosResp.data || [])
      .filter(
        produto =>
          produto.ativo !== false
      )
      .map(
        produto => ({
          ...produto,
          preco:
            Number(
              produto.preco || 0
            ),
          disponivel:
            produto.disponivel !== false,
          destaque:
            produto.destaque === true
        })
      );

  produtosPorId = {};

  produtosCardapio.forEach(
    produto => {
      produtosPorId[
        produto.produto_id
      ] =
        produto;
    }
  );

  sincronizarCarrinhoComCardapio();

  if (renderizar) {
    renderizarCardapio();
    restaurarFavoritos();
    aplicarFiltro();
    atualizarCarrinho();
    atualizarStatus();
  }

  return true;
}

function sincronizarCarrinhoComCardapio() {
  let mudou =
    false;

  carrinho.forEach(
    item => {
      const atual =
        produtosPorId[
          item.id
        ];

      if (!atual) {
        return;
      }

      if (
        item.nome !==
        atual.nome
      ) {
        item.nome =
          atual.nome;

        mudou = true;
      }

      if (
        Number(item.preco) !==
        Number(atual.preco)
      ) {
        item.preco =
          Number(
            atual.preco
          );

        mudou = true;
      }
    }
  );

  if (mudou) {
    salvarCarrinho();
  }
}

function categoriaPorSlug(slug) {
  return categoriasCardapio.find(
    item =>
      item.slug === slug
  );
}

function renderizarCardapio() {
  const nav =
    document.querySelector(
      ".category-nav"
    );

  const container =
    el("sectionsContainer");

  if (
    !nav ||
    !container
  ) {
    return;
  }

  nav.innerHTML =
    `
      <button
        class="${filtroAtual === "todos" ? "active" : ""}"
        data-cat="todos"
      >
        \u2728 Todos
      </button>
    ` +
    categoriasCardapio
      .map(
        categoria => `
          <button
            class="${
              filtroAtual === categoria.slug
                ? "active"
                : ""
            }"
            data-cat="${escaparHtml(
              categoria.slug
            )}"
          >
            ${escaparHtml(
              categoria.emoji || "\uD83C\uDF7D\uFE0F"
            )}
            ${escaparHtml(
              categoria.nome
            )}
          </button>
        `
      )
      .join("");

  nav
    .querySelectorAll(
      "button[data-cat]"
    )
    .forEach(
      botao => {
        botao.addEventListener(
          "click",
          () => {
            filtrarCategoria(
              botao.dataset.cat
            );
          }
        );
      }
    );

  const html =
    categoriasCardapio
      .map(
        categoria => {
          const produtos =
            produtosCardapio.filter(
              produto =>
                produto.categoria ===
                categoria.slug
            );

          if (!produtos.length) {
            return "";
          }

          return `
            <section
              class="category-section"
              id="${escaparHtml(
                categoria.slug
              )}"
            >
              <div class="section-title">
                <div>
                  <span>
                    CARDÁPIO
                  </span>

                  <h2>
                    ${escaparHtml(
                      categoria.emoji || "\uD83C\uDF7D\uFE0F"
                    )}
                    ${escaparHtml(
                      categoria.nome
                    )}
                  </h2>
                </div>

                <button
                  onclick="filtrarCategoria('${escaparJs(
                    categoria.slug
                  )}')"
                >
                  Ver categoria
                </button>
              </div>

              <div class="category-grid">
                ${produtos
                  .map(
                    renderizarProduto
                  )
                  .join("")}
              </div>
            </section>
          `;
        }
      )
      .join("");

  container.innerHTML =
    html ||
    `
      <div class="empty-search">
        <strong>
          Cardápio temporariamente vazio
        </strong>
        <span>
          Volte em alguns minutos.
        </span>
      </div>
    `;

  atualizarProdutosVisual();
}

function renderizarProduto(
  produto
) {
  const imagem =
    produto.imagem_url ||
    "https://placehold.co/800x600/171717/ffffff?text=Produto";

  return `
    <article
      class="product-card"
      data-category="${escaparHtml(
        produto.categoria
      )}"
      data-produto-id="${escaparHtml(
        produto.produto_id
      )}"
      data-name="${escaparHtml(
        String(
          produto.nome || ""
        ).toLowerCase()
      )}"
    >
      <div class="product-image">
        <img
          src="${escaparHtml(
            imagem
          )}"
          alt="${escaparHtml(
            produto.nome
          )}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://placehold.co/800x600/171717/ffffff?text=Produto';"
        >

        <button
          class="heart"
          onclick="toggleFavorito(this,'${escaparJs(
            produto.produto_id
          )}')"
          aria-label="Favoritar"
        >
          \u2661
        </button>

        <div class="sold-overlay">
          <strong>
            ESGOTADO
          </strong>
          <span>
            Indisponível no momento
          </span>
        </div>
      </div>

      <div class="product-info">
        <h3>
          ${escaparHtml(
            produto.nome
          )}
        </h3>

        <p>
          ${escaparHtml(
            produto.descricao || ""
          )}
        </p>

        <div class="product-bottom">
          <strong class="price">
            ${moeda(
              produto.preco
            )}
          </strong>

          <button
            class="add-button"
            onclick="adicionarProduto('${escaparJs(
              produto.produto_id
            )}')"
          >
            Adicionar
          </button>
        </div>
      </div>
    </article>
  `;
}

function atualizarProdutosVisual() {
  const aberta =
    lojaAberta();

  document
    .querySelectorAll(
      ".product-card"
    )
    .forEach(
      card => {
        const id =
          card.dataset
            .produtoId;

        const produto =
          produtosPorId[id];

        const botao =
          card.querySelector(
            ".add-button"
          );

        if (
          !produto ||
          !botao
        ) {
          return;
        }

        const disponivel =
          produto.disponivel !== false;

        card.classList.toggle(
          "sold-out",
          !disponivel
        );

        if (!disponivel) {
          botao.disabled =
            true;

          botao.textContent =
            "Esgotado";

          return;
        }

        if (!aberta) {
          botao.disabled =
            true;

          botao.textContent =
            "Loja fechada";

          return;
        }

        botao.disabled =
          false;

        botao.textContent =
          "Adicionar";
      }
    );
}


/* ============================================================
   CARRINHO
============================================================ */

function produtoDisponivel(
  id
) {
  return (
    produtosPorId[id] &&
    produtosPorId[id]
      .disponivel !== false &&
    produtosPorId[id]
      .ativo !== false
  );
}

function adicionarProduto(
  id,
  nomeFallback,
  precoFallback
) {
  if (!lojaAberta()) {
    toast(
      "Loja fechada"
    );

    return;
  }

  const produto =
    produtosPorId[id] ||
    (
      nomeFallback
        ? {
            produto_id: id,
            nome:
              nomeFallback,
            preco:
              Number(
                precoFallback || 0
              ),
            disponivel:
              true,
            ativo:
              true
          }
        : null
    );

  if (!produto) {
    toast(
      "Produto não encontrado"
    );

    return;
  }

  if (
    produto.disponivel === false
  ) {
    toast(
      "Produto esgotado"
    );

    return;
  }

  const existente =
    carrinho.find(
      item =>
        item.id === id
    );

  if (existente) {
    existente.nome =
      produto.nome;

    existente.preco =
      Number(
        produto.preco
      );

    existente.qtd++;
  }
  else {
    carrinho.push({
      id,
      nome:
        produto.nome,
      preco:
        Number(
          produto.preco
        ),
      qtd: 1
    });
  }

  salvarCarrinho();
  atualizarCarrinho();

  toast(
    "Produto adicionado"
  );
}

function reduzirProduto(
  id
) {
  const item =
    carrinho.find(
      produto =>
        produto.id === id
    );

  if (!item) {
    return;
  }

  item.qtd--;

  if (item.qtd <= 0) {
    carrinho =
      carrinho.filter(
        produto =>
          produto.id !== id
      );
  }

  salvarCarrinho();
  atualizarCarrinho();
}

function removerProduto(
  id
) {
  carrinho =
    carrinho.filter(
      produto =>
        produto.id !== id
    );

  salvarCarrinho();
  atualizarCarrinho();
}

function subtotal() {
  return carrinho.reduce(
    (
      soma,
      item
    ) =>
      soma +
      Number(item.preco) *
      Number(item.qtd),
    0
  );
}

function quantidade() {
  return carrinho.reduce(
    (
      soma,
      item
    ) =>
      soma +
      Number(item.qtd),
    0
  );
}

function taxa() {
  if (
    tipoPedido !==
    "Entrega"
  ) {
    return 0;
  }

  const regiao =
    el("region")
      ?.value;

  const taxas =
    taxasAtuais();

  return (
    taxas[regiao] || 0
  );
}

function atualizarCarrinho() {
  const qtd =
    quantidade();

  const sub =
    subtotal();

  if (
    el("headerCartCount")
  ) {
    el(
      "headerCartCount"
    ).textContent =
      qtd;
  }

  if (
    el("floatingCartCount")
  ) {
    el(
      "floatingCartCount"
    ).textContent =
      qtd;
  }

  if (
    el("floatingCartTotal")
  ) {
    el(
      "floatingCartTotal"
    ).textContent =
      moeda(sub);
  }

  if (
    el("cartSubtotal")
  ) {
    el(
      "cartSubtotal"
    ).textContent =
      moeda(sub);
  }

  const lista =
    el("cartList");

  if (!lista) {
    atualizarResumo();
    return;
  }

  if (!carrinho.length) {
    lista.innerHTML =
      `
        <div class="cart-empty">
          <strong>
            Seu carrinho está vazio
          </strong>
        </div>
      `;

    atualizarResumo();
    return;
  }

  lista.innerHTML =
    carrinho
      .map(
        item => {
          const atual =
            produtosPorId[
              item.id
            ];

          const indisponivel =
            atual
              ? atual.disponivel === false
              : true;

          return `
            <article class="cart-item">
              <div>
                <h4>
                  ${escaparHtml(
                    item.nome
                  )}
                </h4>

                <small>
                  ${moeda(
                    item.preco
                  )} cada
                </small>

                ${
                  indisponivel
                    ? `
                      <small
                        style="display:block;color:#ff7373;margin-top:4px;font-weight:800"
                      >
                        ESGOTADO
                      </small>
                    `
                    : ""
                }

                <div class="qty-controls">
                  <button
                    onclick="reduzirProduto('${escaparJs(
                      item.id
                    )}')"
                  >
                    −
                  </button>

                  <strong>
                    ${item.qtd}
                  </strong>

                  <button
                    onclick="adicionarProduto('${escaparJs(
                      item.id
                    )}')"
                    ${
                      indisponivel ||
                      !lojaAberta()
                        ? "disabled"
                        : ""
                    }
                  >
                    +
                  </button>

                  <button
                    class="remove"
                    onclick="removerProduto('${escaparJs(
                      item.id
                    )}')"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div class="item-price">
                ${moeda(
                  Number(item.preco) *
                  Number(item.qtd)
                )}
              </div>
            </article>
          `;
        }
      )
      .join("");

  atualizarResumo();
}

function abrirCarrinho() {
  el("cartDrawer")
    ?.classList.add(
      "active"
    );

  document.body.style.overflow =
    "hidden";
}

function fecharCarrinho() {
  el("cartDrawer")
    ?.classList.remove(
      "active"
    );

  document.body.style.overflow =
    "";
}


/* ============================================================
   CHECKOUT
============================================================ */

function itensInvalidosCarrinho() {
  return carrinho.filter(
    item =>
      !produtoDisponivel(
        item.id
      )
  );
}

async function abrirCheckout() {
  if (!carrinho.length) {
    toast(
      "Adicione um produto"
    );

    return;
  }

  await Promise.all([
    carregarStatusLoja({
      atualizar: true
    }),
    carregarCardapio({
      renderizar: false
    }),
    carregarConfigCardapio({
      atualizar: false
    })
  ]);

  if (!lojaAberta()) {
    toast(
      "Loja fechada"
    );

    return;
  }

  const invalidos =
    itensInvalidosCarrinho();

  if (invalidos.length) {
    alert(
      "Alguns itens estão esgotados ou indisponíveis:\n\n" +
      invalidos
        .map(
          item =>
            "• " + item.nome
        )
        .join("\n") +
      "\n\nRemova esses itens para continuar."
    );

    atualizarCarrinho();
    return;
  }

  el("checkoutModal")
    ?.classList.add(
      "active"
    );

  document.body.style.overflow =
    "hidden";

  fecharCarrinho();
  atualizarResumo();
}

function fecharCheckout() {
  el("checkoutModal")
    ?.classList.remove(
      "active"
    );

  document.body.style.overflow =
    "";
}

function selecionarTipo(
  tipo
) {
  tipoPedido =
    tipo;

  el("deliveryBtn")
    ?.classList.toggle(
      "active",
      tipo === "Entrega"
    );

  el("pickupBtn")
    ?.classList.toggle(
      "active",
      tipo === "Retirada"
    );

  el("regionField")
    ?.classList.toggle(
      "hidden",
      tipo === "Retirada"
    );

  el("addressField")
    ?.classList.toggle(
      "hidden",
      tipo === "Retirada"
    );

  atualizarResumo();
}

function atualizarResumo() {
  if (
    el("checkoutSubtotal")
  ) {
    el(
      "checkoutSubtotal"
    ).textContent =
      moeda(
        subtotal()
      );
  }

  if (
    el("checkoutFee")
  ) {
    el(
      "checkoutFee"
    ).textContent =
      moeda(
        taxa()
      );
  }

  if (
    el("checkoutTotal")
  ) {
    el(
      "checkoutTotal"
    ).textContent =
      moeda(
        subtotal() +
        taxa()
      );
  }

  atualizarBotaoWhatsApp();
}

function atualizarBotaoWhatsApp() {
  const botao =
    el("sendWhatsApp");

  if (!botao) {
    return;
  }

  const aberta =
    lojaAberta();

  botao.disabled =
    !aberta;

  botao.textContent =
    aberta
      ? "\uD83D\uDCAC Enviar pedido pelo WhatsApp"
      : "\uD83D\uDD12 Loja fechada";
}


/* ============================================================
   FILTROS / FAVORITOS
============================================================ */

function favoritos() {
  return JSON.parse(
    localStorage.getItem(
      "cantinho_favoritos"
    ) || "[]"
  );
}

function toggleFavorito(
  botao,
  id
) {
  let lista =
    favoritos();

  lista =
    lista.includes(id)
      ? lista.filter(
          item =>
            item !== id
        )
      : [
          ...lista,
          id
        ];

  localStorage.setItem(
    "cantinho_favoritos",
    JSON.stringify(lista)
  );

  restaurarFavoritos();
  aplicarFiltro();
}

function restaurarFavoritos() {
  const lista =
    favoritos();

  document
    .querySelectorAll(
      ".product-card"
    )
    .forEach(
      card => {
        const botao =
          card.querySelector(
            ".heart"
          );

        if (!botao) {
          return;
        }

        const ativo =
          lista.includes(
            card.dataset
              .produtoId
          );

        botao.classList.toggle(
          "active",
          ativo
        );

        botao.textContent =
          ativo
            ? "\u2665"
            : "\u2661";
      }
    );
}

function mostrarFavoritos() {
  somenteFavoritos =
    !somenteFavoritos;

  aplicarFiltro();
}

function filtrarCategoria(
  categoria
) {
  filtroAtual =
    categoria;

  document
    .querySelectorAll(
      ".category-nav button"
    )
    .forEach(
      botao => {
        botao.classList.toggle(
          "active",
          botao.dataset.cat ===
            categoria
        );
      }
    );

  aplicarFiltro();
}

function aplicarFiltro() {
  const termo =
    (
      el("searchDesktop")
        ?.value || ""
    )
      .trim()
      .toLowerCase();

  const favs =
    favoritos();

  let encontrados =
    0;

  document
    .querySelectorAll(
      ".category-section"
    )
    .forEach(
      secao => {
        let encontradosSecao =
          0;

        secao
          .querySelectorAll(
            ".product-card"
          )
          .forEach(
            card => {
              const categoriaOk =
                filtroAtual ===
                  "todos" ||
                card.dataset
                  .category ===
                  filtroAtual;

              const pesquisaOk =
                !termo ||
                (
                  (
                    card.dataset
                      .name ||
                    ""
                  ) +
                  " " +
                  card.innerText
                )
                  .toLowerCase()
                  .includes(
                    termo
                  );

              const favoritoOk =
                !somenteFavoritos ||
                favs.includes(
                  card.dataset
                    .produtoId
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
                encontrados++;
                encontradosSecao++;
              }
            }
          );

        secao.classList.toggle(
          "filtered-out",
          encontradosSecao === 0
        );
      }
    );

  el("emptySearch")
    ?.classList.toggle(
      "hidden",
      encontrados !== 0
    );
}

function syncSearch(
  origem
) {
  const destino =
    origem.id ===
      "searchDesktop"
      ? el("searchMobile")
      : el("searchDesktop");

  if (destino) {
    destino.value =
      origem.value;
  }

  aplicarFiltro();
}


/* ============================================================
   INTERFACE
============================================================ */

function rolarCardapio() {
  el("cardapio")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}

function toast(texto) {
  const elemento =
    el("toast");

  if (!elemento) {
    return;
  }

  elemento.textContent =
    texto;

  elemento.classList.add(
    "active"
  );

  clearTimeout(
    window.cantinhoToastTimer
  );

  window.cantinhoToastTimer =
    setTimeout(
      () => {
        elemento.classList.remove(
          "active"
        );
      },
      1600
    );
}


/* ============================================================
   WHATSAPP
============================================================ */

async function finalizarPedido() {
  const [
    statusOk,
    cardapioOk,
    configOk
  ] =
    await Promise.all([
      carregarStatusLoja({
        atualizar: true
      }),
      carregarCardapio({
        renderizar: false
      }),
      carregarConfigCardapio({
        atualizar: false
      })
    ]);

  if (
    sb &&
    (
      !statusOk ||
      !cardapioOk ||
      !configOk
    )
  ) {
    alert(
      "Não foi possível confirmar o pedido agora. Tente novamente em alguns segundos."
    );

    return;
  }

  if (!lojaAberta()) {
    alert(
      "\uD83D\uDD34 A loja está fechada no momento."
    );

    return;
  }

  const invalidos =
    itensInvalidosCarrinho();

  if (invalidos.length) {
    alert(
      "Alguns itens estão esgotados ou indisponíveis:\n\n" +
      invalidos
        .map(
          item =>
            "• " + item.nome
        )
        .join("\n") +
      "\n\nRemova esses itens para continuar."
    );

    atualizarCarrinho();
    return;
  }

  if (!carrinho.length) {
    alert(
      "Seu carrinho está vazio."
    );

    return;
  }

  const numero =
    String(
      configCardapio.whatsapp ||
      ""
    )
      .replace(/\D/g, "");

  if (
    !numero ||
    configCardapio.whatsapp ===
      "COLOQUE_SEU_NUMERO_AQUI"
  ) {
    alert(
      "Configure o número do WhatsApp no painel administrador."
    );

    return;
  }

  const nome =
    el("customerName")
      ?.value
      .trim();

  const telefone =
    el("customerPhone")
      ?.value
      .trim();

  const regiao =
    el("region")
      ?.value;

  const endereco =
    el("address")
      ?.value
      .trim();

  const pagamento =
    el("payment")
      ?.value;

  const troco =
    el("changeFor")
      ?.value
      .trim();

  const observacao =
    el("notes")
      ?.value
      .trim();

  if (
    !nome ||
    !telefone ||
    !pagamento
  ) {
    alert(
      "Preencha nome, telefone e pagamento."
    );

    return;
  }

  if (
    tipoPedido ===
      "Entrega" &&
    (
      !regiao ||
      !endereco
    )
  ) {
    alert(
      "Preencha região e endereço."
    );

    return;
  }

  let mensagem =
    "\uD83C\uDF55 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*\n\n";

  mensagem +=
    `\uD83D\uDC64 *Cliente:* ${nome}\n`;

  mensagem +=
    `\uD83D\uDCF1 *Telefone:* ${telefone}\n`;

  mensagem +=
    `\uD83D\uDCE6 *Recebimento:* ${tipoPedido}\n`;

  if (
    tipoPedido ===
      "Entrega"
  ) {
    mensagem +=
      `\uD83D\uDDFA\uFE0F *Região:* ${regiao}\n`;

    mensagem +=
      `\uD83D\uDCCD *Endereço:* ${endereco}\n`;
  }

  mensagem +=
    "\n\uD83E\uDDFE *ITENS*\n";

  carrinho.forEach(
    item => {
      mensagem +=
        `${item.qtd}x ${item.nome} — ${moeda(
          Number(item.preco) *
          Number(item.qtd)
        )}\n`;
    }
  );

  mensagem +=
    `\n\uD83D\uDCB5 *Subtotal:* ${moeda(
      subtotal()
    )}\n`;

  if (
    tipoPedido ===
      "Entrega"
  ) {
    mensagem +=
      `\uD83D\uDEF5 *Taxa:* ${moeda(
        taxa()
      )}\n`;
  }

  mensagem +=
    `\uD83D\uDCB0 *TOTAL:* ${moeda(
      subtotal() +
      taxa()
    )}\n`;

  mensagem +=
    `\uD83D\uDCB3 *Pagamento:* ${pagamento}\n`;

  if (troco) {
    mensagem +=
      `\uD83D\uDCB5 *Troco para:* ${troco}\n`;
  }

  if (observacao) {
    mensagem +=
      `\uD83D\uDCDD *Obs:* ${observacao}\n`;
  }

  window.open(
    `https://wa.me/${numero}?text=${encodeURIComponent(
      mensagem
    )}`,
    "_blank"
  );
}


/* ============================================================
   REALTIME
============================================================ */

function iniciarRealtime() {
  if (!sb) {
    return;
  }

  sb
    .channel(
      "cantinho-cardapio-realtime"
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "produtos_estoque"
      },
      () => {
        carregarCardapio();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "categorias_cardapio"
      },
      () => {
        carregarCardapio();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "config_cardapio",
        filter: "id=eq.1"
      },
      () => {
        carregarConfigCardapio();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "loja_config",
        filter: "id=eq.1"
      },
      payload => {
        if (
          [
            "automatico",
            "aberta",
            "fechada"
          ].includes(
            payload?.new?.modo
          )
        ) {
          modoLoja =
            payload.new.modo;

          atualizarStatus();
        }
      }
    )
    .subscribe();
}


/* ============================================================
   INICIALIZAÇÃO
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    el("searchDesktop")
      ?.addEventListener(
        "input",
        evento => {
          syncSearch(
            evento.target
          );
        }
      );

    el("searchMobile")
      ?.addEventListener(
        "input",
        evento => {
          syncSearch(
            evento.target
          );
        }
      );

    el("region")
      ?.addEventListener(
        "change",
        atualizarResumo
      );

    el("payment")
      ?.addEventListener(
        "change",
        () => {
          el("changeField")
            ?.classList.toggle(
              "hidden",
              el("payment")
                ?.value !==
                "Dinheiro"
            );
        }
      );

    atualizarCarrinho();

    await Promise.all([
      carregarConfigCardapio({
        atualizar: false
      }),
      carregarStatusLoja({
        atualizar: false
      }),
      carregarCardapio({
        renderizar: true
      })
    ]);

    atualizarTaxasNoHtml();
    atualizarStatus();
    atualizarResumo();
    restaurarFavoritos();

    iniciarRealtime();

    setInterval(
      () => {
        carregarStatusLoja();
      },
      15000
    );

    setInterval(
      () => {
        carregarCardapio();
      },
      60000
    );

    setInterval(
      () => {
        carregarConfigCardapio();
      },
      60000
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (
          !document.hidden
        ) {
          carregarStatusLoja();
          carregarCardapio();
          carregarConfigCardapio();
        }
      }
    );
  }
);

/* ============================================================
   CMS / CONTROLE TOTAL DO SITE
============================================================ */
(() => {
  "use strict";

  const cfg = window.SUPABASE_CONFIG || window.supabaseConfig || {};
  const URL = cfg.url || window.SUPABASE_URL;
  const KEY = cfg.key || cfg.anonKey || window.SUPABASE_ANON_KEY || window.SUPABASE_PUBLISHABLE_KEY;
  const client = window.supabase && URL && KEY ? window.supabase.createClient(URL, KEY) : null;

  let site = null;
  let regioes = [];
  let pagamentos = [];
  let channel = null;
  let pedidoMinimoInstalado = false;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const moeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (v) => String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function css() {
    if (document.getElementById("cantinho-cms-public-css")) return;
    const style = document.createElement("style");
    style.id = "cantinho-cms-public-css";
    style.textContent = `
      .cms-alert-bar{position:relative;z-index:25;margin:0 auto;padding:11px 18px;background:var(--red,#ea1d2c);color:#fff;text-align:center;font-weight:800;font-size:14px;line-height:1.35}
      .cms-alert-bar strong{display:block;font-size:15px;margin-bottom:2px}.cms-alert-bar a{display:inline-block;margin-left:8px;text-decoration:underline;font-weight:900}
      .cms-home-message{max-width:1180px;margin:18px auto 0;padding:18px 20px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#111;color:#fff}
      .cms-home-message strong{display:block;font-size:18px;margin-bottom:5px}.cms-home-message p{margin:0;color:#d7d7d7}.cms-home-message a{display:inline-block;margin-top:10px;color:#fff;font-weight:900}
      .cms-popup-wrap{position:fixed;inset:0;z-index:99998;display:grid;place-items:center;padding:22px;background:rgba(0,0,0,.72);backdrop-filter:blur(5px)}
      .cms-popup{width:min(92vw,440px);padding:24px;border-radius:22px;border:1px solid rgba(255,255,255,.14);background:#111;color:#fff;box-shadow:0 24px 70px rgba(0,0,0,.55)}
      .cms-popup h3{font-size:22px;margin:0 0 8px}.cms-popup p{color:#d2d2d2;line-height:1.55;margin:0 0 18px}.cms-popup-actions{display:flex;gap:10px;flex-wrap:wrap}.cms-popup button,.cms-popup a{border:0;border-radius:12px;padding:12px 16px;font-weight:900}.cms-popup button{background:#292929;color:#fff}.cms-popup a{background:var(--red,#ea1d2c);color:#fff;text-decoration:none}
      .cms-footer{max-width:1180px;margin:32px auto 110px;padding:28px 20px;border-top:1px solid rgba(255,255,255,.10);color:#aaa}.cms-footer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.cms-footer strong{color:#fff}.cms-footer p{margin:7px 0 0;line-height:1.5}.cms-footer a{color:#fff}.cms-footer-copy{margin-top:22px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08);font-size:13px}
      .cms-maintenance{position:fixed;inset:0;z-index:999999;background:#070707;color:#fff;display:grid;place-items:center;padding:28px;text-align:center}.cms-maintenance-card{max-width:560px}.cms-maintenance-card .icon{font-size:48px}.cms-maintenance-card h1{font-size:30px;margin:14px 0 10px}.cms-maintenance-card p{color:#cfcfcf;line-height:1.6;font-size:16px}
      .hero.cms-has-image{position:relative;background-size:cover!important;background-position:center!important;overflow:hidden}.hero.cms-has-image:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.88),rgba(0,0,0,.40))}.hero.cms-has-image>*{position:relative;z-index:1}
      @media(max-width:700px){.cms-footer-grid{grid-template-columns:1fr}.cms-footer{margin-bottom:120px}.cms-alert-bar{font-size:13px}.cms-home-message{margin-left:12px;margin-right:12px}}
    `;
    document.head.appendChild(style);
  }

  function aplicarSite() {
    if (!site) return;

    document.documentElement.style.setProperty("--red", site.cor_primaria || "#ea1d2c");
    if (site.nome_loja) document.title = `${site.nome_loja} | Delivery`;

    const brandName = $(".brand strong");
    const brandSub = $(".brand small");
    if (brandName) brandName.textContent = site.nome_loja || "Cantinho Pizza Burguer";
    if (brandSub) brandSub.textContent = site.subtitulo_marca || "Delivery oficial";

    const hero = $(".hero");
    const heroSeal = $(".hero-copy > span");
    const heroTitle = $(".hero-copy h1");
    const heroText = $(".hero-copy p");
    const heroButton = $(".hero-copy button");
    if (heroSeal) heroSeal.textContent = site.hero_selo || site.nome_loja || "CANTINHO PIZZA BURGUER";
    if (heroTitle) heroTitle.textContent = site.hero_titulo || "Seu pedido do jeito certo.";
    if (heroText) heroText.textContent = site.hero_texto || "Escolha seus produtos e finalize pelo WhatsApp.";
    if (heroButton) heroButton.textContent = site.hero_botao_texto || "Ver cardápio";
    if (hero && site.hero_imagem_url) {
      hero.classList.add("cms-has-image");
      hero.style.backgroundImage = `url("${String(site.hero_imagem_url).replaceAll('"', '%22')}")`;
    } else if (hero) {
      hero.classList.remove("cms-has-image");
      hero.style.backgroundImage = "";
    }

    const storeName = $(".store-copy h2");
    const storeSummary = $(".store-copy p");
    if (storeName) storeName.textContent = site.nome_loja || "Cantinho Pizza Burguer";
    if (storeSummary) storeSummary.textContent = site.resumo_cardapio || "";

    const logoTop = $(".logo");
    const logoStore = $(".store-logo");
    if (site.logo_url) {
      const img = `<img src="${esc(site.logo_url)}" alt="${esc(site.nome_loja)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
      if (logoTop) logoTop.innerHTML = img;
      if (logoStore) logoStore.innerHTML = img;
    }

    const tags = $$(".store-tags span");
    if (tags[0]) tags[0].style.display = site.aceita_entrega === false ? "none" : "";
    if (tags[1]) tags[1].style.display = site.aceita_retirada === false ? "none" : "";
    if (tags[2] && site.tempo_entrega_texto) tags[2].textContent = `⏱\uFE0F ${site.tempo_entrega_texto}`;

    const deliveryBtn = document.getElementById("deliveryBtn");
    const pickupBtn = document.getElementById("pickupBtn");
    if (deliveryBtn) deliveryBtn.style.display = site.aceita_entrega === false ? "none" : "";
    if (pickupBtn) pickupBtn.style.display = site.aceita_retirada === false ? "none" : "";
    if (typeof window.selecionarTipo === "function") {
      if (site.aceita_entrega === false && site.aceita_retirada !== false) window.selecionarTipo("Retirada");
      if (site.aceita_retirada === false && site.aceita_entrega !== false) window.selecionarTipo("Entrega");
    }

    const adminLink = $(".btn-admin-loja");
    if (adminLink) adminLink.style.display = site.mostrar_link_admin ? "" : "none";

    renderFooter();
    renderMaintenance();
  }

  function renderFooter() {
    let footer = document.getElementById("cmsFooter");
    if (!footer) {
      footer = document.createElement("footer");
      footer.id = "cmsFooter";
      footer.className = "cms-footer";
      const bottom = $(".mobile-bottom");
      document.body.insertBefore(footer, bottom || null);
    }
    footer.innerHTML = `
      <div class="cms-footer-grid">
        <div><strong>${esc(site?.nome_loja || "Cantinho Pizza Burguer")}</strong><p>${esc(site?.rodape_texto || "Delivery")}</p></div>
        <div><strong>Atendimento</strong><p>${site?.telefone_exibicao ? esc(site.telefone_exibicao) : "Pedido pelo WhatsApp"}${site?.tempo_entrega_texto ? `<br>Tempo estimado: ${esc(site.tempo_entrega_texto)}` : ""}</p></div>
        <div><strong>Informações</strong><p>${site?.endereco_loja ? esc(site.endereco_loja) : "Entrega e retirada"}${site?.instagram_url ? `<br><a href="${esc(site.instagram_url)}" target="_blank" rel="noopener">Instagram</a>` : ""}</p></div>
      </div>
      <div class="cms-footer-copy">© ${new Date().getFullYear()} ${esc(site?.nome_loja || "Cantinho Pizza Burguer")}. Todos os direitos reservados.</div>
    `;
  }

  function renderMaintenance() {
    const old = document.getElementById("cmsMaintenance");
    if (!site?.manutencao_ativa) {
      old?.remove();
      return;
    }
    const box = old || document.createElement("div");
    box.id = "cmsMaintenance";
    box.className = "cms-maintenance";
    box.innerHTML = `<div class="cms-maintenance-card"><div class="icon">\uD83D\uDEE0\uFE0F</div><h1>${esc(site.nome_loja || "Cantinho Pizza Burguer")}</h1><p>${esc(site.manutencao_mensagem || "Estamos fazendo uma atualização. Voltamos em breve.")}</p></div>`;
    if (!old) document.body.appendChild(box);
  }

  function avisoValido(a) {
    if (!a?.ativo) return false;
    const now = Date.now();
    if (a.inicio && new Date(a.inicio).getTime() > now) return false;
    if (a.fim && new Date(a.fim).getTime() < now) return false;
    return true;
  }

  function limparAvisos() {
    $$(".cms-alert-bar,.cms-home-message,.cms-popup-wrap").forEach((el) => el.remove());
  }

  function renderAvisos(lista) {
    limparAvisos();
    const avisos = (lista || []).filter(avisoValido).sort((a,b) => Number(a.ordem||0)-Number(b.ordem||0));
    const header = $("header.topbar");
    const main = document.querySelector("main#inicio") || document.querySelector("main");

    avisos.filter(a => a.tipo === "faixa").forEach((a) => {
      const el = document.createElement("div");
      el.className = "cms-alert-bar";
      el.innerHTML = `${a.titulo ? `<strong>${esc(a.titulo)}</strong>` : ""}${esc(a.mensagem)}${a.botao_texto && a.botao_url ? `<a href="${esc(a.botao_url)}">${esc(a.botao_texto)}</a>` : ""}`;
      header?.insertAdjacentElement("afterend", el);
    });

    avisos.filter(a => a.tipo === "inicio").forEach((a) => {
      const el = document.createElement("section");
      el.className = "cms-home-message";
      el.innerHTML = `${a.titulo ? `<strong>${esc(a.titulo)}</strong>` : ""}<p>${esc(a.mensagem)}</p>${a.botao_texto && a.botao_url ? `<a href="${esc(a.botao_url)}">${esc(a.botao_texto)}</a>` : ""}`;
      main?.prepend(el);
    });

    const popup = avisos.find(a => a.tipo === "popup" && sessionStorage.getItem(`cantinho_aviso_${a.id}`) !== "visto");
    if (popup) {
      const wrap = document.createElement("div");
      wrap.className = "cms-popup-wrap";
      wrap.innerHTML = `<div class="cms-popup"><h3>${esc(popup.titulo || "Aviso")}</h3><p>${esc(popup.mensagem)}</p><div class="cms-popup-actions">${popup.botao_texto && popup.botao_url ? `<a href="${esc(popup.botao_url)}">${esc(popup.botao_texto)}</a>` : ""}<button type="button">Fechar</button></div></div>`;
      wrap.querySelector("button")?.addEventListener("click", () => {
        sessionStorage.setItem(`cantinho_aviso_${popup.id}`, "visto");
        wrap.remove();
      });
      document.body.appendChild(wrap);
    }
  }

  function aplicarRegioes() {
    const ativas = regioes.filter(r => r.ativo !== false).sort((a,b) => Number(a.ordem||0)-Number(b.ordem||0));
    const select = document.getElementById("region");
    if (select) {
      const atual = select.value;
      select.innerHTML = `<option value="">Selecione</option>` + ativas.map(r => `<option value="${esc(r.codigo)}">${esc(r.nome || r.codigo)} — ${moeda(r.taxa)}</option>`).join("");
      if (ativas.some(r => r.codigo === atual)) select.value = atual;
    }

    const grid = $(".fee-grid");
    if (grid) grid.innerHTML = ativas.map(r => `<article><strong>${esc(r.nome || r.codigo)}</strong><span>${moeda(r.taxa)}</span></article>`).join("");

    // O script principal usa taxasAtuais(). Ao substituir essa função,
    // qualquer região criada no painel passa a calcular a taxa corretamente.
    window.taxasAtuais = () => Object.fromEntries(ativas.map(r => [r.codigo, Number(r.taxa || 0)]));
    if (typeof window.atualizarResumo === "function") window.atualizarResumo();
  }

  function ajustarTrocoAtual() {
    const select = document.getElementById("payment");
    const opt = select?.selectedOptions?.[0];
    const aceita = opt?.dataset?.troco === "1";
    document.getElementById("changeField")?.classList.toggle("hidden", !aceita);
  }

  function aplicarPagamentos() {
    const ativas = pagamentos.filter(p => p.ativo !== false).sort((a,b) => Number(a.ordem||0)-Number(b.ordem||0));
    const select = document.getElementById("payment");
    if (!select) return;
    const atual = select.value;
    select.innerHTML = `<option value="">Selecione</option>` + ativas.map(p => `<option value="${esc(p.nome)}" data-codigo="${esc(p.codigo)}" data-troco="${p.aceita_troco ? "1" : "0"}">${esc(p.nome)}</option>`).join("");
    if (ativas.some(p => p.nome === atual)) select.value = atual;

    if (!select.dataset.cmsPaymentBound) {
      select.dataset.cmsPaymentBound = "1";
      select.addEventListener("change", () => {
        // O script antigo também reage ao pagamento. Rodar no próximo ciclo
        // garante que a configuração do CMS seja a decisão final.
        setTimeout(ajustarTrocoAtual, 0);
        if (typeof window.atualizarResumo === "function") window.atualizarResumo();
      });
    }
    ajustarTrocoAtual();
  }

  function instalarPedidoMinimo() {
    if (pedidoMinimoInstalado || typeof window.finalizarPedido !== "function") return;
    const original = window.finalizarPedido;
    window.finalizarPedido = async function (...args) {
      const minimo = Number(site?.pedido_minimo || 0);
      const totalProdutos = typeof window.subtotal === "function" ? Number(window.subtotal() || 0) : 0;
      if (minimo > 0 && totalProdutos < minimo) {
        alert(`Pedido mínimo: ${moeda(minimo)}. Adicione mais itens para finalizar.`);
        return;
      }
      return original.apply(this, args);
    };
    pedidoMinimoInstalado = true;
  }

  async function carregarTudo() {
    if (!client) return;
    const [s, a, r, p] = await Promise.all([
      client.from("site_config").select("*").eq("id", 1).single(),
      client.from("avisos_site").select("*").order("ordem", {ascending:true}).order("id", {ascending:false}),
      client.from("regioes_entrega").select("*").order("ordem", {ascending:true}),
      client.from("formas_pagamento").select("*").order("ordem", {ascending:true})
    ]);
    if (!s.error && s.data) site = s.data;
    if (!r.error) regioes = r.data || [];
    if (!p.error) pagamentos = p.data || [];
    aplicarSite();
    aplicarRegioes();
    aplicarPagamentos();
    instalarPedidoMinimo();
    if (!a.error) renderAvisos(a.data || []);
  }

  function realtime() {
    if (!client || channel) return;
    channel = client.channel("cantinho-cms-public")
      .on("postgres_changes", {event:"*",schema:"public",table:"site_config"}, carregarTudo)
      .on("postgres_changes", {event:"*",schema:"public",table:"avisos_site"}, carregarTudo)
      .on("postgres_changes", {event:"*",schema:"public",table:"regioes_entrega"}, carregarTudo)
      .on("postgres_changes", {event:"*",schema:"public",table:"formas_pagamento"}, carregarTudo)
      .subscribe();
  }

  async function init() {
    css();
    await carregarTudo();
    realtime();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

