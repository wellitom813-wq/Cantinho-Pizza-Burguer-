let produtosAdmin = [];
let filtroStatus = "todos";

const cfg = window.SUPABASE_CONFIG || {};
const sb =
  cfg.url && cfg.key
    ? window.supabase.createClient(cfg.url, cfg.key)
    : null;

const loginArea = document.getElementById("loginArea");
const adminArea = document.getElementById("adminArea");
const lista = document.getElementById("listaProdutos");
const msg = document.getElementById("loginMsg");

const buscaAdmin = document.getElementById("buscaAdmin");
const emptyAdmin = document.getElementById("emptyAdmin");

const totalProdutos = document.getElementById("totalProdutos");
const totalDisponiveis = document.getElementById("totalDisponiveis");
const totalEsgotados = document.getElementById("totalEsgotados");

const btnEntrar = document.getElementById("btnEntrar");
const btnSair = document.getElementById("btnSair");

const btnTodosDisponiveis =
  document.getElementById("btnTodosDisponiveis");

const btnTodosEsgotados =
  document.getElementById("btnTodosEsgotados");

function toast(texto) {
  const el = document.getElementById("toast");

  if (!el) return;

  el.textContent = texto;
  el.classList.add("active");

  clearTimeout(window._toastTimer);

  window._toastTimer = setTimeout(() => {
    el.classList.remove("active");
  }, 1800);
}

function atualizarStats() {
  totalProdutos.textContent = produtosAdmin.length;

  totalDisponiveis.textContent =
    produtosAdmin.filter(
      produto => produto.disponivel !== false
    ).length;

  totalEsgotados.textContent =
    produtosAdmin.filter(
      produto => produto.disponivel === false
    ).length;
}

function render() {
  const termo =
    buscaAdmin.value.toLowerCase().trim();

  const dados = produtosAdmin.filter(produto => {
    const nome = String(
      produto.nome ||
      produto.produto_id ||
      ""
    ).toLowerCase();

    const correspondeBusca =
      !termo || nome.includes(termo);

    const correspondeStatus =
      filtroStatus === "todos" ||

      (
        filtroStatus === "disponiveis" &&
        produto.disponivel !== false
      ) ||

      (
        filtroStatus === "esgotados" &&
        produto.disponivel === false
      );

    return correspondeBusca && correspondeStatus;
  });

  emptyAdmin.hidden = dados.length !== 0;

  lista.innerHTML = dados.map(produto => {
    const disponivel =
      produto.disponivel !== false;

    return `
      <article class="product ${disponivel ? "" : "esgotado"}">

        <div>
          <strong>
            ${produto.nome || produto.produto_id}
          </strong>

          <div class="status ${disponivel ? "ok" : "no"}">
            ${disponivel ? "Disponível" : "ESGOTADO"}
          </div>
        </div>

        <button
          class="toggle"
          onclick="alterarStatus(
            '${produto.produto_id}',
            ${disponivel ? "false" : "true"}
          )"
        >
          ${
            disponivel
              ? "Marcar esgotado"
              : "Disponibilizar"
          }
        </button>

      </article>
    `;
  }).join("");
}

async function carregar() {
  if (!sb) {
    lista.innerHTML =
      "<p>Supabase não configurado.</p>";

    return;
  }

  const { data, error } = await sb
    .from("produtos_estoque")
    .select(
      "produto_id,nome,disponivel"
    )
    .order("nome");

  if (error) {
    lista.innerHTML =
      `<p>Erro ao carregar produtos: ${error.message}</p>`;

    return;
  }

  produtosAdmin = data || [];

  atualizarStats();
  render();
}

async function alterarStatus(
  id,
  disponivel
) {
  const { error } = await sb
    .from("produtos_estoque")
    .update({
      disponivel: disponivel
    })
    .eq("produto_id", id);

  if (error) {
    alert(
      "Erro ao atualizar produto: " +
      error.message
    );

    return;
  }

  const produto =
    produtosAdmin.find(
      item =>
        item.produto_id === id
    );

  if (produto) {
    produto.disponivel =
      disponivel;
  }

  atualizarStats();
  render();

  toast(
    disponivel
      ? "Produto disponível"
      : "Produto esgotado"
  );
}

async function alterarTodos(
  disponivel
) {
  const mensagem =
    disponivel
      ? "Marcar TODOS os produtos como disponíveis?"
      : "Marcar TODOS os produtos como esgotados?";

  const confirmar =
    confirm(mensagem);

  if (!confirmar) return;

  btnTodosDisponiveis.disabled = true;
  btnTodosEsgotados.disabled = true;

  btnTodosDisponiveis.textContent =
    "Atualizando...";

  btnTodosEsgotados.textContent =
    "Atualizando...";

  const { error } = await sb
    .from("produtos_estoque")
    .update({
      disponivel: disponivel
    })
    .not(
      "produto_id",
      "is",
      null
    );

  if (error) {
    alert(
      "Erro ao atualizar todos os produtos: " +
      error.message
    );

    btnTodosDisponiveis.disabled = false;
    btnTodosEsgotados.disabled = false;

    btnTodosDisponiveis.textContent =
      "Todos disponíveis";

    btnTodosEsgotados.textContent =
      "Todos esgotados";

    return;
  }

  produtosAdmin =
    produtosAdmin.map(
      produto => ({
        ...produto,
        disponivel:
          disponivel
      })
    );

  atualizarStats();
  render();

  btnTodosDisponiveis.disabled = false;
  btnTodosEsgotados.disabled = false;

  btnTodosDisponiveis.textContent =
    "Todos disponíveis";

  btnTodosEsgotados.textContent =
    "Todos esgotados";

  toast(
    disponivel
      ? "Todos os produtos estão disponíveis"
      : "Todos os produtos estão esgotados"
  );

  await carregar();
}

async function mostrarSessao() {
  if (!sb) {
    msg.textContent =
      "Supabase não configurado.";

    return;
  }

  const { data } =
    await sb.auth.getSession();

  const logado =
    !!data.session;

  loginArea.hidden =
    logado;

  adminArea.hidden =
    !logado;

  if (logado) {
    carregar();
  }
}

btnEntrar.onclick =
  async () => {

    msg.textContent = "";

    const email =
      document
        .getElementById("email")
        .value
        .trim();

    const password =
      document
        .getElementById("senha")
        .value;

    if (!email || !password) {
      msg.textContent =
        "Preencha e-mail e senha.";

      return;
    }

    btnEntrar.disabled = true;
    btnEntrar.textContent =
      "Entrando...";

    const { error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });

    btnEntrar.disabled = false;
    btnEntrar.textContent =
      "Entrar";

    if (error) {
      msg.textContent =
        "Não foi possível entrar: " +
        error.message;

      return;
    }

    mostrarSessao();
  };

btnSair.onclick =
  async () => {

    await sb.auth.signOut();

    mostrarSessao();
  };

buscaAdmin.addEventListener(
  "input",
  render
);

document
  .querySelectorAll(".filter")
  .forEach(botao => {

    botao.addEventListener(
      "click",
      () => {

        filtroStatus =
          botao.dataset.status;

        document
          .querySelectorAll(".filter")
          .forEach(item => {
            item.classList.remove(
              "active"
            );
          });

        botao.classList.add(
          "active"
        );

        render();
      }
    );
  });

btnTodosDisponiveis.onclick =
  () => alterarTodos(true);

btnTodosEsgotados.onclick =
  () => alterarTodos(false);

mostrarSessao();
