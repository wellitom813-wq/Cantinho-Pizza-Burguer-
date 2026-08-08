/* =========================================================
   CANTINHO PIZZA BURGUER
   SCRIPT PRINCIPAL
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const NUMERO_WHATSAPP = "5587999999999";

// Horário da loja
// Domingo = 0
// Segunda = 1
// Terça = 2
// Quarta = 3
// Quinta = 4
// Sexta = 5
// Sábado = 6

const DIAS_ABERTOS = [0, 2, 3, 5, 6];

const HORA_ABERTURA = 18;
const HORA_FECHAMENTO = 22;


/* =========================================================
   CARRINHO
========================================================= */

let carrinho = [];


/* =========================================================
   FORMATAR DINHEIRO
========================================================= */

function formatarMoeda(valor) {

  return valor.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


/* =========================================================
   ADICIONAR PRODUTO
========================================================= */

function adicionarProduto(nome, preco) {

  const produtoExistente =
    carrinho.find(
      item => item.nome === nome
    );

  if (produtoExistente) {

    produtoExistente.quantidade++;

  } else {

    carrinho.push({
      nome: nome,
      preco: preco,
      quantidade: 1
    });

  }

  atualizarCarrinho();

  mostrarToast();

}


/* =========================================================
   DIMINUIR PRODUTO
========================================================= */

function removerProduto(nome) {

  const produto =
    carrinho.find(
      item => item.nome === nome
    );

  if (!produto) return;

  produto.quantidade--;

  if (produto.quantidade <= 0) {

    carrinho =
      carrinho.filter(
        item => item.nome !== nome
      );

  }

  atualizarCarrinho();

}


/* =========================================================
   EXCLUIR PRODUTO
========================================================= */

function excluirProduto(nome) {

  carrinho =
    carrinho.filter(
      item => item.nome !== nome
    );

  atualizarCarrinho();

}


/* =========================================================
   LIMPAR CARRINHO
========================================================= */

function limparCarrinho() {

  if (carrinho.length === 0) {
    return;
  }

  const confirmar =
    confirm(
      "Deseja realmente limpar todo o pedido?"
    );

  if (!confirmar) {
    return;
  }

  carrinho = [];

  atualizarCarrinho();

}


/* =========================================================
   QUANTIDADE TOTAL
========================================================= */

function calcularQuantidadeTotal() {

  return carrinho.reduce(
    (total, item) =>
      total + item.quantidade,
    0
  );

}


/* =========================================================
   VALOR TOTAL
========================================================= */

function calcularTotal() {

  return carrinho.reduce(
    (total, item) =>
      total +
      item.preco *
      item.quantidade,
    0
  );

}


/* =========================================================
   PROTEÇÃO DE TEXTO
========================================================= */

function escaparTexto(texto) {

  return texto
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");

}


/* =========================================================
   ATUALIZAR CARRINHO
========================================================= */

function atualizarCarrinho() {

  const quantidadeCarrinho =
    document.getElementById(
      "quantidadeCarrinho"
    );

  const totalCarrinho =
    document.getElementById(
      "totalCarrinho"
    );

  const totalModal =
    document.getElementById(
      "totalModal"
    );

  const listaCarrinho =
    document.getElementById(
      "listaCarrinho"
    );

  if (
    !quantidadeCarrinho ||
    !totalCarrinho ||
    !totalModal ||
    !listaCarrinho
  ) {
    return;
  }

  const quantidade =
    calcularQuantidadeTotal();

  const total =
    calcularTotal();

  quantidadeCarrinho.textContent =
    quantidade;

  totalCarrinho.textContent =
    formatarMoeda(total);

  totalModal.textContent =
    formatarMoeda(total);


  /* CARRINHO VAZIO */

  if (carrinho.length === 0) {

    listaCarrinho.innerHTML = `
      <div class="carrinho-vazio">

        <span>🛒</span>

        <strong>
          Seu carrinho está vazio
        </strong>

        <p>
          Adicione seus produtos favoritos.
        </p>

      </div>
    `;

    return;

  }


  /* PRODUTOS */

  listaCarrinho.innerHTML = "";

  carrinho.forEach(item => {

    const subtotal =
      item.preco *
      item.quantidade;

    const produtoHTML =
      document.createElement("div");

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
            ${formatarMoeda(item.preco)}
            cada
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
            onclick="
              removerProduto(
                '${escaparTexto(item.nome)}'
              )
            "
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
            onclick="
              adicionarProduto(
                '${escaparTexto(item.nome)}',
                ${item.preco}
              )
            "
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
          onclick="
            excluirProduto(
              '${escaparTexto(item.nome)}'
            )
          "
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

    listaCarrinho.appendChild(
      produtoHTML
    );

  });


  /* BOTÃO LIMPAR */

  const botaoLimpar =
    document.createElement("button");

  botaoLimpar.textContent =
    "Limpar pedido";

  botaoLimpar.onclick =
    limparCarrinho;

  botaoLimpar.style.cssText = `
    margin-top:18px;
    width:100%;
    border:1px solid #333;
    border-radius:10px;
    padding:10px;
    background:#191919;
    color:#aaa;
    font-weight:bold;
  `;

  listaCarrinho.appendChild(
    botaoLimpar
  );

}


/* =========================================================
   ABRIR CARRINHO
========================================================= */

function abrirCarrinho() {

  const modal =
    document.getElementById(
      "modalCarrinho"
    );

  if (!modal) return;

  modal.classList.add(
    "ativo"
  );

  document.body.style.overflow =
    "hidden";

}


/* =========================================================
   FECHAR CARRINHO
========================================================= */

function fecharCarrinho() {

  const modal =
    document.getElementById(
      "modalCarrinho"
    );

  if (!modal) return;

  modal.classList.remove(
    "ativo"
  );

  document.body.style.overflow =
    "";

}


/* =========================================================
   IR PARA FINALIZAÇÃO
========================================================= */

function irParaFinalizacao() {

  if (carrinho.length === 0) {

    alert(
      "Seu carrinho está vazio. Adicione pelo menos um produto."
    );

    return;

  }

  fecharCarrinho();

  const finalizacao =
    document.getElementById(
      "finalizacao"
    );

  if (!finalizacao) return;

  finalizacao.classList.add(
    "ativo"
  );

  finalizacao.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =========================================================
   NOTIFICAÇÃO
========================================================= */

function mostrarToast() {

  const toast =
    document.getElementById(
      "toast"
    );

  if (!toast) return;

  toast.classList.add(
    "ativo"
  );

  clearTimeout(
    window.timerToast
  );

  window.timerToast =
    setTimeout(
      function () {

        toast.classList.remove(
          "ativo"
        );

      },
      1800
    );

}


/* =========================================================
   STATUS AUTOMÁTICO DA LOJA
========================================================= */

function atualizarStatusLoja() {

  const agora =
    new Date();

  const dia =
    agora.getDay();

  const hora =
    agora.getHours();

  const minutos =
    agora.getMinutes();

  const horarioAtual =
    hora * 60 + minutos;

  const abertura =
    HORA_ABERTURA * 60;

  const fechamento =
    HORA_FECHAMENTO * 60;


  const nomesDias = {
    0: "domingo",
    1: "segunda-feira",
    2: "terça-feira",
    3: "quarta-feira",
    4: "quinta-feira",
    5: "sexta-feira",
    6: "sábado"
  };


  const status =
    document.querySelector(
      ".status-loja"
    );

  if (!status) return;


  const estaAberto =
    DIAS_ABERTOS.includes(dia) &&
    horarioAtual >= abertura &&
    horarioAtual < fechamento;


  /* LOJA ABERTA */

  if (estaAberto) {

    status.innerHTML = `
      <span
        class="status-bolinha"
      ></span>

      <span>
        Aberto • Fecha às 22h
      </span>
    `;

    status.classList.remove(
      "fechado"
    );

    return;

  }


  let proximaAbertura = "";


  /* MESMO DIA ANTES DAS 18H */

  if (
    DIAS_ABERTOS.includes(dia) &&
    horarioAtual < abertura
  ) {

    proximaAbertura =
      "Abre hoje às 18h";

  } else {

    /* PROCURA PRÓXIMO DIA */

    for (
      let i = 1;
      i <= 7;
      i++
    ) {

      const proximoDia =
        (dia + i) % 7;

      if (
        DIAS_ABERTOS.includes(
          proximoDia
        )
      ) {

        proximaAbertura =
          `Abre ${nomesDias[proximoDia]} às 18h`;

        break;

      }

    }

  }


  status.innerHTML = `
    <span
      class="status-bolinha"
    ></span>

    <span>
      ${proximaAbertura}
    </span>
  `;

  status.classList.add(
    "fechado"
  );

}


/* =========================================================
   ENTREGA OU RETIRADA
========================================================= */

function configurarTipoPedido() {

  const tipoPedido =
    document.getElementById(
      "tipoPedido"
    );

  const endereco =
    document.getElementById(
      "endereco"
    );

  if (
    !tipoPedido ||
    !endereco
  ) {
    return;
  }


  tipoPedido.addEventListener(
    "change",
    function () {

      if (
        this.value === "Retirada"
      ) {

        endereco.disabled = true;

        endereco.value = "";

        endereco.placeholder =
          "Não necessário para retirada";

        endereco.style.opacity =
          "0.45";

      } else {

        endereco.disabled = false;

        endereco.placeholder =
          "Rua, número e bairro";

        endereco.style.opacity =
          "1";

      }

    }
  );

}


/* =========================================================
   PAGAMENTO / TROCO
========================================================= */

function configurarPagamento() {

  const pagamento =
    document.getElementById(
      "pagamento"
    );

  const troco =
    document.getElementById(
      "troco"
    );

  if (
    !pagamento ||
    !troco
  ) {
    return;
  }


  troco.disabled = true;

  troco.style.opacity =
    "0.45";


  pagamento.addEventListener(
    "change",
    function () {

      if (
        this.value === "Dinheiro"
      ) {

        troco.disabled = false;

        troco.placeholder =
          "Ex: R$ 50,00";

        troco.style.opacity =
          "1";

      } else {

        troco.value = "";

        troco.disabled = true;

        troco.placeholder =
          "Somente para pagamento em dinheiro";

        troco.style.opacity =
          "0.45";

      }

    }
  );

}


/* =========================================================
   MÁSCARA DO TELEFONE
========================================================= */

function configurarTelefone() {

  const telefone =
    document.getElementById(
      "telefone"
    );

  if (!telefone) return;


  telefone.addEventListener(
    "input",
    function () {

      let valor =
        this.value.replace(
          /\D/g,
          ""
        );

      valor =
        valor.substring(
          0,
          11
        );


      if (
        valor.length > 10
      ) {

        valor =
          valor.replace(
            /^(\d{2})(\d{5})(\d{4})$/,
            "($1) $2-$3"
          );

      } else if (
        valor.length > 6
      ) {

        valor =
          valor.replace(
            /^(\d{2})(\d{4})(\d{0,4})$/,
            "($1) $2-$3"
          );

      } else if (
        valor.length > 2
      ) {

        valor =
          valor.replace(
            /^(\d{2})(\d+)/,
            "($1) $2"
          );

      }


      this.value =
        valor;

    }
  );

}


/* =========================================================
   FINALIZAR PELO WHATSAPP
========================================================= */

function finalizarPedido() {

  if (carrinho.length === 0) {

    alert(
      "Adicione pelo menos um produto antes de finalizar."
    );

    return;

  }


  const nome =
    document
      .getElementById("nome")
      ?.value
      .trim();


  const telefone =
    document
      .getElementById("telefone")
      ?.value
      .trim();


  const tipoPedido =
    document
      .getElementById("tipoPedido")
      ?.value;


  const endereco =
    document
      .getElementById("endereco")
      ?.value
      .trim();


  const pagamento =
    document
      .getElementById("pagamento")
      ?.value;


  const troco =
    document
      .getElementById("troco")
      ?.value
      .trim();


  const observacoes =
    document
      .getElementById("observacoes")
      ?.value
      .trim();


  /* VALIDAÇÕES */

  if (!nome) {

    alert(
      "Digite seu nome."
    );

    document
      .getElementById("nome")
      ?.focus();

    return;

  }


  if (!telefone) {

    alert(
      "Digite seu telefone."
    );

    document
      .getElementById("telefone")
      ?.focus();

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
      ?.focus();

    return;

  }


  if (!pagamento) {

    alert(
      "Selecione a forma de pagamento."
    );

    return;

  }


  const total =
    calcularTotal();


  /* =====================================================
     MENSAGEM
  ===================================================== */

  let mensagem =
    "🍔 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*\n\n";


  mensagem +=
    `👤 *Cliente:* ${nome}\n`;


  mensagem +=
    `📱 *Telefone:* ${telefone}\n`;


  mensagem +=
    `📦 *Tipo:* ${tipoPedido}\n`;


  if (
    tipoPedido === "Entrega"
  ) {

    mensagem +=
      `📍 *Endereço:* ${endereco}\n`;

  }


  mensagem +=
    "\n🧾 *ITENS DO PEDIDO*\n";

  mensagem +=
    "━━━━━━━━━━━━━━\n";


  carrinho.forEach(
    item => {

      const subtotal =
        item.preco *
        item.quantidade;


      mensagem +=
        `\n${item.quantidade}x ${item.nome}\n`;


      mensagem +=
        `${formatarMoeda(subtotal)}\n`;

    }
  );


  mensagem +=
    "\n━━━━━━━━━━━━━━\n";


  mensagem +=
    `💰 *TOTAL: ${formatarMoeda(total)}*\n\n`;


  mensagem +=
    `💳 *Pagamento:* ${pagamento}\n`;


  if (
    pagamento === "Dinheiro" &&
    troco
  ) {

    mensagem +=
      `💵 *Troco para:* ${troco}\n`;

  }


  if (observacoes) {

    mensagem +=
      `\n📝 *Observações:*\n${observacoes}\n`;

  }


  mensagem +=
    "\n✅ Pedido realizado pelo site.";


  /* =====================================================
     ABRIR WHATSAPP
  ===================================================== */

  const mensagemCodificada =
    encodeURIComponent(
      mensagem
    );


  const link =
    `https://wa.me/${NUMERO_WHATSAPP}?text=${mensagemCodificada}`;


  window.open(
    link,
    "_blank"
  );

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    atualizarCarrinho();

    atualizarStatusLoja();

    configurarTipoPedido();

    configurarPagamento();

    configurarTelefone();


    /* ATUALIZA STATUS A CADA 1 MINUTO */

    setInterval(
      atualizarStatusLoja,
      60000
    );

  }
);
