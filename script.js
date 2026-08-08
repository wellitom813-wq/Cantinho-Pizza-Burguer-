/* =========================================================
   CANTINHO PIZZA BURGUER
   SCRIPT COMPLETO
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

/*
  COLOQUE AQUI O WHATSAPP DA HAMBURGUERIA

  Formato:
  55 + DDD + número

  Exemplo:
  5587999999999
*/

const NUMERO_WHATSAPP =
  "5587999999999";


/* =========================================================
   HORÁRIO DE FUNCIONAMENTO
========================================================= */

/*
  0 = Domingo
  1 = Segunda
  2 = Terça
  3 = Quarta
  4 = Quinta
  5 = Sexta
  6 = Sábado
*/

const DIAS_ABERTOS =
  [0, 2, 3, 5, 6];

const HORA_ABERTURA =
  18;

const HORA_FECHAMENTO =
  22;


/* =========================================================
   TAXAS DE ENTREGA
========================================================= */

const TAXAS_ENTREGA = {

  N1: 4.00,

  N3: 3.00,

  N5: 5.00,

  C2: 6.00

};


/* =========================================================
   CARRINHO
========================================================= */

let carrinho = [];


/* =========================================================
   VERIFICAR SE A LOJA ESTÁ ABERTA
========================================================= */

function lojaEstaAberta() {

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


  return (

    DIAS_ABERTOS.includes(dia) &&

    horarioAtual >= abertura &&

    horarioAtual < fechamento

  );

}


/* =========================================================
   AVISO LOJA FECHADA
========================================================= */

function avisarLojaFechada() {

  alert(
    "🔴 LOJA FECHADA NO MOMENTO\n\n" +

    "Não estamos recebendo pedidos agora.\n\n" +

    "🕕 Horário de funcionamento:\n" +

    "Terça-feira: 18h às 22h\n" +

    "Quarta-feira: 18h às 22h\n" +

    "Sexta-feira: 18h às 22h\n" +

    "Sábado: 18h às 22h\n" +

    "Domingo: 18h às 22h"
  );

}


/* =========================================================
   BLOQUEAR / LIBERAR BOTÕES
========================================================= */

function atualizarBotoesLoja() {

  const aberta =
    lojaEstaAberta();


  const botoesAdicionar =
    document.querySelectorAll(
      ".btn-adicionar"
    );


  botoesAdicionar.forEach(
    botao => {

      if (aberta) {

        botao.disabled =
          false;


        botao.classList.remove(
          "loja-fechada"
        );


        botao.textContent =
          "Adicionar +";

      } else {

        botao.disabled =
          true;


        botao.classList.add(
          "loja-fechada"
        );


        botao.textContent =
          "Loja fechada";

      }

    }
  );


  /*
    Carrinho flutuante
  */

  const botaoCarrinho =
    document.getElementById(
      "botaoCarrinho"
    );


  if (botaoCarrinho) {

    if (aberta) {

      botaoCarrinho.classList.remove(
        "carrinho-bloqueado"
      );

    } else {

      botaoCarrinho.classList.add(
        "carrinho-bloqueado"
      );

    }

  }


  /*
    Botão WhatsApp
  */

  const botaoWhatsapp =
    document.querySelector(
      ".btn-whatsapp"
    );


  if (botaoWhatsapp) {

    if (aberta) {

      botaoWhatsapp.disabled =
        false;


      botaoWhatsapp.classList.remove(
        "loja-fechada"
      );


      botaoWhatsapp.innerHTML =
        `
          <span>💬</span>
          Finalizar pedido pelo WhatsApp
        `;

    } else {

      botaoWhatsapp.disabled =
        true;


      botaoWhatsapp.classList.add(
        "loja-fechada"
      );


      botaoWhatsapp.innerHTML =
        `
          <span>🔒</span>
          Loja fechada
        `;

    }

  }

}


/* =========================================================
   FORMATAR MOEDA
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

function adicionarProduto(
  nome,
  preco
) {

  /*
    TRAVA DE SEGURANÇA
  */

  if (
    !lojaEstaAberta()
  ) {

    avisarLojaFechada();

    atualizarBotoesLoja();

    return;

  }


  const produtoExistente =
    carrinho.find(
      item =>
        item.nome === nome
    );


  if (
    produtoExistente
  ) {

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
      item =>
        item.nome === nome
    );


  if (!produto) {
    return;
  }


  produto.quantidade--;


  if (
    produto.quantidade <= 0
  ) {

    carrinho =
      carrinho.filter(
        item =>
          item.nome !== nome
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
      item =>
        item.nome !== nome
    );


  atualizarCarrinho();

}


/* =========================================================
   LIMPAR CARRINHO
========================================================= */

function limparCarrinho() {

  if (
    carrinho.length === 0
  ) {

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

    (
      total,
      item
    ) =>

      total +
      item.quantidade,

    0

  );

}


/* =========================================================
   SUBTOTAL
========================================================= */

function calcularTotal() {

  return carrinho.reduce(

    (
      total,
      item
    ) =>

      total +
      item.preco *
      item.quantidade,

    0

  );

}


/* =========================================================
   TAXA DE ENTREGA
========================================================= */

function obterTaxaEntrega() {

  const tipoPedido =
    document
      .getElementById(
        "tipoPedido"
      )
      ?.value;


  const regiao =
    document
      .getElementById(
        "regiao"
      )
      ?.value;


  if (
    tipoPedido !== "Entrega"
  ) {

    return 0;

  }


  if (!regiao) {

    return 0;

  }


  return (
    TAXAS_ENTREGA[regiao]
    || 0
  );

}


/* =========================================================
   TOTAL FINAL
========================================================= */

function calcularTotalFinal() {

  return (
    calcularTotal() +
    obterTaxaEntrega()
  );

}


/* =========================================================
   RESUMO FINAL
========================================================= */

function atualizarResumoFinal() {

  const subtotal =
    calcularTotal();


  const taxa =
    obterTaxaEntrega();


  const totalFinal =
    subtotal + taxa;


  const subtotalElemento =
    document.getElementById(
      "subtotalPedido"
    );


  const taxaElemento =
    document.getElementById(
      "taxaEntrega"
    );


  const totalElemento =
    document.getElementById(
      "totalFinalPedido"
    );


  if (
    subtotalElemento
  ) {

    subtotalElemento.textContent =
      formatarMoeda(
        subtotal
      );

  }


  if (
    taxaElemento
  ) {

    taxaElemento.textContent =
      formatarMoeda(
        taxa
      );

  }


  if (
    totalElemento
  ) {

    totalElemento.textContent =
      formatarMoeda(
        totalFinal
      );

  }

}


/* =========================================================
   ESCAPAR TEXTO
========================================================= */

function escaparTexto(texto) {

  return texto
    .replaceAll(
      "\\",
      "\\\\"
    )
    .replaceAll(
      "'",
      "\\'"
    );

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


  const subtotal =
    calcularTotal();


  quantidadeCarrinho.textContent =
    quantidade;


  totalCarrinho.textContent =
    formatarMoeda(
      subtotal
    );


  totalModal.textContent =
    formatarMoeda(
      subtotal
    );


  atualizarResumoFinal();


  if (
    carrinho.length === 0
  ) {

    listaCarrinho.innerHTML =
      `

        <div class="carrinho-vazio">

          <span>
            🛒
          </span>

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


  listaCarrinho.innerHTML =
    "";


  carrinho.forEach(
    item => {

      const subtotalItem =
        item.preco *
        item.quantidade;


      const elemento =
        document.createElement(
          "div"
        );


      elemento.style.cssText =
        `

          padding:15px 0;

          border-bottom:
            1px solid #242424;

        `;


      elemento.innerHTML =
        `

          <div
            style="
              display:flex;
              justify-content:space-between;
              gap:12px;
              margin-bottom:10px;
            "
          >

            <div>

              <strong>
                ${item.nome}
              </strong>

              <div
                style="
                  color:#888;
                  font-size:12px;
                  margin-top:4px;
                "
              >

                ${formatarMoeda(item.preco)}
                cada

              </div>

            </div>


            <strong
              style="
                color:#ff7a1a;
              "
            >

              ${formatarMoeda(subtotalItem)}

            </strong>

          </div>


          <div
            style="
              display:flex;
              align-items:center;
              justify-content:space-between;
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
              "
            >

              Remover

            </button>

          </div>

        `;


      listaCarrinho.appendChild(
        elemento
      );

    }
  );


  const limpar =
    document.createElement(
      "button"
    );


  limpar.textContent =
    "Limpar pedido";


  limpar.onclick =
    limparCarrinho;


  limpar.style.cssText =
    `

      margin-top:18px;

      width:100%;

      border:
        1px solid #333;

      border-radius:10px;

      padding:10px;

      background:#191919;

      color:#aaa;

    `;


  listaCarrinho.appendChild(
    limpar
  );

}


/* =========================================================
   ABRIR CARRINHO
========================================================= */

function abrirCarrinho() {

  if (
    !lojaEstaAberta() &&
    carrinho.length === 0
  ) {

    avisarLojaFechada();

    return;

  }


  document
    .getElementById(
      "modalCarrinho"
    )
    ?.classList.add(
      "ativo"
    );


  document.body.style.overflow =
    "hidden";

}


/* =========================================================
   FECHAR CARRINHO
========================================================= */

function fecharCarrinho() {

  document
    .getElementById(
      "modalCarrinho"
    )
    ?.classList.remove(
      "ativo"
    );


  document.body.style.overflow =
    "";

}


/* =========================================================
   IR PARA FINALIZAÇÃO
========================================================= */

function irParaFinalizacao() {

  if (
    !lojaEstaAberta()
  ) {

    avisarLojaFechada();

    return;

  }


  if (
    carrinho.length === 0
  ) {

    alert(
      "Adicione pelo menos um produto."
    );

    return;

  }


  fecharCarrinho();


  const finalizacao =
    document.getElementById(
      "finalizacao"
    );


  finalizacao
    ?.classList.add(
      "ativo"
    );


  atualizarResumoFinal();


  finalizacao
    ?.scrollIntoView({

      behavior: "smooth",

      block: "start"

    });

}


/* =========================================================
   TOAST
========================================================= */

function mostrarToast() {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    return;

  }


  toast.classList.add(
    "ativo"
  );


  clearTimeout(
    window.timerToast
  );


  window.timerToast =
    setTimeout(

      () => {

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


  const status =
    document.querySelector(
      ".status-loja"
    );


  if (!status) {

    atualizarBotoesLoja();

    return;

  }


  const nomesDias = {

    0: "domingo",

    1: "segunda-feira",

    2: "terça-feira",

    3: "quarta-feira",

    4: "quinta-feira",

    5: "sexta-feira",

    6: "sábado"

  };


  const aberta =
    lojaEstaAberta();


  if (
    aberta
  ) {

    status.innerHTML =
      `

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


    atualizarBotoesLoja();


    return;

  }


  let proximaAbertura =
    "";


  /*
    MESMO DIA ANTES DAS 18H
  */

  if (

    DIAS_ABERTOS.includes(dia) &&

    horarioAtual < abertura

  ) {

    proximaAbertura =
      "Abre hoje às 18h";

  } else {

    /*
      PROCURAR PRÓXIMO DIA ABERTO
    */

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


  status.innerHTML =
    `

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


  atualizarBotoesLoja();

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


  const campoRegiao =
    document.getElementById(
      "campoRegiao"
    );


  const regiao =
    document.getElementById(
      "regiao"
    );


  if (
    !tipoPedido ||
    !endereco
  ) {

    return;

  }


  function atualizarCampos() {

    if (
      tipoPedido.value ===
      "Retirada"
    ) {

      endereco.disabled =
        true;


      endereco.value =
        "";


      endereco.placeholder =
        "Não necessário para retirada";


      endereco.style.opacity =
        "0.45";


      if (
        campoRegiao
      ) {

        campoRegiao.style.display =
          "none";

      }


      if (
        regiao
      ) {

        regiao.value =
          "";

      }

    } else {

      endereco.disabled =
        false;


      endereco.placeholder =
        "Rua, número, bairro e referência";


      endereco.style.opacity =
        "1";


      if (
        campoRegiao
      ) {

        campoRegiao.style.display =
          "flex";

      }

    }


    atualizarResumoFinal();

  }


  tipoPedido.addEventListener(

    "change",

    atualizarCampos

  );


  regiao?.addEventListener(

    "change",

    atualizarResumoFinal

  );


  atualizarCampos();

}


/* =========================================================
   PAGAMENTO
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


  troco.disabled =
    true;


  troco.style.opacity =
    "0.45";


  pagamento.addEventListener(

    "change",

    function () {

      if (
        pagamento.value ===
        "Dinheiro"
      ) {

        troco.disabled =
          false;


        troco.style.opacity =
          "1";


        troco.placeholder =
          "Ex: R$ 50,00";

      } else {

        troco.disabled =
          true;


        troco.value =
          "";


        troco.style.opacity =
          "0.45";


        troco.placeholder =
          "Somente para dinheiro";

      }

    }

  );

}


/* =========================================================
   TELEFONE
========================================================= */

function configurarTelefone() {

  const telefone =
    document.getElementById(
      "telefone"
    );


  if (!telefone) {

    return;

  }


  telefone.addEventListener(

    "input",

    function () {

      let valor =
        telefone.value.replace(
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


      telefone.value =
        valor;

    }

  );

}


/* =========================================================
   FINALIZAR PEDIDO
========================================================= */

function finalizarPedido() {

  /*
    TRAVA MAIS IMPORTANTE
  */

  if (
    !lojaEstaAberta()
  ) {

    alert(
      "🔴 LOJA FECHADA\n\n" +

      "Não é possível enviar pedidos pelo WhatsApp fora do horário de funcionamento."
    );


    atualizarBotoesLoja();


    return;

  }


  if (
    carrinho.length === 0
  ) {

    alert(
      "Seu carrinho está vazio."
    );

    return;

  }


  const nome =
    document
      .getElementById(
        "nome"
      )
      ?.value
      .trim();


  const telefone =
    document
      .getElementById(
        "telefone"
      )
      ?.value
      .trim();


  const tipoPedido =
    document
      .getElementById(
        "tipoPedido"
      )
      ?.value;


  const regiao =
    document
      .getElementById(
        "regiao"
      )
      ?.value;


  const endereco =
    document
      .getElementById(
        "endereco"
      )
      ?.value
      .trim();


  const pagamento =
    document
      .getElementById(
        "pagamento"
      )
      ?.value;


  const troco =
    document
      .getElementById(
        "troco"
      )
      ?.value
      .trim();


  const observacoes =
    document
      .getElementById(
        "observacoes"
      )
      ?.value
      .trim();


  /*
    VALIDAÇÕES
  */

  if (!nome) {

    alert(
      "Digite seu nome."
    );

    return;

  }


  if (!telefone) {

    alert(
      "Digite seu telefone."
    );

    return;

  }


  if (

    tipoPedido === "Entrega" &&

    !regiao

  ) {

    alert(
      "Selecione sua região de entrega."
    );


    document
      .getElementById(
        "regiao"
      )
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

    return;

  }


  if (!pagamento) {

    alert(
      "Selecione a forma de pagamento."
    );

    return;

  }


  /*
    VALORES
  */

  const subtotal =
    calcularTotal();


  const taxaEntrega =
    obterTaxaEntrega();


  const totalFinal =
    subtotal +
    taxaEntrega;


  /*
    MONTAR MENSAGEM
  */

  let mensagem =
    "🍔 *NOVO PEDIDO - CANTINHO PIZZA BURGUER*\n\n";


  mensagem +=
    `👤 *Cliente:* ${nome}\n`;


  mensagem +=
    `📱 *Telefone:* ${telefone}\n`;


  mensagem +=
    `📦 *Pedido:* ${tipoPedido}\n`;


  if (
    tipoPedido === "Entrega"
  ) {

    mensagem +=
      `🗺️ *Região:* ${regiao}\n`;


    mensagem +=
      `📍 *Endereço:* ${endereco}\n`;

  }


  mensagem +=
    "\n🧾 *ITENS DO PEDIDO*\n";


  mensagem +=
    "━━━━━━━━━━━━━━\n";


  carrinho.forEach(
    item => {

      const subtotalItem =
        item.preco *
        item.quantidade;


      mensagem +=
        `\n${item.quantidade}x ${item.nome}\n`;


      mensagem +=
        `${formatarMoeda(subtotalItem)}\n`;

    }
  );


  mensagem +=
    "\n━━━━━━━━━━━━━━\n";


  mensagem +=
    `💵 *Subtotal:* ${formatarMoeda(subtotal)}\n`;


  if (
    tipoPedido === "Entrega"
  ) {

    mensagem +=
      `🛵 *Taxa de entrega (${regiao}):* ${formatarMoeda(taxaEntrega)}\n`;

  }


  mensagem +=
    `💰 *TOTAL:* ${formatarMoeda(totalFinal)}\n\n`;


  mensagem +=
    `💳 *Pagamento:* ${pagamento}\n`;


  if (

    pagamento === "Dinheiro" &&

    troco

  ) {

    mensagem +=
      `💵 *Troco para:* ${troco}\n`;

  }


  if (
    observacoes
  ) {

    mensagem +=
      `\n📝 *Observações:*\n${observacoes}\n`;

  }


  mensagem +=
    "\n✅ Pedido realizado pelo site.";


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
   INICIAR SITE
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  function () {

    atualizarCarrinho();

    configurarTipoPedido();

    configurarPagamento();

    configurarTelefone();

    atualizarResumoFinal();

    atualizarStatusLoja();

    atualizarBotoesLoja();


    /*
      VERIFICA A CADA 30 SEGUNDOS

      Se der 18h enquanto o cliente
      estiver com o site aberto,
      os botões liberam sozinhos.

      Se der 22h,
      eles travam sozinhos.
    */

    setInterval(

      function () {

        atualizarStatusLoja();

        atualizarBotoesLoja();

      },

      30000

    );

  }

);
