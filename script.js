let carrinho = [];

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function adicionarProduto(nome, preco) {
  const produtoExistente = carrinho.find(
    item => item.nome === nome
  );

  if (produtoExistente) {
    produtoExistente.quantidade += 1;
  } else {
    carrinho.push({
      nome,
      preco,
      quantidade: 1
    });
  }

  atualizarCarrinho();
  mostrarToast();
}

function removerProduto(nome) {
  const produto = carrinho.find(
    item => item.nome === nome
  );

  if (!produto) return;

  produto.quantidade -= 1;

  if (produto.quantidade <= 0) {
    carrinho = carrinho.filter(
      item => item.nome !== nome
    );
  }

  atualizarCarrinho();
}

function excluirProduto(nome) {
  carrinho = carrinho.filter(
    item => item.nome !== nome
  );

  atualizarCarrinho();
}

function limparCarrinho() {
  carrinho = [];
  atualizarCarrinho();
}

function calcularQuantidadeTotal() {
  return carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  );
}

function calcularTotal() {
  return carrinho.reduce(
    (total, item) =>
      total + item.preco * item.quantidade,
    0
  );
}

function atualizarCarrinho() {
  const quantidadeCarrinho =
    document.getElementById("quantidadeCarrinho");

  const totalCarrinho =
    document.getElementById("totalCarrinho");

  const totalModal =
    document.getElementById("totalModal");

  const listaCarrinho =
    document.getElementById("listaCarrinho");

  const quantidade = calcularQuantidadeTotal();
  const total = calcularTotal();

  quantidadeCarrinho.textContent = quantidade;
  totalCarrinho.textContent = formatarMoeda(total);
  totalModal.textContent = formatarMoeda(total);

  if (carrinho.length === 0) {
    listaCarrinho.innerHTML = `
      <div class="carrinho-vazio">
        <span>🛒</span>
        <strong>Seu carrinho está vazio</strong>
        <p>Adicione seus produtos favoritos.</p>
      </div>
    `;

    return;
  }

  listaCarrinho.innerHTML = "";

  carrinho.forEach(item => {
    const subtotal =
      item.preco * item.quantidade;

    const produtoHTML = document.createElement("div");

    produtoHTML.style.cssText = `
      padding: 15px 0;
      border-bottom: 1px solid #242424;
    `;

    produtoHTML.innerHTML = `
      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:12px;
          margin-bottom:10px;
        "
      >

        <div>
          <strong
            style="
              display:block;
              margin-bottom:3px;
            "
          >
            ${item.nome}
          </strong>

          <span
            style="
              color:#8f8f8f;
              font-size:12px;
            "
          >
            ${formatarMoeda(item.preco)} cada
          </span>
        </div>

        <strong
          style="
            color:#ff7a1a;
            white-space:nowrap;
          "
        >
          ${formatarMoeda(subtotal)}
        </strong>

      </div>

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
        "
      >

        <div
          style="
            display:flex;
            align-items:center;
            gap:9px;
          "
        >

          <button
            onclick="removerProduto('${escaparTexto(item.nome)}')"
            style="
              width:32px;
              height:32px;
              border:0;
              border-radius:9px;
              background:#242424;
              color:white;
              font-weight:bold;
            "
          >
            −
          </button>

          <strong>
            ${item.quantidade}
          </strong>

          <button
            onclick="adicionarProduto('${escaparTexto(item.nome)}', ${item.preco})"
            style="
              width:32px;
              height:32px;
              border:0;
              border-radius:9px;
              background:#ff4c0d;
              color:white;
              font-weight:bold;
            "
          >
            +
          </button>

        </div>

        <button
          onclick="excluirProduto('${escaparTexto(item.nome)}')"
          style="
            border:0;
            background:transparent;
            color:#ff6767;
            font-size:12px;
            font-weight:bold;
          "
        >
          Remover
        </button>

      </div>
    `;

    listaCarrinho.appendChild(produtoHTML);
  });

  const limparHTML = document.createElement("button");

  limparHTML.textContent = "Limpar pedido";

  limparHTML.onclick = limparCarrinho;

  limparHTML.style.cssText = `
    margin-top:18px;
    width:100%;
    border:1px solid #333;
    border-radius:10px;
    padding:10px;
    background:#191919;
    color:#aaa;
    font-weight:bold;
  `;

  listaCarrinho.appendChild(limparHTML);
}

function escaparTexto(texto) {
  return texto
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}

function abrirCarrinho() {
  document
    .getElementById("modalCarrinho")
    .classList.add("ativo");

  document.body.style.overflow = "hidden";
}

function fecharCarrinho() {
  document
    .getElementById("modalCarrinho")
    .classList.remove("ativo");

  document.body.style.overflow = "";
}

function irParaFinalizacao() {
  if (carrinho.length === 0) {
    alert(
      "Seu carrinho está vazio. Adicione pelo menos um produto."
    );

    return;
  }

  fecharCarrinho();

  const finalizacao =
    document.getElementById("finalizacao");

  finalizacao.classList.add("ativo");

  finalizacao.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function mostrarToast() {
  const toast =
    document.getElementById("toast");

  toast.classList.add("ativo");

  clearTimeout(window.timerToast);

  window.timerToast = setTimeout(() => {
    toast.classList.remove("ativo");
  }, 1800);
}

function finalizarPedido() {
  if (carrinho.length === 0) {
    alert(
      "Adicione pelo menos um produto antes de finalizar."
    );

    return;
  }

  const nome =
    document.getElementById("nome").value.trim();

  const telefone =
    document.getElementById("telefone").value.trim();

  const tipoPedido =
    document.getElementById("tipoPedido").value;

  const endereco =
    document.getElementById("endereco").value.trim();

  const pagamento =
    document.getElementById("pagamento").value;

  const troco =
    document.getElementById("troco").value.trim();

  const observacoes =
    document.getElementById("observacoes").value.trim();

  if (!nome) {
    alert("Digite seu nome.");

    document
      .getElementById("nome")
      .focus();

    return;
  }

  if (!telefone) {
    alert("Digite seu telefone.");

    document
      .getElementById("telefone")
      .focus();

    return;
  }

  if (
    tipoPedido === "Entrega" &&
    !endereco
  ) {
    alert(
      "Digite o endereço para entrega."
    );

    document
      .getElementById("endereco")
      .focus();

    return;
  }

  if (!pagamento) {
    alert(
      "Selecione a forma de pagamento."
    );

    document
      .getElementById("pagamento")
      .focus();

    return;
  }

  const total = calcularTotal();

  let mensagem = "";

  mensagem +=
    "🍔 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*%0A%0A";

  mensagem +=
    `👤 *Cliente:* ${encodeURIComponent(nome)}%0A`;

  mensagem +=
    `📱 *Telefone:* ${encodeURIComponent(telefone)}%0A`;

  mensagem +=
    `📦 *Tipo:* ${encodeURIComponent(tipoPedido)}%0A`;

  if (tipoPedido === "Entrega") {
    mensagem +=
      `📍 *Endereço:* ${encodeURIComponent(endereco)}%0A`;
  }

  mensagem += "%0A";
  mensagem += "🧾 *ITENS DO PEDIDO*%0A";
  mensagem += "━━━━━━━━━━━━━━%0A";

  carrinho.forEach(item => {
    const subtotal =
      item.preco * item.quantidade;

    mensagem +=
      `${item.quantidade}x ${encodeURIComponent(item.nome)}%0A`;

    mensagem +=
      `${encodeURIComponent(
        formatarMoeda(subtotal)
      )}%0A%0A`;
  });

  mensagem += "━━━━━━━━━━━━━━%0A";

  mensagem +=
    `💰 *TOTAL:* ${encodeURIComponent(
      formatarMoeda(total)
    )}%0A%0A`;

  mensagem +=
    `💳 *Pagamento:* ${encodeURIComponent(pagamento)}%0A`;

  if (
    pagamento === "Dinheiro" &&
    troco
  ) {
    mensagem +=
      `💵 *Troco para:* ${encodeURIComponent(troco)}%0A`;
  }

  if (observacoes) {
    mensagem +=
      `%0A📝 *Observações:*%0A${encodeURIComponent(observacoes)}%0A`;
  }

  mensagem += "%0A";
  mensagem +=
    "✅ Pedido realizado pelo site.";

  /*
    COLOQUE AQUI O NÚMERO
    DO WHATSAPP DA HAMBURGUERIA.

    Formato:
    55 + DDD + número

    Exemplo:
    5587999999999
  */

  const numeroWhatsApp =
    "5587999999999";

  const linkWhatsApp =
    `https://wa.me/${numeroWhatsApp}?text=${mensagem}`;

  window.open(
    linkWhatsApp,
    "_blank"
  );
}

/* =========================
   ENTREGA / RETIRADA
========================= */

const tipoPedido =
  document.getElementById("tipoPedido");

const campoEndereco =
  document.getElementById("endereco");

tipoPedido.addEventListener(
  "change",
  function () {

    if (
      this.value === "Retirada"
    ) {
      campoEndereco.disabled = true;

      campoEndereco.value = "";

      campoEndereco.placeholder =
        "Não necessário para retirada";

      campoEndereco.style.opacity =
        "0.45";
    } else {
      campoEndereco.disabled = false;

      campoEndereco.placeholder =
        "Rua, número e bairro";

      campoEndereco.style.opacity =
        "1";
    }

  }
);

/* =========================
   TROCO
========================= */

const pagamento =
  document.getElementById("pagamento");

const troco =
  document.getElementById("troco");

pagamento.addEventListener(
  "change",
  function () {

    if (
      this.value !== "Dinheiro"
    ) {
      troco.value = "";

      troco.disabled = true;

      troco.placeholder =
        "Somente para pagamento em dinheiro";

      troco.style.opacity =
        "0.45";
    } else {
      troco.disabled = false;

      troco.placeholder =
        "Ex: R$ 50,00";

      troco.style.opacity =
        "1";
    }

  }
);

/* =========================
   TELEFONE
========================= */

document
  .getElementById("telefone")
  .addEventListener(
    "input",
    function () {

      let valor =
        this.value.replace(/\D/g, "");

      valor =
        valor.substring(0, 11);

      if (valor.length > 10) {
        valor =
          valor.replace(
            /^(\d{2})(\d{5})(\d{4})$/,
            "($1) $2-$3"
          );
      } else if (valor.length > 6) {
        valor =
          valor.replace(
            /^(\d{2})(\d{4})(\d{0,4})$/,
            "($1) $2-$3"
          );
      } else if (valor.length > 2) {
        valor =
          valor.replace(
            /^(\d{2})(\d+)/,
            "($1) $2"
          );
      }

      this.value = valor;

    }
  );

/* =========================
   INICIALIZAÇÃO
========================= */

atualizarCarrinho();

troco.disabled = true;
troco.style.opacity = "0.45";

/* =========================
   STATUS AUTOMÁTICO DA LOJA
========================= */

function atualizarStatusLoja() {

  const agora = new Date();

  const dia = agora.getDay();
  const hora = agora.getHours();
  const minutos = agora.getMinutes();

  /*
    Dias:
    0 = Domingo
    1 = Segunda
    2 = Terça
    3 = Quarta
    4 = Quinta
    5 = Sexta
    6 = Sábado
  */

  const diasAbertos = [0, 2, 3, 5, 6];

  const horarioAtual =
    hora * 60 + minutos;

  const abertura = 18 * 60;
  const fechamento = 22 * 60;

  const estaAberto =
    diasAbertos.includes(dia) &&
    horarioAtual >= abertura &&
    horarioAtual < fechamento;

  const status =
    document.querySelector(".status-loja");

  if (!status) return;

  if (estaAberto) {

    status.innerHTML = `
      <span class="status-bolinha"></span>
      <span>Aberto • Fecha às 22h</span>
    `;

    status.classList.remove("fechado");

  } else {

    status.innerHTML = `
      <span class="status-bolinha"></span>
      <span>Fechado</span>
    `;

    status.classList.add("fechado");
  }
}

atualizarStatusLoja();

/* Atualiza automaticamente a cada minuto */

setInterval(
  atualizarStatusLoja,
  60000
);
