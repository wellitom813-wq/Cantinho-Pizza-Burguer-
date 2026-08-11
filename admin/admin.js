(() => {
  "use strict";

  const ADMIN_UID = "d8ca47b0-b9ef-4bee-8f44-65cfc602fdeb";
  const BUCKET = "produtos";
  const cfg = window.SUPABASE_CONFIG || window.supabaseConfig || {};
  const URL = cfg.url || window.SUPABASE_URL;
  const KEY = cfg.key || cfg.anonKey || window.SUPABASE_ANON_KEY || window.SUPABASE_PUBLISHABLE_KEY;

  const $ = (id) => document.getElementById(id);
  const client = window.supabase && URL && KEY ? window.supabase.createClient(URL, KEY) : null;

  let produtos = [];
  let categorias = [];
  let config = null;
  let abaAtual = "produtos";
  let realtimeChannel = null;

  function msg(id, texto = "", tipo = "") {
    const el = $(id);
    if (!el) return;
    el.textContent = texto;
    el.className = "msg" + (tipo ? ` ${tipo}` : "");
  }

  function moeda(v) {
    return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function slug(v) {
    return String(v || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function showLogin() {
    $("loginView")?.classList.remove("hidden");
    $("dashboardView")?.classList.add("hidden");
  }

  function showDashboard(user) {
    $("loginView")?.classList.add("hidden");
    $("dashboardView")?.classList.remove("hidden");
    $("adminEmail").textContent = user?.email || "Administrador";
  }

  async function sessaoAdmin() {
    if (!client) throw new Error("Configuração do Supabase não encontrada em ../config.js.");
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const user = data?.session?.user;
    if (!user) return null;
    if (user.id !== ADMIN_UID) {
      await client.auth.signOut();
      throw new Error("Este usuário não tem permissão de administrador.");
    }
    return user;
  }

  async function login(event) {
    event.preventDefault();
    msg("loginMsg", "Entrando...");
    const btn = $("btnEntrar");
    btn.disabled = true;
    try {
      if (!client) throw new Error("Configuração do Supabase não encontrada em ../config.js.");
      const { data, error } = await client.auth.signInWithPassword({
        email: $("email").value.trim(),
        password: $("senha").value
      });
      if (error) throw error;
      if (!data?.user || data.user.id !== ADMIN_UID) {
        await client.auth.signOut();
        throw new Error("Usuário sem permissão para este painel.");
      }
      msg("loginMsg", "");
      showDashboard(data.user);
      await carregarTudo();
      iniciarRealtime();
    } catch (e) {
      msg("loginMsg", e?.message || "Não foi possível entrar.", "erro");
    } finally {
      btn.disabled = false;
    }
  }

  async function sair() {
    if (client) await client.auth.signOut();
    if (realtimeChannel) {
      try { await client.removeChannel(realtimeChannel); } catch (_) {}
      realtimeChannel = null;
    }
    showLogin();
  }

  async function carregarTudo() {
    try {
      await sessaoAdmin();
      const [p, c, f] = await Promise.all([
        client.from("produtos_estoque")
          .select("produto_id,nome,preco,descricao,categoria,imagem_url,disponivel,ativo,destaque,ordem")
          .order("categoria", { ascending: true })
          .order("ordem", { ascending: true })
          .order("nome", { ascending: true }),
        client.from("categorias_cardapio")
          .select("slug,nome,emoji,ordem,ativo")
          .order("ordem", { ascending: true })
          .order("nome", { ascending: true }),
        client.from("config_cardapio")
          .select("id,whatsapp,hora_abertura,hora_fechamento,dias_abertos,taxa_n1,taxa_n3,taxa_n5,taxa_c2,modo_loja")
          .eq("id", 1)
          .single()
      ]);
      if (p.error) throw p.error;
      if (c.error) throw c.error;
      if (f.error) throw f.error;
      produtos = p.data || [];
      categorias = c.data || [];
      config = f.data;
      renderizarTudo();
    } catch (e) {
      console.error(e);
      msg("produtoMsg", `Erro: ${e?.message || "não foi possível carregar"}`, "erro");
    }
  }

  function renderizarTudo() {
    renderStatusLoja();
    renderProdutos();
    renderCategorias();
    renderConfig();
    preencherFiltroCategorias();
  }

  function lojaAbertaAgora() {
    if (!config) return false;
    if (config.modo_loja === "aberta") return true;
    if (config.modo_loja === "fechada") return false;
    const agora = new Date();
    const dia = agora.getDay();
    const dias = (config.dias_abertos || []).map(Number);
    const hhmm = (v) => {
      const [h, m] = String(v || "00:00").slice(0, 5).split(":").map(Number);
      return h * 60 + m;
    };
    const atual = agora.getHours() * 60 + agora.getMinutes();
    return dias.includes(dia) && atual >= hhmm(config.hora_abertura) && atual < hhmm(config.hora_fechamento);
  }

  function renderStatusLoja() {
    const badge = $("storeBadge");
    const help = $("storeHelp");
    if (!badge || !config) return;
    badge.className = "status-badge";
    if (config.modo_loja === "aberta") {
      badge.textContent = "LOJA ABERTA";
      badge.classList.add("open");
      help.textContent = "Modo manual: a loja está forçada como ABERTA até você fechar ou voltar ao horário automático.";
    } else if (config.modo_loja === "fechada") {
      badge.textContent = "LOJA FECHADA";
      badge.classList.add("closed");
      help.textContent = "Modo manual: a loja está forçada como FECHADA até você abrir ou voltar ao horário automático.";
    } else {
      badge.textContent = lojaAbertaAgora() ? "ABERTA • AUTOMÁTICO" : "FECHADA • AUTOMÁTICO";
      badge.classList.add("auto");
      help.textContent = `Modo automático: ${String(config.hora_abertura).slice(0,5)} às ${String(config.hora_fechamento).slice(0,5)} nos dias selecionados.`;
    }
  }

  async function mudarModoLoja(modo) {
    if (!config) return;
    msg("storeMsg", "Salvando...");
    try {
      await sessaoAdmin();
      const { error } = await client.from("config_cardapio").update({ modo_loja: modo }).eq("id", 1);
      if (error) throw error;
      config.modo_loja = modo;
      renderStatusLoja();
      msg("storeMsg", "Status da loja atualizado.", "ok");
    } catch (e) {
      msg("storeMsg", e?.message || "Não foi possível alterar.", "erro");
    }
  }

  function preencherFiltroCategorias() {
    const select = $("filtroCategoria");
    if (!select) return;
    const valor = select.value || "todos";
    select.innerHTML = `<option value="todos">Todas as categorias</option>` + categorias.map(c =>
      `<option value="${esc(c.slug)}">${esc(c.emoji)} ${esc(c.nome)}</option>`
    ).join("");
    select.value = categorias.some(c => c.slug === valor) ? valor : "todos";
  }

  function stats() {
    return {
      total: produtos.length,
      disponiveis: produtos.filter(p => p.ativo !== false && p.disponivel !== false).length,
      esgotados: produtos.filter(p => p.ativo !== false && p.disponivel === false).length,
      ocultos: produtos.filter(p => p.ativo === false).length
    };
  }

  function renderProdutos() {
    const s = stats();
    $("statTotal").textContent = s.total;
    $("statDisponiveis").textContent = s.disponiveis;
    $("statEsgotados").textContent = s.esgotados;
    $("statOcultos").textContent = s.ocultos;

    const busca = ($("buscaProduto")?.value || "").trim().toLowerCase();
    const cat = $("filtroCategoria")?.value || "todos";
    const filtrados = produtos.filter(p => {
      const okBusca = !busca || `${p.nome || ""} ${p.produto_id || ""}`.toLowerCase().includes(busca);
      const okCat = cat === "todos" || p.categoria === cat;
      return okBusca && okCat;
    });

    const lista = $("listaProdutos");
    if (!lista) return;
    if (!filtrados.length) {
      lista.innerHTML = `<div class="notice">Nenhum produto encontrado.</div>`;
      return;
    }

    lista.innerHTML = filtrados.map(p => {
      const catObj = categorias.find(c => c.slug === p.categoria);
      const img = p.imagem_url || "";
      return `
        <article class="product-row" data-id="${esc(p.produto_id)}">
          <img src="${esc(img)}" alt="${esc(p.nome)}" onerror="this.style.opacity='.25'">
          <div>
            <h3>${esc(p.nome || p.produto_id)}</h3>
            <div class="product-meta">
              <span>${moeda(p.preco)}</span>
              <span class="pill">${esc(catObj?.emoji || "🍽️")} ${esc(catObj?.nome || p.categoria || "Sem categoria")}</span>
              <span class="pill ${p.disponivel !== false ? "green" : "red"}">${p.disponivel !== false ? "Disponível" : "Esgotado"}</span>
              <span class="pill ${p.ativo !== false ? "green" : "gray"}">${p.ativo !== false ? "Visível" : "Oculto"}</span>
              ${p.destaque ? `<span class="pill">⭐ Destaque</span>` : ""}
            </div>
          </div>
          <div class="row-actions">
            <button class="btn small ${p.disponivel !== false ? "danger" : "success"}" data-action="estoque" data-id="${esc(p.produto_id)}" type="button">${p.disponivel !== false ? "Esgotar" : "Disponível"}</button>
            <button class="btn small secondary" data-action="visibilidade" data-id="${esc(p.produto_id)}" type="button">${p.ativo !== false ? "Ocultar" : "Mostrar"}</button>
            <button class="btn small primary" data-action="editar" data-id="${esc(p.produto_id)}" type="button">Editar</button>
            <button class="btn small danger" data-action="excluir" data-id="${esc(p.produto_id)}" type="button">Excluir</button>
          </div>
        </article>`;
    }).join("");
  }

  async function atualizarProdutoRapido(id, campo, valor) {
    msg("produtoMsg", "Salvando...");
    try {
      await sessaoAdmin();
      const { error } = await client.from("produtos_estoque").update({ [campo]: valor }).eq("produto_id", id);
      if (error) throw error;
      const p = produtos.find(x => x.produto_id === id);
      if (p) p[campo] = valor;
      renderProdutos();
      msg("produtoMsg", "Alteração salva.", "ok");
    } catch (e) {
      msg("produtoMsg", e?.message || "Falha ao salvar.", "erro");
    }
  }

  async function atualizarTodosDisponibilidade(valor) {
    const ids = produtos.map(p => p.produto_id);
    if (!ids.length) return;
    const texto = valor ? "Marcar TODOS os produtos como disponíveis?" : "Marcar TODOS os produtos como esgotados?";
    if (!confirm(texto)) return;
    msg("produtoMsg", "Atualizando todos os produtos...");
    try {
      await sessaoAdmin();
      const { error } = await client.from("produtos_estoque").update({ disponivel: valor }).in("produto_id", ids);
      if (error) throw error;
      produtos.forEach(p => p.disponivel = valor);
      renderProdutos();
      msg("produtoMsg", `Todos os ${ids.length} produtos foram atualizados.`, "ok");
    } catch (e) {
      msg("produtoMsg", e?.message || "Não foi possível atualizar todos.", "erro");
    }
  }

  function abrirModal(titulo, html) {
    $("modalTitle").textContent = titulo;
    $("modalBody").innerHTML = html;
    $("modal").classList.add("open");
    $("modal").setAttribute("aria-hidden", "false");
  }

  function fecharModal() {
    $("modal").classList.remove("open");
    $("modal").setAttribute("aria-hidden", "true");
    $("modalBody").innerHTML = "";
  }

  function formularioProduto(p = null) {
    const novo = !p;
    const catOptions = categorias.map(c => `<option value="${esc(c.slug)}" ${p?.categoria === c.slug ? "selected" : ""}>${esc(c.emoji)} ${esc(c.nome)}</option>`).join("");
    abrirModal(novo ? "Novo produto" : `Editar: ${p.nome}`, `
      <form id="produtoForm" class="form-grid">
        <label class="full"><span>Nome</span><input id="pNome" value="${esc(p?.nome || "")}" required></label>
        <label><span>ID do produto</span><input id="pId" value="${esc(p?.produto_id || "")}" ${novo ? "" : "readonly"} placeholder="gerado pelo nome"></label>
        <label><span>Preço</span><input id="pPreco" type="number" min="0" step="0.01" value="${p?.preco ?? ""}" required></label>
        <label class="full"><span>Descrição</span><textarea id="pDescricao">${esc(p?.descricao || "")}</textarea></label>
        <label><span>Categoria</span><select id="pCategoria" required>${catOptions}</select></label>
        <label><span>Ordem</span><input id="pOrdem" type="number" step="1" value="${Number(p?.ordem || 0)}"></label>
        <label class="full"><span>URL da imagem</span><input id="pImagem" value="${esc(p?.imagem_url || "")}" placeholder="https://..."></label>
        <div class="full upload-line">
          <label><span>Ou enviar foto do celular</span><input id="pArquivo" type="file" accept="image/*"></label>
          <button id="btnUploadFoto" class="btn secondary" type="button">Enviar foto agora</button>
        </div>
        <div class="full"><img id="pPreview" class="preview" src="${esc(p?.imagem_url || "")}" alt="Prévia" onerror="this.style.opacity='.25'"></div>
        <div class="checks full">
          <label class="check"><input id="pDisponivel" type="checkbox" ${p?.disponivel !== false ? "checked" : ""}> Disponível</label>
          <label class="check"><input id="pAtivo" type="checkbox" ${p?.ativo !== false ? "checked" : ""}> Mostrar no cardápio</label>
          <label class="check"><input id="pDestaque" type="checkbox" ${p?.destaque ? "checked" : ""}> Destaque</label>
        </div>
        <p id="produtoModalMsg" class="msg full"></p>
        <div class="modal-actions full">
          <button class="btn secondary" type="button" data-close-modal>Cancelar</button>
          <button class="btn primary" type="submit">Salvar produto</button>
        </div>
      </form>`);

    const nome = $("pNome");
    const id = $("pId");
    if (novo) nome.addEventListener("input", () => { if (!id.dataset.manual) id.value = slug(nome.value); });
    if (novo) id.addEventListener("input", () => id.dataset.manual = "1");
    $("pImagem").addEventListener("input", () => $("pPreview").src = $("pImagem").value.trim());
    $("btnUploadFoto").addEventListener("click", async () => {
      const arquivo = $("pArquivo").files?.[0];
      if (!arquivo) return msg("produtoModalMsg", "Escolha uma imagem primeiro.", "erro");
      try {
        msg("produtoModalMsg", "Enviando imagem...");
        const produtoId = slug($("pId").value || $("pNome").value) || "produto";
        const url = await uploadImagem(arquivo, produtoId);
        $("pImagem").value = url;
        $("pPreview").src = url;
        msg("produtoModalMsg", "Imagem enviada.", "ok");
      } catch (e) { msg("produtoModalMsg", e?.message || "Falha no upload.", "erro"); }
    });
    $("produtoForm").addEventListener("submit", e => salvarProduto(e, p));
  }

  async function uploadImagem(file, produtoId) {
    await sessaoAdmin();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${produtoId}/${Date.now()}.${ext}`;
    const { error } = await client.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });
    if (error) throw error;
    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("Não foi possível obter a URL pública da imagem.");
    return data.publicUrl;
  }

  async function salvarProduto(event, existente) {
    event.preventDefault();
    msg("produtoModalMsg", "Salvando...");
    try {
      await sessaoAdmin();
      const nome = $("pNome").value.trim();
      const produto_id = existente?.produto_id || slug($("pId").value || nome);
      if (!nome || !produto_id) throw new Error("Preencha nome e ID do produto.");
      let imagem_url = $("pImagem").value.trim();
      const arquivo = $("pArquivo").files?.[0];
      if (arquivo && !imagem_url) imagem_url = await uploadImagem(arquivo, produto_id);
      const payload = {
        nome,
        preco: Number($("pPreco").value || 0),
        descricao: $("pDescricao").value.trim(),
        categoria: $("pCategoria").value,
        imagem_url,
        disponivel: $("pDisponivel").checked,
        ativo: $("pAtivo").checked,
        destaque: $("pDestaque").checked,
        ordem: Number($("pOrdem").value || 0)
      };
      let r;
      if (existente) r = await client.from("produtos_estoque").update(payload).eq("produto_id", existente.produto_id);
      else r = await client.from("produtos_estoque").insert({ produto_id, ...payload });
      if (r.error) throw r.error;
      await carregarTudo();
      fecharModal();
      msg("produtoMsg", existente ? "Produto atualizado." : "Produto criado.", "ok");
    } catch (e) { msg("produtoModalMsg", e?.message || "Não foi possível salvar.", "erro"); }
  }

  async function excluirProduto(p) {
    if (!confirm(`Excluir definitivamente "${p.nome}"?`)) return;
    msg("produtoMsg", "Excluindo...");
    try {
      await sessaoAdmin();
      const { error } = await client.from("produtos_estoque").delete().eq("produto_id", p.produto_id);
      if (error) throw error;
      produtos = produtos.filter(x => x.produto_id !== p.produto_id);
      renderProdutos();
      msg("produtoMsg", "Produto excluído.", "ok");
    } catch (e) { msg("produtoMsg", e?.message || "Não foi possível excluir.", "erro"); }
  }

  function renderCategorias() {
    const lista = $("listaCategorias");
    if (!lista) return;
    if (!categorias.length) return lista.innerHTML = `<div class="notice">Nenhuma categoria cadastrada.</div>`;
    lista.innerHTML = categorias.map(c => {
      const qtd = produtos.filter(p => p.categoria === c.slug).length;
      return `<article class="category-row">
        <div><h3>${esc(c.emoji)} ${esc(c.nome)}</h3><div class="product-meta"><span>${qtd} produto(s)</span><span>Ordem ${Number(c.ordem || 0)}</span><span class="pill ${c.ativo !== false ? "green" : "gray"}">${c.ativo !== false ? "Visível" : "Oculta"}</span></div></div>
        <div class="row-actions">
          <button class="btn small primary" data-cat-action="editar" data-slug="${esc(c.slug)}" type="button">Editar</button>
          <button class="btn small danger" data-cat-action="excluir" data-slug="${esc(c.slug)}" type="button">Excluir</button>
        </div>
      </article>`;
    }).join("");
  }

  function formularioCategoria(c = null) {
    const novo = !c;
    abrirModal(novo ? "Nova categoria" : `Editar: ${c.nome}`, `
      <form id="categoriaForm" class="form-grid">
        <label><span>Nome</span><input id="cNome" value="${esc(c?.nome || "")}" required></label>
        <label><span>Emoji</span><input id="cEmoji" value="${esc(c?.emoji || "🍽️")}" maxlength="8"></label>
        <label><span>Slug/ID</span><input id="cSlug" value="${esc(c?.slug || "")}" ${novo ? "" : "readonly"}></label>
        <label><span>Ordem</span><input id="cOrdem" type="number" step="1" value="${Number(c?.ordem || 0)}"></label>
        <label class="check full"><input id="cAtivo" type="checkbox" ${c?.ativo !== false ? "checked" : ""}> Mostrar categoria no cardápio</label>
        <p id="categoriaModalMsg" class="msg full"></p>
        <div class="modal-actions full"><button class="btn secondary" type="button" data-close-modal>Cancelar</button><button class="btn primary" type="submit">Salvar categoria</button></div>
      </form>`);
    if (novo) {
      const nome = $("cNome"), sl = $("cSlug");
      nome.addEventListener("input", () => { if (!sl.dataset.manual) sl.value = slug(nome.value); });
      sl.addEventListener("input", () => sl.dataset.manual = "1");
    }
    $("categoriaForm").addEventListener("submit", e => salvarCategoria(e, c));
  }

  async function salvarCategoria(event, existente) {
    event.preventDefault();
    msg("categoriaModalMsg", "Salvando...");
    try {
      await sessaoAdmin();
      const nome = $("cNome").value.trim();
      const catSlug = existente?.slug || slug($("cSlug").value || nome);
      if (!nome || !catSlug) throw new Error("Preencha o nome da categoria.");
      const payload = { nome, emoji: $("cEmoji").value.trim() || "🍽️", ordem: Number($("cOrdem").value || 0), ativo: $("cAtivo").checked };
      let r;
      if (existente) r = await client.from("categorias_cardapio").update(payload).eq("slug", existente.slug);
      else r = await client.from("categorias_cardapio").insert({ slug: catSlug, ...payload });
      if (r.error) throw r.error;
      await carregarTudo();
      fecharModal();
      msg("categoriaMsg", "Categoria salva.", "ok");
    } catch (e) { msg("categoriaModalMsg", e?.message || "Não foi possível salvar.", "erro"); }
  }

  async function excluirCategoria(c) {
    const usados = produtos.filter(p => p.categoria === c.slug);
    if (usados.length) return msg("categoriaMsg", `Essa categoria possui ${usados.length} produto(s). Mova-os para outra categoria antes de excluir.`, "erro");
    if (!confirm(`Excluir a categoria "${c.nome}"?`)) return;
    try {
      await sessaoAdmin();
      const { error } = await client.from("categorias_cardapio").delete().eq("slug", c.slug);
      if (error) throw error;
      categorias = categorias.filter(x => x.slug !== c.slug);
      renderCategorias();
      preencherFiltroCategorias();
      msg("categoriaMsg", "Categoria excluída.", "ok");
    } catch (e) { msg("categoriaMsg", e?.message || "Não foi possível excluir.", "erro"); }
  }

  function renderConfig() {
    if (!config) return;
    $("cfgWhatsapp").value = config.whatsapp || "";
    $("cfgAbertura").value = String(config.hora_abertura || "18:00").slice(0, 5);
    $("cfgFechamento").value = String(config.hora_fechamento || "22:00").slice(0, 5);
    $("cfgN1").value = Number(config.taxa_n1 || 0).toFixed(2);
    $("cfgN3").value = Number(config.taxa_n3 || 0).toFixed(2);
    $("cfgN5").value = Number(config.taxa_n5 || 0).toFixed(2);
    $("cfgC2").value = Number(config.taxa_c2 || 0).toFixed(2);
    const dias = (config.dias_abertos || []).map(Number);
    document.querySelectorAll('input[name="dia"]').forEach(x => x.checked = dias.includes(Number(x.value)));
  }

  async function salvarConfig(event) {
    event.preventDefault();
    msg("configMsg", "Salvando...");
    try {
      await sessaoAdmin();
      const dias_abertos = [...document.querySelectorAll('input[name="dia"]:checked')].map(x => Number(x.value)).sort((a,b) => a-b);
      const payload = {
        whatsapp: $("cfgWhatsapp").value.trim(),
        hora_abertura: $("cfgAbertura").value,
        hora_fechamento: $("cfgFechamento").value,
        dias_abertos,
        taxa_n1: Number($("cfgN1").value || 0),
        taxa_n3: Number($("cfgN3").value || 0),
        taxa_n5: Number($("cfgN5").value || 0),
        taxa_c2: Number($("cfgC2").value || 0)
      };
      const { error } = await client.from("config_cardapio").update(payload).eq("id", 1);
      if (error) throw error;
      config = { ...config, ...payload };
      renderStatusLoja();
      msg("configMsg", "Configurações salvas.", "ok");
    } catch (e) { msg("configMsg", e?.message || "Não foi possível salvar.", "erro"); }
  }

  function trocarAba(nome) {
    abaAtual = nome;
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === nome));
    $("tabProdutos").classList.toggle("hidden", nome !== "produtos");
    $("tabCategorias").classList.toggle("hidden", nome !== "categorias");
    $("tabConfig").classList.toggle("hidden", nome !== "config");
    $("btnNovoProduto").classList.toggle("hidden", nome !== "produtos");
  }

  function iniciarRealtime() {
    if (!client || realtimeChannel) return;
    realtimeChannel = client.channel("cantinho-admin-total")
      .on("postgres_changes", { event: "*", schema: "public", table: "produtos_estoque" }, () => carregarTudo())
      .on("postgres_changes", { event: "*", schema: "public", table: "categorias_cardapio" }, () => carregarTudo())
      .on("postgres_changes", { event: "*", schema: "public", table: "config_cardapio" }, () => carregarTudo())
      .subscribe();
  }

  function binds() {
    $("loginForm")?.addEventListener("submit", login);
    $("btnSair")?.addEventListener("click", sair);
    $("btnFecharModal")?.addEventListener("click", fecharModal);
    $("modal")?.addEventListener("click", e => { if (e.target === $("modal")) fecharModal(); });
    document.addEventListener("click", e => {
      const close = e.target.closest("[data-close-modal]");
      if (close) fecharModal();
      const mode = e.target.closest("[data-store-mode]");
      if (mode) mudarModoLoja(mode.dataset.storeMode);
      const prod = e.target.closest("[data-action]");
      if (prod) {
        const p = produtos.find(x => x.produto_id === prod.dataset.id);
        if (!p) return;
        if (prod.dataset.action === "estoque") atualizarProdutoRapido(p.produto_id, "disponivel", p.disponivel === false);
        if (prod.dataset.action === "visibilidade") atualizarProdutoRapido(p.produto_id, "ativo", p.ativo === false);
        if (prod.dataset.action === "editar") formularioProduto(p);
        if (prod.dataset.action === "excluir") excluirProduto(p);
      }
      const cat = e.target.closest("[data-cat-action]");
      if (cat) {
        const c = categorias.find(x => x.slug === cat.dataset.slug);
        if (!c) return;
        if (cat.dataset.catAction === "editar") formularioCategoria(c);
        if (cat.dataset.catAction === "excluir") excluirCategoria(c);
      }
    });
    document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => trocarAba(b.dataset.tab)));
    $("btnNovoProduto")?.addEventListener("click", () => formularioProduto());
    $("btnNovaCategoria")?.addEventListener("click", () => formularioCategoria());
    $("buscaProduto")?.addEventListener("input", renderProdutos);
    $("filtroCategoria")?.addEventListener("change", renderProdutos);
    $("btnTodosDisponiveis")?.addEventListener("click", () => atualizarTodosDisponibilidade(true));
    $("btnTodosEsgotados")?.addEventListener("click", () => atualizarTodosDisponibilidade(false));
    $("configForm")?.addEventListener("submit", salvarConfig);
  }

  async function init() {
    binds();
    if (!client) {
      showLogin();
      msg("loginMsg", "Configuração do Supabase não encontrada em ../config.js.", "erro");
      return;
    }
    try {
      const user = await sessaoAdmin();
      if (!user) return showLogin();
      showDashboard(user);
      await carregarTudo();
      iniciarRealtime();
    } catch (e) {
      showLogin();
      msg("loginMsg", e?.message || "Faça login novamente.", "erro");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
