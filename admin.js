const PRODUTOS = [
  ["x-salada", "X-Salada", "Hambúrgueres"],
  ["x-burguer", "X-Burguer", "Hambúrgueres"],
  ["x-bacon", "X-Bacon", "Hambúrgueres"],
  ["x-tudao", "X-Tudão", "Hambúrgueres"],
  ["x-tudo", "X-Tudo", "Hambúrgueres"],
  ["moda-da-casa", "Moda da Casa", "Hambúrgueres"],
  ["artesanal-simples", "Hambúrguer Simples", "Artesanais"],
  ["x-calabresa-artesanal", "X Calabresa Artesanal", "Artesanais"],
  ["x-bacon-artesanal", "X Bacon Artesanal", "Artesanais"],
  ["pizza-mucarela", "Pizza Muçarela", "Pizzas"],
  ["pizza-calabresa", "Pizza Calabresa", "Pizzas"],
  ["pizza-frango", "Pizza de Frango", "Pizzas"],
  ["pizza-portuguesa", "Pizza Portuguesa", "Pizzas"],
  ["pizza-baiana", "Pizza Baiana", "Pizzas"],
  ["pizza-milho", "Pizza de Milho", "Pizzas"],
  ["calzone-calabresa", "Calzone de Calabresa", "Calzones"],
  ["calzone-frango", "Calzone de Frango", "Calzones"],
  ["calzone-presunto", "Calzone de Presunto", "Calzones"],
  ["coca-lata-zero", "Coca-Cola Lata Sem Açúcar", "Bebidas"],
  ["coca-2l", "Coca-Cola 2L", "Bebidas"],
  ["coca-zero-2l", "Coca-Cola Sem Açúcar 2L", "Bebidas"],
  ["guarana-1l", "Guaraná Antarctica 1L", "Bebidas"],
  ["pepsi-1l", "Pepsi 1L", "Bebidas"],
  ["refri-guarana", "Refri Guaraná", "Bebidas"]
];

const client =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

let estado = {};

const loginBox =
  document.getElementById("loginBox");
const painelBox =
  document.getElementById("painelBox");
const lista =
  document.getElementById("listaProdutos");

async function verificarSessao() {
  const {
    data: { session }
  } = await client.auth.getSession();

  if (session) {
    loginBox.classList.add("oculto");
    painelBox.classList.remove("oculto");
    await carregarProdutos();
  } else {
    loginBox.classList.remove("oculto");
    painelBox.classList.add("oculto");
  }
}

async function carregarProdutos() {
  const { data, error } =
    await client
      .from("produtos_estoque")
      .select("produto_id,disponivel");

  if (error) {
    lista.innerHTML =
      `<p style="color:#ff7777">${error.message}</p>`;
    return;
  }

  estado = {};

  (data || []).forEach(item => {
    estado[item.produto_id] =
      Boolean(item.disponivel);
  });

  renderizar();
}

function renderizar() {
  lista.innerHTML =
    PRODUTOS.map(([id, nome, categoria]) => {
      const disponivel =
        estado[id] !== false;

      return `
        <article class="produto-admin">
          <div>
            <strong>${nome}</strong>
            <small>${categoria}</small>
            <span class="status-admin ${disponivel ? "disponivel" : "esgotado"}">
              ${disponivel ? "🟢 DISPONÍVEL" : "🔴 ESGOTADO"}
            </span>
          </div>

          <button
            class="acao-estoque ${disponivel ? "esgotar" : "reativar"}"
            onclick="alterarEstoque('${id}', ${!disponivel})"
          >
            ${disponivel ? "Esgotar" : "Reativar"}
          </button>
        </article>
      `;
    }).join("");
}

async function alterarEstoque(id, disponivel) {
  const botao =
    event?.currentTarget;

  if (botao) botao.disabled = true;

  const { error } =
    await client
      .from("produtos_estoque")
      .upsert(
        {
          produto_id: id,
          disponivel,
          atualizado_em:
            new Date().toISOString()
        },
        {
          onConflict: "produto_id"
        }
      );

  if (error) {
    alert("Erro: " + error.message);
    if (botao) botao.disabled = false;
    return;
  }

  estado[id] = disponivel;
  renderizar();
}

document
  .getElementById("btnEntrar")
  .addEventListener(
    "click",
    async () => {
      const email =
        document.getElementById("email").value.trim();
      const password =
        document.getElementById("senha").value;
      const msg =
        document.getElementById("loginMsg");

      msg.textContent = "Entrando...";

      const { error } =
        await client.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        msg.textContent =
          "E-mail ou senha incorretos.";
        return;
      }

      msg.textContent = "";
      await verificarSessao();
    }
  );

document
  .getElementById("btnSair")
  .addEventListener(
    "click",
    async () => {
      await client.auth.signOut();
      await verificarSessao();
    }
  );

client.auth.onAuthStateChange(
  () => verificarSessao()
);

verificarSessao();
