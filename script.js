/* ============================================================
   CANTINHO PIZZA BURGUER
   SCRIPT.JS COMPLETO

   VERSÃO NOVA
   - PREÇOS VERDES
   - DESCRIÇÃO COMPLETA
   - LETRAS MAIORES
   - CARRINHO MODERNO
   - BOTÕES: − | QTD | + | ×
   - SUPABASE
   - STATUS DA LOJA
   - FAVORITOS
   - CHECKOUT
============================================================ */


/* ============================================================
   CONFIGURAÇÃO PADRÃO
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


/* ============================================================
   VARIÁVEIS
============================================================ */

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


/* ============================================================
   SUPABASE
============================================================ */

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

function minutosDeHora(hora) {
  const partes =
    String(hora || "00:00").split(":");

  const h =
    Number(partes[0] || 0);

  const m =
    Number(partes[1] || 0);

  return h * 60 + m;
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
   CSS COMPLETO DO CARDÁPIO + CARRINHO
============================================================ */

function instalarCssCardapio() {

  const antigo =
    el("cantinho-cardapio-fix");

  if (antigo) {
    antigo.remove();
  }

  const style =
    document.createElement("style");

  style.id = "cantinho-cardapio-fix";

  style.textContent = `

    /* =====================================================
       CARDÁPIO
    ===================================================== */

    #sectionsContainer {
      width: 100%;
      max-width: 1180px;
      margin: 0 auto;
    }

    .category-section {
      width: 100%;
      margin: 0 0 34px;
    }

    .section-title {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      margin: 28px 2px 15px;
    }

    .section-title > div > span {
      display: block;
      margin-bottom: 5px;

      color: #9f9f9f;

      font-size: 12px;
      font-weight: 800;

      letter-spacing: .08em;
    }

    .section-title h2 {
      margin: 0;

      color: #ffffff;

      font-size: 22px;
      font-weight: 900;

      line-height: 1.25;
    }

    .section-title > button {
      display: none;
    }


    /* =====================================================
       GRADE
    ===================================================== */

    .category-grid {
      display: grid !important;

      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 12px;

      width: 100%;
    }


    /* =====================================================
       CARD PRODUTO
    ===================================================== */

    .product-card {
      position: relative;

      display: flex;
      flex-direction: column;

      min-width: 0;

      overflow: hidden;

      border:
        1px solid
        rgba(255,255,255,.09);

      border-radius: 18px;

      background:
        linear-gradient(
          180deg,
          #171717,
          #121212
        );

      color: #fff;
    }


    /* =====================================================
       FOTO
    ===================================================== */

    .product-image {
      position: relative;

      width: 100%;
      height: 155px;

      overflow: hidden;

      background: #202020;
    }

    .product-image img {
      display: block !important;

      width: 100% !important;
      height: 100% !important;

      max-width: 100% !important;

      object-fit: cover !important;

      margin: 0 !important;
    }


    /* =====================================================
       INFO
    ===================================================== */

    .product-info {
      display: flex;
      flex: 1;
      flex-direction: column;

      padding: 13px;
    }


    /* =====================================================
       NOME
    ===================================================== */

    .product-info h3 {
      display: block;

      margin: 0 0 8px;

      color: #fff;

      font-size: 17px;
      font-weight: 900;

      line-height: 1.3;

      white-space: normal;

      overflow: visible;

      text-overflow: unset;
    }


    /* =====================================================
       DESCRIÇÃO COMPLETA

       SEM ...
       SEM CORTAR LINHAS
    ===================================================== */

    .product-info p {
      display: block !important;

      width: 100%;

      height: auto !important;

      min-height: 0 !important;
      max-height: none !important;

      margin: 0 0 15px;

      overflow: visible !important;

      color: #c7c7c7;

      font-size: 14px;
      font-weight: 400;

      line-height: 1.5;

      white-space: normal !important;

      text-overflow: unset !important;

      overflow-wrap: break-word;

      -webkit-line-clamp: unset !important;
      -webkit-box-orient: initial !important;
    }


    /* =====================================================
       PREÇO + ADICIONAR
    ===================================================== */

    .product-bottom {
      display: flex;

      align-items: center;
      justify-content: space-between;

      gap: 9px;

      width: 100%;

      margin-top: auto;
    }


    /* PREÇO VERDE */

    .product-bottom .price {
      color: #31d56f !important;

      font-size: 17px;
      font-weight: 900;

      white-space: nowrap;
    }


    /* BOTÃO ADICIONAR */

    .product-bottom .add-button {
      padding: 10px 12px;

      border: none;

      border-radius: 10px;

      background: #e74627;

      color: white;

      font-size: 12px;
      font-weight: 900;

      cursor: pointer;
    }

    .product-bottom .add-button:disabled {
      background: #303030;

      color: #999;

      cursor: not-allowed;
    }


    /* =====================================================
       FAVORITOS
    ===================================================== */

    .heart {
      position: absolute;

      z-index: 5;

      top: 9px;
      right: 9px;

      display: flex;

      align-items: center;
      justify-content: center;

      width: 35px;
      height: 35px;

      padding: 0;

      border: none;

      border-radius: 50%;

      background:
        rgba(0,0,0,.7);

      color: white;

      font-size: 20px;

      cursor: pointer;
    }

    .heart.active {
      color: #ff4c4c;
    }


    /* =====================================================
       ESGOTADO
    ===================================================== */

    .sold-overlay {
      display: none;

      position: absolute;

      z-index: 4;

      inset: 0;

      align-items: center;
      justify-content: center;

      flex-direction: column;

      padding: 12px;

      background:
        rgba(0,0,0,.72);

      text-align: center;
    }

    .sold-overlay strong {
      font-size: 18px;
      font-weight: 900;

      color: white;
    }

    .sold-overlay span {
      margin-top: 4px;

      font-size: 12px;

      color: #ddd;
    }

    .product-card.sold-out
    .sold-overlay {
      display: flex;
    }


    /* =====================================================
       FILTRO
    ===================================================== */

    .filtered-out {
      display: none !important;
    }


    /* =====================================================
       MEU PEDIDO / CARRINHO

       NOVO VISUAL
    ===================================================== */

    #cartList {
      display: flex;
      flex-direction: column;

      gap: 12px;

      padding-top: 8px;
    }


    /* ITEM */

    .cart-item {
      display: flex;

      align-items: center;
      justify-content: space-between;

      gap: 14px;

      width: 100%;

      padding: 14px;

      border:
        1px solid
        rgba(255,255,255,.09);

      border-radius: 16px;

      background:
        linear-gradient(
          145deg,
          #1b1b1b,
          #111111
        );
    }


    /* INFORMAÇÕES DO ITEM */

    .cart-item-info {
      flex: 1;

      min-width: 0;
    }

    .cart-item-info strong {
      display: block;

      margin: 0 0 5px;

      color: #ffffff;

      font-size: 15px;
      font-weight: 800;

      line-height: 1.3;
    }


    /* PREÇO NO CARRINHO */

    .cart-item-price {
      display: block;

      color: #31d56f !important;

      font-size: 14px;

      font-weight: 900;
    }


    /* CONTROLES */

    .cart-item-actions {
      display: flex;

      align-items: center;

      gap: 5px;

      flex-shrink: 0;

      padding: 4px;

      border:
        1px solid
        rgba(255,255,255,.08);

      border-radius: 13px;

      background: #0c0c0c;
    }


    /* MENOS / MAIS */

    .cart-qty-btn {
      display: flex;

      align-items: center;
      justify-content: center;

      width: 32px;
      height: 32px;

      padding: 0;

      border: none;

      border-radius: 9px;

      background: #232323;

      color: white;

      font-size: 19px;
      font-weight: 800;

      cursor: pointer;
    }

    .cart-qty-btn:active {
      transform: scale(.94);
    }


    /* QUANTIDADE */

    .cart-item-qty {
      display: flex;

      align-items: center;
      justify-content: center;

      min-width: 27px;

      color: white;

      font-size: 15px;
      font-weight: 900;

      text-align: center;
    }


    /* EXCLUIR */

    .cart-remove-btn {
      display: flex;

      align-items: center;
      justify-content: center;

      width: 32px;
      height: 32px;

      margin-left: 3px;

      padding: 0;

      border: none;

      border-radius: 9px;

      background:
        rgba(255,65,65,.13);

      color: #ff5a5a;

      font-size: 17px;
      font-weight: 900;

      cursor: pointer;
    }

    .cart-remove-btn:active {
      transform: scale(.94);
    }


    /* CARRINHO VAZIO */

    .cart-empty {
      width: 100%;

      padding: 26px 16px;

      border:
        1px dashed
        rgba(255,255,255,.13);

      border-radius: 16px;

      color: #aaa;

      text-align: center;

      font-size: 14px;
    }


    /* =====================================================
       SUBTOTAL DO CARRINHO
    ===================================================== */

    #cartSubtotal,
    #checkoutSubtotal,
    #checkoutTotal {
      font-weight: 900;
    }

    #cartSubtotal,
    #checkoutTotal {
      color: #31d56f;
    }


    /* =====================================================
       CELULAR PEQUENO
    ===================================================== */

    @media(max-width:380px) {

      .category-grid {
        gap: 9px;
      }

      .product-image {
        height: 140px;
      }

      .product-info {
        padding: 11px;
      }

      .product-info h3 {
        font-size: 16px;
      }

      .product-info p {
        font-size: 13px;

        line-height: 1.5;
      }

      .product-bottom {
        flex-direction: column;

        align-items: stretch;
      }

      .product-bottom .price {
        font-size: 17px;
      }

      .product-bottom
      .add-button {
        width: 100%;
      }


      /* MEU PEDIDO NO CELULAR */

      .cart-item {
        flex-direction: column;

        align-items: stretch;

        padding: 13px;
      }

      .cart-item-actions {
        align-self: flex-start;
      }

      .cart-item-info strong {
        font-size: 15px;
      }
    }


    /* =====================================================
       TABLET
    ===================================================== */

    @media(min-width:760px) {

      .category-grid {
        grid-template-columns:
          repeat(3,minmax(0,1fr));

        gap: 16px;
      }

      .product-image {
        height: 200px;
      }

      .product-info {
        padding: 15px;
      }

      .product-info h3 {
        font-size: 19px;
      }

      .product-info p {
        font-size: 15px;

        line-height: 1.55;
      }

      .product-bottom .price {
        font-size: 19px;
      }

      .product-bottom
      .add-button {
        padding: 11px 15px;

        font-size: 13px;
      }
    }


    /* =====================================================
       COMPUTADOR
    ===================================================== */

    @media(min-width:1050px) {

      .category-grid {
        grid-template-columns:
          repeat(4,minmax(0,1fr));
      }

      .product-image {
        height: 210px;
      }
    }
  `;

  document.head.appendChild(style);
}


/* ============================================================
   TAXAS
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
    .forEach(card => {

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

        if (
          option.value &&
          option.value in taxas
        ) {

          option.textContent =
            `${option.value} — ${moeda(
              taxas[option.value]
            )}`;
        }
      });
  }
}


/* ============================================================
   CONFIGURAÇÕES
============================================================ */

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
      .from("config_cardapio")
      .select(
        "whatsapp,hora_abertura,hora_fechamento,dias_abertos,taxa_n1,taxa_n3,taxa_n5,taxa_c2,modo_loja"
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
        Array.isArray(
          data.dias_abertos
        )
          ? data.dias_abertos.map(Number)
          : PADRAO_DIAS_ABERTOS
    };


    if (
      [
        "automatico",
        "aberta",
        "fechada"
      ].includes(data.modo_loja)
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
   STATUS
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
      .from("config_cardapio")
      .select("modo_loja")
      .eq("id", 1)
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
    ].includes(data?.modo_loja)
  ) {

    modoLoja =
      data.modo_loja;

    configCardapio.modo_loja =
      data.modo_loja;
  }


  if (atualizar) {
    atualizarStatus();
  }


  return true;
}


/* ============================================================
   HORÁRIO
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

  if (
    modoLoja === "aberta"
  ) {
    return true;
  }

  if (
    modoLoja === "fechada"
  ) {
    return false;
  }

  return lojaAbertaNoAutomatico();
}


/* ============================================================
   STATUS VISUAL
============================================================ */

function atualizarStatus() {

  const aberta =
    lojaAberta();


  const status =
    el("statusLoja") ||
    document.querySelector(
      ".status-loja"
    );


  const texto =
    el("statusTexto") ||
    status?.querySelector(
      "span:last-child"
    );


  if (status) {

    status.classList.toggle(
      "closed",
      !aberta
    );

    status.classList.toggle(
      "fechado",
      !aberta
    );
  }


  if (texto) {

    if (
      modoLoja === "aberta"
    ) {

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
   CARREGAR CARDÁPIO
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
        .from("produtos_estoque")
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
        item =>
          item.ativo !== false
      );


  produtosCardapio =
    (
      produtosResp.data ||
      []
    )
      .filter(
        item =>
          item.ativo !== false
      )
      .map(
        item => ({

          ...item,

          preco:
            Number(
              item.preco || 0
            ),

          disponivel:
            item.disponivel !== false
        })
      );


  produtosPorId = {};


  produtosCardapio
    .forEach(produto => {

      produtosPorId[
        produto.produto_id
      ] =
        produto;
    });


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


/* ============================================================
   SINCRONIZAR CARRINHO
============================================================ */

function sincronizarCarrinhoComCardapio() {

  let mudou =
    false;


  carrinho =
    carrinho.filter(item => {

      const atual =
        produtosPorId[item.id];


      if (
        !atual ||
        atual.ativo === false
      ) {

        mudou = true;

        return false;
      }


      if (
        item.nome !== atual.nome
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
          Number(atual.preco);

        mudou = true;
      }


      return true;
    });


  if (mudou) {

    salvarCarrinho();
  }
}


/* ============================================================
   RENDER CARDÁPIO
============================================================ */

function renderizarCardapio() {

  instalarCssCardapio();


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
        class="${
          filtroAtual === "todos"
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
    .forEach(botao => {

      botao.addEventListener(
        "click",
        () => {

          filtrarCategoria(
            botao.dataset.cat
          );
        }
      );
    });


  const html =
    categoriasCardapio
      .map(categoria => {

        const produtos =
          produtosCardapio
            .filter(
              produto =>
                produto.categoria ===
                categoria.slug
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
      })
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


/* ============================================================
   RENDER PRODUTO
============================================================ */

function renderizarProduto(
  produto
) {

  const imagem =
    produto.imagem_url ||
    "https://placehold.co/800x600/171717/ffffff?text=Produto";


  const descricao =
    produto.descricao || "";


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
                produto.produto_id
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
            descricao
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
                  produto.produto_id
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


/* ============================================================
   VISUAL PRODUTOS
============================================================ */

function atualizarProdutosVisual() {

  const aberta =
    lojaAberta();


  document
    .querySelectorAll(
      ".product-card"
    )
    .forEach(card => {

      const produto =
        produtosPorId[
          card.dataset.produtoId
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
        produto.disponivel !== false;


      card.classList.toggle(
        "sold-out",
        !disponivel
      );


      if (!disponivel) {

        botao.disabled = true;

        botao.textContent =
          "Esgotado";

        return;
      }


      if (!aberta) {

        botao.disabled = true;

        botao.textContent =
          "Loja fechada";

        return;
      }


      botao.disabled = false;

      botao.textContent =
        "Adicionar";
    });
}


/* ============================================================
   ADICIONAR
============================================================ */

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
    produtosPorId[id];


  if (
    produto &&
    produto.disponivel === false
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
      item =>
        item.id === id
    );


  if (item) {

    item.qtd += 1;
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


/* ============================================================
   MENOS
============================================================ */

function reduzirProduto(id) {

  const item =
    carrinho.find(
      produto =>
        produto.id === id
    );


  if (!item) {
    return;
  }


  item.qtd -= 1;


  if (
    item.qtd <= 0
  ) {

    removerProduto(id);

    return;
  }


  salvarCarrinho();

  atualizarCarrinho();
}


/* ============================================================
   EXCLUIR
============================================================ */

function removerProduto(id) {

  carrinho =
    carrinho.filter(
      produto =>
        produto.id !== id
    );


  salvarCarrinho();

  atualizarCarrinho();


  toast(
    "Produto removido"
  );
}


/* ============================================================
   TOTAL
============================================================ */

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
    tipoPedido ===
    "Retirada"
  ) {

    return 0;
  }


  const regiao =
    el("region")
      ?.value;


  const taxas =
    taxasAtuais();


  return Number(
    taxas[regiao] || 0
  );
}


/* ============================================================
   CARRINHO MODERNO
============================================================ */

function atualizarCarrinho() {

  const lista =
    el("cartList");


  const qtd =
    quantidade();


  const total =
    subtotal();


  [
    el("headerCartCount"),
    el("floatingCartCount")
  ]
    .forEach(contador => {

      if (contador) {

        contador.textContent =
          qtd;
      }
    });


  if (
    el("floatingCartTotal")
  ) {

    el(
      "floatingCartTotal"
    ).textContent =
      moeda(total);
  }


  if (
    el("cartSubtotal")
  ) {

    el(
      "cartSubtotal"
    ).textContent =
      moeda(total);
  }


  if (!lista) {

    atualizarResumo();

    return;
  }


  if (
    !carrinho.length
  ) {

    lista.innerHTML =
      `
        <div
          class="cart-empty"
        >
          🛒 Seu pedido está vazio.
        </div>
      `;


    atualizarResumo();

    return;
  }


  lista.innerHTML =
    carrinho
      .map(
        item => `

          <div
            class="cart-item"
          >


            <div
              class="cart-item-info"
            >

              <strong>

                ${escaparHtml(
                  item.nome
                )}

              </strong>


              <span
                class="cart-item-price"
              >

                ${moeda(
                  Number(item.preco) *
                  Number(item.qtd)
                )}

              </span>

            </div>


            <div
              class="cart-item-actions"
            >


              <button

                class="cart-qty-btn"

                onclick="
                  reduzirProduto(
                    '${escaparJs(
                      item.id
                    )}'
                  )
                "

                aria-label="Diminuir quantidade"
              >
                −
              </button>


              <span
                class="cart-item-qty"
              >

                ${item.qtd}

              </span>


              <button

                class="cart-qty-btn"

                onclick="
                  adicionarProduto(
                    '${escaparJs(
                      item.id
                    )}'
                  )
                "

                aria-label="Aumentar quantidade"
              >
                +
              </button>


              <button

                class="cart-remove-btn"

                onclick="
                  removerProduto(
                    '${escaparJs(
                      item.id
                    )}'
                  )
                "

                aria-label="Excluir produto"
              >
                ×
              </button>


            </div>


          </div>
        `
      )
      .join("");


  atualizarResumo();
}


/* ============================================================
   ABRIR CARRINHO
============================================================ */

function abrirCarrinho() {

  el("cartDrawer")
    ?.classList
    .add("active");


  document.body.style.overflow =
    "hidden";
}


/* ============================================================
   FECHAR CARRINHO
============================================================ */

function fecharCarrinho() {

  el("cartDrawer")
    ?.classList
    .remove("active");


  document.body.style.overflow =
    "";
}


/* ============================================================
   ITENS INVÁLIDOS
============================================================ */

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
          produto.disponivel === false ||
          produto.ativo === false
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
      "Seu pedido está vazio"
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


  if (!lojaAberta()) {

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

      "Alguns produtos ficaram indisponíveis:\n\n" +

      invalidos
        .map(
          item =>
            "• " +
            item.nome
        )
        .join("\n")
    );


    atualizarCarrinho();

    return;
  }


  el("checkoutModal")
    ?.classList
    .add("active");


  document.body.style.overflow =
    "hidden";


  fecharCarrinho();

  atualizarResumo();
}


/* ============================================================
   FECHAR CHECKOUT
============================================================ */

function fecharCheckout() {

  el("checkoutModal")
    ?.classList
    .remove("active");


  document.body.style.overflow =
    "";
}


/* ============================================================
   ENTREGA / RETIRADA
============================================================ */

function selecionarTipo(tipo) {

  tipoPedido =
    tipo;


  el("deliveryBtn")
    ?.classList
    .toggle(
      "active",
      tipo === "Entrega"
    );


  el("pickupBtn")
    ?.classList
    .toggle(
      "active",
      tipo === "Retirada"
    );


  el("regionField")
    ?.classList
    .toggle(
      "hidden",
      tipo === "Retirada"
    );


  el("addressField")
    ?.classList
    .toggle(
      "hidden",
      tipo === "Retirada"
    );


  atualizarResumo();
}


/* ============================================================
   RESUMO
============================================================ */

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


/* ============================================================
   BOTÃO WHATSAPP
============================================================ */

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
      ? "💬 Enviar pedido pelo WhatsApp"
      : "🔒 Loja fechada";
}


/* ============================================================
   FAVORITOS
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
    .forEach(card => {

      const botao =
        card.querySelector(
          ".heart"
        );


      if (!botao) {
        return;
      }


      const ativo =
        lista.includes(
          card.dataset.produtoId
        );


      botao.classList.toggle(
        "active",
        ativo
      );


      botao.textContent =
        ativo
          ? "♥"
          : "♡";
    });
}

function mostrarFavoritos() {

  somenteFavoritos =
    !somenteFavoritos;


  aplicarFiltro();
}


/* ============================================================
   FILTROS
============================================================ */

function filtrarCategoria(
  categoria
) {

  filtroAtual =
    categoria;


  document
    .querySelectorAll(
      ".category-nav button"
    )
    .forEach(botao => {

      botao.classList.toggle(
        "active",

        botao.dataset.cat ===
        categoria
      );
    });


  aplicarFiltro();
}

function aplicarFiltro() {

  const termo =
    (
      el("searchDesktop")
        ?.value ||

      el("searchMobile")
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
    .forEach(secao => {

      let encontradosSecao =
        0;


      secao
        .querySelectorAll(
          ".product-card"
        )
        .forEach(card => {

          const categoriaOk =
            filtroAtual ===
              "todos" ||

            card.dataset.category ===
              filtroAtual;


          const pesquisaOk =
            !termo ||

            (
              (
                card.dataset.name ||
                ""
              ) +

              " " +

              card.innerText
            )
              .toLowerCase()
              .includes(termo);


          const favoritoOk =
            !somenteFavoritos ||

            favs.includes(
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

            encontrados++;

            encontradosSecao++;
          }
        });


      secao.classList.toggle(
        "filtered-out",
        encontradosSecao === 0
      );
    });


  el("emptySearch")
    ?.classList
    .toggle(
      "hidden",
      encontrados !== 0
    );
}

function syncSearch(origem) {

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
   FINALIZAR PEDIDO
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
      "Não foi possível confirmar o pedido agora. Tente novamente."
    );

    return;
  }


  if (!lojaAberta()) {

    alert(
      "🔴 A loja está fechada no momento."
    );

    return;
  }


  if (
    !carrinho.length
  ) {

    alert(
      "Seu pedido está vazio."
    );

    return;
  }


  const numero =
    String(
      configCardapio.whatsapp ||
      ""
    )
      .replace(
        /\D/g,
        ""
      );


  if (
    !numero ||
    configCardapio.whatsapp ===
      "COLOQUE_SEU_NUMERO_AQUI"
  ) {

    alert(
      "Configure o WhatsApp no painel administrador."
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
    .forEach(item => {

      mensagem +=
        `${item.qtd}x ${item.nome} — ${moeda(
          Number(item.preco) *
          Number(item.qtd)
        )}\n`;
    });


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


  if (observacao) {

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

        const novoModo =
          payload
            ?.new
            ?.modo_loja;


        if (
          [
            "automatico",
            "aberta",
            "fechada"
          ].includes(
            novoModo
          )
        ) {

          modoLoja =
            novoModo;
        }


        carregarConfigCardapio();
      }
    )


    .subscribe();
}


/* ============================================================
   FUNÇÕES DOS BOTÕES
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
   INICIAR
============================================================ */

document.addEventListener(
  "DOMContentLoaded",

  async () => {


    instalarCssCardapio();


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
            ?.classList
            .toggle(

              "hidden",

              el("payment")
                ?.value !==
                "Dinheiro"
            );
        }
      );


    atualizarCarrinho();


    if (!sb) {

      console.error(
        "Supabase não configurado. Verifique config.js."
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
