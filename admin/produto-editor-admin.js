/* ============================================================
   CANTINHO PIZZA BURGUER
   EDITOR DE PRODUTOS NO PAINEL ADMINISTRADOR

   Carregue este arquivo DEPOIS de:
   - config.js
   - admin.js
   - loja-status-admin.js (se estiver usando)
============================================================ */

(() => {
  "use strict";

  const cfg =
    window.SUPABASE_CONFIG ||
    window.supabaseConfig ||
    {};

  const url =
    cfg.url ||
    window.SUPABASE_URL;

  const key =
    cfg.key ||
    cfg.anonKey ||
    window.SUPABASE_ANON_KEY ||
    window.SUPABASE_PUBLISHABLE_KEY;

  if (!window.supabase || !url || !key) {
    console.error(
      "[Editor Produtos] Supabase não configurado."
    );
    return;
  }

  const client =
    window.supabase.createClient(
      url,
      key
    );

  let produtos = [];
  let termoBusca = "";

  function dinheiroInput(valor) {
    const numero = Number(valor);

    return Number.isFinite(numero)
      ? numero.toFixed(2)
      : "0.00";
  }

  function escaparHtml(texto) {
    return String(texto ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function inserirEstilos() {
    if (
      document.getElementById(
        "produtoEditorEstilos"
      )
    ) return;

    const style =
      document.createElement("style");

    style.id =
      "produtoEditorEstilos";

    style.textContent = `
      #produtoEditorAdmin {
        margin: 20px 0;
        padding: 20px;
        border-radius: 18px;
        background: #111;
        border: 1px solid #292929;
        color: #fff;
      }

      #produtoEditorAdmin * {
        box-sizing: border-box;
      }

      .pe-topo {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 15px;
        flex-wrap: wrap;
      }

      .pe-topo h2 {
        margin: 0;
        font-size: 21px;
        font-weight: 900;
      }

      .pe-topo p {
        margin: 6px 0 0;
        color: #aaa;
        font-size: 13px;
        line-height: 1.45;
      }

      .pe-busca {
        margin-top: 16px;
      }

      .pe-busca input {
        width: 100%;
        min-height: 46px;
        border-radius: 12px;
        border: 1px solid #333;
        background: #0a0a0a;
        color: #fff;
        padding: 0 14px;
        outline: none;
        font-size: 14px;
      }

      .pe-info {
        margin-top: 12px;
        min-height: 18px;
        color: #aaa;
        font-size: 12px;
        font-weight: 700;
      }

      .pe-info.ok {
        color: #65e68f;
      }

      .pe-info.erro {
        color: #ff7b7b;
      }

      .pe-lista {
        display: grid;
        gap: 12px;
        margin-top: 16px;
      }

      .pe-card {
        border: 1px solid #2b2b2b;
        border-radius: 15px;
        background: #171717;
        padding: 15px;
      }

      .pe-id {
        color: #777;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .5px;
        overflow-wrap: anywhere;
      }

      .pe-campos {
        display: grid;
        grid-template-columns:
          minmax(0, 1fr) 130px;
        gap: 10px;
        margin-top: 10px;
      }

      .pe-campo {
        display: grid;
        gap: 6px;
      }

      .pe-campo span {
        color: #aaa;
        font-size: 11px;
        font-weight: 800;
      }

      .pe-campo input {
        width: 100%;
        min-height: 43px;
        border-radius: 10px;
        border: 1px solid #333;
        background: #0c0c0c;
        color: white;
        padding: 0 11px;
        outline: none;
      }

      .pe-acoes {
        display: grid;
        grid-template-columns:
          minmax(0, 1fr) minmax(0, 1fr);
        gap: 9px;
        margin-top: 12px;
      }

      .pe-btn {
        min-height: 42px;
        border: 0;
        border-radius: 10px;
        padding: 9px 12px;
        font-weight: 900;
        cursor: pointer;
      }

      .pe-btn.salvar {
        background: #ff4c0d;
        color: #fff;
      }

      .pe-btn.disponivel {
        background: #1fbd5c;
        color: #07180d;
      }

      .pe-btn.esgotado {
        background: #df4040;
        color: #fff;
      }

      .pe-btn:disabled {
        opacity: .55;
        cursor: wait;
      }

      .pe-vazio {
        padding: 25px 15px;
        text-align: center;
        color: #888;
        border: 1px dashed #333;
        border-radius: 12px;
      }

      @media (max-width: 560px) {
        .pe-campos {
          grid-template-columns: 1fr;
        }

        .pe-acoes {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function acharDashboard() {
    return (
      document.getElementById("dashboard") ||
      document.querySelector(".dashboard") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function criarSecao() {
    if (
      document.getElementById(
        "produtoEditorAdmin"
      )
    ) return true;

    const dashboard =
      acharDashboard();

    if (!dashboard) return false;

    const secao =
      document.createElement("section");

    secao.id =
      "produtoEditorAdmin";

    secao.innerHTML = `
      <div class="pe-topo">
        <div>
          <h2>✏️ Editar produtos</h2>
          <p>
            Altere nome, preço e disponibilidade.
            As mudanças aparecem no cardápio público.
          </p>
        </div>
      </div>

      <div class="pe-busca">
        <input
          id="produtoEditorBusca"
          type="search"
          placeholder="Buscar produto..."
        >
      </div>

      <div
        id="produtoEditorInfo"
        class="pe-info"
      ></div>

      <div
        id="produtoEditorLista"
        class="pe-lista"
      >
        <div class="pe-vazio">
          Carregando produtos...
        </div>
      </div>
    `;

    /*
      Insere depois do status da loja, quando ele existir.
      Caso contrário, entra no início do dashboard.
    */
    const statusLoja =
      document.getElementById(
        "controleLojaCard"
      );

    if (
      statusLoja &&
      statusLoja.parentElement === dashboard
    ) {
      statusLoja.insertAdjacentElement(
        "afterend",
        secao
      );
    } else {
      dashboard.prepend(secao);
    }

    secao
      .querySelector(
        "#produtoEditorBusca"
      )
      ?.addEventListener(
        "input",
        evento => {
          termoBusca =
            evento.target.value
              .trim()
              .toLowerCase();

          renderizar();
        }
      );

    return true;
  }

  function mensagem(
    texto,
    tipo = ""
  ) {
    const info =
      document.getElementById(
        "produtoEditorInfo"
      );

    if (!info) return;

    info.textContent = texto;
    info.className =
      "pe-info" +
      (tipo ? " " + tipo : "");
  }

  function renderizar() {
    const lista =
      document.getElementById(
        "produtoEditorLista"
      );

    if (!lista) return;

    const filtrados =
      produtos.filter(
        produto => {
          const texto =
            `${produto.nome || ""} ${produto.produto_id || ""}`
              .toLowerCase();

          return (
            !termoBusca ||
            texto.includes(termoBusca)
          );
        }
      );

    if (!filtrados.length) {
      lista.innerHTML = `
        <div class="pe-vazio">
          Nenhum produto encontrado.
        </div>
      `;
      return;
    }

    lista.innerHTML =
      filtrados
        .map(produto => {
          const id =
            escaparHtml(
              produto.produto_id
            );

          const nome =
            escaparHtml(
              produto.nome || ""
            );

          const disponivel =
            produto.disponivel !== false;

          return `
            <article
              class="pe-card"
              data-editor-id="${id}"
            >
              <div class="pe-id">
                ID: ${id}
              </div>

              <div class="pe-campos">
                <label class="pe-campo">
                  <span>Nome do produto</span>
                  <input
                    class="pe-nome"
                    type="text"
                    value="${nome}"
                    maxlength="100"
                  >
                </label>

                <label class="pe-campo">
                  <span>Preço (R$)</span>
                  <input
                    class="pe-preco"
                    type="number"
                    min="0"
                    step="0.01"
                    inputmode="decimal"
                    value="${dinheiroInput(
                      produto.preco
                    )}"
                  >
                </label>
              </div>

              <div class="pe-acoes">
                <button
                  type="button"
                  class="pe-btn salvar"
                  data-editor-salvar="${id}"
                >
                  💾 SALVAR NOME E PREÇO
                </button>

                <button
                  type="button"
                  class="pe-btn ${
                    disponivel
                      ? "disponivel"
                      : "esgotado"
                  }"
                  data-editor-status="${id}"
                  data-editor-disponivel="${
                    disponivel
                      ? "true"
                      : "false"
                  }"
                >
                  ${
                    disponivel
                      ? "🟢 DISPONÍVEL"
                      : "🔴 ESGOTADO"
                  }
                </button>
              </div>
            </article>
          `;
        })
        .join("");

    lista
      .querySelectorAll(
        "[data-editor-salvar]"
      )
      .forEach(botao => {
        botao.addEventListener(
          "click",
          () =>
            salvarProduto(
              botao.dataset.editorSalvar
            )
        );
      });

    lista
      .querySelectorAll(
        "[data-editor-status]"
      )
      .forEach(botao => {
        botao.addEventListener(
          "click",
          () => {
            const atual =
              botao.dataset
                .editorDisponivel ===
              "true";

            alterarDisponibilidade(
              botao.dataset.editorStatus,
              !atual
            );
          }
        );
      });
  }

  async function garantirLogin() {
    const {
      data,
      error
    } =
      await client.auth.getSession();

    if (error) {
      throw error;
    }

    if (!data?.session?.user) {
      throw new Error(
        "Faça login no painel administrativo para editar produtos."
      );
    }

    return data.session.user;
  }

  async function carregarProdutos() {
    try {
      await garantirLogin();

      const {
        data,
        error
      } =
        await client
          .from("produtos_estoque")
          .select(
            "produto_id,nome,preco,disponivel"
          )
          .order(
            "nome",
            {
              ascending: true
            }
          );

      if (error) {
        throw error;
      }

      produtos =
        data || [];

      renderizar();

      mensagem(
        `${produtos.length} produto(s) carregado(s).`
      );

      return true;
    }
    catch (erro) {
      console.error(
        "[Editor Produtos]",
        erro
      );

      mensagem(
        "❌ " +
        (
          erro?.message ||
          "Não foi possível carregar os produtos."
        ),
        "erro"
      );

      return false;
    }
  }

  function cardDoProduto(id) {
    return Array
      .from(
        document.querySelectorAll(
          "#produtoEditorLista .pe-card"
        )
      )
      .find(
        card =>
          card.dataset.editorId === id
      );
  }

  async function salvarProduto(id) {
    const card =
      cardDoProduto(id);

    if (!card) return;

    const nome =
      card
        .querySelector(".pe-nome")
        ?.value
        .trim();

    const preco =
      Number(
        card
          .querySelector(".pe-preco")
          ?.value
      );

    if (!nome) {
      mensagem(
        "❌ Digite o nome do produto.",
        "erro"
      );
      return;
    }

    if (
      !Number.isFinite(preco) ||
      preco < 0
    ) {
      mensagem(
        "❌ Digite um preço válido.",
        "erro"
      );
      return;
    }

    const botoes =
      card.querySelectorAll(
        "button"
      );

    botoes.forEach(
      botao =>
        botao.disabled = true
    );

    mensagem(
      `Salvando ${nome}...`
    );

    try {
      await garantirLogin();

      const {
        error
      } =
        await client
          .from("produtos_estoque")
          .update({
            nome,
            preco
          })
          .eq(
            "produto_id",
            id
          );

      if (error) {
        throw error;
      }

      const item =
        produtos.find(
          produto =>
            produto.produto_id === id
        );

      if (item) {
        item.nome = nome;
        item.preco = preco;
      }

      mensagem(
        `✅ ${nome} atualizado com sucesso.`,
        "ok"
      );
    }
    catch (erro) {
      console.error(
        "[Editor Produtos] Erro ao salvar:",
        erro
      );

      mensagem(
        "❌ " +
        (
          erro?.message ||
          "Não foi possível salvar."
        ),
        "erro"
      );
    }
    finally {
      botoes.forEach(
        botao =>
          botao.disabled = false
      );
    }
  }

  async function alterarDisponibilidade(
    id,
    novaDisponibilidade
  ) {
    const card =
      cardDoProduto(id);

    const botoes =
      card?.querySelectorAll(
        "button"
      ) || [];

    botoes.forEach(
      botao =>
        botao.disabled = true
    );

    mensagem(
      novaDisponibilidade
        ? "Marcando como disponível..."
        : "Marcando como esgotado..."
    );

    try {
      await garantirLogin();

      const {
        error
      } =
        await client
          .from("produtos_estoque")
          .update({
            disponivel:
              novaDisponibilidade
          })
          .eq(
            "produto_id",
            id
          );

      if (error) {
        throw error;
      }

      const item =
        produtos.find(
          produto =>
            produto.produto_id === id
        );

      if (item) {
        item.disponivel =
          novaDisponibilidade;
      }

      renderizar();

      mensagem(
        novaDisponibilidade
          ? "✅ Produto disponível."
          : "✅ Produto esgotado.",
        "ok"
      );
    }
    catch (erro) {
      console.error(
        "[Editor Produtos] Erro no status:",
        erro
      );

      mensagem(
        "❌ " +
        (
          erro?.message ||
          "Não foi possível alterar o status."
        ),
        "erro"
      );
    }
    finally {
      botoes.forEach(
        botao =>
          botao.disabled = false
      );
    }
  }

  function iniciarRealtime() {
    client
      .channel(
        "editor-produtos-admin"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "produtos_estoque"
        },
        () => {
          carregarProdutos();
        }
      )
      .subscribe();
  }

  async function iniciar() {
    inserirEstilos();

    if (!criarSecao()) {
      let tentativas = 0;

      const timer =
        setInterval(
          () => {
            tentativas++;

            if (
              criarSecao() ||
              tentativas >= 30
            ) {
              clearInterval(timer);

              if (
                document.getElementById(
                  "produtoEditorAdmin"
                )
              ) {
                carregarProdutos();
              }
            }
          },
          300
        );
    } else {
      await carregarProdutos();
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
  } else {
    iniciar();
  }
})();
