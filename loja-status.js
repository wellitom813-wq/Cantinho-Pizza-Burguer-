/* ============================================================
   CANTINHO PIZZA BURGUER
   CONTROLE DE STATUS DA LOJA
   Carregue este arquivo DEPOIS do script.js.
============================================================ */

(() => {
  "use strict";

  const cfgLojaStatus =
    window.SUPABASE_CONFIG ||
    window.supabaseConfig ||
    {};

  const urlLojaStatus =
    cfgLojaStatus.url ||
    window.SUPABASE_URL;

  const chaveLojaStatus =
    cfgLojaStatus.key ||
    cfgLojaStatus.anonKey ||
    window.SUPABASE_ANON_KEY ||
    window.SUPABASE_PUBLISHABLE_KEY;

  if (
    !window.supabase ||
    !urlLojaStatus ||
    !chaveLojaStatus
  ) {
    console.warn(
      "[Loja Status] Supabase não configurado. " +
      "O site continuará usando somente o horário automático."
    );
    return;
  }

  const lojaStatusClient =
    window.supabase.createClient(
      urlLojaStatus,
      chaveLojaStatus
    );

  /*
    Modos:
    automatico = respeita o horário normal do site
    aberta     = força a loja aberta
    fechada    = força a loja fechada
  */
  let modoLojaAtual = "automatico";

  const DIAS_ABERTOS_STATUS =
    [0, 2, 3, 5, 6];

  const HORA_ABERTURA_STATUS =
    18;

  const HORA_FECHAMENTO_STATUS =
    22;

  function lojaAbertaPeloHorario() {
    const agora =
      new Date();

    const dia =
      agora.getDay();

    const minutos =
      agora.getHours() * 60 +
      agora.getMinutes();

    return (
      DIAS_ABERTOS_STATUS.includes(dia) &&
      minutos >= HORA_ABERTURA_STATUS * 60 &&
      minutos < HORA_FECHAMENTO_STATUS * 60
    );
  }

  function lojaAbertaEfetivamente() {
    if (
      modoLojaAtual === "aberta"
    ) {
      return true;
    }

    if (
      modoLojaAtual === "fechada"
    ) {
      return false;
    }

    return lojaAbertaPeloHorario();
  }

  function obterProximaAbertura() {
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
      DIAS_ABERTOS_STATUS.includes(dia) &&
      minutos < HORA_ABERTURA_STATUS * 60
    ) {
      return "Abre hoje às 18h";
    }

    for (
      let i = 1;
      i <= 7;
      i++
    ) {
      const proximoDia =
        (dia + i) % 7;

      if (
        DIAS_ABERTOS_STATUS.includes(
          proximoDia
        )
      ) {
        return (
          `Abre ${nomesDias[proximoDia]} às 18h`
        );
      }
    }

    return "Fechado no momento";
  }

  /*
    Substitui a função original do seu script.js.
    Todo o sistema existente passa a respeitar
    o modo definido no painel administrador.
  */
  window.lojaEstaAberta =
    function lojaEstaAberta() {
      return lojaAbertaEfetivamente();
    };

  const avisarLojaFechadaOriginal =
    window.avisarLojaFechada;

  window.avisarLojaFechada =
    function avisarLojaFechada() {
      if (
        modoLojaAtual === "fechada"
      ) {
        alert(
          "🔴 LOJA FECHADA NO MOMENTO\n\n" +
          "Os pedidos foram pausados pela loja.\n" +
          "Acompanhe o status no cardápio para saber quando reabrirmos."
        );
        return;
      }

      if (
        typeof avisarLojaFechadaOriginal ===
        "function"
      ) {
        avisarLojaFechadaOriginal();
        return;
      }

      alert(
        "🔴 LOJA FECHADA NO MOMENTO"
      );
    };

  window.atualizarStatusLoja =
    function atualizarStatusLoja() {
      const status =
        document.querySelector(
          ".status-loja"
        );

      const aberta =
        lojaAbertaEfetivamente();

      if (status) {
        if (
          modoLojaAtual === "aberta"
        ) {
          status.innerHTML =
            `
              <span class="status-bolinha"></span>
              <span>Aberto agora • abertura manual</span>
            `;

          status.classList.remove(
            "fechado"
          );
        }
        else if (
          modoLojaAtual === "fechada"
        ) {
          status.innerHTML =
            `
              <span class="status-bolinha"></span>
              <span>Fechado no momento</span>
            `;

          status.classList.add(
            "fechado"
          );
        }
        else if (aberta) {
          status.innerHTML =
            `
              <span class="status-bolinha"></span>
              <span>Aberto • Fecha às 22h</span>
            `;

          status.classList.remove(
            "fechado"
          );
        }
        else {
          status.innerHTML =
            `
              <span class="status-bolinha"></span>
              <span>${obterProximaAbertura()}</span>
            `;

          status.classList.add(
            "fechado"
          );
        }
      }

      if (
        typeof window.atualizarVisualProdutos ===
        "function"
      ) {
        window.atualizarVisualProdutos();
      }
    };

  async function carregarStatusLoja() {
    const {
      data,
      error
    } =
      await lojaStatusClient
        .from("loja_config")
        .select("modo")
        .eq("id", 1)
        .single();

    if (error) {
      console.error(
        "[Loja Status] Erro ao carregar:",
        error
      );

      /*
        Em caso de falha, mantém o horário
        automático original como fallback.
      */
      modoLojaAtual =
        "automatico";

      window.atualizarStatusLoja();
      return false;
    }

    modoLojaAtual =
      (
        data?.modo === "aberta" ||
        data?.modo === "fechada"
      )
        ? data.modo
        : "automatico";

    window.atualizarStatusLoja();
    return true;
  }

  function iniciarRealtimeStatusLoja() {
    lojaStatusClient
      .channel(
        "loja-status-publico"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loja_config",
          filter: "id=eq.1"
        },
        payload => {
          if (
            payload.new &&
            payload.new.modo
          ) {
            modoLojaAtual =
              payload.new.modo;

            window.atualizarStatusLoja();
          }
        }
      )
      .subscribe();
  }

  /*
    Revalida o status no banco antes
    de efetivamente enviar o pedido.
  */
  const finalizarPedidoOriginal =
    window.finalizarPedido;

  if (
    typeof finalizarPedidoOriginal ===
    "function"
  ) {
    window.finalizarPedido =
      async function finalizarPedidoSeguro(
        ...args
      ) {
        await carregarStatusLoja();

        if (
          !lojaAbertaEfetivamente()
        ) {
          window.avisarLojaFechada();

          if (
            typeof window.atualizarVisualProdutos ===
            "function"
          ) {
            window.atualizarVisualProdutos();
          }

          return;
        }

        return finalizarPedidoOriginal.apply(
          this,
          args
        );
      };
  }

  const irParaFinalizacaoOriginal =
    window.irParaFinalizacao;

  if (
    typeof irParaFinalizacaoOriginal ===
    "function"
  ) {
    window.irParaFinalizacao =
      async function irParaFinalizacaoSeguro(
        ...args
      ) {
        await carregarStatusLoja();

        if (
          !lojaAbertaEfetivamente()
        ) {
          window.avisarLojaFechada();
          return;
        }

        return irParaFinalizacaoOriginal.apply(
          this,
          args
        );
      };
  }

  document.addEventListener(
    "DOMContentLoaded",
    async () => {
      await carregarStatusLoja();

      iniciarRealtimeStatusLoja();

      /*
        Backup caso o Realtime fique
        temporariamente sem conexão.
      */
      setInterval(
        carregarStatusLoja,
        60000
      );
    }
  );

  /*
    Deixa disponível para diagnóstico
    no console, sem interferir no site.
  */
  window.carregarStatusLoja =
    carregarStatusLoja;
})();
