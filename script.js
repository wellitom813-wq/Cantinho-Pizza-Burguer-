/* =========================================================
   CANTINHO PIZZA BURGUER
   SCRIPT PÚBLICO COMPLETO
   - Horário automático
   - Estoque global via Supabase
   - Produto esgotado bloqueado para todos
   - Carrinho
   - Taxas por região
   - Validação final antes do WhatsApp
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const NUMERO_WHATSAPP =
  "5587999999999";

const DIAS_ABERTOS =
  [0, 2, 3, 5, 6];

const HORA_ABERTURA =
  18;

const HORA_FECHAMENTO =
  22;

const TAXAS_ENTREGA = {
  N1: 4.00,
  N3: 3.00,
  N5: 5.00,
  C2: 6.00
};


/* =========================================================
   SUPABASE
========================================================= */

const cfg =
  window.SUPABASE_CONFIG ||
  window.supabaseConfig ||
  {};

const SUPABASE_PUBLIC_URL =
  cfg.url ||
  window.SUPABASE_URL;

const SUPABASE_PUBLIC_KEY =
  cfg.key ||
  cfg.anonKey ||
  window.SUPABASE_ANON_KEY ||
  window.SUPABASE_PUBLISHABLE_KEY;

const supabaseClient =
  (
    SUPABASE_PUBLIC_URL &&
    SUPABASE_PUBLIC_KEY
  )
    ? window.supabase.createClient(
        SUPABASE_PUBLIC_URL,
        SUPABASE_PUBLIC_KEY
      )
    : null;


/* =========================================================
   ESTADOS
========================================================= */

let carrinho = [];

let estoqueProdutos = {};


/* =========================================================
   HORÁRIO DA LOJA
========================================================= */

function lojaEstaAberta() {

  const agora =
    new Date();

  const dia =
    agora.getDay();

  const minutos =
    agora.getHours() * 60 +
    agora.getMinutes();

  return (
    DIAS_ABERTOS.includes(dia) &&
    minutos >= HORA_ABERTURA * 60 &&
    minutos < HORA_FECHAMENTO * 60
  );

}


function avisarLojaFechada() {

  alert(
    "🔴 LOJA FECHADA NO MOMENTO\n\n" +

    "Horário de funcionamento:\n" +

    "Terça-feira: 18h às 22h\n" +
    "Quarta-feira: 18h às 22h\n" +
    "Sexta-feira: 18h às 22h\n" +
    "Sábado: 18h às 22h\n" +
    "Domingo: 18h às 22h"
  );

}


/* =========================================================
   ESTOQUE
========================================================= */

function produtoDisponivel(
  produtoId
) {

  /*
    Se ainda não existe informação daquele
    produto no banco, consideramos disponível.

    Assim o site não trava caso você tenha
    adicionado um produto novo ao HTML antes
    de criar a linha correspondente no Supabase.
  */

  if (
    !(produtoId in estoqueProdutos)
  ) {

    return true;

  }

  return (
    estoqueProdutos[produtoId] !== false
  );

}


function mostrarAvisoEstoque(
  texto,
  erro = false
) {

  let aviso =
    document.getElementById(
      "estoqueSyncAviso"
    );

  if (!aviso) {

    aviso =
      document.createElement(
        "div"
      );

    aviso.id =
      "estoqueSyncAviso";

    aviso.className =
      "estoque-sync-aviso";

    const categorias =
      document.querySelector(
        ".categorias"
      );

    if (categorias) {

      categorias.insertAdjacentElement(
        "afterend",
        aviso
      );

    }

  }

  aviso.textContent =
    texto;

  aviso.classList.toggle(
    "erro",
    erro
  );

}


function removerAvisoEstoque() {

  document
    .getElementById(
      "estoqueSyncAviso"
    )
    ?.remove();

}


async function carregarEstoque() {

  if (!supabaseClient) {

    mostrarAvisoEstoque(
      "Estoque online ainda não está conectado ao Supabase.",
      true
    );

    atualizarVisualProdutos();

    return false;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "produtos_estoque"
      )
      .select(
        "produto_id, disponivel"
      );


  if (error) {

    console.error(
      "Erro ao carregar estoque:",
      error
    );

    mostrarAvisoEstoque(
      "Não foi possível sincronizar o estoque agora.",
      true
    );

    atualizarVisualProdutos();

    return false;

  }


  estoqueProdutos = {};


  (
    data || []
  ).forEach(
    item => {

      estoqueProdutos[
        item.produto_id
      ] =
        item.disponivel !== false;

    }
  );


  removerAvisoEstoque();

  atualizarVisualProdutos();

  return true;

}


/* =========================================================
   VISUAL DOS PRODUTOS
========================================================= */

function atualizarVisualProdutos() {

  const aberta =
    lojaEstaAberta();


  document
    .querySelectorAll(
      ".produto[data-produto-id]"
    )
    .forEach(
      card => {

        const produtoId =
          card.dataset.produtoId;


        const disponivel =
          produtoDisponivel(
            produtoId
          );


        const botao =
          card.querySelector(
            ".btn-adicionar"
          );


        const selo =
          card.querySelector(
            ".selo-esgotado"
          );


        /*
          PRODUTO ESGOTADO
        */

        if (!disponivel) {

          card.classList.add(
            "esgotado"
          );


          if (selo) {

            selo.style.display =
              "block";

          }


          if (botao) {

            botao.disabled =
              true;


            botao.classList.add(
              "esgotado"
            );


            botao.classList.remove(
              "loja-fechada"
            );


            botao.textContent =
              "Produto esgotado";

          }


          return;

        }


        /*
          PRODUTO DISPONÍVEL
        */

        card.classList.remove(
          "esgotado"
        );


        if (selo) {

          selo.style.display =
            "none";

        }


        if (!botao) {

          return;

        }


        botao.classList.remove(
          "esgotado"
        );


        /*
          LOJA FECHADA
        */

        if (!aberta) {

          botao.disabled =
            true;


          botao.classList.add(
            "loja-fechada"
          );


          botao.textContent =
            "Loja fechada";


          return;

        }


        /*
          LOJA ABERTA
        */

        botao.disabled =
          false;


        botao.classList.remove(
          "loja-fechada"
        );


        botao.textContent =
          "Adicionar +";

      }
    );


  /*
    Botão de finalizar no WhatsApp
  */

  const botaoWhatsapp =
    document.querySelector(
      ".btn-whatsapp"
    );


  if (botaoWhatsapp) {

    botaoWhatsapp.disabled =
      !aberta;


    if (aberta) {

      botaoWhatsapp.innerHTML =
        "<span>💬</span> Finalizar pedido pelo WhatsApp";

    } else {

      botaoWhatsapp.innerHTML =
        "<span>🔒</span> Loja fechada";

    }

  }

}


/* =========================================================
   REALTIME
========================================================= */

async function iniciarRealtimeEstoque() {

  if (!supabaseClient) {

    return;

  }


  supabaseClient
    .channel(
      "estoque-publico"
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "produtos_estoque"
      },
      payload => {

        /*
          UPDATE ou INSERT
        */

        if (
          payload.new &&
          payload.new.produto_id
        ) {

          estoqueProdutos[
            payload.new.produto_id
          ] =
            payload.new.disponivel !== false;

        }


        /*
          DELETE
        */

        if (
          payload.eventType === "DELETE" &&
          payload.old &&
          payload.old.produto_id
        ) {

          delete estoqueProdutos[
            payload.old.produto_id
          ];

        }


        atualizarVisualProdutos();

      }
    )
    .subscribe();

}


/* =========================================================
   MOEDA
========================================================= */

function formatarMoeda(
  valor
) {

  return Number(
    valor || 0
  )
    .toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );

}


/* =========================================================
   CARRINHO
========================================================= */

function adicionarProduto(
  produtoId,
  nome,
  preco
) {

  /*
    Segurança de horário
  */

  if (
    !lojaEstaAberta()
  ) {

    avisarLojaFechada();

    atualizarVisualProdutos();

    return;

  }


  /*
    Segurança de estoque
  */

  if (
    !produtoDisponivel(
      produtoId
    )
  ) {

    alert(
      `🔴 ${nome} está esgotado no momento.`
    );

    atualizarVisualProdutos();

    return;

  }


  const produtoExistente =
    carrinho.find(
      item =>
        item.id === produtoId
    );


  if (
    produtoExistente
  ) {

    produtoExistente.quantidade++;

  } else {

    carrinho.push({
      id: produtoId,
      nome,
      preco,
      quantidade: 1
    });

  }


  atualizarCarrinho();

  mostrarToast();

}


function removerProduto(
  produtoId
) {

  const produto =
    carrinho.find(
      item =>
        item.id === produtoId
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
          item.id !== produtoId
      );

  }


  atualizarCarrinho();

}


function excluirProduto(
  produtoId
) {

  carrinho =
    carrinho.filter(
      item =>
        item.id !== produtoId
    );


  atualizarCarrinho();

}


function limparCarrinho() {

  if (
    !carrinho.length
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
   TOTAIS
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
    TAXAS_ENTREGA[
      regiao
    ] || 0
  );

}


function calcularTotalFinal() {

  return (
    calcularTotal() +
    obterTaxaEntrega()
  );

}


/* =========================================================
   RESUMO
========================================================= */

function atualizarResumoFinal() {

  const subtotal =
    calcularTotal();


  const taxa =
    obterTaxaEntrega();


  const total =
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
        total
      );

  }

}


/* =========================================================
   ESCAPAR TEXTO
========================================================= */

function escaparHtml(
  texto
) {

  return String(
    texto
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function escaparJs(
  texto
) {

  return String(
    texto
  )
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

    atualizarResumoFinal();

    return;

  }


  quantidadeCarrinho.textContent =
    calcularQuantidadeTotal();


  totalCarrinho.textContent =
    formatarMoeda(
      calcularTotal()
    );


  totalModal.textContent =
    formatarMoeda(
      calcularTotal()
    );


  atualizarResumoFinal();


  if (
    !carrinho.length
  ) {

    listaCarrinho.innerHTML =
      `
        <div class="carrinho-vazio">

          <span
            style="
              font-size:42px;
            "
          >
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
    carrinho
      .map(
        item => {

          const subtotalItem =
            item.preco *
            item.quantidade;


          const indisponivel =
            !produtoDisponivel(
              item.id
            );


          return `
            <div
              style="
                padding:15px 0;
                border-bottom:
                  1px solid #242424;
                ${indisponivel
                  ? "opacity:.6;"
                  : ""}
              "
            >

              <div
                style="
                  display:flex;
                  justify-content:
                    space-between;
                  gap:12px;
                "
              >

                <div>

                  <strong>
                    ${escaparHtml(item.nome)}
                  </strong>

                  ${
                    indisponivel
                      ? `
                        <div
                          style="
                            color:#ff7373;
                            font-size:11px;
                            margin-top:4px;
                            font-weight:800;
                          "
                        >
                          🔴 ESGOTADO
                        </div>
                      `
                      : ""
                  }

                </div>

                <strong
                  style="
                    color:#ff7a1a;
                  "
                >
                  ${formatarMoeda(
                    subtotalItem
                  )}
                </strong>

              </div>


              <div
                style="
                  display:flex;
                  justify-content:
                    space-between;
                  align-items:center;
                  margin-top:10px;
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
                        '${escaparJs(item.id)}'
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
                        '${escaparJs(item.id)}',
                        '${escaparJs(item.nome)}',
                        ${item.preco}
                      )
                    "
                    ${indisponivel
                      ? "disabled"
                      : ""}
                    style="
                      width:32px;
                      height:32px;
                      border:0;
                      border-radius:9px;
                      background:
                        ${indisponivel
                          ? "#292929"
                          : "#ff4c0d"};
                      color:white;
                    "
                  >
                    +
                  </button>

                </div>


                <button
                  onclick="
                    excluirProduto(
                      '${escaparJs(item.id)}'
                    )
                  "
                  style="
                    border:0;
                    background:transparent;
                    color:#ff6767;
                  "
                >
                  Remover
                </button>

              </div>

            </div>
          `;

        }
      )
      .join("");


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
      border:1px solid #333;
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
   CARRINHO MODAL
========================================================= */

function abrirCarrinho() {

  if (
    !lojaEstaAberta() &&
    !carrinho.length
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
   VALIDAR CARRINHO
========================================================= */

function encontrarEsgotadosNoCarrinho() {

  return carrinho.filter(
    item =>
      !produtoDisponivel(
        item.id
      )
  );

}


function avisarEsgotados(
  itens
) {

  alert(
    "Alguns produtos do seu pedido estão esgotados:\n\n" +

    itens
      .map(
        item =>
          "• " + item.nome
      )
      .join(
        "\n"
      ) +

    "\n\nRemova esses produtos para continuar."
  );

}


/* =========================================================
   IR PARA FINALIZAÇÃO
========================================================= */

async function irParaFinalizacao() {

  if (
    !lojaEstaAberta()
  ) {

    avisarLojaFechada();

    return;

  }


  if (
    !carrinho.length
  ) {

    alert(
      "Adicione pelo menos um produto."
    );

    return;

  }


  /*
    Atualiza o estoque antes
    de ir para o formulário.
  */

  await carregarEstoque();


  const esgotados =
    encontrarEsgotadosNoCarrinho();


  if (
    esgotados.length
  ) {

    avisarEsgotados(
      esgotados
    );

    atualizarCarrinho();

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
   STATUS DA LOJA
========================================================= */

function atualizarStatusLoja() {

  const status =
    document.querySelector(
      ".status-loja"
    );


  if (!status) {

    atualizarVisualProdutos();

    return;

  }


  const agora =
    new Date();


  const dia =
    agora.getDay();


  const minutos =
    agora.getHours() * 60 +
    agora.getMinutes();


  const nomesDias = {
    0: "domingo",
    1: "segunda-feira",
    2: "terça-feira",
    3: "quarta-feira",
    4: "quinta-feira",
    5: "sexta-feira",
    6: "sábado"
  };


  if (
    lojaEstaAberta()
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


    atualizarVisualProdutos();

    return;

  }


  let proximaAbertura =
    "";


  if (
    DIAS_ABERTOS.includes(
      dia
    ) &&
    minutos <
      HORA_ABERTURA * 60
  ) {

    proximaAbertura =
      "Abre hoje às 18h";

  } else {

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


  atualizarVisualProdutos();

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
    !tipoPedido
  ) {

    return;

  }


  function atualizarCampos() {

    const retirada =
      tipoPedido.value ===
      "Retirada";


    if (
      endereco
    ) {

      endereco.disabled =
        retirada;


      endereco.style.opacity =
        retirada
          ? "0.45"
          : "1";


      endereco.placeholder =
        retirada
          ? "Não necessário para retirada"
          : "Rua, número, bairro e referência";


      if (
        retirada
      ) {

        endereco.value =
          "";

      }

    }


    if (
      campoRegiao
    ) {

      campoRegiao.style.display =
        retirada
          ? "none"
          : "flex";

    }


    if (
      retirada &&
      regiao
    ) {

      regiao.value =
        "";

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


  function atualizar() {

    const dinheiro =
      pagamento.value ===
      "Dinheiro";


    troco.disabled =
      !dinheiro;


    troco.style.opacity =
      dinheiro
        ? "1"
        : "0.45";


    troco.placeholder =
      dinheiro
        ? "Ex: R$ 50,00"
        : "Somente para dinheiro";


    if (
      !dinheiro
    ) {

      troco.value =
        "";

    }

  }


  pagamento.addEventListener(
    "change",
    atualizar
  );


  atualizar();

}


/* =========================================================
   TELEFONE
========================================================= */

function configurarTelefone() {

  const telefone =
    document.getElementById(
      "telefone"
    );


  if (
    !telefone
  ) {

    return;

  }


  telefone.addEventListener(
    "input",
    () => {

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

async function finalizarPedido() {

  /*
    SEGURANÇA DE HORÁRIO
  */

  if (
    !lojaEstaAberta()
  ) {

    avisarLojaFechada();

    atualizarVisualProdutos();

    return;

  }


  /*
    CARRINHO VAZIO
  */

  if (
    !carrinho.length
  ) {

    alert(
      "Seu carrinho está vazio."
    );

    return;

  }


  /*
    REVALIDAÇÃO DO ESTOQUE
    DIRETO NO BANCO
  */

  const estoqueAtualizado =
    await carregarEstoque();


  if (
    supabaseClient &&
    !estoqueAtualizado
  ) {

    alert(
      "Não foi possível confirmar o estoque agora. Tente novamente em alguns segundos."
    );

    return;

  }


  const esgotados =
    encontrarEsgotadosNoCarrinho();


  if (
    esgotados.length
  ) {

    avisarEsgotados(
      esgotados
    );

    atualizarCarrinho();

    return;

  }


  /*
    CAMPOS
  */

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
    tipoPedido ===
      "Entrega" &&
    !regiao
  ) {

    alert(
      "Selecione sua região de entrega."
    );

    return;

  }


  if (
    tipoPedido ===
      "Entrega" &&
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
    TOTAIS
  */

  const subtotal =
    calcularTotal();


  const taxaEntrega =
    obterTaxaEntrega();


  const totalFinal =
    subtotal +
    taxaEntrega;


  /*
    WHATSAPP
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
    tipoPedido ===
      "Entrega"
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
    tipoPedido ===
      "Entrega"
  ) {

    mensagem +=
      `🛵 *Taxa de entrega (${regiao}):* ${formatarMoeda(taxaEntrega)}\n`;

  }


  mensagem +=
    `💰 *TOTAL:* ${formatarMoeda(totalFinal)}\n\n`;


  mensagem +=
    `💳 *Pagamento:* ${pagamento}\n`;


  if (
    pagamento ===
      "Dinheiro" &&
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


  const link =
    `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;


  window.open(
    link,
    "_blank"
  );

}


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    atualizarCarrinho();

    configurarTipoPedido();

    configurarPagamento();

    configurarTelefone();

    atualizarStatusLoja();

    atualizarVisualProdutos();


    /*
      Carrega estoque global
    */

    await carregarEstoque();


    /*
      Escuta alterações do painel
    */

    await iniciarRealtimeEstoque();


    /*
      Horário automático
    */

    setInterval(
      atualizarStatusLoja,
      30000
    );


    /*
      Segurança extra:
      atualiza estoque a cada 60 segundos
      mesmo se o realtime cair.
    */

    setInterval(
      carregarEstoque,
      60000
    );

  }
);
