(() => {

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


  const msg =
    document.getElementById("loginMsg");

  const loginArea =
    document.getElementById("loginArea");

  const adminArea =
    document.getElementById("adminArea");

  const lista =
    document.getElementById("listaProdutos");


  if (!url || !key) {

    msg.textContent =
      "Configuração do Supabase não encontrada em config.js.";

    return;

  }


  const sb =
    window.supabase.createClient(
      url,
      key
    );


  const NOMES_PRODUTOS = {

    "x-salada":
      "X-Salada",

    "x-burguer":
      "X-Burguer",

    "x-bacon":
      "X-Bacon",

    "x-tudao":
      "X-Tudão",

    "x-tudo":
      "X-Tudo",

    "moda-da-casa":
      "Moda da Casa",

    "artesanal-simples":
      "Hambúrguer Simples",

    "x-calabresa-artesanal":
      "X Calabresa Artesanal",

    "x-bacon-artesanal":
      "X Bacon Artesanal",

    "pizza-mucarela":
      "Pizza Muçarela",

    "pizza-calabresa":
      "Pizza Calabresa",

    "pizza-frango":
      "Pizza de Frango",

    "pizza-portuguesa":
      "Pizza Portuguesa",

    "pizza-baiana":
      "Pizza Baiana",

    "pizza-milho":
      "Pizza de Milho",

    "calzone-calabresa":
      "Calzone de Calabresa",

    "calzone-frango":
      "Calzone de Frango",

    "calzone-presunto":
      "Calzone de Presunto",

    "coca-lata-zero":
      "Coca-Cola Lata Sem Açúcar",

    "coca-2l":
      "Coca-Cola 2L",

    "coca-zero-2l":
      "Coca-Cola Sem Açúcar 2L",

    "guarana-1l":
      "Guaraná Antarctica 1L",

    "pepsi-1l":
      "Pepsi 1L",

    "refri-guarana":
      "Refri Guaraná"

  };


  async function carregar() {

    lista.innerHTML =
      "<p>Carregando produtos...</p>";


    const {
      data,
      error
    } =
      await sb
        .from(
          "produtos_estoque"
        )
        .select(
          "produto_id, disponivel"
        )
        .order(
          "produto_id"
        );


    if (error) {

      lista.innerHTML =
        `
          <p>
            Não foi possível carregar os produtos:
            ${error.message}
          </p>
        `;

      return;

    }


    lista.innerHTML =
      "";


    if (
      !data ||
      data.length === 0
    ) {

      lista.innerHTML =
        `
          <p>
            Nenhum produto foi encontrado
            na tabela produtos_estoque.
          </p>
        `;

      return;

    }


    data.forEach(
      produto => {

        const id =
          produto.produto_id;


        const nome =
          NOMES_PRODUTOS[id] ||
          id;


        const disponivel =
          produto.disponivel !== false;


        const el =
          document.createElement(
            "div"
          );


        el.className =
          "produto" +
          (
            disponivel
              ? ""
              : " esgotado"
          );


        el.innerHTML =
          `

            <div>

              <strong>
                ${nome}
              </strong>

              <div class="status">

                ${
                  disponivel
                    ? "🟢 Disponível"
                    : "🔴 ESGOTADO"
                }

              </div>

            </div>

          `;


        const botao =
          document.createElement(
            "button"
          );


        botao.textContent =
          disponivel
            ? "Marcar esgotado"
            : "Disponibilizar";


        botao.onclick =
          async () => {

            botao.disabled =
              true;


            const novoEstado =
              !disponivel;


            const {
              error
            } =
              await sb
                .from(
                  "produtos_estoque"
                )
                .update({
                  disponivel:
                    novoEstado,

                  atualizado_em:
                    new Date()
                      .toISOString()
                })
                .eq(
                  "produto_id",
                  id
                );


            if (error) {

              alert(
                "Erro ao alterar estoque: " +
                error.message
              );


              botao.disabled =
                false;


              return;

            }


            await carregar();

          };


        el.appendChild(
          botao
        );


        lista.appendChild(
          el
        );

      }
    );

  }


  async function mostrarSessao() {

    const {
      data
    } =
      await sb.auth
        .getSession();


    const logado =
      !!data.session;


    loginArea.hidden =
      logado;


    adminArea.hidden =
      !logado;


    if (logado) {

      await carregar();

    }

  }


  document
    .getElementById(
      "btnEntrar"
    )
    .onclick =
      async () => {

        msg.textContent =
          "";


        const email =
          document
            .getElementById(
              "email"
            )
            .value
            .trim();


        const password =
          document
            .getElementById(
              "senha"
            )
            .value;


        if (
          !email ||
          !password
        ) {

          msg.textContent =
            "Digite o e-mail e a senha.";

          return;

        }


        const {
          error
        } =
          await sb.auth
            .signInWithPassword({

              email,
              password

            });


        if (error) {

          msg.textContent =
            "Não foi possível entrar: " +
            error.message;


          return;

        }


        await mostrarSessao();

      };


  document
    .getElementById(
      "btnSair"
    )
    .onclick =
      async () => {

        await sb.auth
          .signOut();


        await mostrarSessao();

      };


  sb
    .channel(
      "painel-estoque"
    )
    .on(
      "postgres_changes",
      {

        event: "*",

        schema:
          "public",

        table:
          "produtos_estoque"

      },

      () => {

        carregar();

      }
    )
    .subscribe();


  mostrarSessao();

})();
