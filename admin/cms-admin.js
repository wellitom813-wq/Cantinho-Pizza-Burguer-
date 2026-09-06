(() => {
  "use strict";

  const ADMIN_UID = "d8ca47b0-b9ef-4bee-8f44-65cfc602fdeb";
  const cfg = window.SUPABASE_CONFIG || window.supabaseConfig || {};
  const URL = cfg.url || window.SUPABASE_URL;
  const KEY = cfg.key || cfg.anonKey || window.SUPABASE_ANON_KEY || window.SUPABASE_PUBLISHABLE_KEY;
  let client = null;
  function ensureClient() {
    if (!client && window.supabase && URL && KEY) client = window.supabase.createClient(URL, KEY);
    return client;
  }

  let site = null;
  let avisos = [];
  let regioes = [];
  let pagamentos = [];
  let iniciado = false;
  let channel = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (v) => String(v ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const slug = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const money = (v) => Number(v || 0).toLocaleString("pt-BR", {style:"currency",currency:"BRL"});

  function css() {
    if (document.getElementById("cantinho-cms-admin-css")) return;
    const style = document.createElement("style");
    style.id = "cantinho-cms-admin-css";
    style.textContent = `
      .cms-admin-card{margin-top:18px}.cms-admin-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.cms-admin-tab{border:1px solid #303030;background:#151515;color:#ddd;border-radius:11px;padding:10px 12px;font-weight:800}.cms-admin-tab.active{background:#ea1d2c;border-color:#ea1d2c;color:#fff}.cms-panel.hidden{display:none!important}
      .cms-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.cms-form label{display:flex;flex-direction:column;gap:7px}.cms-form .full{grid-column:1/-1}.cms-form span,.cms-mini-label{font-size:12px;color:#aaa;font-weight:800}.cms-form input,.cms-form select,.cms-form textarea,.cms-row input,.cms-row select{width:100%;background:#0e0e0e;color:#fff;border:1px solid #303030;border-radius:10px;padding:11px}.cms-form textarea{min-height:90px;resize:vertical}.cms-check{flex-direction:row!important;align-items:center!important;padding:10px 0}.cms-check input{width:auto!important}.cms-save{margin-top:5px}.cms-list{display:grid;gap:10px;margin-top:14px}.cms-row{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(100px,.7fr) minmax(90px,.5fr) auto;gap:8px;align-items:center;padding:12px;border:1px solid #2b2b2b;border-radius:13px;background:#111}.cms-row-main strong{display:block}.cms-row-main small{display:block;color:#888;margin-top:4px}.cms-actions{display:flex;gap:6px;flex-wrap:wrap}.cms-btn{border:0;border-radius:9px;padding:9px 11px;font-weight:900}.cms-btn.edit{background:#262626;color:#fff}.cms-btn.danger{background:#50171b;color:#ffb6bb}.cms-btn.ok{background:#173d25;color:#adf0c0}.cms-note{color:#aaa;font-size:13px;line-height:1.5;margin-top:6px}.cms-msg{min-height:20px;margin-top:10px;font-weight:800}.cms-msg.ok{color:#5ee089}.cms-msg.err{color:#ff747d}.cms-section-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.cms-color-preview{height:42px;border-radius:10px;border:1px solid #333}
      @media(max-width:720px){.cms-form{grid-template-columns:1fr}.cms-row{grid-template-columns:1fr}.cms-admin-tabs{display:grid;grid-template-columns:1fr 1fr}.cms-form .full{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function msg(text = "", type = "") {
    const el = document.getElementById("cmsMsg");
    if (!el) return;
    el.textContent = text;
    el.className = `cms-msg ${type}`;
  }

  async function adminSession() {
    if (!ensureClient()) return null;
    const {data} = await client.auth.getSession();
    const user = data?.session?.user;
    return user?.id === ADMIN_UID ? user : null;
  }


  function ocultarTaxasLegadas() {
    ["cfgN1","cfgN3","cfgN5","cfgC2"].forEach(id => {
      const campo = document.getElementById(id);
      const label = campo?.closest("label");
      if (label) label.style.display = "none";
    });
  }

  function inject() {
    if (document.getElementById("cmsAdminCard")) return;
    const dash = document.getElementById("dashboardView");
    if (!dash) return;
    const card = document.createElement("section");
    card.id = "cmsAdminCard";
    card.className = "card cms-admin-card";
    card.innerHTML = `
      <div class="section-head wrap-head"><div><span class="eyebrow">EDITAR SITE</span><h2>Central de controle</h2><p class="muted">Textos, avisos, entrega, pagamentos, aparência e manutenção.</p></div></div>
      <div class="cms-admin-tabs">
        <button class="cms-admin-tab active" data-cms-tab="site" type="button">🏠 Site</button>
        <button class="cms-admin-tab" data-cms-tab="avisos" type="button">📢 Avisos</button>
        <button class="cms-admin-tab" data-cms-tab="entrega" type="button">🛵 Entrega</button>
        <button class="cms-admin-tab" data-cms-tab="pagamentos" type="button">💳 Pagamentos</button>
        <button class="cms-admin-tab" data-cms-tab="aparencia" type="button">🎨 Aparência</button>
      </div>
      <div id="cmsPanelSite" class="cms-panel"></div>
      <div id="cmsPanelAvisos" class="cms-panel hidden"></div>
      <div id="cmsPanelEntrega" class="cms-panel hidden"></div>
      <div id="cmsPanelPagamentos" class="cms-panel hidden"></div>
      <div id="cmsPanelAparencia" class="cms-panel hidden"></div>
      <p id="cmsMsg" class="cms-msg"></p>
    `;
    dash.appendChild(card);
    $$("[data-cms-tab]", card).forEach(btn => btn.addEventListener("click", () => abrirTab(btn.dataset.cmsTab)));
  }

  function abrirTab(tab) {
    $$(".cms-admin-tab").forEach(b => b.classList.toggle("active", b.dataset.cmsTab === tab));
    ["site","avisos","entrega","pagamentos","aparencia"].forEach(t => {
      document.getElementById(`cmsPanel${t[0].toUpperCase()+t.slice(1)}`)?.classList.toggle("hidden", t !== tab);
    });
  }

  async function load() {
    const [s,a,r,p] = await Promise.all([
      client.from("site_config").select("*").eq("id",1).single(),
      client.from("avisos_site").select("*").order("ordem",{ascending:true}).order("id",{ascending:false}),
      client.from("regioes_entrega").select("*").order("ordem",{ascending:true}),
      client.from("formas_pagamento").select("*").order("ordem",{ascending:true})
    ]);
    if (s.error) throw s.error;
    if (a.error) throw a.error;
    if (r.error) throw r.error;
    if (p.error) throw p.error;
    site = s.data;
    avisos = a.data || [];
    regioes = r.data || [];
    pagamentos = p.data || [];
    renderAll();
  }

  function renderAll() {
    renderSite(); renderAvisos(); renderEntrega(); renderPagamentos(); renderAparencia();
  }

  function renderSite() {
    const box = document.getElementById("cmsPanelSite");
    if (!box || !site) return;
    box.innerHTML = `
      <form id="cmsSiteForm" class="cms-form">
        <label><span>Nome da loja</span><input id="cmsNomeLoja" value="${esc(site.nome_loja)}"></label>
        <label><span>Subtítulo da marca</span><input id="cmsSubMarca" value="${esc(site.subtitulo_marca)}"></label>
        <label class="full"><span>Frase pequena do topo</span><input id="cmsHeroSelo" value="${esc(site.hero_selo)}"></label>
        <label class="full"><span>Título principal</span><input id="cmsHeroTitulo" value="${esc(site.hero_titulo)}"></label>
        <label class="full"><span>Texto principal</span><textarea id="cmsHeroTexto">${esc(site.hero_texto)}</textarea></label>
        <label><span>Texto do botão principal</span><input id="cmsHeroBotao" value="${esc(site.hero_botao_texto)}"></label>
        <label><span>Tempo estimado</span><input id="cmsTempo" value="${esc(site.tempo_entrega_texto || "")}" placeholder="Ex: 30–60 min"></label>
        <label class="full"><span>Resumo do cardápio</span><input id="cmsResumo" value="${esc(site.resumo_cardapio || "")}"></label>
        <label><span>Telefone para exibir</span><input id="cmsTelefone" value="${esc(site.telefone_exibicao || "")}"></label>
        <label><span>Pedido mínimo (R$)</span><input id="cmsPedidoMin" type="number" min="0" step="0.01" value="${Number(site.pedido_minimo||0)}"></label>
        <label class="full"><span>Endereço / referência da loja</span><input id="cmsEndereco" value="${esc(site.endereco_loja || "")}"></label>
        <label class="full"><span>Instagram (link completo)</span><input id="cmsInstagram" value="${esc(site.instagram_url || "")}" placeholder="https://instagram.com/..."></label>
        <label class="cms-check"><input id="cmsEntrega" type="checkbox" ${site.aceita_entrega ? "checked":""}> <span>Aceitar entrega</span></label>
        <label class="cms-check"><input id="cmsRetirada" type="checkbox" ${site.aceita_retirada ? "checked":""}> <span>Aceitar retirada</span></label>
        <label class="cms-check"><input id="cmsAdminLink" type="checkbox" ${site.mostrar_link_admin ? "checked":""}> <span>Mostrar link do Admin no site público</span></label>
        <label class="full"><span>Texto do rodapé</span><input id="cmsRodape" value="${esc(site.rodape_texto || "")}"></label>
        <div class="full"><button class="btn primary cms-save" type="submit">Salvar dados do site</button></div>
      </form>
    `;
    document.getElementById("cmsSiteForm").onsubmit = saveSite;
  }

  async function saveSite(e) {
    e.preventDefault(); msg("Salvando...");
    const payload = {
      nome_loja: $("#cmsNomeLoja").value.trim(), subtitulo_marca: $("#cmsSubMarca").value.trim(), hero_selo: $("#cmsHeroSelo").value.trim(),
      hero_titulo: $("#cmsHeroTitulo").value.trim(), hero_texto: $("#cmsHeroTexto").value.trim(), hero_botao_texto: $("#cmsHeroBotao").value.trim(),
      tempo_entrega_texto: $("#cmsTempo").value.trim(), resumo_cardapio: $("#cmsResumo").value.trim(), telefone_exibicao: $("#cmsTelefone").value.trim() || null,
      pedido_minimo: Number($("#cmsPedidoMin").value || 0), endereco_loja: $("#cmsEndereco").value.trim() || null, instagram_url: $("#cmsInstagram").value.trim() || null,
      aceita_entrega: $("#cmsEntrega").checked, aceita_retirada: $("#cmsRetirada").checked, mostrar_link_admin: $("#cmsAdminLink").checked, rodape_texto: $("#cmsRodape").value.trim()
    };
    const {error} = await client.from("site_config").update(payload).eq("id",1);
    if (error) return msg(error.message,"err");
    msg("Dados do site salvos.","ok"); await load();
  }

  function renderAvisos() {
    const box = document.getElementById("cmsPanelAvisos");
    if (!box) return;
    box.innerHTML = `
      <div class="cms-section-head"><div><h3>Mensagens aos clientes</h3><p class="cms-note">Faixa no topo, mensagem na página inicial ou pop-up.</p></div><button id="cmsNovoAviso" class="btn primary" type="button">+ Novo aviso</button></div>
      <div class="cms-list">${avisos.length ? avisos.map(a => `
        <div class="cms-row"><div class="cms-row-main"><strong>${esc(a.titulo || "Sem título")}</strong><small>${esc(a.mensagem)} • ${esc(a.tipo)} • ${a.ativo ? "Ativo":"Inativo"}</small></div><div>${a.inicio ? new Date(a.inicio).toLocaleDateString("pt-BR") : "Agora"}</div><div>${a.fim ? new Date(a.fim).toLocaleDateString("pt-BR") : "Sem fim"}</div><div class="cms-actions"><button class="cms-btn edit" data-aviso-edit="${a.id}">Editar</button><button class="cms-btn ${a.ativo?"danger":"ok"}" data-aviso-toggle="${a.id}">${a.ativo?"Desativar":"Ativar"}</button><button class="cms-btn danger" data-aviso-del="${a.id}">Excluir</button></div></div>`).join("") : `<p class="cms-note">Nenhum aviso criado.</p>`}</div>
      <div id="cmsAvisoEditor"></div>
    `;
    $("#cmsNovoAviso").onclick = () => avisoEditor(null);
    $$('[data-aviso-edit]').forEach(b => b.onclick = () => avisoEditor(avisos.find(a => String(a.id)===b.dataset.avisoEdit)));
    $$('[data-aviso-toggle]').forEach(b => b.onclick = () => toggleAviso(b.dataset.avisoToggle));
    $$('[data-aviso-del]').forEach(b => b.onclick = () => deleteAviso(b.dataset.avisoDel));
  }

  function localDatetime(v) {
    if (!v) return "";
    const d = new Date(v); const pad=n=>String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function avisoEditor(a) {
    const box = document.getElementById("cmsAvisoEditor");
    box.innerHTML = `<hr style="border:0;border-top:1px solid #292929;margin:20px 0"><form id="cmsAvisoForm" class="cms-form">
      <label><span>Título</span><input id="cmsAvisoTitulo" value="${esc(a?.titulo || "")}" placeholder="Ex: Promoção de hoje"></label>
      <label><span>Onde mostrar</span><select id="cmsAvisoTipo"><option value="faixa" ${a?.tipo==='faixa'?'selected':''}>Faixa no topo</option><option value="inicio" ${a?.tipo==='inicio'?'selected':''}>Página inicial</option><option value="popup" ${a?.tipo==='popup'?'selected':''}>Pop-up</option></select></label>
      <label class="full"><span>Mensagem</span><textarea id="cmsAvisoMensagem" required>${esc(a?.mensagem || "")}</textarea></label>
      <label><span>Texto do botão (opcional)</span><input id="cmsAvisoBotao" value="${esc(a?.botao_texto || "")}"></label>
      <label><span>Link do botão (opcional)</span><input id="cmsAvisoUrl" value="${esc(a?.botao_url || "")}"></label>
      <label><span>Começar em (opcional)</span><input id="cmsAvisoInicio" type="datetime-local" value="${localDatetime(a?.inicio)}"></label>
      <label><span>Terminar em (opcional)</span><input id="cmsAvisoFim" type="datetime-local" value="${localDatetime(a?.fim)}"></label>
      <label><span>Ordem</span><input id="cmsAvisoOrdem" type="number" value="${Number(a?.ordem || 10)}"></label>
      <label class="cms-check"><input id="cmsAvisoAtivo" type="checkbox" ${a?.ativo !== false ? 'checked':''}> <span>Ativo</span></label>
      <div class="full"><button class="btn primary" type="submit">${a ? "Salvar aviso":"Publicar aviso"}</button> <button id="cmsCancelarAviso" class="btn ghost" type="button">Cancelar</button></div>
    </form>`;
    $("#cmsCancelarAviso").onclick = () => box.innerHTML = "";
    $("#cmsAvisoForm").onsubmit = async (e) => {
      e.preventDefault();
      const payload = {titulo:$("#cmsAvisoTitulo").value.trim()||null,mensagem:$("#cmsAvisoMensagem").value.trim(),tipo:$("#cmsAvisoTipo").value,botao_texto:$("#cmsAvisoBotao").value.trim()||null,botao_url:$("#cmsAvisoUrl").value.trim()||null,inicio:$("#cmsAvisoInicio").value?new Date($("#cmsAvisoInicio").value).toISOString():null,fim:$("#cmsAvisoFim").value?new Date($("#cmsAvisoFim").value).toISOString():null,ordem:Number($("#cmsAvisoOrdem").value||10),ativo:$("#cmsAvisoAtivo").checked};
      const q = a ? client.from("avisos_site").update(payload).eq("id",a.id) : client.from("avisos_site").insert(payload);
      const {error} = await q; if (error) return msg(error.message,"err"); msg("Aviso salvo.","ok"); await load(); abrirTab("avisos");
    };
  }

  async function toggleAviso(id) { const a=avisos.find(x=>String(x.id)===String(id)); if(!a)return; const {error}=await client.from("avisos_site").update({ativo:!a.ativo}).eq("id",id); if(error)return msg(error.message,"err"); await load(); abrirTab("avisos"); }
  async function deleteAviso(id) { if(!confirm("Excluir este aviso?"))return; const {error}=await client.from("avisos_site").delete().eq("id",id); if(error)return msg(error.message,"err"); await load(); abrirTab("avisos"); }

  function renderEntrega() {
    const box = document.getElementById("cmsPanelEntrega"); if(!box)return;
    box.innerHTML = `<div class="cms-section-head"><div><h3>Regiões e taxas</h3><p class="cms-note">Você pode criar quantas regiões precisar.</p></div><button id="cmsNovaRegiao" class="btn primary" type="button">+ Nova região</button></div>
      <div class="cms-list">${regioes.map(r=>`<div class="cms-row"><div class="cms-row-main"><strong>${esc(r.nome)}</strong><small>Código: ${esc(r.codigo)} • ${r.ativo?'Ativa':'Oculta'}</small></div><div>${money(r.taxa)}</div><div>Ordem ${Number(r.ordem||0)}</div><div class="cms-actions"><button class="cms-btn edit" data-reg-edit="${r.id}">Editar</button><button class="cms-btn danger" data-reg-del="${r.id}">Excluir</button></div></div>`).join("")}</div><div id="cmsRegEditor"></div>`;
    $("#cmsNovaRegiao").onclick=()=>regEditor(null); $$('[data-reg-edit]').forEach(b=>b.onclick=()=>regEditor(regioes.find(r=>String(r.id)===b.dataset.regEdit))); $$('[data-reg-del]').forEach(b=>b.onclick=()=>deleteReg(b.dataset.regDel));
  }

  function regEditor(r) {
    const box=$("#cmsRegEditor"); box.innerHTML=`<hr style="border:0;border-top:1px solid #292929;margin:20px 0"><form id="cmsRegForm" class="cms-form"><label><span>Nome</span><input id="cmsRegNome" value="${esc(r?.nome||"")}" required placeholder="Ex: N7"></label><label><span>Código</span><input id="cmsRegCodigo" value="${esc(r?.codigo||"")}" required placeholder="N7"></label><label><span>Taxa (R$)</span><input id="cmsRegTaxa" type="number" min="0" step="0.01" value="${Number(r?.taxa||0)}"></label><label><span>Ordem</span><input id="cmsRegOrdem" type="number" value="${Number(r?.ordem||10)}"></label><label class="cms-check"><input id="cmsRegAtivo" type="checkbox" ${r?.ativo!==false?'checked':''}><span>Região ativa</span></label><div class="full"><button class="btn primary" type="submit">Salvar região</button> <button id="cmsRegCancel" class="btn ghost" type="button">Cancelar</button></div></form>`;
    $("#cmsRegCancel").onclick=()=>box.innerHTML=""; $("#cmsRegForm").onsubmit=async e=>{e.preventDefault();const payload={nome:$("#cmsRegNome").value.trim(),codigo:slug($("#cmsRegCodigo").value).toUpperCase().replaceAll("-","_")||slug($("#cmsRegNome").value).toUpperCase().replaceAll("-","_"),taxa:Number($("#cmsRegTaxa").value||0),ordem:Number($("#cmsRegOrdem").value||10),ativo:$("#cmsRegAtivo").checked};const q=r?client.from("regioes_entrega").update(payload).eq("id",r.id):client.from("regioes_entrega").insert(payload);const {error}=await q;if(error)return msg(error.message,"err");msg("Região salva.","ok");await load();abrirTab("entrega");};
  }
  async function deleteReg(id){if(!confirm("Excluir esta região?"))return;const {error}=await client.from("regioes_entrega").delete().eq("id",id);if(error)return msg(error.message,"err");await load();abrirTab("entrega");}

  function renderPagamentos() {
    const box=$("#cmsPanelPagamentos");if(!box)return;box.innerHTML=`<div class="cms-section-head"><div><h3>Formas de pagamento</h3><p class="cms-note">Ative, oculte ou crie novas opções.</p></div><button id="cmsNovoPag" class="btn primary" type="button">+ Nova forma</button></div><div class="cms-list">${pagamentos.map(p=>`<div class="cms-row"><div class="cms-row-main"><strong>${esc(p.nome)}</strong><small>${p.ativo?'Ativa':'Oculta'}${p.aceita_troco?' • aceita troco':''}</small></div><div>${esc(p.codigo)}</div><div>Ordem ${Number(p.ordem||0)}</div><div class="cms-actions"><button class="cms-btn edit" data-pag-edit="${p.id}">Editar</button><button class="cms-btn danger" data-pag-del="${p.id}">Excluir</button></div></div>`).join("")}</div><div id="cmsPagEditor"></div>`;$("#cmsNovoPag").onclick=()=>pagEditor(null);$$('[data-pag-edit]').forEach(b=>b.onclick=()=>pagEditor(pagamentos.find(p=>String(p.id)===b.dataset.pagEdit)));$$('[data-pag-del]').forEach(b=>b.onclick=()=>deletePag(b.dataset.pagDel));
  }
  function pagEditor(p){const box=$("#cmsPagEditor");box.innerHTML=`<hr style="border:0;border-top:1px solid #292929;margin:20px 0"><form id="cmsPagForm" class="cms-form"><label><span>Nome</span><input id="cmsPagNome" value="${esc(p?.nome||"")}" required></label><label><span>Código</span><input id="cmsPagCodigo" value="${esc(p?.codigo||"")}" required></label><label><span>Ordem</span><input id="cmsPagOrdem" type="number" value="${Number(p?.ordem||10)}"></label><label class="cms-check"><input id="cmsPagAtivo" type="checkbox" ${p?.ativo!==false?'checked':''}><span>Ativa</span></label><label class="cms-check"><input id="cmsPagTroco" type="checkbox" ${p?.aceita_troco?'checked':''}><span>Mostrar campo de troco</span></label><div class="full"><button class="btn primary" type="submit">Salvar forma</button> <button id="cmsPagCancel" class="btn ghost" type="button">Cancelar</button></div></form>`;$("#cmsPagCancel").onclick=()=>box.innerHTML="";$("#cmsPagForm").onsubmit=async e=>{e.preventDefault();const payload={nome:$("#cmsPagNome").value.trim(),codigo:slug($("#cmsPagCodigo").value)||slug($("#cmsPagNome").value),ordem:Number($("#cmsPagOrdem").value||10),ativo:$("#cmsPagAtivo").checked,aceita_troco:$("#cmsPagTroco").checked};const q=p?client.from("formas_pagamento").update(payload).eq("id",p.id):client.from("formas_pagamento").insert(payload);const {error}=await q;if(error)return msg(error.message,"err");msg("Forma de pagamento salva.","ok");await load();abrirTab("pagamentos");};}
  async function deletePag(id){if(!confirm("Excluir esta forma de pagamento?"))return;const {error}=await client.from("formas_pagamento").delete().eq("id",id);if(error)return msg(error.message,"err");await load();abrirTab("pagamentos");}

  async function uploadSiteAsset(file, pasta) {
    if (!file) return null;
    if (!String(file.type || "").startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
    if (file.size > 8 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 8 MB.");
    const extOriginal = String(file.name || "imagem.jpg").split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const path = `${pasta}/${Date.now()}-${id}.${extOriginal}`;
    const { error } = await client.storage.from("site-assets").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = client.storage.from("site-assets").getPublicUrl(path);
    return data?.publicUrl || null;
  }

  function renderAparencia() {
    const box = $("#cmsPanelAparencia");
    if (!box || !site) return;
    box.innerHTML = `
      <form id="cmsAparenciaForm" class="cms-form">
        <label><span>Cor principal</span><input id="cmsCor" type="color" value="${/^#[0-9a-fA-F]{6}$/.test(site.cor_primaria||"") ? site.cor_primaria : '#ea1d2c'}"></label>
        <div><span class="cms-mini-label">Prévia</span><div id="cmsColorPreview" class="cms-color-preview" style="background:${esc(site.cor_primaria||'#ea1d2c')}"></div></div>

        <label class="full"><span>URL da logo</span><input id="cmsLogo" value="${esc(site.logo_url||"")}" placeholder="https://..."></label>
        <label class="full"><span>Ou envie uma logo do celular</span><input id="cmsLogoFile" type="file" accept="image/*"></label>

        <label class="full"><span>URL da imagem/banner principal</span><input id="cmsHeroImg" value="${esc(site.hero_imagem_url||"")}" placeholder="https://..."></label>
        <label class="full"><span>Ou envie um banner do celular</span><input id="cmsHeroFile" type="file" accept="image/*"></label>

        <label class="cms-check full"><input id="cmsManutencao" type="checkbox" ${site.manutencao_ativa?'checked':''}><span>Ativar modo manutenção</span></label>
        <label class="full"><span>Mensagem de manutenção</span><textarea id="cmsManutMsg">${esc(site.manutencao_mensagem||"")}</textarea></label>
        <p class="cms-note full">Imagens enviadas pelo painel ficam no Storage do seu Supabase. Tamanho máximo por imagem: 8 MB.</p>
        <div class="full"><button class="btn primary" type="submit">Salvar aparência</button></div>
      </form>`;

    $("#cmsCor").oninput = e => $("#cmsColorPreview").style.background = e.target.value;
    $("#cmsAparenciaForm").onsubmit = async e => {
      e.preventDefault();
      msg("Salvando aparência...");
      try {
        let logoUrl = $("#cmsLogo").value.trim() || null;
        let heroUrl = $("#cmsHeroImg").value.trim() || null;
        const logoFile = $("#cmsLogoFile").files?.[0];
        const heroFile = $("#cmsHeroFile").files?.[0];
        if (logoFile) logoUrl = await uploadSiteAsset(logoFile, "logo");
        if (heroFile) heroUrl = await uploadSiteAsset(heroFile, "banner");

        const payload = {
          cor_primaria: $("#cmsCor").value,
          logo_url: logoUrl,
          hero_imagem_url: heroUrl,
          manutencao_ativa: $("#cmsManutencao").checked,
          manutencao_mensagem: $("#cmsManutMsg").value.trim()
        };
        const {error} = await client.from("site_config").update(payload).eq("id",1);
        if (error) throw error;
        msg("Aparência salva.","ok");
        await load();
        abrirTab("aparencia");
      } catch (error) {
        msg(error?.message || "Não foi possível salvar a aparência.", "err");
      }
    };
  }

  function realtime(){if(channel||!client)return;channel=client.channel("cantinho-cms-admin").on("postgres_changes",{event:"*",schema:"public",table:"site_config"},()=>load().catch(()=>{})).on("postgres_changes",{event:"*",schema:"public",table:"avisos_site"},()=>load().catch(()=>{})).on("postgres_changes",{event:"*",schema:"public",table:"regioes_entrega"},()=>load().catch(()=>{})).on("postgres_changes",{event:"*",schema:"public",table:"formas_pagamento"},()=>load().catch(()=>{})).subscribe();}

  async function tryInit(){
    if(iniciado)return;
    if(!ensureClient())return;
    const dashboard=document.getElementById("dashboardView");
    if(!dashboard||dashboard.classList.contains("hidden"))return;
    const user=await adminSession();if(!user)return;
    iniciado=true;css();inject();ocultarTaxasLegadas();
    try{await load();realtime();}catch(e){msg(`Execute cms-upgrade.sql no Supabase. ${e?.message||""}`,"err");}
  }

  setInterval(tryInit,800);
  window.addEventListener("focus",tryInit);
  document.addEventListener("DOMContentLoaded",tryInit);
})();
