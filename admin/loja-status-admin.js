/* ============================================================
   CANTINHO PIZZA BURGUER
   CONTROLE DA LOJA NO PAINEL ADMINISTRADOR
   Carregue este arquivo DEPOIS do admin.js.
============================================================ */

(() => {
  "use strict";

  const cfgControleLoja =
    window.SUPABASE_CONFIG ||
    window.supabaseConfig ||
    {};

  const urlControleLoja =
    cfgControleLoja.url ||
    window.SUPABASE_URL;

  const chaveControleLoja =
    cfgControleLoja.key ||
    cfgControleLoja.anonKey ||
    window.SUPABASE_ANON_KEY ||
    window.SUPABASE_PUBLISHABLE_KEY;

  if (
    !window.supabase ||
    !urlControleLoja ||
    !chaveControleLoja
  ) {
    console.error(
      "[Admin Loja] Supabase não configurado."
    );
    return;
  }

  const adminLojaClient =
    window.supabase.createClient(
      urlControleLoja,
      chaveControleLoja
    );

  let modoAtual =
    "automatico";

  const DIAS_ABERTOS_ADMIN =
    [0, 2, 3, 5, 6];

  const HORA_ABERTURA_ADMIN =
    18;

  const HORA_FECHAMENTO_ADMIN =
    22;

  function abertaNoAutomatico() {
    const agora =
      new Date();

    const dia =
      agora.getDay();

    const minutos =
      agora.getHours() * 60 +
      agora.getMinutes();

    return (
      DIAS_ABERTOS_ADMIN.includes(dia) &&
      minutos >= HORA_ABERTURA_ADMIN * 60 &&
      minutos < HORA_FECHAMENTO_ADMIN * 60
    );
  }

  function abertaEfetivamente() {
    if (
      modoAtual === "aberta"
    ) {
      return true;
    }

    if (
      modoAtual === "fechada"
    ) {
      return false;
    }

    return abertaNoAutomatico();
  }

  function inserirEstilos() {
    if (
      document.getElementById(
        "controleLojaEstilos"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "controleLojaEstilos";

    style.textContent =
      `
        #controleLojaCard {
          margin: 0 0 20px;
          padding: 20px;
          border: 1px solid #2d2d2d;
          border-radius: 18px;
          background: linear-gradient(
            145deg,
            #171717,
            #101010
          );
          box-shadow:
            0 12px 30px rgba(0,0,0,.22);
          color: #fff;
        }

        #controleLojaCard * {
          box-sizing: border-box;
        }

        .loja-admin-topo {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .loja-admin-titulo {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
        }

        .loja-admin-subtitulo {
          margin: 5px 0 0;
          color: #a9a9a9;
          font-size: 13px;
          line-height: 1.45;
        }

        .loja-admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .loja-admin-badge.aberta {
          background: rgba(36, 200, 92, .14);
          border: 1px solid rgba(36, 200, 92, .35);
          color: #66e58f;
        }

        .loja-admin-badge.fechada {
          background: rgba(255, 72, 72, .13);
          border: 1px solid rgba(255, 72, 72, .35);
          color: #ff8080;
        }

        .loja-admin-modo {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 12px;
          background: #0c0c0c;
          border: 1px solid #242424;
          color: #d0d0d0;
          font-size: 13px;
          line-height: 1.45;
        }

        .loja-admin-acoes {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .loja-admin-btn {
          min-height: 48px;
          border: 0;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          transition:
            transform .15s ease,
            opacity .15s ease;
        }

        .loja-admin-btn:active {
          transform: scale(.98);
        }

        .loja-admin-btn:disabled {
          opacity: .55;
          cursor: wait;
        }

        .loja-admin-btn.abrir {
          background: #1fbd5c;
          color: #06160b;
        }

        .loja-admin-btn.fechar {
          background: #e43d3d;
          color: #fff;
        }

        .loja-admin-btn.auto {
          grid-column: 1 / -1;
          background: #252525;
          border: 1px solid #3a3a3a;
          color: #fff;
        }

        .loja-admin-msg {
          min-height: 18px;
          margin-top: 12px;
          color: #aaa;
          font-size: 12px;
          font-weight: 700;
        }

        .loja-admin-msg.ok {
          color: #66e58f;
        }

        .loja-admin-msg.erro {
          color: #ff8080;
        }

        @media (max-width: 520px) {
          .loja-admin-acoes {
            grid-template-columns: 1fr;
          }

          .loja-admin-btn.auto {
            grid-column: auto;
          }
        }
      `;

    document.head.appendChild(
      style
    );
  }

  function encontrarDashboard() {
    return (
      document.getElementById(
        "dashboard"
      ) ||
      document.querySelector(
        ".dashboard"
      ) ||
      document.querySelector(
        "main"
      )
    );
  }

  function criarCard() {
    if (
      document.getElementById(
        "controleLojaCard"
      )
    ) {
      return true;
    }

    const dashboard =
      encontrarDashboard();

    if (!dashboard) {
      return false;
    }

    const card =
      document.createElement(
        "section"
      );

    card.id =
      "controleLojaCard";

    card.innerHTML =
      `
        <div class="loja-admin-topo">
          <div>
            <h2 class="loja-admin-titulo">
              🏪 Status da Loja
            </h2>

            <p class="loja-admin-subtitulo">
              Abra ou feche o cardápio manualmente
              sem alterar o estoque dos produtos.
            </p>
          </div>

          <span
            id="lojaAdminBadge"
            class="loja-admin-badge fechada"
          >
            ● Carregando...
          </span>
        </div>

        <div
          id="lojaAdminModo"
          class="loja-admin-modo"
        >
          Consultando o status no Supabase...
        </div>

        <div class="loja-admin-acoes">
          <button
            type="button"
            class="loja-admin-btn abrir"
            data-loja-modo="aberta"
          >
            🟢 ABRIR LOJA AGORA
          </button>

          <button
            type="button"
            class="loja-admin-btn fechar"
            data-loja-modo="fechada"
          >
            🔴 FECHAR LOJA AGORA
          </button>

          <button
            type="button"
            class="loja-admin-btn auto"
            data-loja-modo="automatico"
          >
            🕒 VOLTAR AO HORÁRIO AUTOMÁTICO
          </button>
        </div>

        <div
          id="lojaAdminMensagem"
          class="loja-admin-msg"
        ></div>
      `;

    dashboard.prepend(
      card
    );

    card
      .querySelectorAll(
        "[data-loja-modo]"
      )
      .forEach(
        botao => {
          botao.addEventListener(
            "click",
            () => {
              alterarModoLoja(
                botao.dataset.lojaModo
              );
            }
          );
        }
      );

    atualizarCard();
    return true;
  }

  function atualizarCard() {
    const badge =
      document.getElementById(
        "lojaAdminBadge"
      );

    const modo =
      document.getElementById(
        "lojaAdminModo"
      );

    if (
      !badge ||
      !modo
    ) {
      return;
    }

    const aberta =
      abertaEfetivamente();

    badge.classList.toggle(
      "aberta",
      aberta
    );

    badge.classList.toggle(
      "fechada",
      !aberta
    );

    badge.textContent =
      aberta
        ? "● LOJA ABERTA"
        : "● LOJA FECHADA";

    if (
      modoAtual === "aberta"
    ) {
      modo.innerHTML =
        "<strong>Modo manual:</strong> " +
        "a loja foi forçada a ficar ABERTA. " +
        "Ela continuará aberta até você fechar " +
        "ou voltar ao horário automático.";
    }
    else if (
      modoAtual === "fechada"
    ) {
      modo.innerHTML =
        "<strong>Modo manual:</strong> " +
        "a loja foi forçada a ficar FECHADA. " +
        "Os clientes não conseguem finalizar pedidos.";
    }
    else {
      modo.innerHTML =
        "<strong>Modo automático:</strong> " +
        "terça, quarta, sexta, sábado e domingo, " +
        "das 18h às 22h. " +
        "Status agora: <strong>" +
        (aberta ? "ABERTA" : "FECHADA") +
        "</strong>.";
    }
  }

  function mensagem(
    texto,
    tipo = ""
  ) {
    const el =
      document.getElementById(
        "lojaAdminMensagem"
      );

    if (!el) {
      return;
    }

    el.textContent =
      texto;

    el.className =
      "loja-admin-msg" +
      (
        tipo
          ? " " + tipo
          : ""
      );
  }

  function bloquearBotoes(
    bloquear
  ) {
    document
      .querySelectorAll(
        "#controleLojaCard [data-loja-modo]"
      )
      .forEach(
        botao => {
          botao.disabled =
            bloquear;
        }
      );
  }

  async function carregarModoLoja() {
    const {
      data,
      error
    } =
      await adminLojaClient
        .from("loja_config")
        .select("modo")
        .eq("id", 1)
        .single();

    if (error) {
      console.error(
        "[Admin Loja] Erro ao carregar:",
        error
      );

      mensagem(
        "Não foi possível carregar o status da loja.",
        "erro"
      );

      return false;
    }

    modoAtual =
      (
        data?.modo === "aberta" ||
        data?.modo === "fechada"
      )
        ? data.modo
        : "automatico";

    atualizarCard();
    return true;
  }

  async function alterarModoLoja(
    novoModo
  ) {
    if (
      ![
        "automatico",
        "aberta",
        "fechada"
      ].includes(
        novoModo
      )
    ) {
      return;
    }

    bloquearBotoes(
      true
    );

    mensagem(
      "Salvando alteração..."
    );

    try {
      const {
        data: sessaoData,
        error: sessaoErro
      } =
        await adminLojaClient
          .auth
          .getSession();

      if (
        sessaoErro ||
        !sessaoData?.session?.user
      ) {
        throw new Error(
          "Sua sessão de administrador expirou. Faça login novamente."
        );
      }

      const usuarioId =
        sessaoData.session.user.id;

      const {
        error
      } =
        await adminLojaClient
          .from("loja_config")
          .update({
            modo: novoModo,
            atualizado_em:
              new Date().toISOString(),
            atualizado_por:
              usuarioId
          })
          .eq("id", 1);

      if (error) {
        throw error;
      }

      modoAtual =
        novoModo;

      atualizarCard();

      if (
        novoModo === "aberta"
      ) {
        mensagem(
          "✅ Loja aberta. O cardápio já está liberado para pedidos.",
          "ok"
        );
      }
      else if (
        novoModo === "fechada"
      ) {
        mensagem(
          "✅ Loja fechada. Novos pedidos foram bloqueados.",
          "ok"
        );
      }
      else {
        mensagem(
          "✅ Horário automático restaurado.",
          "ok"
        );
      }
    }
    catch (erro) {
      console.error(
        "[Admin Loja] Erro ao salvar:",
        erro
      );

      mensagem(
        "❌ " +
        (
          erro?.message ||
          "Não foi possível salvar a alteração."
        ),
        "erro"
      );
    }
    finally {
      bloquearBotoes(
        false
      );
    }
  }

  function iniciarRealtimeAdmin() {
    adminLojaClient
      .channel(
        "loja-status-admin"
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
            modoAtual =
              payload.new.modo;

            atualizarCard();
          }
        }
      )
      .subscribe();
  }

  async function iniciar() {
    inserirEstilos();

    /*
      Tenta criar imediatamente.
      Se o admin.js montar/exibir o dashboard
      depois, tenta novamente por alguns segundos.
    */
    if (!criarCard()) {
      let tentativas =
        0;

      const timer =
        setInterval(
          () => {
            tentativas++;

            if (
              criarCard() ||
              tentativas >= 20
            ) {
              clearInterval(
                timer
              );
            }
          },
          300
        );
    }

    await carregarModoLoja();
    iniciarRealtimeAdmin();

    setInterval(
      () => {
        criarCard();
        atualizarCard();
      },
      30000
    );
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
