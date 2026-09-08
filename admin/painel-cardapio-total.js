/* ============================================================
   CANTINHO PIZZA BURGUER
   PAINEL TOTAL DO CARDÁPIO
   - Produtos
   - Categorias
   - Configurações
   - Upload de foto
============================================================ */

(() => {
  "use strict";

  const cfg =
    window.SUPABASE_CONFIG ||
    window.supabaseConfig ||
    {};

  const URL =
    cfg.url ||
    window.SUPABASE_URL;

  const KEY =
    cfg.key ||
    cfg.anonKey ||
    window.SUPABASE_ANON_KEY ||
    window.SUPABASE_PUBLISHABLE_KEY;

  if (
    !window.supabase ||
    !URL ||
    !KEY
  ) {
    console.error(
      "[Painel Total] Supabase não configurado."
    );

    return;
  }

  const client =
    window.supabase.createClient(
      URL,
      KEY
    );

  let produtos = [];
  let categorias = [];
  let config = null;
  let abaAtual = "produtos";
  let busca = "";
  let categoriaFiltro = "todos";

  function el(id) {
    return document.getElementById(id);
  }

  function moeda(valor) {
    return Number(valor || 0)
      .toLocaleString(
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

  function slug(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  }

  async function usuarioAtual() {
    const {
      data,
      error
    } =
      await client.auth
        .getSession();

    if (error) {
      throw error;
    }

    if (
      !data?.session?.user
    ) {
      throw new Error(
        "Sua sessão expirou. Faça login novamente."
      );
    }

    return data.session.user;
  }

  function mensagem(
    texto,
    tipo = ""
  ) {
    const info =
      el("paTotalMensagem");

    if (!info) {
      return;
    }

    info.textContent =
      texto;

    info.className =
      "pa-msg" +
      (
        tipo
          ? " " + tipo
          : ""
      );
  }

  function estilos() {
    if (
      el("paTotalStyles")
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "paTotalStyles";

    style.textContent = `
      #painelCardapioTotal {
        margin: 20px 0;
        padding: 0;
        border: 1px solid #292929;
        border-radius: 20px;
        overflow: hidden;
        background: #0f0f0f;
        color: white;
      }

      #painelCardapioTotal * {
        box-sizing: border-box;
      }

      .pa-head {
        padding: 20px;
        border-bottom: 1px solid #262626;
        background: linear-gradient(
          145deg,
          #191919,
          #101010
        );
      }

      .pa-head h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 900;
      }

      .pa-head p {
        margin: 6px 0 0;
        color: #aaa;
        font-size: 13px;
        line-height: 1.5;
      }

      .pa-tabs {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 8px;
        padding: 12px;
        background: #0b0b0b;
        border-bottom: 1px solid #222;
      }

      .pa-tab {
        border: 1px solid #2d2d2d;
        border-radius: 11px;
        min-height: 42px;
        padding: 8px;
        background: #161616;
        color: #aaa;
        font-weight: 900;
        cursor: pointer;
      }

      .pa-tab.active {
        background: #ff4c0d;
        border-color: #ff4c0d;
        color: #fff;
      }

      .pa-body {
        padding: 16px;
      }

      .pa-toolbar {
        display: grid;
        grid-template-columns:
          minmax(0, 1fr) 170px auto;
        gap: 9px;
        margin-bottom: 13px;
      }

      .pa-input,
      .pa-select,
      .pa-textarea {
        width: 100%;
        border: 1px solid #333;
        border-radius: 11px;
        background: #0a0a0a;
        color: white;
        outline: none;
        padding: 11px 12px;
        font: inherit;
      }

      .pa-input,
      .pa-select {
        min-height: 44px;
      }

      .pa-textarea {
        min-height: 90px;
        resize: vertical;
      }

      .pa-btn {
        min-height: 44px;
        border: 0;
        border-radius: 11px;
        padding: 10px 13px;
        font-weight: 900;
        cursor: pointer;
      }

      .pa-btn.primary {
        background: #ff4c0d;
        color: white;
      }

      .pa-btn.green {
        background: #22bb5b;
        color: #07180c;
      }

      .pa-btn.red {
        background: #db3e3e;
        color: white;
      }

      .pa-btn.dark {
        background: #242424;
        color: white;
        border: 1px solid #373737;
      }

      .pa-btn:disabled {
        opacity: .55;
        cursor: wait;
      }

      .pa-msg {
        min-height: 18px;
        margin: 10px 0;
        color: #aaa;
        font-size: 12px;
        font-weight: 800;
      }

      .pa-msg.ok {
        color: #64e58e;
      }

      .pa-msg.erro {
        color: #ff7b7b;
      }

      .pa-stats {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0,1fr));
        gap: 9px;
        margin: 12px 0 15px;
      }

      .pa-stat {
        padding: 12px;
        border-radius: 12px;
        background: #171717;
        border: 1px solid #292929;
      }

      .pa-stat small {
        display: block;
        color: #888;
        font-size: 10px;
        font-weight: 800;
      }

      .pa-stat strong {
        display: block;
        margin-top: 3px;
        font-size: 19px;
      }

      .pa-lista {
        display: grid;
        gap: 10px;
      }

      .pa-produto {
        display: grid;
        grid-template-columns:
          76px minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 12px;
        border: 1px solid #292929;
        border-radius: 14px;
        background: #171717;
      }

      .pa-produto img {
        width: 76px;
        height: 76px;
        border-radius: 11px;
        object-fit: cover;
        background: #222;
      }

      .pa-produto h3 {
        margin: 0;
        font-size: 15px;
      }

      .pa-produto p {
        margin: 4px 0;
        color: #aaa;
        font-size: 11px;
        line-height: 1.4;
      }

      .pa-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 5px;
      }

      .pa-tag {
        display: inline-flex;
        border-radius: 999px;
        padding: 5px 7px;
        font-size: 9px;
        font-weight: 900;
        background: #282828;
        color: #bbb;
      }

      .pa-tag.green {
        background: rgba(34,187,91,.15);
        color: #67e590;
      }

      .pa-tag.red {
        background: rgba(219,62,62,.16);
        color: #ff8181;
      }

      .pa-prod-acoes {
        display: grid;
        gap: 6px;
        min-width: 104px;
      }

      .pa-prod-acoes .pa-btn {
        min-height: 35px;
        font-size: 10px;
        padding: 6px 9px;
      }

      .pa-bulk {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }

      .pa-bulk .pa-btn {
        min-height: 36px;
        font-size: 10px;
      }

      .pa-categoria {
        display: grid;
        grid-template-columns:
          50px minmax(0,1fr) auto;
        gap: 10px;
        align-items: center;
        padding: 12px;
        border: 1px solid #292929;
        border-radius: 13px;
        background: #171717;
      }

      .pa-categoria-emoji {
        width: 50px;
        height: 50px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: #222;
        font-size: 25px;
      }

      .pa-categoria h3 {
        margin: 0;
        font-size: 15px;
      }

      .pa-categoria small {
        color: #888;
      }

      .pa-form-grid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .pa-field {
        display: grid;
        gap: 6px;
      }

      .pa-field.full {
        grid-column: 1 / -1;
      }

      .pa-field span {
        color: #aaa;
        font-size: 11px;
        font-weight: 800;
      }

      .pa-checks {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0,1fr));
        gap: 8px;
      }

      .pa-check {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 10px;
        border: 1px solid #333;
        border-radius: 10px;
        background: #101010;
        font-size: 11px;
        font-weight: 800;
      }

      .pa-preview {
        width: 100%;
        max-height: 220px;
        object-fit: cover;
        border-radius: 12px;
        border: 1px solid #333;
        background: #151515;
      }

      .pa-dias {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 8px;
      }

      .pa-dia {
        display: flex;
        align-items: center;
        gap: 7px;
        min-height: 42px;
        padding: 9px;
        background: #111;
        border: 1px solid #333;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 800;
      }

      .pa-vazio {
        padding: 25px 15px;
        text-align: center;
        border: 1px dashed #333;
        border-radius: 12px;
        color: #888;
      }

      .pa-modal {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: none;
        align-items: flex-end;
        justify-content: center;
        background: rgba(0,0,0,.72);
        padding: 12px;
      }

      .pa-modal.open {
        display: flex;
      }

      .pa-modal-card {
        width: min(720px, 100%);
        max-height: 92vh;
        overflow: auto;
        background: #111;
        border: 1px solid #333;
        border-radius: 20px;
        padding: 18px;
        box-shadow: 0 20px 80px rgba(0,0,0,.45);
      }

      .pa-modal-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 15px;
      }

      .pa-modal-head h3 {
        margin: 0;
        font-size: 19px;
      }

      .pa-close {
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 10px;
        background: #252525;
        color: white;
        font-size: 18px;
      }

      .pa-modal-actions {
        display: grid;
        grid-template-columns:
          1fr 1fr;
        gap: 9px;
        margin-top: 15px;
      }

      @media (max-width: 700px) {
        .pa-toolbar {
          grid-template-columns: 1fr;
        }

        .pa-stats {
          grid-template-columns:
            repeat(2, minmax(0,1fr));
        }

        .pa-produto {
          grid-template-columns:
            64px minmax(0,1fr);
        }

        .pa-produto img {
          width: 64px;
          height: 64px;
        }

        .pa-prod-acoes {
          grid-column: 1 / -1;
          grid-template-columns:
            repeat(3, minmax(0,1fr));
        }

        .pa-form-grid {
          grid-template-columns: 1fr;
        }

        .pa-field.full {
          grid-column: auto;
        }

        .pa-checks {
          grid-template-columns: 1fr;
        }

        .pa-dias {
          grid-template-columns:
            repeat(2, minmax(0,1fr));
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function acharDashboard() {
    return (
      el("dashboard") ||
      document.querySelector(
        ".dashboard"
      ) ||
      document.querySelector(
        "main"
      ) ||
      document.body
    );
  }

  function criarPainel() {
    if (
      el("painelCardapioTotal")
    ) {
      return true;
    }

    const dashboard =
      acharDashboard();

    if (!dashboard) {
      return false;
    }

    const secao =
      document.createElement(
        "section"
      );

    secao.id =
      "painelCardapioTotal";

    secao.innerHTML = `
      <div class="pa-head">
        <h2>
          🍕 Gerenciar Cardápio
        </h2>

        <p>
          Controle produtos, categorias,
          fotos, preços, disponibilidade,
          WhatsApp, taxas e horários.
        </p>
      </div>

      <div class="pa-tabs">
        <button
          class="pa-tab active"
          data-pa-tab="produtos"
        >
          🍔 Produtos
        </button>

        <button
          class="pa-tab"
          data-pa-tab="categorias"
        >
          🗂️ Categorias
        </button>

        <button
          class="pa-tab"
          data-pa-tab="config"
        >
          ⚙️ Configurações
        </button>
      </div>

      <div
        class="pa-body"
        id="paTotalBody"
      ></div>
    `;

    const statusCard =
      el("controleLojaCard");

    if (
      statusCard &&
      statusCard.parentElement ===
        dashboard
    ) {
      statusCard
        .insertAdjacentElement(
          "afterend",
          secao
        );
    }
    else {
      dashboard.prepend(
        secao
      );
    }

    secao
      .querySelectorAll(
        "[data-pa-tab]"
      )
      .forEach(
        botao => {
          botao.addEventListener(
            "click",
            () => {
              abaAtual =
                botao.dataset.paTab;

              secao
                .querySelectorAll(
                  "[data-pa-tab]"
                )
                .forEach(
                  item => {
                    item.classList.toggle(
                      "active",
                      item === botao
                    );
                  }
                );

              renderizarAba();
            }
          );
        }
      );

    return true;
  }

  async function carregarDados() {
    try {
      await usuarioAtual();

      const [
        prodResp,
        catResp,
        cfgResp
      ] =
        await Promise.all([
          client
            .from("produtos_estoque")
            .select(
              "produto_id,nome,preco,descricao,categoria,imagem_url,disponivel,ativo,destaque,ordem"
            )
            .order("categoria", {
              ascending: true
            })
            .order("ordem", {
              ascending: true
            })
            .order("nome", {
              ascending: true
            }),

          client
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

          client
            .from("config_cardapio")
            .select(
              "whatsapp,hora_abertura,hora_fechamento,dias_abertos,taxa_n1,taxa_n3,taxa_n5,taxa_c2"
            )
            .eq("id", 1)
            .single()
        ]);

      if (prodResp.error) {
        throw prodResp.error;
      }

      if (catResp.error) {
        throw catResp.error;
      }

      if (cfgResp.error) {
        throw cfgResp.error;
      }

      produtos =
        prodResp.data || [];

      categorias =
        catResp.data || [];

      config =
        cfgResp.data || null;

      renderizarAba();

      return true;
    }
    catch (erro) {
      console.error(
        "[Painel Total]",
        erro
      );

      const body =
        el("paTotalBody");

      if (body) {
        body.innerHTML = `
          <div class="pa-vazio">
            ❌ ${escaparHtml(
              erro?.message ||
              "Não foi possível carregar o painel."
            )}
          </div>
        `;
      }

      return false;
    }
  }

  function renderizarAba() {
    if (
      abaAtual === "produtos"
    ) {
      renderizarProdutos();
      return;
    }

    if (
      abaAtual === "categorias"
    ) {
      renderizarCategorias();
      return;
    }

    renderizarConfig();
  }

  function statsProdutos() {
    return {
      total:
        produtos.length,

      disponiveis:
        produtos.filter(
          item =>
            item.disponivel !== false &&
            item.ativo !== false
        ).length,

      esgotados:
        produtos.filter(
          item =>
            item.disponivel === false &&
            item.ativo !== false
        ).length,

      ocultos:
        produtos.filter(
          item =>
            item.ativo === false
        ).length
    };
  }

  function renderizarProdutos() {
    const body =
      el("paTotalBody");

    if (!body) {
      return;
    }

    const stats =
      statsProdutos();

    const filtrados =
      produtos.filter(
        produto => {
          const termo =
            `${produto.nome || ""} ${produto.produto_id || ""}`
              .toLowerCase();

          const buscaOk =
            !busca ||
            termo.includes(
              busca
            );

          const catOk =
            categoriaFiltro ===
              "todos" ||
            produto.categoria ===
              categoriaFiltro;

          return (
            buscaOk &&
            catOk
          );
        }
      );

    body.innerHTML = `
      <div class="pa-toolbar">
        <input
          id="paBuscaProdutos"
          class="pa-input"
          type="search"
          placeholder="Buscar produto..."
          value="${escaparHtml(
            busca
          )}"
        >

        <select
          id="paFiltroCategoria"
          class="pa-select"
        >
          <option value="todos">
            Todas as categorias
          </option>

          ${categorias
            .map(
              categoria => `
                <option
                  value="${escaparHtml(
                    categoria.slug
                  )}"
                  ${
                    categoriaFiltro ===
                      categoria.slug
                      ? "selected"
                      : ""
                  }
                >
                  ${escaparHtml(
                    categoria.emoji
                  )}
                  ${escaparHtml(
                    categoria.nome
                  )}
                </option>
              `
            )
            .join("")}
        </select>

        <button
          id="paNovoProduto"
          class="pa-btn primary"
          type="button"
        >
          + NOVO PRODUTO
        </button>
      </div>

      <div class="pa-stats">
        <div class="pa-stat">
          <small>TOTAL</small>
          <strong>
            ${stats.total}
          </strong>
        </div>

        <div class="pa-stat">
          <small>DISPONÍVEIS</small>
          <strong>
            ${stats.disponiveis}
          </strong>
        </div>

        <div class="pa-stat">
          <small>ESGOTADOS</small>
          <strong>
            ${stats.esgotados}
          </strong>
        </div>

        <div class="pa-stat">
          <small>OCULTOS</small>
          <strong>
            ${stats.ocultos}
          </strong>
        </div>
      </div>

      <div class="pa-bulk">
        <button
          class="pa-btn green"
          id="paTodosDisponiveis"
        >
          🟢 TODOS DISPONÍVEIS
        </button>

        <button
          class="pa-btn red"
          id="paTodosEsgotados"
        >
          🔴 TODOS ESGOTADOS
        </button>
      </div>

      <div
        id="paTotalMensagem"
        class="pa-msg"
      ></div>

      <div class="pa-lista">
        ${
          filtrados.length
            ? filtrados
                .map(
                  renderProdutoLinha
                )
                .join("")
            : `
              <div class="pa-vazio">
                Nenhum produto encontrado.
              </div>
            `
        }
      </div>
    `;

    el("paBuscaProdutos")
      ?.addEventListener(
        "input",
        evento => {
          busca =
            evento.target.value
              .trim()
              .toLowerCase();

          renderizarProdutos();
        }
      );

    el("paFiltroCategoria")
      ?.addEventListener(
        "change",
        evento => {
          categoriaFiltro =
            evento.target.value;

          renderizarProdutos();
        }
      );

    el("paNovoProduto")
      ?.addEventListener(
        "click",
        () => {
          abrirModalProduto(
            null
          );
        }
      );

    el("paTodosDisponiveis")
      ?.addEventListener(
        "click",
        () => {
          alterarTodosDisponiveis(
            true
          );
        }
      );

    el("paTodosEsgotados")
      ?.addEventListener(
        "click",
        () => {
          alterarTodosDisponiveis(
            false
          );
        }
      );

    body
      .querySelectorAll(
        "[data-pa-editar]"
      )
      .forEach(
        botao => {
          botao.addEventListener(
            "click",
            () => {
              const produto =
                produtos.find(
                  item =>
                    item.produto_id ===
                    botao.dataset.paEditar
                );

              abrirModalProduto(
                produto
              );
            }
          );
        }
      );

    body
      .querySelectorAll(
        "[data-pa-toggle-stock]"
      )
      .forEach(
        botao => {
          botao.addEventListener(
            "click",
            () => {
              const produto =
                produtos.find(
                  item =>
                    item.produto_id ===
                    botao.dataset
                      .paToggleStock
                );

              if (!produto) {
                return;
              }

              alterarProdutoRapido(
                produto.produto_id,
                {
                  disponivel:
                    produto
                      .disponivel ===
                      false
                }
              );
            }
          );
        }
      );

    body
      .querySelectorAll(
        "[data-pa-toggle-ativo]"
      )
      .forEach(
        botao => {
          botao.addEventListener(
            "click",
            () => {
              const produto =
                produtos.find(
                  item =>
                    item.produto_id ===
                    botao.dataset
                      .paToggleAtivo
                );

              if (!produto) {
                return;
              }

              alterarProdutoRapido(
                produto.produto_id,
                {
                  ativo:
                    produto.ativo ===
                      false
                }
              );
            }
          );
        }
      );
  }

  function renderProdutoLinha(
    produto
  ) {
    const categoria =
      categorias.find(
        item =>
          item.slug ===
          produto.categoria
      );

    const imagem =
      produto.imagem_url ||
      "https://placehold.co/300x300/222/fff?text=Produto";

    const disponivel =
      produto.disponivel !==
      false;

    const ativo =
      produto.ativo !==
      false;

    return `
      <article class="pa-produto">
        <img
          src="${escaparHtml(
            imagem
          )}"
          alt="${escaparHtml(
            produto.nome
          )}"
          onerror="this.onerror=null;this.src='https://placehold.co/300x300/222/fff?text=Produto';"
        >

        <div>
          <h3>
            ${escaparHtml(
              produto.nome
            )}
          </h3>

          <p>
            ${escaparHtml(
              produto.descricao ||
              "Sem descrição"
            )}
          </p>

          <strong>
            ${moeda(
              produto.preco
            )}
          </strong>

          <div class="pa-tags">
            <span class="pa-tag">
              ${escaparHtml(
                categoria?.emoji ||
                "🍽️"
              )}
              ${escaparHtml(
                categoria?.nome ||
                produto.categoria ||
                "Sem categoria"
              )}
            </span>

            <span
              class="pa-tag ${
                disponivel
                  ? "green"
                  : "red"
              }"
            >
              ${
                disponivel
                  ? "DISPONÍVEL"
                  : "ESGOTADO"
              }
            </span>

            <span
              class="pa-tag ${
                ativo
                  ? "green"
                  : "red"
              }"
            >
              ${
                ativo
                  ? "VISÍVEL"
                  : "OCULTO"
              }
            </span>

            ${
              produto.destaque
                ? `
                  <span class="pa-tag">
                    ⭐ DESTAQUE
                  </span>
                `
                : ""
            }
          </div>
        </div>

        <div class="pa-prod-acoes">
          <button
            class="pa-btn primary"
            data-pa-editar="${escaparHtml(
              produto.produto_id
            )}"
          >
            ✏️ EDITAR
          </button>

          <button
            class="pa-btn ${
              disponivel
                ? "red"
                : "green"
            }"
            data-pa-toggle-stock="${escaparHtml(
              produto.produto_id
            )}"
          >
            ${
              disponivel
                ? "ESGOTAR"
                : "DISPONÍVEL"
            }
          </button>

          <button
            class="pa-btn dark"
            data-pa-toggle-ativo="${escaparHtml(
              produto.produto_id
            )}"
          >
            ${
              ativo
                ? "OCULTAR"
                : "MOSTRAR"
            }
          </button>
        </div>
      </article>
    `;
  }

  function criarModal() {
    let modal =
      el("paProdutoModal");

    if (modal) {
      return modal;
    }

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "paProdutoModal";

    modal.className =
      "pa-modal";

    document.body.appendChild(
      modal
    );

    return modal;
  }

  function abrirModalProduto(
    produto
  ) {
    const modal =
      criarModal();

    const novo =
      !produto;

    modal.innerHTML = `
      <div class="pa-modal-card">
        <div class="pa-modal-head">
          <div>
            <h3>
              ${
                novo
                  ? "➕ Novo produto"
                  : "✏️ Editar produto"
              }
            </h3>
          </div>

          <button
            class="pa-close"
            id="paFecharModal"
          >
            ✕
          </button>
        </div>

        <div class="pa-form-grid">
          <label class="pa-field">
            <span>
              Nome do produto
            </span>
            <input
              id="paProdNome"
              class="pa-input"
              value="${escaparHtml(
                produto?.nome || ""
              )}"
              placeholder="Ex: X-Salada"
            >
          </label>

          <label class="pa-field">
            <span>
              Preço
            </span>
            <input
              id="paProdPreco"
              class="pa-input"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              value="${
                produto
                  ? Number(
                      produto.preco || 0
                    ).toFixed(2)
                  : ""
              }"
              placeholder="0.00"
            >
          </label>

          <label class="pa-field">
            <span>
              Categoria
            </span>
            <select
              id="paProdCategoria"
              class="pa-select"
            >
              ${categorias
                .map(
                  categoria => `
                    <option
                      value="${escaparHtml(
                        categoria.slug
                      )}"
                      ${
                        produto?.categoria ===
                          categoria.slug
                          ? "selected"
                          : ""
                      }
                    >
                      ${escaparHtml(
                        categoria.emoji
                      )}
                      ${escaparHtml(
                        categoria.nome
                      )}
                    </option>
                  `
                )
                .join("")}
            </select>
          </label>

          <label class="pa-field">
            <span>
              Ordem de exibição
            </span>
            <input
              id="paProdOrdem"
              class="pa-input"
              type="number"
              step="1"
              value="${Number(
                produto?.ordem || 0
              )}"
            >
          </label>

          <label class="pa-field full">
            <span>
              Descrição
            </span>
            <textarea
              id="paProdDescricao"
              class="pa-textarea"
              placeholder="Ingredientes / descrição..."
            >${escaparHtml(
              produto?.descricao || ""
            )}</textarea>
          </label>

          <label class="pa-field full">
            <span>
              URL da imagem
            </span>
            <input
              id="paProdImagemUrl"
              class="pa-input"
              value="${escaparHtml(
                produto?.imagem_url || ""
              )}"
              placeholder="https://..."
            >
          </label>

          <label class="pa-field full">
            <span>
              Ou enviar foto do celular
            </span>
            <input
              id="paProdArquivo"
              class="pa-input"
              type="file"
              accept="image/*"
            >
          </label>

          <div class="pa-field full">
            <span>
              Pré-visualização
            </span>

            <img
              id="paProdPreview"
              class="pa-preview"
              src="${escaparHtml(
                produto?.imagem_url ||
                "https://placehold.co/800x500/222/fff?text=Produto"
              )}"
              alt="Prévia"
            >
          </div>

          <div class="pa-field full">
            <span>
              Opções
            </span>

            <div class="pa-checks">
              <label class="pa-check">
                <input
                  id="paProdDisponivel"
                  type="checkbox"
                  ${
                    produto?.disponivel !==
                      false
                      ? "checked"
                      : ""
                  }
                >
                Disponível
              </label>

              <label class="pa-check">
                <input
                  id="paProdAtivo"
                  type="checkbox"
                  ${
                    produto?.ativo !==
                      false
                      ? "checked"
                      : ""
                  }
                >
                Visível no site
              </label>

              <label class="pa-check">
                <input
                  id="paProdDestaque"
                  type="checkbox"
                  ${
                    produto?.destaque
                      ? "checked"
                      : ""
                  }
                >
                Produto em destaque
              </label>
            </div>
          </div>
        </div>

        <div
          id="paModalMensagem"
          class="pa-msg"
        ></div>

        <div class="pa-modal-actions">
          ${
            novo
              ? ""
              : `
                <button
                  class="pa-btn red"
                  id="paExcluirProduto"
                >
                  🗑️ EXCLUIR
                </button>
              `
          }

          <button
            class="pa-btn primary"
            id="paSalvarProduto"
          >
            💾 SALVAR
          </button>
        </div>
      </div>
    `;

    modal.classList.add(
      "open"
    );

    el("paFecharModal")
      ?.addEventListener(
        "click",
        fecharModal
      );

    modal.addEventListener(
      "click",
      evento => {
        if (
          evento.target ===
          modal
        ) {
          fecharModal();
        }
      },
      {
        once: true
      }
    );

    el("paProdImagemUrl")
      ?.addEventListener(
        "input",
        evento => {
          const valor =
            evento.target.value
              .trim();

          if (valor) {
            el(
              "paProdPreview"
            ).src =
              valor;
          }
        }
      );

    el("paProdArquivo")
      ?.addEventListener(
        "change",
        evento => {
          const arquivo =
            evento.target
              .files?.[0];

          if (!arquivo) {
            return;
          }

          el(
            "paProdPreview"
          ).src =
            URL.createObjectURL(
              arquivo
            );
        }
      );

    el("paSalvarProduto")
      ?.addEventListener(
        "click",
        () => {
          salvarProduto(
            produto
          );
        }
      );

    el("paExcluirProduto")
      ?.addEventListener(
        "click",
        () => {
          excluirProduto(
            produto
          );
        }
      );
  }

  function modalMensagem(
    texto,
    tipo = ""
  ) {
    const item =
      el("paModalMensagem");

    if (!item) {
      return;
    }

    item.textContent =
      texto;

    item.className =
      "pa-msg" +
      (
        tipo
          ? " " + tipo
          : ""
      );
  }

  function fecharModal() {
    el("paProdutoModal")
      ?.classList.remove(
        "open"
      );
  }

  async function uploadImagem(
    arquivo,
    produtoId
  ) {
    if (!arquivo) {
      return null;
    }

    if (
      !arquivo.type
        .startsWith(
          "image/"
        )
    ) {
      throw new Error(
        "Escolha um arquivo de imagem."
      );
    }

    const ext =
      arquivo.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const caminho =
      `${produtoId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

    const {
      error
    } =
      await client.storage
        .from("produtos")
        .upload(
          caminho,
          arquivo,
          {
            cacheControl: "3600",
            upsert: false
          }
        );

    if (error) {
      throw error;
    }

    const {
      data
    } =
      client.storage
        .from("produtos")
        .getPublicUrl(
          caminho
        );

    return (
      data?.publicUrl ||
      null
    );
  }

  async function salvarProduto(
    existente
  ) {
    const nome =
      el("paProdNome")
        ?.value
        .trim();

    const preco =
      Number(
        el("paProdPreco")
          ?.value
      );

    const descricao =
      el("paProdDescricao")
        ?.value
        .trim() || "";

    const categoria =
      el("paProdCategoria")
        ?.value;

    const ordem =
      Number(
        el("paProdOrdem")
          ?.value || 0
      );

    let imagemUrl =
      el("paProdImagemUrl")
        ?.value
        .trim() || "";

    const arquivo =
      el("paProdArquivo")
        ?.files?.[0];

    const disponivel =
      el("paProdDisponivel")
        ?.checked !== false;

    const ativo =
      el("paProdAtivo")
        ?.checked !== false;

    const destaque =
      el("paProdDestaque")
        ?.checked === true;

    if (!nome) {
      modalMensagem(
        "❌ Digite o nome do produto.",
        "erro"
      );

      return;
    }

    if (
      !Number.isFinite(
        preco
      ) ||
      preco < 0
    ) {
      modalMensagem(
        "❌ Digite um preço válido.",
        "erro"
      );

      return;
    }

    if (!categoria) {
      modalMensagem(
        "❌ Selecione a categoria.",
        "erro"
      );

      return;
    }

    const botao =
      el("paSalvarProduto");

    if (botao) {
      botao.disabled =
        true;
    }

    try {
      await usuarioAtual();

      let produtoId =
        existente?.produto_id;

      if (!produtoId) {
        const baseId =
          slug(nome) ||
          "produto";

        produtoId =
          `${baseId}-${Date.now()
            .toString(36)}`;
      }

      if (arquivo) {
        modalMensagem(
          "Enviando foto..."
        );

        const novaUrl =
          await uploadImagem(
            arquivo,
            produtoId
          );

        if (novaUrl) {
          imagemUrl =
            novaUrl;
        }
      }

      modalMensagem(
        "Salvando produto..."
      );

      const payload = {
        produto_id:
          produtoId,
        nome,
        preco,
        descricao,
        categoria,
        imagem_url:
          imagemUrl,
        disponivel,
        ativo,
        destaque,
        ordem:
          Number.isFinite(
            ordem
          )
            ? ordem
            : 0,
        atualizado_em:
          new Date()
            .toISOString()
      };

      let resposta;

      if (existente) {
        resposta =
          await client
            .from(
              "produtos_estoque"
            )
            .update(
              payload
            )
            .eq(
              "produto_id",
              existente
                .produto_id
            );
      }
      else {
        resposta =
          await client
            .from(
              "produtos_estoque"
            )
            .insert(
              payload
            );
      }

      if (
        resposta.error
      ) {
        throw resposta.error;
      }

      modalMensagem(
        "✅ Produto salvo.",
        "ok"
      );

      await carregarDados();

      setTimeout(
        fecharModal,
        450
      );
    }
    catch (erro) {
      console.error(
        "[Painel Total] salvar produto:",
        erro
      );

      modalMensagem(
        "❌ " +
        (
          erro?.message ||
          "Não foi possível salvar."
        ),
        "erro"
      );
    }
    finally {
      if (botao) {
        botao.disabled =
          false;
      }
    }
  }

  async function excluirProduto(
    produto
  ) {
    if (!produto) {
      return;
    }

    const confirmou =
      confirm(
        `Excluir definitivamente "${produto.nome}" do cardápio?`
      );

    if (!confirmou) {
      return;
    }

    try {
      await usuarioAtual();

      const {
        error
      } =
        await client
          .from(
            "produtos_estoque"
          )
          .delete()
          .eq(
            "produto_id",
            produto.produto_id
          );

      if (error) {
        throw error;
      }

      fecharModal();
      await carregarDados();

      mensagem(
        "✅ Produto excluído.",
        "ok"
      );
    }
    catch (erro) {
      modalMensagem(
        "❌ " +
        (
          erro?.message ||
          "Não foi possível excluir."
        ),
        "erro"
      );
    }
  }

  async function alterarProdutoRapido(
    produtoId,
    campos
  ) {
    try {
      await usuarioAtual();

      const {
        error
      } =
        await client
          .from(
            "produtos_estoque"
          )
          .update({
            ...campos,
            atualizado_em:
              new Date()
                .toISOString()
          })
          .eq(
            "produto_id",
            produtoId
          );

      if (error) {
        throw error;
      }

      await carregarDados();

      mensagem(
        "✅ Alteração salva.",
        "ok"
      );
    }
    catch (erro) {
      mensagem(
        "❌ " +
        (
          erro?.message ||
          "Não foi possível alterar."
        ),
        "erro"
      );
    }
  }

  async function alterarTodosDisponiveis(
    disponivel
  ) {
    const confirmou =
      confirm(
        disponivel
          ? "Marcar TODOS os produtos visíveis como disponíveis?"
          : "Marcar TODOS os produtos visíveis como esgotados?"
      );

    if (!confirmou) {
      return;
    }

    mensagem(
      "Atualizando todos os produtos..."
    );

    try {
      await usuarioAtual();

      const {
        error
      } =
        await client
          .from(
            "produtos_estoque"
          )
          .update({
            disponivel,
            atualizado_em:
              new Date()
                .toISOString()
          })
          .eq(
            "ativo",
            true
          );

      if (error) {
        throw error;
      }

      await carregarDados();

      mensagem(
        disponivel
          ? "✅ Todos disponíveis."
          : "✅ Todos esgotados.",
        "ok"
      );
    }
    catch (erro) {
      mensagem(
        "❌ " +
        (
          erro?.message ||
          "Falha na atualização."
        ),
        "erro"
      );
    }
  }

  function renderizarCategorias() {
    const body =
      el("paTotalBody");

    if (!body) {
      return;
    }

    body.innerHTML = `
      <div class="pa-toolbar">
        <div></div>
        <div></div>

        <button
          class="pa-btn primary"
          id="paNovaCategoria"
        >
          + NOVA CATEGORIA
        </button>
      </div>

      <div
        id="paTotalMensagem"
        class="pa-msg"
      ></div>

      <div class="pa-lista">
        ${
          categorias.length
            ? categorias
                .map(
                  categoria => `
                    <article class="pa-categoria">
                      <div class="pa-categoria-emoji">
                        ${escaparHtml(
                          categoria.emoji ||
                          "🍽️"
                        )}
                      </div>

                      <div>
                        <h3>
                          ${escaparHtml(
                            categoria.nome
                          )}
                        </h3>

                        <small>
                          ${escaparHtml(
                            categoria.slug
                          )}
                          • ordem
                          ${Number(
                            categoria.ordem || 0
                          )}
                          •
                          ${
                            categoria.ativo !==
                              false
                              ? "visível"
                              : "oculta"
                          }
                        </small>
                      </div>

                      <button
                        class="pa-btn primary"
                        data-pa-cat-edit="${escaparHtml(
                          categoria.slug
                        )}"
                      >
                        EDITAR
                      </button>
                    </article>
                  `
                )
                .join("")
            : `
              <div class="pa-vazio">
                Nenhuma categoria.
              </div>
            `
        }
      </div>
    `;

    el("paNovaCategoria")
      ?.addEventListener(
        "click",
        () => {
          abrirModalCategoria(
            null
          );
        }
      );

    body
      .querySelectorAll(
        "[data-pa-cat-edit]"
      )
      .forEach(
        botao => {
          botao.addEventListener(
            "click",
            () => {
              const categoria =
                categorias.find(
                  item =>
                    item.slug ===
                    botao.dataset
                      .paCatEdit
                );

              abrirModalCategoria(
                categoria
              );
            }
          );
        }
      );
  }

  function abrirModalCategoria(
    categoria
  ) {
    const modal =
      criarModal();

    const novo =
      !categoria;

    modal.innerHTML = `
      <div class="pa-modal-card">
        <div class="pa-modal-head">
          <h3>
            ${
              novo
                ? "➕ Nova categoria"
                : "✏️ Editar categoria"
            }
          </h3>

          <button
            class="pa-close"
            id="paFecharModal"
          >
            ✕
          </button>
        </div>

        <div class="pa-form-grid">
          <label class="pa-field">
            <span>Nome</span>
            <input
              id="paCatNome"
              class="pa-input"
              value="${escaparHtml(
                categoria?.nome || ""
              )}"
              placeholder="Ex: Sobremesas"
            >
          </label>

          <label class="pa-field">
            <span>Emoji</span>
            <input
              id="paCatEmoji"
              class="pa-input"
              value="${escaparHtml(
                categoria?.emoji || "🍽️"
              )}"
              placeholder="🍰"
            >
          </label>

          <label class="pa-field">
            <span>Ordem</span>
            <input
              id="paCatOrdem"
              class="pa-input"
              type="number"
              value="${Number(
                categoria?.ordem || 0
              )}"
            >
          </label>

          <label class="pa-check">
            <input
              id="paCatAtivo"
              type="checkbox"
              ${
                categoria?.ativo !==
                  false
                  ? "checked"
                  : ""
              }
            >
            Categoria visível
          </label>
        </div>

        <div
          id="paModalMensagem"
          class="pa-msg"
        ></div>

        <div class="pa-modal-actions">
          ${
            novo
              ? ""
              : `
                <button
                  class="pa-btn red"
                  id="paExcluirCategoria"
                >
                  🗑️ EXCLUIR
                </button>
              `
          }

          <button
            class="pa-btn primary"
            id="paSalvarCategoria"
          >
            💾 SALVAR
          </button>
        </div>
      </div>
    `;

    modal.classList.add(
      "open"
    );

    el("paFecharModal")
      ?.addEventListener(
        "click",
        fecharModal
      );

    el("paSalvarCategoria")
      ?.addEventListener(
        "click",
        () => {
          salvarCategoria(
            categoria
          );
        }
      );

    el("paExcluirCategoria")
      ?.addEventListener(
        "click",
        () => {
          excluirCategoria(
            categoria
          );
        }
      );
  }

  async function salvarCategoria(
    existente
  ) {
    const nome =
      el("paCatNome")
        ?.value
        .trim();

    const emoji =
      el("paCatEmoji")
        ?.value
        .trim() ||
      "🍽️";

    const ordem =
      Number(
        el("paCatOrdem")
          ?.value || 0
      );

    const ativo =
      el("paCatAtivo")
        ?.checked !== false;

    if (!nome) {
      modalMensagem(
        "❌ Digite o nome da categoria.",
        "erro"
      );

      return;
    }

    try {
      await usuarioAtual();

      const categoriaSlug =
        existente?.slug ||
        slug(nome);

      if (!categoriaSlug) {
        throw new Error(
          "Nome de categoria inválido."
        );
      }

      const payload = {
        slug:
          categoriaSlug,
        nome,
        emoji,
        ordem:
          Number.isFinite(ordem)
            ? ordem
            : 0,
        ativo,
        atualizado_em:
          new Date()
            .toISOString()
      };

      let resposta;

      if (existente) {
        resposta =
          await client
            .from(
              "categorias_cardapio"
            )
            .update(
              payload
            )
            .eq(
              "slug",
              existente.slug
            );
      }
      else {
        resposta =
          await client
            .from(
              "categorias_cardapio"
            )
            .insert(
              payload
            );
      }

      if (
        resposta.error
      ) {
        throw resposta.error;
      }

      await carregarDados();
      fecharModal();

      mensagem(
        "✅ Categoria salva.",
        "ok"
      );
    }
    catch (erro) {
      modalMensagem(
        "❌ " +
        (
          erro?.message ||
          "Não foi possível salvar."
        ),
        "erro"
      );
    }
  }

  async function excluirCategoria(
    categoria
  ) {
    if (!categoria) {
      return;
    }

    const usados =
      produtos.filter(
        produto =>
          produto.categoria ===
          categoria.slug
      );

    if (usados.length) {
      alert(
        `Essa categoria possui ${usados.length} produto(s). Mova os produtos para outra categoria antes de excluir.`
      );

      return;
    }

    if (
      !confirm(
        `Excluir a categoria "${categoria.nome}"?`
      )
    ) {
      return;
    }

    try {
      await usuarioAtual();

      const {
        error
      } =
        await client
          .from(
            "categorias_cardapio"
          )
          .delete()
          .eq(
            "slug",
            categoria.slug
          );

      if (error) {
        throw error;
      }

      fecharModal();
      await carregarDados();

      mensagem(
        "✅ Categoria excluída.",
        "ok"
      );
    }
    catch (erro) {
      modalMensagem(
        "❌ " +
        (
          erro?.message ||
          "Não foi possível excluir."
        ),
        "erro"
      );
    }
  }

  function renderizarConfig() {
    const body =
      el("paTotalBody");

    if (
      !body ||
      !config
    ) {
      return;
    }

    const dias =
      Array.isArray(
        config.dias_abertos
      )
        ? config.dias_abertos
          .map(Number)
        : [];

    const nomesDias = [
      ["0", "Domingo"],
      ["1", "Segunda"],
      ["2", "Terça"],
      ["3", "Quarta"],
      ["4", "Quinta"],
      ["5", "Sexta"],
      ["6", "Sábado"]
    ];

    body.innerHTML = `
      <div class="pa-form-grid">
        <label class="pa-field full">
          <span>
            WhatsApp dos pedidos
          </span>
          <input
            id="paCfgWhatsapp"
            class="pa-input"
            value="${escaparHtml(
              config.whatsapp || ""
            )}"
            placeholder="5587999999999"
          >
        </label>

        <label class="pa-field">
          <span>
            Horário de abertura
          </span>
          <input
            id="paCfgAbertura"
            class="pa-input"
            type="time"
            value="${escaparHtml(
              String(
                config.hora_abertura ||
                "18:00"
              ).slice(0,5)
            )}"
          >
        </label>

        <label class="pa-field">
          <span>
            Horário de fechamento
          </span>
          <input
            id="paCfgFechamento"
            class="pa-input"
            type="time"
            value="${escaparHtml(
              String(
                config.hora_fechamento ||
                "22:00"
              ).slice(0,5)
            )}"
          >
        </label>

        <div class="pa-field full">
          <span>
            Dias de funcionamento automático
          </span>

          <div class="pa-dias">
            ${nomesDias
              .map(
                ([numero, nome]) => `
                  <label class="pa-dia">
                    <input
                      type="checkbox"
                      data-pa-dia="${numero}"
                      ${
                        dias.includes(
                          Number(numero)
                        )
                          ? "checked"
                          : ""
                      }
                    >
                    ${nome}
                  </label>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="pa-field full" style="padding:12px;border:1px solid #303030;border-radius:12px;color:#aaa;background:#151515">
          As taxas de entrega agora ficam em <b style="color:#fff">Controle Total do Site → Entrega</b>, onde você pode criar quantas regiões quiser.
        </div>
      </div>

      <div
        id="paTotalMensagem"
        class="pa-msg"
      ></div>

      <button
        id="paSalvarConfig"
        class="pa-btn primary"
        style="width:100%;margin-top:10px"
      >
        💾 SALVAR CONFIGURAÇÕES
      </button>
    `;

    el("paSalvarConfig")
      ?.addEventListener(
        "click",
        salvarConfig
      );
  }

  async function salvarConfig() {
    const dias =
      Array
        .from(
          document.querySelectorAll(
            "[data-pa-dia]:checked"
          )
        )
        .map(
          item =>
            Number(
              item.dataset.paDia
            )
        );

    const whatsapp =
      el("paCfgWhatsapp")
        ?.value
        .trim() || "";

    const abertura =
      el("paCfgAbertura")
        ?.value;

    const fechamento =
      el("paCfgFechamento")
        ?.value;

    if (
      !abertura ||
      !fechamento
    ) {
      mensagem(
        "❌ Informe abertura e fechamento.",
        "erro"
      );

      return;
    }

    if (!dias.length) {
      mensagem(
        "❌ Selecione pelo menos um dia.",
        "erro"
      );

      return;
    }

    try {
      await usuarioAtual();

      const {
        error
      } =
        await client
          .from(
            "config_cardapio"
          )
          .update({
            whatsapp,
            hora_abertura:
              abertura,
            hora_fechamento:
              fechamento,
            dias_abertos:
              dias,
            atualizado_em:
              new Date()
                .toISOString()
          })
          .eq(
            "id",
            1
          );

      if (error) {
        throw error;
      }

      await carregarDados();

      mensagem(
        "✅ Configurações salvas.",
        "ok"
      );
    }
    catch (erro) {
      mensagem(
        "❌ " +
        (
          erro?.message ||
          "Não foi possível salvar."
        ),
        "erro"
      );
    }
  }

  function iniciarRealtime() {
    client
      .channel(
        "painel-total-admin"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "produtos_estoque"
        },
        () => {
          carregarDados();
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
          carregarDados();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "config_cardapio"
        },
        () => {
          carregarDados();
        }
      )
      .subscribe();
  }

  async function iniciar() {
    estilos();

    if (!criarPainel()) {
      let tentativas =
        0;

      const timer =
        setInterval(
          async () => {
            tentativas++;

            if (
              criarPainel() ||
              tentativas >= 30
            ) {
              clearInterval(
                timer
              );

              if (
                el(
                  "painelCardapioTotal"
                )
              ) {
                await carregarDados();
              }
            }
          },
          300
        );
    }
    else {
      await carregarDados();
    }

    iniciarRealtime();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      iniciar
    );
  }
  else {
    iniciar();
  }
})();
/* ============================================================
   CANTINHO PIZZA BURGUER — CONTROLE TOTAL DO SITE
   Complementa o painel existente sem remover estoque/status.
============================================================ */
(() => {
  "use strict";

  const cfg = window.SUPABASE_CONFIG || window.supabaseConfig || {};
  const URL = cfg.url || window.SUPABASE_URL;
  const KEY = cfg.key || cfg.anonKey || window.SUPABASE_ANON_KEY || window.SUPABASE_PUBLISHABLE_KEY;
  if (!window.supabase || !URL || !KEY) {
    console.error("[Controle Total do Site] Supabase não configurado.");
    return;
  }

  const sb = window.supabase.createClient(URL, KEY);
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const val = (id) => $("#"+id)?.value?.trim() ?? "";
  const checked = (id) => !!$("#"+id)?.checked;
  const num = (id) => Number($("#"+id)?.value || 0);
  const slug = (v) => String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");

  let site = null;
  let avisos = [];
  let regioes = [];
  let pagamentos = [];
  let aba = "conteudo";
  let channel = null;

  async function sessao() {
    const {data,error} = await sb.auth.getSession();
    if (error) throw error;
    if (!data?.session?.user) throw new Error("Sua sessão expirou. Entre novamente no painel.");
    return data.session;
  }

  function toast(texto, tipo="ok") {
    let n = $("#pstToast");
    if (!n) {
      n = document.createElement("div");
      n.id = "pstToast";
      document.body.appendChild(n);
    }
    n.textContent = texto;
    n.className = `pst-toast show ${tipo}`;
    clearTimeout(window.__pstToast);
    window.__pstToast = setTimeout(() => n.classList.remove("show"), 3300);
  }

  function estilos() {
    if ($("#pstStyles")) return;
    const st = document.createElement("style");
    st.id = "pstStyles";
    st.textContent = `
      #painelSiteTotal{margin:22px 0;border:1px solid #2b2b2b;border-radius:22px;overflow:hidden;background:#0e0e0f;color:#fff;box-shadow:0 20px 55px rgba(0,0,0,.24)}
      #painelSiteTotal *{box-sizing:border-box} .pst-head{padding:22px;background:linear-gradient(135deg,#171717,#101010);border-bottom:1px solid #292929}.pst-head h2{margin:0 0 6px;font-size:24px}.pst-head p{margin:0;color:#aaa;line-height:1.5}
      .pst-tabs{display:flex;gap:7px;overflow:auto;padding:11px;background:#090909;border-bottom:1px solid #252525;scrollbar-width:none}.pst-tab{flex:0 0 auto;border:1px solid #303030;background:#151515;color:#cfcfcf;border-radius:12px;padding:11px 13px;font-weight:900;cursor:pointer}.pst-tab.active{background:#ea1d2c;border-color:#ea1d2c;color:#fff}
      .pst-body{padding:18px}.pst-form,.pst-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.pst-field{display:grid;gap:7px}.pst-field.full{grid-column:1/-1}.pst-field>span,.pst-label{font-size:12px;font-weight:900;color:#bdbdbd;text-transform:uppercase;letter-spacing:.04em}.pst-input,.pst-select,.pst-textarea{width:100%;border:1px solid #333;background:#151515;color:#fff;border-radius:12px;padding:12px 13px;font:inherit;outline:none}.pst-textarea{min-height:92px;resize:vertical}.pst-input:focus,.pst-select:focus,.pst-textarea:focus{border-color:#ea1d2c}.pst-check{display:flex;gap:10px;align-items:center;padding:12px 13px;border:1px solid #303030;border-radius:12px;background:#141414;color:#e6e6e6}.pst-check input{width:19px;height:19px;accent-color:#ea1d2c}
      .pst-actions{grid-column:1/-1;display:flex;gap:9px;flex-wrap:wrap;margin-top:4px}.pst-btn{border:0;border-radius:12px;padding:12px 15px;font-weight:900;cursor:pointer;background:#272727;color:#fff}.pst-btn.primary{background:#ea1d2c}.pst-btn.green{background:#168341}.pst-btn.danger{background:#9f2028}.pst-btn.ghost{border:1px solid #343434;background:#141414}.pst-btn:disabled{opacity:.55;cursor:not-allowed}
      .pst-card{border:1px solid #2c2c2c;border-radius:17px;padding:15px;background:#131313}.pst-card h3{margin:0 0 11px;font-size:17px}.pst-card small{color:#999}.pst-list{display:grid;gap:12px}.pst-rowform{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;align-items:end}.pst-rowform .wide{grid-column:span 2}.pst-rowform .full{grid-column:1/-1}.pst-row-actions{display:flex;gap:7px;flex-wrap:wrap;grid-column:1/-1}
      .pst-preview{width:100%;overflow:hidden;border:1px solid #303030;border-radius:16px;background:#080808;min-height:130px;display:grid;place-items:center}.pst-preview img{display:block;width:100%;height:auto;max-height:360px;object-fit:contain}.pst-preview.logo img{width:120px;height:120px;object-fit:cover;border-radius:20px}.pst-help{padding:12px 14px;border-radius:13px;background:#161616;border:1px solid #292929;color:#aaa;font-size:13px;line-height:1.55}.pst-section-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 13px}.pst-section-title h3{margin:0}.pst-badge{display:inline-block;padding:5px 8px;border-radius:999px;background:#242424;font-size:11px;font-weight:900;color:#ddd}.pst-empty{padding:22px;text-align:center;color:#888;border:1px dashed #333;border-radius:14px}.pst-color{height:48px;padding:4px}
      .pst-toast{position:fixed;z-index:999999;left:50%;bottom:24px;transform:translate(-50%,25px);opacity:0;pointer-events:none;background:#1c1c1c;color:#fff;border:1px solid #343434;border-radius:13px;padding:13px 17px;font-weight:900;transition:.2s;max-width:min(90vw,560px);text-align:center}.pst-toast.show{opacity:1;transform:translate(-50%,0)}.pst-toast.erro{background:#3b1216;border-color:#7d1d25}.pst-toast.ok{background:#102c1b;border-color:#1d6b3b}
      @media(max-width:760px){.pst-form,.pst-grid{grid-template-columns:1fr}.pst-field.full{grid-column:auto}.pst-rowform{grid-template-columns:1fr 1fr}.pst-rowform .wide,.pst-rowform .full{grid-column:1/-1}.pst-body{padding:13px}.pst-head{padding:18px}.pst-head h2{font-size:21px}}
    `;
    document.head.appendChild(st);
  }

  function acharDashboard() {
    return $("#dashboard") || $(".dashboard") || $("main") || document.body;
  }

  function criarPainel() {
    if ($("#painelSiteTotal")) return true;
    const dash = acharDashboard();
    if (!dash) return false;
    const sec = document.createElement("section");
    sec.id = "painelSiteTotal";
    sec.innerHTML = `
      <div class="pst-head"><h2>🎛️ Controle Total do Site</h2><p>Altere capa, textos, avisos, entrega, pagamentos, aparência e recursos sem editar o GitHub.</p></div>
      <div class="pst-tabs">
        <button class="pst-tab active" data-pst-tab="conteudo">🏠 Conteúdo</button>
        <button class="pst-tab" data-pst-tab="aparencia">🎨 Aparência</button>
        <button class="pst-tab" data-pst-tab="avisos">📢 Avisos</button>
        <button class="pst-tab" data-pst-tab="entrega">🛵 Entrega</button>
        <button class="pst-tab" data-pst-tab="pagamentos">💳 Pagamentos</button>
        <button class="pst-tab" data-pst-tab="recursos">⚙️ Recursos</button>
      </div>
      <div class="pst-body" id="pstBody"><div class="pst-empty">Carregando configurações...</div></div>`;
    const cardapio = $("#painelCardapioTotal");
    if (cardapio?.parentElement === dash) cardapio.insertAdjacentElement("afterend", sec);
    else dash.appendChild(sec);
    sec.addEventListener("click", e => {
      const b = e.target.closest("[data-pst-tab]");
      if (!b) return;
      aba = b.dataset.pstTab;
      $$(".pst-tab",sec).forEach(x=>x.classList.toggle("active",x===b));
      render();
    });
    sec.addEventListener("submit", tratarSubmit);
    sec.addEventListener("click", tratarClique);
    sec.addEventListener("change", tratarChange);
    return true;
  }

  async function carregar() {
    try {
      await sessao();
      const [s,a,r,p] = await Promise.all([
        sb.from("site_config").select("*").eq("id",1).single(),
        sb.from("avisos_site").select("*").order("ordem",{ascending:true}).order("id",{ascending:false}),
        sb.from("regioes_entrega").select("*").order("ordem",{ascending:true}),
        sb.from("formas_pagamento").select("*").order("ordem",{ascending:true})
      ]);
      if (s.error) throw s.error;
      site = s.data;
      avisos = a.error ? [] : (a.data||[]);
      regioes = r.error ? [] : (r.data||[]);
      pagamentos = p.error ? [] : (p.data||[]);
      render();
    } catch(err) {
      console.error(err);
      const body = $("#pstBody");
      if (body) body.innerHTML = `<div class="pst-empty">⚠️ ${esc(err.message||"Não foi possível carregar o controle total. Rode o SQL do pacote no Supabase.")}</div>`;
    }
  }

  async function salvarSite(patch, msg="Alterações salvas.") {
    await sessao();
    patch.atualizado_em = new Date().toISOString();
    const {data,error} = await sb.from("site_config").update(patch).eq("id",1).select().single();
    if (error) throw error;
    site = data;
    toast("✅ "+msg);
    return data;
  }

  async function upload(file,pasta) {
    if (!file) return "";
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use uma imagem JPG, PNG ou WEBP.");
    if (file.size > 8*1024*1024) throw new Error("A imagem deve ter no máximo 8 MB.");
    await sessao();
    const ext = (file.name.split(".").pop()||"webp").replace(/[^a-z0-9]/gi,"").toLowerCase();
    const path = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const {error} = await sb.storage.from("site-assets").upload(path,file,{cacheControl:"3600",upsert:false});
    if (error) throw error;
    return sb.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
  }

  function render() {
    const body = $("#pstBody");
    if (!body || !site) return;
    if (aba === "conteudo") body.innerHTML = renderConteudo();
    else if (aba === "aparencia") body.innerHTML = renderAparencia();
    else if (aba === "avisos") body.innerHTML = renderAvisos();
    else if (aba === "entrega") body.innerHTML = renderEntrega();
    else if (aba === "pagamentos") body.innerHTML = renderPagamentos();
    else body.innerHTML = renderRecursos();
  }

  function renderConteudo() {
    return `<form class="pst-form" data-pst-form="conteudo">
      <label class="pst-field"><span>Nome da loja</span><input class="pst-input" id="pstNome" value="${esc(site.nome_loja)}"></label>
      <label class="pst-field"><span>Subtítulo da marca</span><input class="pst-input" id="pstSubtitulo" value="${esc(site.subtitulo_marca)}"></label>
      <label class="pst-field full"><span>Resumo do cardápio</span><input class="pst-input" id="pstResumo" value="${esc(site.resumo_cardapio)}"></label>
      <label class="pst-field"><span>Selo do topo</span><input class="pst-input" id="pstHeroSelo" value="${esc(site.hero_selo)}"></label>
      <label class="pst-field"><span>Título do topo</span><input class="pst-input" id="pstHeroTitulo" value="${esc(site.hero_titulo)}"></label>
      <label class="pst-field full"><span>Texto do topo</span><textarea class="pst-textarea" id="pstHeroTexto">${esc(site.hero_texto)}</textarea></label>
      <label class="pst-field"><span>Texto do botão do topo</span><input class="pst-input" id="pstHeroBotao" value="${esc(site.hero_botao_texto)}"></label>
      <label class="pst-field"><span>Pedido mínimo (R$)</span><input class="pst-input" id="pstMinimo" type="number" min="0" step="0.01" value="${Number(site.pedido_minimo||0).toFixed(2)}"></label>
      <label class="pst-field"><span>Telefone exibido</span><input class="pst-input" id="pstTelefone" value="${esc(site.telefone_exibicao)}" placeholder="(87) 99999-9999"></label>
      <label class="pst-field"><span>Instagram (URL)</span><input class="pst-input" id="pstInstagram" value="${esc(site.instagram_url)}" placeholder="https://instagram.com/..."></label>
      <label class="pst-field full"><span>Endereço / informação da loja</span><input class="pst-input" id="pstEndereco" value="${esc(site.endereco_loja)}"></label>
      <label class="pst-field full"><span>Texto do rodapé</span><input class="pst-input" id="pstRodape" value="${esc(site.rodape_texto)}"></label>
      <div class="pst-actions"><button class="pst-btn primary" type="submit">💾 Salvar conteúdo</button></div>
    </form>`;
  }

  function renderAparencia() {
    const img = site.hero_imagem_url || "/assets/capa-cantinho.webp";
    return `<div class="pst-grid">
      <form class="pst-form pst-card" data-pst-form="capa">
        <div class="pst-field full"><span>Capa atual</span><div class="pst-preview"><img id="pstCapaPreview" src="${esc(img)}" alt="Capa"></div></div>
        <label class="pst-field full"><span>Enviar nova capa</span><input class="pst-input" id="pstCapaFile" type="file" accept="image/jpeg,image/png,image/webp"></label>
        <label class="pst-field full"><span>Ou URL da capa</span><input class="pst-input" id="pstCapaUrl" value="${esc(site.hero_imagem_url)}"></label>
        <label class="pst-check full"><input id="pstCapaCompleta" type="checkbox" ${site.hero_capa_completa!==false?"checked":""}> Usar a arte como capa completa, sem repetir os textos por cima</label>
        <div class="pst-actions"><button class="pst-btn primary" type="submit">🖼️ Salvar capa</button><button class="pst-btn ghost" type="button" data-pst-reset-capa>↺ Restaurar nova capa padrão</button></div>
      </form>
      <form class="pst-form pst-card" data-pst-form="visual">
        <label class="pst-field"><span>Cor principal</span><input class="pst-input pst-color" id="pstCor" type="color" value="${esc(site.cor_primaria||'#ea1d2c')}"></label>
        <label class="pst-field"><span>Logo por URL</span><input class="pst-input" id="pstLogoUrl" value="${esc(site.logo_url)}"></label>
        <label class="pst-field full"><span>Enviar nova logo</span><input class="pst-input" id="pstLogoFile" type="file" accept="image/jpeg,image/png,image/webp"></label>
        <div class="pst-field full"><span>Prévia da logo</span><div class="pst-preview logo">${site.logo_url?`<img id="pstLogoPreview" src="${esc(site.logo_url)}">`:`<div id="pstLogoPreview">🍕</div>`}</div></div>
        <div class="pst-actions"><button class="pst-btn primary" type="submit">🎨 Salvar aparência</button></div>
      </form>
    </div>`;
  }

  function renderAvisos() {
    const lista = avisos.length ? avisos.map(a => `<form class="pst-card pst-rowform" data-pst-form="aviso-editar" data-id="${a.id}">
      <label class="pst-field"><span>Tipo</span><select class="pst-select" name="tipo"><option value="faixa" ${a.tipo==='faixa'?'selected':''}>Faixa</option><option value="inicio" ${a.tipo==='inicio'?'selected':''}>Início</option><option value="popup" ${a.tipo==='popup'?'selected':''}>Popup</option></select></label>
      <label class="pst-field wide"><span>Título</span><input class="pst-input" name="titulo" value="${esc(a.titulo)}"></label>
      <label class="pst-field"><span>Ordem</span><input class="pst-input" name="ordem" type="number" value="${Number(a.ordem||0)}"></label>
      <label class="pst-check"><input name="ativo" type="checkbox" ${a.ativo!==false?'checked':''}> Ativo</label>
      <label class="pst-field full"><span>Mensagem</span><textarea class="pst-textarea" name="mensagem">${esc(a.mensagem)}</textarea></label>
      <label class="pst-field wide"><span>Texto do botão</span><input class="pst-input" name="botao_texto" value="${esc(a.botao_texto)}"></label>
      <label class="pst-field wide"><span>Link do botão</span><input class="pst-input" name="botao_url" value="${esc(a.botao_url)}"></label>
      <div class="pst-row-actions"><button class="pst-btn primary" type="submit">Salvar aviso</button><button class="pst-btn danger" type="button" data-pst-excluir-aviso="${a.id}">Excluir</button></div>
    </form>`).join("") : `<div class="pst-empty">Nenhum aviso cadastrado.</div>`;
    return `<div class="pst-section-title"><h3>📢 Avisos para clientes</h3><span class="pst-badge">Faixa • Início • Popup</span></div>
      <form class="pst-card pst-form" data-pst-form="aviso-novo">
        <label class="pst-field"><span>Tipo</span><select class="pst-select" id="pstNovoAvisoTipo"><option value="faixa">Faixa no topo</option><option value="inicio">Mensagem no início</option><option value="popup">Popup</option></select></label>
        <label class="pst-field"><span>Título</span><input class="pst-input" id="pstNovoAvisoTitulo" placeholder="Ex.: Aviso importante"></label>
        <label class="pst-field full"><span>Mensagem</span><textarea class="pst-textarea" id="pstNovoAvisoMensagem" required></textarea></label>
        <label class="pst-field"><span>Texto do botão (opcional)</span><input class="pst-input" id="pstNovoAvisoBotao"></label>
        <label class="pst-field"><span>Link do botão (opcional)</span><input class="pst-input" id="pstNovoAvisoLink"></label>
        <div class="pst-actions"><button class="pst-btn green" type="submit">＋ Criar aviso</button></div>
      </form><div style="height:14px"></div><div class="pst-list">${lista}</div>`;
  }

  function renderEntrega() {
    const lista = regioes.length ? regioes.map(r => `<form class="pst-card pst-rowform" data-pst-form="regiao" data-codigo="${esc(r.codigo)}">
      <label class="pst-field"><span>Código</span><input class="pst-input" name="codigo" value="${esc(r.codigo)}" disabled></label>
      <label class="pst-field wide"><span>Nome</span><input class="pst-input" name="nome" value="${esc(r.nome)}"></label>
      <label class="pst-field"><span>Taxa R$</span><input class="pst-input" name="taxa" type="number" min="0" step="0.01" value="${Number(r.taxa||0).toFixed(2)}"></label>
      <label class="pst-field"><span>Ordem</span><input class="pst-input" name="ordem" type="number" value="${Number(r.ordem||0)}"></label>
      <label class="pst-check"><input name="ativo" type="checkbox" ${r.ativo!==false?'checked':''}> Ativa</label>
      <div class="pst-row-actions"><button class="pst-btn primary" type="submit">Salvar</button><button class="pst-btn danger" type="button" data-pst-excluir-regiao="${esc(r.codigo)}">Excluir</button></div>
    </form>`).join("") : `<div class="pst-empty">Nenhuma região cadastrada.</div>`;
    return `<form class="pst-card pst-form" data-pst-form="entrega-recursos">
      <label class="pst-check"><input id="pstEntrega" type="checkbox" ${site.aceita_entrega!==false?'checked':''}> Aceitar entrega</label>
      <label class="pst-check"><input id="pstRetirada" type="checkbox" ${site.aceita_retirada!==false?'checked':''}> Aceitar retirada</label>
      <label class="pst-field full"><span>Texto de horário/tempo exibido</span><input class="pst-input" id="pstTempo" value="${esc(site.tempo_entrega_texto)}"></label>
      <div class="pst-actions"><button class="pst-btn primary" type="submit">Salvar opções</button></div>
    </form><div style="height:14px"></div>
    <div class="pst-section-title"><h3>🗺️ Regiões e taxas</h3><span class="pst-badge">Atualiza o checkout</span></div>
    <form class="pst-card pst-form" data-pst-form="regiao-nova">
      <label class="pst-field"><span>Código</span><input class="pst-input" id="pstRegCodigo" placeholder="Ex.: N7" required></label>
      <label class="pst-field"><span>Nome</span><input class="pst-input" id="pstRegNome" placeholder="Ex.: Projeto N7" required></label>
      <label class="pst-field"><span>Taxa R$</span><input class="pst-input" id="pstRegTaxa" type="number" min="0" step="0.01" value="0"></label>
      <label class="pst-field"><span>Ordem</span><input class="pst-input" id="pstRegOrdem" type="number" value="100"></label>
      <div class="pst-actions"><button class="pst-btn green" type="submit">＋ Adicionar região</button></div>
    </form><div style="height:14px"></div><div class="pst-list">${lista}</div>`;
  }

  function renderPagamentos() {
    const lista = pagamentos.length ? pagamentos.map(p => `<form class="pst-card pst-rowform" data-pst-form="pagamento" data-codigo="${esc(p.codigo)}">
      <label class="pst-field"><span>Código</span><input class="pst-input" value="${esc(p.codigo)}" disabled></label>
      <label class="pst-field wide"><span>Nome</span><input class="pst-input" name="nome" value="${esc(p.nome)}"></label>
      <label class="pst-field"><span>Ordem</span><input class="pst-input" name="ordem" type="number" value="${Number(p.ordem||0)}"></label>
      <label class="pst-check"><input name="troco" type="checkbox" ${p.aceita_troco?'checked':''}> Aceita troco</label>
      <label class="pst-check"><input name="ativo" type="checkbox" ${p.ativo!==false?'checked':''}> Ativo</label>
      <div class="pst-row-actions"><button class="pst-btn primary" type="submit">Salvar</button><button class="pst-btn danger" type="button" data-pst-excluir-pag="${esc(p.codigo)}">Excluir</button></div>
    </form>`).join("") : `<div class="pst-empty">Nenhuma forma de pagamento.</div>`;
    return `<div class="pst-section-title"><h3>💳 Formas de pagamento</h3><span class="pst-badge">Checkout</span></div>
    <form class="pst-card pst-form" data-pst-form="pagamento-novo">
      <label class="pst-field"><span>Código</span><input class="pst-input" id="pstPagCodigo" placeholder="Ex.: vale" required></label>
      <label class="pst-field"><span>Nome</span><input class="pst-input" id="pstPagNome" placeholder="Ex.: Vale refeição" required></label>
      <label class="pst-check"><input id="pstPagTroco" type="checkbox"> Aceita troco</label>
      <label class="pst-field"><span>Ordem</span><input class="pst-input" id="pstPagOrdem" type="number" value="100"></label>
      <div class="pst-actions"><button class="pst-btn green" type="submit">＋ Adicionar pagamento</button></div>
    </form><div style="height:14px"></div><div class="pst-list">${lista}</div>`;
  }

  function renderRecursos() {
    return `<form class="pst-form" data-pst-form="recursos">
      <label class="pst-check"><input id="pstAdminLink" type="checkbox" ${site.mostrar_link_admin!==false?'checked':''}> Mostrar link “Área Administrativa” no site público</label>
      <label class="pst-check"><input id="pstManutencao" type="checkbox" ${site.manutencao_ativa?'checked':''}> Ativar modo manutenção</label>
      <label class="pst-field full"><span>Mensagem da manutenção</span><textarea class="pst-textarea" id="pstManutMsg">${esc(site.manutencao_mensagem)}</textarea></label>
      <div class="pst-help full"><b>Modo manutenção:</b> quando ativado, os clientes verão apenas a mensagem acima. O painel administrador continua acessível para você desfazer a manutenção.</div>
      <div class="pst-actions"><button class="pst-btn primary" type="submit">⚙️ Salvar recursos</button><a class="pst-btn ghost" href="../" target="_blank" style="text-decoration:none">↗ Ver site</a></div>
    </form>`;
  }

  async function tratarSubmit(e) {
    const f = e.target.closest("[data-pst-form]");
    if (!f) return;
    e.preventDefault();
    const tipo = f.dataset.pstForm;
    const btn = e.submitter;
    if (btn) btn.disabled = true;
    try {
      if (tipo === "conteudo") {
        await salvarSite({nome_loja:val("pstNome"),subtitulo_marca:val("pstSubtitulo"),resumo_cardapio:val("pstResumo"),hero_selo:val("pstHeroSelo"),hero_titulo:val("pstHeroTitulo"),hero_texto:val("pstHeroTexto"),hero_botao_texto:val("pstHeroBotao"),pedido_minimo:num("pstMinimo"),telefone_exibicao:val("pstTelefone"),instagram_url:val("pstInstagram"),endereco_loja:val("pstEndereco"),rodape_texto:val("pstRodape")},"Conteúdo atualizado.");
      } else if (tipo === "capa") {
        let url = val("pstCapaUrl");
        const file = $("#pstCapaFile")?.files?.[0];
        if (file) { toast("Enviando capa..."); url = await upload(file,"capas"); }
        await salvarSite({hero_imagem_url:url,hero_capa_completa:checked("pstCapaCompleta")},"Capa atualizada."); render();
      } else if (tipo === "visual") {
        let logo = val("pstLogoUrl");
        const file = $("#pstLogoFile")?.files?.[0];
        if (file) { toast("Enviando logo..."); logo = await upload(file,"logos"); }
        await salvarSite({cor_primaria:$("#pstCor")?.value||"#ea1d2c",logo_url:logo},"Aparência atualizada."); render();
      } else if (tipo === "recursos") {
        await salvarSite({mostrar_link_admin:checked("pstAdminLink"),manutencao_ativa:checked("pstManutencao"),manutencao_mensagem:val("pstManutMsg")},"Recursos atualizados.");
      } else if (tipo === "entrega-recursos") {
        await salvarSite({aceita_entrega:checked("pstEntrega"),aceita_retirada:checked("pstRetirada"),tempo_entrega_texto:val("pstTempo")},"Opções de entrega atualizadas.");
      } else if (tipo === "aviso-novo") {
        await sessao();
        const {error}=await sb.from("avisos_site").insert({tipo:val("pstNovoAvisoTipo"),titulo:val("pstNovoAvisoTitulo"),mensagem:val("pstNovoAvisoMensagem"),botao_texto:val("pstNovoAvisoBotao"),botao_url:val("pstNovoAvisoLink"),ativo:true,ordem:0});
        if(error) throw error; toast("✅ Aviso criado."); await carregar();
      } else if (tipo === "aviso-editar") {
        await sessao(); const id=Number(f.dataset.id);
        const payload={tipo:f.elements.tipo.value,titulo:f.elements.titulo.value.trim(),mensagem:f.elements.mensagem.value.trim(),botao_texto:f.elements.botao_texto.value.trim(),botao_url:f.elements.botao_url.value.trim(),ativo:f.elements.ativo.checked,ordem:Number(f.elements.ordem.value||0),atualizado_em:new Date().toISOString()};
        const {error}=await sb.from("avisos_site").update(payload).eq("id",id); if(error) throw error; toast("✅ Aviso salvo."); await carregar();
      } else if (tipo === "regiao-nova") {
        await sessao(); const codigo=slug(val("pstRegCodigo")).toUpperCase(); if(!codigo) throw new Error("Informe um código para a região.");
        const {error}=await sb.from("regioes_entrega").insert({codigo,nome:val("pstRegNome"),taxa:num("pstRegTaxa"),ativo:true,ordem:num("pstRegOrdem")}); if(error) throw error; toast("✅ Região adicionada."); await carregar();
      } else if (tipo === "regiao") {
        await sessao(); const codigo=f.dataset.codigo;
        const {error}=await sb.from("regioes_entrega").update({nome:f.elements.nome.value.trim(),taxa:Number(f.elements.taxa.value||0),ordem:Number(f.elements.ordem.value||0),ativo:f.elements.ativo.checked,atualizado_em:new Date().toISOString()}).eq("codigo",codigo); if(error) throw error; toast("✅ Região salva."); await carregar();
      } else if (tipo === "pagamento-novo") {
        await sessao(); const codigo=slug(val("pstPagCodigo")); if(!codigo) throw new Error("Informe um código.");
        const {error}=await sb.from("formas_pagamento").insert({codigo,nome:val("pstPagNome"),aceita_troco:checked("pstPagTroco"),ativo:true,ordem:num("pstPagOrdem")}); if(error) throw error; toast("✅ Pagamento adicionado."); await carregar();
      } else if (tipo === "pagamento") {
        await sessao(); const codigo=f.dataset.codigo;
        const {error}=await sb.from("formas_pagamento").update({nome:f.elements.nome.value.trim(),aceita_troco:f.elements.troco.checked,ativo:f.elements.ativo.checked,ordem:Number(f.elements.ordem.value||0),atualizado_em:new Date().toISOString()}).eq("codigo",codigo); if(error) throw error; toast("✅ Pagamento salvo."); await carregar();
      }
    } catch(err) { console.error(err); toast("❌ "+(err.message||"Não foi possível salvar."),"erro"); }
    finally { if (btn) btn.disabled = false; }
  }

  async function tratarClique(e) {
    const reset = e.target.closest("[data-pst-reset-capa]");
    if (reset) {
      try { await salvarSite({hero_imagem_url:"/assets/capa-cantinho.webp",hero_capa_completa:true},"Capa padrão restaurada."); render(); } catch(err){toast("❌ "+err.message,"erro");} return;
    }
    const av = e.target.closest("[data-pst-excluir-aviso]");
    if (av) { if(!confirm("Excluir este aviso?")) return; try{await sessao(); const {error}=await sb.from("avisos_site").delete().eq("id",Number(av.dataset.pstExcluirAviso)); if(error)throw error; toast("✅ Aviso excluído."); await carregar();}catch(err){toast("❌ "+err.message,"erro");} return; }
    const rg = e.target.closest("[data-pst-excluir-regiao]");
    if (rg) { if(!confirm("Excluir esta região?")) return; try{await sessao(); const {error}=await sb.from("regioes_entrega").delete().eq("codigo",rg.dataset.pstExcluirRegiao); if(error)throw error; toast("✅ Região excluída."); await carregar();}catch(err){toast("❌ "+err.message,"erro");} return; }
    const pg = e.target.closest("[data-pst-excluir-pag]");
    if (pg) { if(!confirm("Excluir esta forma de pagamento?")) return; try{await sessao(); const {error}=await sb.from("formas_pagamento").delete().eq("codigo",pg.dataset.pstExcluirPag); if(error)throw error; toast("✅ Pagamento excluído."); await carregar();}catch(err){toast("❌ "+err.message,"erro");} }
  }

  function tratarChange(e) {
    if (e.target.id === "pstCapaFile" && e.target.files?.[0]) {
      const img=$("#pstCapaPreview"); if(img) img.src=URL.createObjectURL(e.target.files[0]);
    }
    if (e.target.id === "pstLogoFile" && e.target.files?.[0]) {
      const box=$(".pst-preview.logo"); if(box) box.innerHTML=`<img id="pstLogoPreview" src="${URL.createObjectURL(e.target.files[0])}">`;
    }
  }

  function realtime() {
    if (channel) return;
    channel = sb.channel("cantinho-admin-site-total")
      .on("postgres_changes",{event:"*",schema:"public",table:"site_config"},carregar)
      .on("postgres_changes",{event:"*",schema:"public",table:"avisos_site"},carregar)
      .on("postgres_changes",{event:"*",schema:"public",table:"regioes_entrega"},carregar)
      .on("postgres_changes",{event:"*",schema:"public",table:"formas_pagamento"},carregar)
      .subscribe();
  }

  async function iniciar() {
    estilos();
    let tentativas=0;
    const timer=setInterval(async()=>{
      tentativas++;
      if(criarPainel()){
        clearInterval(timer);
        await carregar();
        realtime();
      } else if(tentativas>40) clearInterval(timer);
    },250);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",iniciar); else iniciar();
})();
