(() => {
  const cfg = window.SUPABASE_CONFIG || window.supabaseConfig || {};
  const url = cfg.url || window.SUPABASE_URL;
  const key = cfg.key || cfg.anonKey || window.SUPABASE_ANON_KEY || window.SUPABASE_PUBLISHABLE_KEY;

  const msg = document.getElementById('loginMsg');
  if (!url || !key) {
    msg.textContent = 'Configuração do Supabase não encontrada em config.js.';
    return;
  }

  const sb = window.supabase.createClient(url, key);
  const loginArea = document.getElementById('loginArea');
  const adminArea = document.getElementById('adminArea');
  const lista = document.getElementById('listaProdutos');

  async function carregar() {
    const { data, error } = await sb.from('produtos').select('*').order('nome');
    if (error) {
      lista.innerHTML = `<p>Não foi possível carregar os produtos: ${error.message}</p>`;
      return;
    }
    lista.innerHTML = '';
    (data || []).forEach(p => {
      const disponivel = p.disponivel !== false;
      const el = document.createElement('div');
      el.className = 'produto' + (disponivel ? '' : ' esgotado');
      el.innerHTML = `<div><strong>${p.nome || p.id}</strong><div class="status">${disponivel ? 'Disponível' : 'ESGOTADO'}</div></div>`;
      const b = document.createElement('button');
      b.textContent = disponivel ? 'Marcar esgotado' : 'Disponibilizar';
      b.onclick = async () => {
        b.disabled = true;
        const { error } = await sb.from('produtos').update({ disponivel: !disponivel }).eq('id', p.id);
        if (error) alert(error.message);
        await carregar();
      };
      el.appendChild(b);
      lista.appendChild(el);
    });
  }

  async function mostrarSessao() {
    const { data } = await sb.auth.getSession();
    const logado = !!data.session;
    loginArea.hidden = logado;
    adminArea.hidden = !logado;
    if (logado) carregar();
  }

  document.getElementById('btnEntrar').onclick = async () => {
    msg.textContent = '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('senha').value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) msg.textContent = 'Não foi possível entrar: ' + error.message;
    else mostrarSessao();
  };

  document.getElementById('btnSair').onclick = async () => {
    await sb.auth.signOut();
    mostrarSessao();
  };

  mostrarSessao();
})();