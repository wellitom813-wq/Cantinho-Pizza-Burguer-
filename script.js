/* =========================================================
   CANTINHO PIZZA BURGUER
   Horário + estoque global Supabase + carrinho
========================================================= */

const NUMERO_WHATSAPP = "5587999999999";

const DIAS_ABERTOS = [0, 2, 3, 5, 6];
const HORA_ABERTURA = 18;
const HORA_FECHAMENTO = 22;

const TAXAS_ENTREGA = {
  N1: 4,
  N3: 3,
  N5: 5,
  C2: 6
};

let carrinho = [];
let estoqueProdutos = {};

const supabaseClient =
  SUPABASE_URL.includes("COLE_AQUI")
    ? null
    : window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

function lojaEstaAberta() {
  const agora = new Date();
  const dia = agora.getDay();
  const minutos = agora.getHours() * 60 + agora.getMinutes();

  return (
    DIAS_ABERTOS.includes(dia) &&
    minutos >= HORA_ABERTURA * 60 &&
    minutos < HORA_FECHAMENTO * 60
  );
}

function produtoDisponivel(id) {
  if (!(id in estoqueProdutos)) return true;
  return estoqueProdutos[id] !== false;
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function mostrarAvisoEstoque(texto, erro = false) {
  let aviso = document.getElementById("estoqueSyncAviso");

  if (!aviso) {
    aviso = document.createElement("div");
    aviso.id = "estoqueSyncAviso";
    aviso.className = "estoque-sync-aviso";

    const categorias = document.querySelector(".categorias");
    categorias?.insertAdjacentElement("afterend", aviso);
  }

  aviso.textContent = texto;
  aviso.classList.toggle("erro", erro);
}

async function carregarEstoque() {
  if (!supabaseClient) {
    mostrarAvisoEstoque(
      "Estoque online ainda não configurado. Configure o Supabase em config.js.",
      true
    );
    atualizarVisualProdutos();
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("produtos_estoque")
      .select("produto_id,disponivel");

  if (error) {
    console.error(error);
    mostrarAvisoEstoque(
      "Não foi possível sincronizar o estoque agora. O cardápio foi carregado com o estado padrão.",
      true
    );
    atualizarVisualProdutos();
    return;
  }

  estoqueProdutos = {};

  (data || []).forEach(item => {
    estoqueProdutos[item.produto_id] =
      Boolean(item.disponivel);
  });

  atualizarVisualProdutos();

  const aviso =
    document.getElementById("estoqueSyncAviso");

  if (aviso) aviso.remove();
}

function atualizarVisualProdutos() {
  document
    .querySelectorAll(".produto[data-produto-id]")
    .forEach(card => {
      const id = card.dataset.produtoId;
      const disponivel = produtoDisponivel(id);
      const botao =
        card.querySelector(".btn-adicionar");

      card.classList.toggle(
        "esgotado",
        !disponivel
      );

      if (!botao) return;

      if (!disponivel) {
        botao.disabled = true;
        botao.classList.add("esgotado");
        botao.classList.remove("loja-fechada");
        botao.textContent = "Produto esgotado";
        return;
      }

      botao.classList.remove("esgotado");

      if (!lojaEstaAberta()) {
        botao.disabled = true;
        botao.classList.add("loja-fechada");
        botao.textContent = "Loja fechada";
      } else {
        botao.disabled = false;
        botao.classList.remove("loja-fechada");
        botao.textContent = "Adicionar +";
      }
    });

  const botaoWhatsapp =
    document.querySelector(".btn-whatsapp");

  if (botaoWhatsapp) {
    botaoWhatsapp.disabled =
      !lojaEstaAberta();

    botaoWhatsapp.innerHTML =
      lojaEstaAberta()
        ? "<span>💬</span> Finalizar pedido pelo WhatsApp"
        : "<span>🔒</span> Loja fechada";
  }
}

function avisarLojaFechada() {
  alert(
    "🔴 LOJA FECHADA NO MOMENTO\n\n" +
    "Horário:\n" +
    "Terça, quarta, sexta, sábado e domingo\n" +
    "18h às 22h."
  );
}

function adicionarProduto(id, nome, preco) {
  if (!lojaEstaAberta()) {
    avisarLojaFechada();
    return;
  }

  if (!produtoDisponivel(id)) {
    alert(
      `🔴 ${nome} está esgotado no momento.`
    );
    atualizarVisualProdutos();
    return;
  }

  const existente =
    carrinho.find(
      item => item.id === id
    );

  if (existente) {
    existente.quantidade++;
  } else {
    carrinho.push({
      id,
      nome,
      preco,
      quantidade: 1
    });
  }

  atualizarCarrinho();
  mostrarToast();
}

function removerProduto(id) {
  const produto =
    carrinho.find(item => item.id === id);

  if (!produto) return;

  produto.quantidade--;

  if (produto.quantidade <= 0) {
    carrinho =
      carrinho.filter(
        item => item.id !== id
      );
  }

  atualizarCarrinho();
}

function excluirProduto(id) {
  carrinho =
    carrinho.filter(
      item => item.id !== id
    );

  atualizarCarrinho();
}

function calcularQuantidadeTotal() {
  return carrinho.reduce(
    (total, item) =>
      total + item.quantidade,
    0
  );
}

function calcularTotal() {
  return carrinho.reduce(
    (total, item) =>
      total +
      item.preco * item.quantidade,
    0
  );
}

function obterTaxaEntrega() {
  const tipo =
    document
      .getElementById("tipoPedido")
      ?.value;

  const regiao =
    document
      .getElementById("regiao")
      ?.value;

  if (
    tipo !== "Entrega" ||
    !regiao
  ) return 0;

  return TAXAS_ENTREGA[regiao] || 0;
}

function atualizarResumoFinal() {
  const subtotal = calcularTotal();
  const taxa = obterTaxaEntrega();
  const total = subtotal + taxa;

  const s =
    document.getElementById("subtotalPedido");
  const t =
    document.getElementById("taxaEntrega");
  const f =
    document.getElementById("totalFinalPedido");

  if (s) s.textContent = formatarMoeda(subtotal);
  if (t) t.textContent = formatarMoeda(taxa);
  if (f) f.textContent = formatarMoeda(total);
}

function atualizarCarrinho() {
  const quantidade =
    document.getElementById("quantidadeCarrinho");
  const total =
    document.getElementById("totalCarrinho");
  const totalModal =
    document.getElementById("totalModal");
  const lista =
    document.getElementById("listaCarrinho");

  if (!lista) return;

  quantidade.textContent =
    calcularQuantidadeTotal();

  total.textContent =
    formatarMoeda(calcularTotal());

  totalModal.textContent =
    formatarMoeda(calcularTotal());

  atualizarResumoFinal();

  if (!carrinho.length) {
    lista.innerHTML = `
      <div class="carrinho-vazio">
        <span style="font-size:42px">🛒</span>
        <strong>Seu carrinho está vazio</strong>
        <p>Adicione seus produtos favoritos.</p>
      </div>
    `;
    return;
  }

  lista.innerHTML =
    carrinho.map(item => `
      <div style="padding:15px 0;border-bottom:1px solid #242424">
        <div style="display:flex;justify-content:space-between;gap:12px">
          <strong>${item.nome}</strong>
          <strong style="color:#ff7a1a">
            ${formatarMoeda(item.preco * item.quantidade)}
          </strong>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
          <div style="display:flex;align-items:center;gap:9px">
            <button onclick="removerProduto('${item.id}')" style="width:32px;height:32px;border:0;border-radius:9px;background:#242424;color:white">−</button>
            <strong>${item.quantidade}</strong>
            <button onclick="adicionarProduto('${item.id}','${item.nome.replaceAll("'","\\'")}',${item.preco})" style="width:32px;height:32px;border:0;border-radius:9px;background:#ff4c0d;color:white">+</button>
          </div>
          <button onclick="excluirProduto('${item.id}')" style="border:0;background:transparent;color:#ff6767">Remover</button>
        </div>
      </div>
    `).join("");
}

function abrirCarrinho() {
  if (!lojaEstaAberta() && !carrinho.length) {
    avisarLojaFechada();
    return;
  }

  document
    .getElementById("modalCarrinho")
    ?.classList.add("ativo");

  document.body.style.overflow = "hidden";
}

function fecharCarrinho() {
  document
    .getElementById("modalCarrinho")
    ?.classList.remove("ativo");

  document.body.style.overflow = "";
}

function irParaFinalizacao() {
  if (!lojaEstaAberta()) {
    avisarLojaFechada();
    return;
  }

  if (!carrinho.length) {
    alert("Adicione pelo menos um produto.");
    return;
  }

  const esgotados =
    carrinho.filter(
      item => !produtoDisponivel(item.id)
    );

  if (esgotados.length) {
    alert(
      "Alguns produtos do carrinho acabaram:\n\n" +
      esgotados
        .map(p => "• " + p.nome)
        .join("\n") +
      "\n\nRemova-os para continuar."
    );
    return;
  }

  fecharCarrinho();

  const finalizacao =
    document.getElementById("finalizacao");

  finalizacao?.classList.add("ativo");
  atualizarResumoFinal();

  finalizacao?.scrollIntoView({
    behavior: "smooth"
  });
}

function mostrarToast() {
  const toast =
    document.getElementById("toast");

  if (!toast) return;

  toast.classList.add("ativo");
  clearTimeout(window.timerToast);

  window.timerToast =
    setTimeout(
      () =>
        toast.classList.remove("ativo"),
      1800
    );
}

function atualizarStatusLoja() {
  const status =
    document.querySelector(".status-loja");

  if (!status) return;

  const agora = new Date();
  const dia = agora.getDay();
  const minutos =
    agora.getHours() * 60 +
    agora.getMinutes();

  const nomes = {
    0: "domingo",
    1: "segunda-feira",
    2: "terça-feira",
    3: "quarta-feira",
    4: "quinta-feira",
    5: "sexta-feira",
    6: "sábado"
  };

  if (lojaEstaAberta()) {
    status.innerHTML =
      '<span class="status-bolinha"></span><span>Aberto • Fecha às 22h</span>';

    status.classList.remove("fechado");
    atualizarVisualProdutos();
    return;
  }

  let proxima = "";

  if (
    DIAS_ABERTOS.includes(dia) &&
    minutos < HORA_ABERTURA * 60
  ) {
    proxima = "Abre hoje às 18h";
  } else {
    for (let i = 1; i <= 7; i++) {
      const proximoDia =
        (dia + i) % 7;

      if (
        DIAS_ABERTOS.includes(
          proximoDia
        )
      ) {
        proxima =
          `Abre ${nomes[proximoDia]} às 18h`;
        break;
      }
    }
  }

  status.innerHTML =
    `<span class="status-bolinha"></span><span>${proxima}</span>`;

  status.classList.add("fechado");
  atualizarVisualProdutos();
}

function configurarTipoPedido() {
  const tipo =
    document.getElementById("tipoPedido");
  const endereco =
    document.getElementById("endereco");
  const campoRegiao =
    document.getElementById("campoRegiao");
  const regiao =
    document.getElementById("regiao");

  function atualizar() {
    const retirada =
      tipo.value === "Retirada";

    endereco.disabled = retirada;
    endereco.style.opacity =
      retirada ? ".45" : "1";

    if (retirada) {
      endereco.value = "";
      regiao.value = "";
      campoRegiao.style.display = "none";
    } else {
      campoRegiao.style.display = "flex";
    }

    atualizarResumoFinal();
  }

  tipo?.addEventListener(
    "change",
    atualizar
  );

  regiao?.addEventListener(
    "change",
    atualizarResumoFinal
  );

  atualizar();
}

function configurarPagamento() {
  const pagamento =
    document.getElementById("pagamento");
  const troco =
    document.getElementById("troco");

  function atualizar() {
    const dinheiro =
      pagamento.value === "Dinheiro";

    troco.disabled = !dinheiro;
    troco.style.opacity =
      dinheiro ? "1" : ".45";

    if (!dinheiro) troco.value = "";
  }

  pagamento?.addEventListener(
    "change",
    atualizar
  );

  atualizar();
}

async function validarEstoqueAntesDeEnviar() {
  if (!supabaseClient) return true;

  await carregarEstoque();

  const indisponiveis =
    carrinho.filter(
      item => !produtoDisponivel(item.id)
    );

  if (!indisponiveis.length) return true;

  alert(
    "Um produto acabou antes da finalização:\n\n" +
    indisponiveis
      .map(p => "• " + p.nome)
      .join("\n") +
    "\n\nRemova-o do carrinho para continuar."
  );

  return false;
}

async function finalizarPedido() {
  if (!lojaEstaAberta()) {
    avisarLojaFechada();
    return;
  }

  if (!carrinho.length) {
    alert("Seu carrinho está vazio.");
    return;
  }

  if (!(await validarEstoqueAntesDeEnviar())) {
    return;
  }

  const nome =
    document.getElementById("nome")?.value.trim();
  const telefone =
    document.getElementById("telefone")?.value.trim();
  const tipo =
    document.getElementById("tipoPedido")?.value;
  const regiao =
    document.getElementById("regiao")?.value;
  const endereco =
    document.getElementById("endereco")?.value.trim();
  const pagamento =
    document.getElementById("pagamento")?.value;
  const troco =
    document.getElementById("troco")?.value.trim();
  const observacoes =
    document.getElementById("observacoes")?.value.trim();

  if (!nome) return alert("Digite seu nome.");
  if (!telefone) return alert("Digite seu telefone.");

  if (tipo === "Entrega" && !regiao) {
    return alert("Selecione sua região de entrega.");
  }

  if (tipo === "Entrega" && !endereco) {
    return alert("Digite o endereço para entrega.");
  }

  if (!pagamento) {
    return alert("Selecione a forma de pagamento.");
  }

  const subtotal = calcularTotal();
  const taxa = obterTaxaEntrega();
  const total = subtotal + taxa;

  let mensagem =
    "🍔 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*\n\n";

  mensagem += `👤 *Cliente:* ${nome}\n`;
  mensagem += `📱 *Telefone:* ${telefone}\n`;
  mensagem += `📦 *Pedido:* ${tipo}\n`;

  if (tipo === "Entrega") {
    mensagem += `🗺️ *Região:* ${regiao}\n`;
    mensagem += `📍 *Endereço:* ${endereco}\n`;
  }

  mensagem += "\n🧾 *ITENS DO PEDIDO*\n━━━━━━━━━━━━━━\n";

  carrinho.forEach(item => {
    mensagem +=
      `\n${item.quantidade}x ${item.nome}\n` +
      `${formatarMoeda(item.preco * item.quantidade)}\n`;
  });

  mensagem += "\n━━━━━━━━━━━━━━\n";
  mensagem += `💵 *Subtotal:* ${formatarMoeda(subtotal)}\n`;

  if (tipo === "Entrega") {
    mensagem += `🛵 *Taxa (${regiao}):* ${formatarMoeda(taxa)}\n`;
  }

  mensagem += `💰 *TOTAL:* ${formatarMoeda(total)}\n\n`;
  mensagem += `💳 *Pagamento:* ${pagamento}\n`;

  if (pagamento === "Dinheiro" && troco) {
    mensagem += `💵 *Troco para:* ${troco}\n`;
  }

  if (observacoes) {
    mensagem += `\n📝 *Observações:*\n${observacoes}\n`;
  }

  const url =
    `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");
}

async function iniciarRealtimeEstoque() {
  if (!supabaseClient) return;

  supabaseClient
    .channel("estoque-publico")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "produtos_estoque"
      },
      payload => {
        const novo = payload.new;

        if (
          novo &&
          novo.produto_id
        ) {
          estoqueProdutos[novo.produto_id] =
            Boolean(novo.disponivel);

          atualizarVisualProdutos();
        }
      }
    )
    .subscribe();
}

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    atualizarCarrinho();
    configurarTipoPedido();
    configurarPagamento();
    atualizarStatusLoja();

    await carregarEstoque();
    await iniciarRealtimeEstoque();

    setInterval(
      atualizarStatusLoja,
      30000
    );

    // Segurança extra caso o realtime caia:
    setInterval(
      carregarEstoque,
      60000
    );
  }
);
