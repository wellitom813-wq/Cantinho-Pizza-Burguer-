/* ============================================================
   CANTINHO PIZZA BURGUER
   SCRIPT.JS COMPLETO — CARDÁPIO + SUPABASE + CARRINHO
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
  taxa_c2: 6,
  modo_loja: "automatico"
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

function minutosDeHora(hora) {
  const [h, m] =
    String(hora || "00:00")
      .split(":")
      .map(Number);

  return (h || 0) * 60 + (m || 0);
}

function horaCurta(hora) {
  return String(hora || "").slice(0, 5);
}

function salvarCarrinho() {
  localStorage.setItem(
    "cantinho_carrinho",
    JSON.stringify(carrinho)
  );
}


/* ============================================================
   CORREÇÃO DO VISUAL DOS PRODUTOS
============================================================ */

function instalarCssCardapio() {
  if (
    el("cantinho-cardapio-fix")
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "cantinho-cardapio-fix";

  style.textContent = `
    #sectionsContainer{
      width:100%;
      max-width:1180px;
      margin:0 auto;
    }

    .category-section{
      width:100%;
      margin:0 0 28px;
    }

    .section-title{
      display:flex;
      align-items:flex-end;
      justify-content:space-between;
      gap:12px;
      margin:24px 0 12px;
    }

    .section-title>div>span{
      display:block;
      color:#8e8e8e;
      font-size:10px;
      font-weight:800;
      letter-spacing:.08em;
      margin-bottom:4px;
    }

    .section-title h2{
      margin:0;
      color:#fff;
      font-size:19px;
      line-height:1.2;
    }

    .section-title>button{
      display:none;
    }

    .category-grid{
      display:grid!important;
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap:10px;
      width:100%;
    }

    .product-card{
      position:relative;
      min-width:0;
      overflow:hidden;

      border:
        1px solid
        rgba(255,255,255,.08);

      border-radius:16px;

      background:#121212;
      color:#fff;
    }

    .product-image{
      position:relative;

      width:100%;
      height:145px;

      overflow:hidden;

      background:#1b1b1b;
    }

    .product-image img{
      display:block!important;

      width:100%!important;
      height:100%!important;

      max-width:100%!important;

      object-fit:cover!important;
    }

    .product-info{
      padding:10px;
    }

    .product-info h3{
      margin:0 0 5px;

      color:#fff;

      font-size:14px;
      line-height:1.2;
    }

    .product-info p{
      display:-webkit-box;

      min-height:34px;

      margin:0 0 9px;

      overflow:hidden;

      color:#aaa;

      font-size:11px;
      line-height:1.4;

      -webkit-box-orient:vertical;
      -webkit-line-clamp:2;
    }

    .product-bottom{
      display:flex;

      align-items:center;
      justify-content:space-between;

      gap:7px;
    }

    .product-bottom .price{
      color:#ff6534;

      font-size:13px;
      font-weight:900;

      white-space:nowrap;
    }

    .product-bottom .add-button{
      min-width:0;

      padding:8px 9px;

      border:0;
      border-radius:9px;

      background:#e43b20;
      color:#fff;

      font-size:10px;
      font-weight:900;

      line-height:1.1;
    }

    .product-bottom
    .add-button:disabled{
      background:#292929;
      color:#888;
    }

    .heart{
      position:absolute;

      z-index:3;

      top:8px;
      right:8px;

      width:31px;
      height:31px;

      padding:0;

      border:0;
      border-radius:50%;

      background:
        rgba(0,0,0,.62);

      color:#fff;

      font-size:17px;
    }

    .heart.active{
      color:#ff4747;
    }

    .sold-overlay{
      display:none;

      position:absolute;

      z-index:2;

      inset:0;

      align-items:center;
      justify-content:center;

      flex-direction:column;

      background:
        rgba(0,0,0,.64);

      text-align:center;
    }

    .sold-overlay strong{
      font-size:16px;
      color:#fff;
    }

    .sold-overlay span{
      font-size:10px;
      color:#ddd;
      margin-top:3px;
    }

    .product-card.sold-out
    .sold-overlay{
      display:flex;
    }

    .filtered-out{
      display:none!important;
    }

    @media(min-width:760px){

      .category-grid{
        grid-template-columns:
          repeat(3,minmax(0,1fr));

        gap:14px;
      }

      .product-image{
        height:190px;
      }

      .product-info{
        padding:13px;
      }

      .product-info h3{
        font-size:16px;
      }

      .product-info p{
        font-size:12px;
      }

      .product-bottom .price{
        font-size:15px;
      }

      .product-bottom
      .add-button{
        font-size:12px;
        padding:10px 12px;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}


/* ============================================================
   CONFIGURAÇÕES
============================================================ */

function taxasAtuais() {
  return {
    N1:
      Number(
        configCardapio.taxa_n1 || 0
      ),

    N3:
      Number(
        configCardapio.taxa_n3 || 0
      ),

    N5:
      Number(
        configCardapio.taxa_n5 || 0
      ),

    C2:
      Number(
        configCardapio.taxa_c2 || 0
      )
  };
}

function atualizarTaxasNoHtml() {

  const taxas =
    taxasAtuais();

  document
    .querySelectorAll(
      ".fee-grid article"
    )
    .forEach(
      card => {

        const codigo =
          card
            .querySelector(
              "strong"
            )
            ?.textContent
            ?.trim();

        const span =
          card.querySelector(
            "span"
          );

        if (
          codigo &&
          span &&
          codigo in taxas
        ) {
          span.textContent =
            moeda(
              taxas[codigo]
            );
        }
      }
    );

  const select =
    el("region");

  if (select) {

    Array
      .from(
        select.options
      )
      .forEach(
        option => {

          if (
            option.value &&
            option.value in taxas
          ) {
            option.textContent =
              `${option.value} — ${moeda(
                taxas[
                  option.value
                ]
              )}`;
          }
        }
      );
  }
}

async function carregarConfigCardapio({
  atualizar = true
} = {}) {

  if (!sb) {
    return false;
  }

  const {
    data,
    error
  } =
    await sb
      .from(
        "config_cardapio"
      )
      .select(
        "whatsapp,hora_abertura,hora_fechamento,dias_abertos,taxa_n1,taxa_n3,taxa_n5,taxa_c2,modo_loja"
      )
      .eq(
        "id",
        1
      )
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
        Array.isArray(
          data.dias_abertos
        )
          ? data
              .dias_abertos
              .map(
                Number
              )
          : PADRAO_DIAS_ABERTOS
    };

    if (
      [
        "automatico",
        "aberta",
        "fechada"
      ].includes(
        data.modo_loja
      )
    ) {
      modoLoja =
        data.modo_loja;
    }
  }

  atualizarTaxasNoHtml();

  if (atualizar) {

    atualizarStatus();

    atualizarResumo();
  }

  return true;
}


/* ============================================================
   STATUS DA LOJA
============================================================ */

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
      .from(
        "config_cardapio"
      )
      .select(
        "modo_loja"
      )
      .eq(
        "id",
        1
      )
      .single();

  if (error) {

    console.error(
      "Erro ao carregar modo_loja:",
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
      data?.modo_loja
    )
  ) {

    modoLoja =
      data.modo_loja;

    configCardapio
      .modo_loja =
      data.modo_loja;
  }

  if (atualizar) {
    atualizarStatus();
  }

  return true;
}

function lojaAbertaNoAutomatico() {

  const agora =
    new Date();

  const dia =
    agora.getDay();

  const minutos =
    agora.getHours() *
      60 +
    agora.getMinutes();

  const inicio =
    minutosDeHora(
      configCardapio
        .hora_abertura
    );

  const fim =
    minutosDeHora(
      configCardapio
        .hora_fechamento
    );

  const dias =
    Array.isArray(
      configCardapio
        .dias_abertos
    )
      ? configCardapio
          .dias_abertos
      : PADRAO_DIAS_ABERTOS;

  return (
    dias.includes(
      dia
    ) &&
    minutos >= inicio &&
    minutos < fim
  );
}

function lojaAberta() {

  if (
    modoLoja ===
      "aberta"
  ) {
    return true;
  }

  if (
    modoLoja ===
      "fechada"
  ) {
    return false;
  }

  return lojaAbertaNoAutomatico();
}

function atualizarStatus() {

  const aberta =
    lojaAberta();

  const status =
    el(
      "statusLoja"
    ) ||
    document.querySelector(
      ".status-loja"
    );

  const texto =
    el(
      "statusTexto"
    ) ||
    status
      ?.querySelector(
        "span:last-child"
      );

  status
    ?.classList
    .toggle(
      "closed",
      !aberta
    );

  status
    ?.classList
    .toggle(
      "fechado",
      !aberta
    );

  if (texto) {

    if (
      modoLoja ===
        "aberta"
    ) {

      texto.textContent =
        "Aberto • manual";
    }

    else if (
      modoLoja ===
        "fechada"
    ) {

      texto.textContent =
        "Fechado • manual";
    }

    else if (
      aberta
    ) {

      texto.textContent =
        `Aberto • fecha às ${horaCurta(
          configCardapio
            .hora_fechamento
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
   CARREGAR PRODUTOS DO SUPABASE
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
        .from(
          "categorias_cardapio"
        )
        .select(
          "slug,nome,emoji,ordem,ativo"
        )
        .order(
          "ordem",
          {
            ascending: true
          }
        )
        .order(
          "nome",
          {
            ascending: true
          }
        ),

      sb
        .from(
          "produtos_estoque"
        )
        .select(
          "produto_id,nome,preco,descricao,categoria,imagem_url,disponivel,ativo,destaque,ordem"
        )
        .order(
          "ordem",
          {
            ascending: true
          }
        )
        .order(
          "nome",
          {
            ascending: true
          }
        )
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
    (
      categoriasResp.data ||
      []
    )
      .filter(
        categoria =>
          categoria.ativo !==
          false
      );

  produtosCardapio =
    (
      produtosResp.data ||
      []
    )
      .filter(
        produto =>
          produto.ativo !==
          false
      )
      .map(
        produto => ({
          ...produto,

          preco:
            Number(
              produto.preco ||
              0
            ),

          disponivel:
            produto
              .disponivel !==
            false,

          destaque:
            produto
              .destaque ===
            true
        })
      );

  produtosPorId = {};

  produtosCardapio
    .forEach(
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

  carrinho =
    carrinho.filter(
      item => {

        const atual =
          produtosPorId[
            item.id
          ];

        if (
          !atual ||
          atual.ativo ===
            false
        ) {

          mudou =
            true;

          return false;
        }

        if (
          item.nome !==
          atual.nome
        ) {

          item.nome =
            atual.nome;

          mudou =
            true;
        }

        if (
          Number(
            item.preco
          ) !==
          Number(
            atual.preco
          )
        ) {

          item.preco =
            Number(
              atual.preco
            );

          mudou =
            true;
        }

        return true;
      }
    );

  if (mudou) {
    salvarCarrinho();
  }
}


/* ============================================================
   MONTAR CARDÁPIO
============================================================ */

function renderizarCardapio() {

  instalarCssCardapio();

  const nav =
    document.querySelector(
      ".category-nav"
    );

  const container =
    el(
      "sectionsContainer"
    );

  if (
    !nav ||
    !container
  ) {

    console.warn(
      "Não encontrei .category-nav ou #sectionsContainer no index.html."
    );

    return;
  }

  nav.innerHTML =
    `
      <button
        class="${
          filtroAtual ===
            "todos"
            ? "active"
            : ""
        }"
        data-cat="todos"
      >
        ✨ Todos
      </button>

      ${
        categoriasCardapio
          .map(
            categoria => `
              <button
                class="${
                  filtroAtual ===
                    categoria.slug
                    ? "active"
                    : ""
                }"

                data-cat="${escaparHtml(
                  categoria.slug
                )}"
              >

                ${escaparHtml(
                  categoria.emoji ||
                  "🍽️"
                )}

                ${escaparHtml(
                  categoria.nome
                )}

              </button>
            `
          )
          .join("")
      }
    `;

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
              botao
                .dataset
                .cat
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
            produtosCardapio
              .filter(
                produto =>
                  produto
                    .categoria ===
                  categoria
                    .slug
              );

          if (
            !produtos.length
          ) {
            return "";
          }

          return `
            <section
              class="category-section"

              data-section-category="${escaparHtml(
                categoria.slug
              )}"
            >

              <div
                class="section-title"
              >

                <div>

                  <span>
                    CARDÁPIO
                  </span>

                  <h2>
                    ${escaparHtml(
                      categoria.emoji ||
                      "🍽️"
                    )}

                    ${escaparHtml(
                      categoria.nome
                    )}
                  </h2>

                </div>

              </div>

              <div
                class="category-grid"
              >

                ${
                  produtos
                    .map(
                      renderizarProduto
                    )
                    .join("")
                }

              </div>

            </section>
          `;
        }
      )
      .join("");

  container.innerHTML =
    html ||
    `
      <div
        class="empty-search"
      >

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
          produto.nome ||
          ""
        )
          .toLowerCase()
      )}"
    >

      <div
        class="product-image"
      >

        <img
          src="${escaparHtml(
            imagem
          )}"

          alt="${escaparHtml(
            produto.nome
          )}"

          loading="lazy"

          onerror="
            this.onerror=null;
            this.src='https://placehold.co/800x600/171717/ffffff?text=Produto';
          "
        >

        <button
          class="heart"

          onclick="
            toggleFavorito(
              this,
              '${escaparJs(
                produto
                  .produto_id
              )}'
            )
          "

          aria-label="Favoritar"
        >
          ♡
        </button>

        <div
          class="sold-overlay"
        >

          <strong>
            ESGOTADO
          </strong>

          <span>
            Indisponível no momento
          </span>

        </div>

      </div>

      <div
        class="product-info"
      >

        <h3>
          ${escaparHtml(
            produto.nome
          )}
        </h3>

        <p>
          ${escaparHtml(
            produto.descricao ||
            ""
          )}
        </p>

        <div
          class="product-bottom"
        >

          <strong
            class="price"
          >
            ${moeda(
              produto.preco
            )}
          </strong>

          <button
            class="add-button"

            onclick="
              adicionarProduto(
                '${escaparJs(
                  produto
                    .produto_id
                )}'
              )
            "
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

        const produto =
          produtosPorId[
            card
              .dataset
              .produtoId
          ];

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
          produto
            .disponivel !==
          false;

        card
          .classList
          .toggle(
            "sold-out",
            !disponivel
          );

        if (
          !disponivel
        ) {

          botao.disabled =
            true;

          botao.textContent =
            "Esgotado";
        }

        else if (
          !aberta
        ) {

          botao.disabled =
            true;

          botao.textContent =
            "Loja fechada";
        }

        else {

          botao.disabled =
            false;

          botao.textContent =
            "Adicionar";
        }
      }
    );
}


/* ============================================================
   CARRINHO
============================================================ */

function produtoDisponivel(
  id
) {

  const produto =
    produtosPorId[id];

  return (
    !!produto &&
    produto.disponivel !==
      false &&
    produto.ativo !==
      false
  );
}

function adicionarProduto(
  id,
  nomeFallback,
  precoFallback
) {

  if (
    !lojaAberta()
  ) {

    toast(
      "Loja fechada"
    );

    return;
  }

  const produto =
    produtosPorId[
      id
    ];

  if (
    produto &&
    produto.disponivel ===
      false
  ) {

    toast(
      "Produto esgotado"
    );

    return;
  }

  const nome =
    produto?.nome ||
    nomeFallback ||
    "Produto";

  const preco =
    Number(
      produto?.preco ??
      precoFallback ??
      0
    );

  const item =
    carrinho.find(
      produtoCarrinho =>
        produtoCarrinho.id ===
        id
    );

  if (item) {

    item.qtd +=
      1;
  }

  else {

    carrinho.push({
      id,
      nome,
      preco,
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
        produto.id ===
        id
    );

  if (!item) {
    return;
  }

  item.qtd -=
    1;

  if (
    item.qtd <=
    0
  ) {

    carrinho =
      carrinho.filter(
        produto =>
          produto.id !==
          id
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
        produto.id !==
        id
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
      Number(
        item.preco
      ) *
      Number(
        item.qtd
      ),
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
      Number(
        item.qtd
      ),
    0
  );
}

function taxa() {

  if (
    tipoPedido ===
      "Retirada"
  ) {
    return 0;
  }

  const regiao =
    el(
      "region"
    )
      ?.value;

  const taxas =
    taxasAtuais();

  return Number(
    taxas[
      regiao
    ] ||
    0
  );
}

function atualizarCarrinho() {

  const lista =
    el(
      "cartList"
    );

  const qtd =
    quantidade();

  const total =
    subtotal();

  [
    el(
      "headerCartCount"
    ),

    el(
      "floatingCartCount"
    )
  ]
    .forEach(
      contador => {

        if (contador) {

          contador.textContent =
            qtd;
        }
      }
    );

  if (
    el(
      "floatingCartTotal"
    )
  ) {

    el(
      "floatingCartTotal"
    ).textContent =
      moeda(
        total
      );
  }

  if (
    el(
      "cartSubtotal"
    )
  ) {

    el(
      "cartSubtotal"
    ).textContent =
      moeda(
        total
      );
  }

  if (lista) {

    if (
      !carrinho.length
    ) {

      lista.innerHTML =
        `
          <div
            class="cart-empty"
          >
            Seu carrinho está vazio.
          </div>
        `;
    }

    else {

      lista.innerHTML =
        carrinho
          .map(
            item => `
              <div
                class="cart-item"
              >

                <div>

                  <strong>
                    ${escaparHtml(
                      item.nome
                    )}
                  </strong>

                  <span>
                    ${moeda(
                      Number(
                        item.preco
                      ) *
                      Number(
                        item.qtd
                      )
                    )}
                  </span>

                </div>

                <div
                  class="cart-item-actions"
                >

                  <button
                    onclick="
                      reduzirProduto(
                        '${escaparJs(
                          item.id
                        )}'
                      )
                    "
                  >
                    −
                  </button>

                  <b>
                    ${item.qtd}
                  </b>

                  <button
                    onclick="
                      adicionarProduto(
                        '${escaparJs(
                          item.id
                        )}'
                      )
                    "
                  >
                    +
                  </button>

                  <button
                    onclick="
                      removerProduto(
                        '${escaparJs(
                          item.id
                        )}'
                      )
                    "
                  >
                    ×
                  </button>

                </div>

              </div>
            `
          )
          .join("");
    }
  }

  atualizarResumo();
}

function abrirCarrinho() {

  el(
    "cartDrawer"
  )
    ?.classList
    .add(
      "active"
    );

  document
    .body
    .style
    .overflow =
    "hidden";
}

function fecharCarrinho() {

  el(
    "cartDrawer"
  )
    ?.classList
    .remove(
      "active"
    );

  document
    .body
    .style
    .overflow =
    "";
}

function itensInvalidosCarrinho() {

  return carrinho.filter(
    item => {

      const produto =
        produtosPorId[
          item.id
        ];

      return (
        produto &&
        (
          produto.disponivel ===
            false ||
          produto.ativo ===
            false
        )
      );
    }
  );
}


/* ============================================================
   CHECKOUT
============================================================ */

async function abrirCheckout() {

  if (
    !carrinho.length
  ) {

    toast(
      "Seu carrinho está vazio"
    );

    return;
  }

  await Promise.all([
    carregarStatusLoja({
      atualizar: false
    }),

    carregarCardapio({
      renderizar: false
    }),

    carregarConfigCardapio({
      atualizar: false
    })
  ]);

  if (
    !lojaAberta()
  ) {

    alert(
      "🔴 A loja está fechada no momento."
    );

    return;
  }

  const invalidos =
    itensInvalidosCarrinho();

  if (
    invalidos.length
  ) {

    alert(
      "Alguns itens estão esgotados ou indisponíveis:\n\n" +
      invalidos
        .map(
          item =>
            "• " +
            item.nome
        )
        .join(
          "\n"
        )
    );

    atualizarCarrinho();

    return;
  }

  el(
    "checkoutModal"
  )
    ?.classList
    .add(
      "active"
    );

  document
    .body
    .style
    .overflow =
    "hidden";

  fecharCarrinho();

  atualizarResumo();
}

function fecharCheckout() {

  el(
    "checkoutModal"
  )
    ?.classList
    .remove(
      "active"
    );

  document
    .body
    .style
    .overflow =
    "";
}

function selecionarTipo(
  tipo
) {

  tipoPedido =
    tipo;

  el(
    "deliveryBtn"
  )
    ?.classList
    .toggle(
      "active",
      tipo ===
        "Entrega"
    );

  el(
    "pickupBtn"
  )
    ?.classList
    .toggle(
      "active",
      tipo ===
        "Retirada"
    );

  el(
    "regionField"
  )
    ?.classList
    .toggle(
      "hidden",
      tipo ===
        "Retirada"
    );

  el(
    "addressField"
  )
    ?.classList
    .toggle(
      "hidden",
      tipo ===
        "Retirada"
    );

  atualizarResumo();
}

function atualizarResumo() {

  if (
    el(
      "checkoutSubtotal"
    )
  ) {

    el(
      "checkoutSubtotal"
    ).textContent =
      moeda(
        subtotal()
      );
  }

  if (
    el(
      "checkoutFee"
    )
  ) {

    el(
      "checkoutFee"
    ).textContent =
      moeda(
        taxa()
      );
  }

  if (
    el(
      "checkoutTotal"
    )
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
    el(
      "sendWhatsApp"
    );

  if (!botao) {
    return;
  }

  const aberta =
    lojaAberta();

  botao.disabled =
    !aberta;

  botao.textContent =
    aberta
      ? "💬 Enviar pedido pelo WhatsApp"
      : "🔒 Loja fechada";
}


/* ============================================================
   FAVORITOS E FILTROS
============================================================ */

function favoritos() {

  return JSON.parse(
    localStorage.getItem(
      "cantinho_favoritos"
    ) ||
    "[]"
  );
}

function toggleFavorito(
  botao,
  id
) {

  let lista =
    favoritos();

  lista =
    lista.includes(
      id
    )
      ? lista.filter(
          item =>
            item !==
            id
        )
      : [
          ...lista,
          id
        ];

  localStorage.setItem(
    "cantinho_favoritos",
    JSON.stringify(
      lista
    )
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
            card
              .dataset
              .produtoId
          );

        botao
          .classList
          .toggle(
            "active",
            ativo
          );

        botao.textContent =
          ativo
            ? "♥"
            : "♡";
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

        botao
          .classList
          .toggle(
            "active",
            botao
              .dataset
              .cat ===
              categoria
          );
      }
    );

  aplicarFiltro();
}

function aplicarFiltro() {

  const termo =
    (
      el(
        "searchDesktop"
      )
        ?.value ||
      el(
        "searchMobile"
      )
        ?.value ||
      ""
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
                card
                  .dataset
                  .category ===
                  filtroAtual;

              const pesquisaOk =
                !termo ||
                (
                  (
                    card
                      .dataset
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
                  card
                    .dataset
                    .produtoId
                );

              const mostrar =
                categoriaOk &&
                pesquisaOk &&
                favoritoOk;

              card
                .classList
                .toggle(
                  "filtered-out",
                  !mostrar
                );

              if (mostrar) {

                encontrados +=
                  1;

                encontradosSecao +=
                  1;
              }
            }
          );

        secao
          .classList
          .toggle(
            "filtered-out",
            encontradosSecao ===
              0
          );
      }
    );

  el(
    "emptySearch"
  )
    ?.classList
    .toggle(
      "hidden",
      encontrados !==
        0
    );
}

function syncSearch(
  origem
) {

  const destino =
    origem.id ===
      "searchDesktop"
      ? el(
          "searchMobile"
        )
      : el(
          "searchDesktop"
        );

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

  el(
    "cardapio"
  )
    ?.scrollIntoView({
      behavior:
        "smooth"
    });
}

function toast(
  texto
) {

  const elemento =
    el(
      "toast"
    );

  if (!elemento) {
    return;
  }

  elemento.textContent =
    texto;

  elemento
    .classList
    .add(
      "active"
    );

  clearTimeout(
    window
      .cantinhoToastTimer
  );

  window
    .cantinhoToastTimer =
    setTimeout(
      () => {

        elemento
          .classList
          .remove(
            "active"
          );
      },
      1600
    );
}


/* ============================================================
   ENVIAR PEDIDO
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

  if (
    !lojaAberta()
  ) {

    alert(
      "🔴 A loja está fechada no momento."
    );

    return;
  }

  const invalidos =
    itensInvalidosCarrinho();

  if (
    invalidos.length
  ) {

    alert(
      "Alguns itens estão esgotados ou indisponíveis:\n\n" +
      invalidos
        .map(
          item =>
            "• " +
            item.nome
        )
        .join(
          "\n"
        ) +
      "\n\nRemova esses itens para continuar."
    );

    atualizarCarrinho();

    return;
  }

  if (
    !carrinho.length
  ) {

    alert(
      "Seu carrinho está vazio."
    );

    return;
  }

  const numero =
    String(
      configCardapio
        .whatsapp ||
      ""
    )
      .replace(
        /\D/g,
        ""
      );

  if (
    !numero ||
    configCardapio
      .whatsapp ===
      "COLOQUE_SEU_NUMERO_AQUI"
  ) {

    alert(
      "Configure o número do WhatsApp no painel administrador."
    );

    return;
  }

  const nome =
    el(
      "customerName"
    )
      ?.value
      .trim();

  const telefone =
    el(
      "customerPhone"
    )
      ?.value
      .trim();

  const regiao =
    el(
      "region"
    )
      ?.value;

  const endereco =
    el(
      "address"
    )
      ?.value
      .trim();

  const pagamento =
    el(
      "payment"
    )
      ?.value;

  const troco =
    el(
      "changeFor"
    )
      ?.value
      .trim();

  const observacao =
    el(
      "notes"
    )
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
    "🍕 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*\n\n";

  mensagem +=
    `👤 *Cliente:* ${nome}\n`;

  mensagem +=
    `📱 *Telefone:* ${telefone}\n`;

  mensagem +=
    `📦 *Recebimento:* ${tipoPedido}\n`;

  if (
    tipoPedido ===
      "Entrega"
  ) {

    mensagem +=
      `🗺️ *Região:* ${regiao}\n`;

    mensagem +=
      `📍 *Endereço:* ${endereco}\n`;
  }

  mensagem +=
    "\n🧾 *ITENS*\n";

  carrinho
    .forEach(
      item => {

        mensagem +=
          `${item.qtd}x ${item.nome} — ${moeda(
            Number(
              item.preco
            ) *
            Number(
              item.qtd
            )
          )}\n`;
      }
    );

  mensagem +=
    `\n💵 *Subtotal:* ${moeda(
      subtotal()
    )}\n`;

  if (
    tipoPedido ===
      "Entrega"
  ) {

    mensagem +=
      `🛵 *Taxa:* ${moeda(
        taxa()
      )}\n`;
  }

  mensagem +=
    `💰 *TOTAL:* ${moeda(
      subtotal() +
      taxa()
    )}\n`;

  mensagem +=
    `💳 *Pagamento:* ${pagamento}\n`;

  if (troco) {

    mensagem +=
      `💵 *Troco para:* ${troco}\n`;
  }

  if (
    observacao
  ) {

    mensagem +=
      `📝 *Obs:* ${observacao}\n`;
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
        table:
          "produtos_estoque"
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
        table:
          "categorias_cardapio"
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
        table:
          "config_cardapio",
        filter:
          "id=eq.1"
      },

      payload => {

        if (
          [
            "automatico",
            "aberta",
            "fechada"
          ].includes(
            payload
              ?.new
              ?.modo_loja
          )
        ) {

          modoLoja =
            payload
              .new
              .modo_loja;
        }

        carregarConfigCardapio();
      }
    )

    .subscribe();
}


/* ============================================================
   FUNÇÕES DISPONÍVEIS PARA OS BOTÕES HTML
============================================================ */

window.adicionarProduto =
  adicionarProduto;

window.reduzirProduto =
  reduzirProduto;

window.removerProduto =
  removerProduto;

window.abrirCarrinho =
  abrirCarrinho;

window.fecharCarrinho =
  fecharCarrinho;

window.abrirCheckout =
  abrirCheckout;

window.fecharCheckout =
  fecharCheckout;

window.selecionarTipo =
  selecionarTipo;

window.toggleFavorito =
  toggleFavorito;

window.mostrarFavoritos =
  mostrarFavoritos;

window.filtrarCategoria =
  filtrarCategoria;

window.syncSearch =
  syncSearch;

window.rolarCardapio =
  rolarCardapio;

window.finalizarPedido =
  finalizarPedido;


/* ============================================================
   INICIAR SITE
============================================================ */

document.addEventListener(
  "DOMContentLoaded",

  async () => {

    instalarCssCardapio();

    el(
      "searchDesktop"
    )
      ?.addEventListener(
        "input",
        evento => {

          syncSearch(
            evento.target
          );
        }
      );

    el(
      "searchMobile"
    )
      ?.addEventListener(
        "input",
        evento => {

          syncSearch(
            evento.target
          );
        }
      );

    el(
      "region"
    )
      ?.addEventListener(
        "change",
        atualizarResumo
      );

    el(
      "payment"
    )
      ?.addEventListener(
        "change",
        () => {

          el(
            "changeField"
          )
            ?.classList
            .toggle(
              "hidden",

              el(
                "payment"
              )
                ?.value !==
                "Dinheiro"
            );
        }
      );

    atualizarCarrinho();

    if (!sb) {

      console.error(
        "Supabase não configurado. Verifique config.js e a biblioteca @supabase/supabase-js."
      );

      atualizarStatus();

      return;
    }

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
