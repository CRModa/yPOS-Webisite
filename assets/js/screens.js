/* Réplica simplificada dos ecrãs da app YPOS (POS-Mobile/screens), para as
   demonstrações. Cada ecrã é `render(estado) → HTML`.
   - data-t="x": alvo onde o dedo da demonstração pode tocar.
   - data-k="x": elemento com animação de entrada; se continuar presente no
     redesenho seguinte, a animação não se repete. */
(function (Y) {
  'use strict';

  const i = Y.icon;
  const esc = Y.esc;

  const fmt = n =>
    Number(n || 0).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' MZN';

  const PRODUTOS = [
    {id: 1, n: 'Arroz 5kg', p: 450, e: 24, cat: 'Mercearia'},
    {id: 2, n: 'Óleo 1L', p: 180, e: 15, cat: 'Mercearia'},
    {id: 3, n: 'Açúcar 1kg', p: 95, e: 40, cat: 'Mercearia'},
    {id: 4, n: 'Coca-Cola 2L', p: 120, e: 3, cat: 'Bebidas', low: true},
    {id: 5, n: 'Pão', p: 10, e: 60, cat: 'Padaria'},
    {id: 6, n: 'Sabão em barra', p: 60, e: 12, cat: 'Limpeza'},
  ];
  const produto = id => PRODUTOS.find(p => p.id === Number(id));

  const TABS = [
    ['painel', 'view-dashboard-outline', 'Painel'],
    ['produtos', 'package-variant-closed', 'Produtos'],
    ['venda', 'cart-outline', 'Venda'],
    ['compras', 'receipt', 'Compras'],
    ['faturas', 'file-document-outline', 'Faturas'],
  ];

  const NOTCH_PATH =
    'M0 0C7.472 0.00368103 10.5705 7.11092 14.1215 15.2564C18.9284 26.2825 24.5647 39.211 43.0011 38.9974C61.0636 38.7881 66.3435 26.4362 70.9369 15.6903C74.4956 7.36502 77.6422 0.00374625 86.0017 0H0Z';

  /* ---------- Peças comuns ---------- */

  const statusBar = bare =>
    `<div class="a-status${bare ? ' bare' : ''}"><span>09:41</span><span>${i('signal')}${i('wifi')}${i('battery-80')}</span></div>`;

  const banner = s =>
    s.banner
      ? `<div class="a-banner" data-k="banner">${i('alert-outline')}<span>A licença vence em 3 dias.</span><b data-t="renovar">Renovar</b></div>`
      : '';

  function header(title, s, o = {}) {
    const lead = o.back
      ? `<span class="mdi mdi-arrow-left a-back" data-t="back"></span>`
      : o.close
      ? `<span class="mdi mdi-close a-back" data-t="close"></span>`
      : '';
    const right = o.plain
      ? ''
      : `<span class="a-hbtn" data-t="empresa">${i('domain')}</span>` +
        `<span class="a-hbtn" data-t="printer">${i('printer-outline')}</span>` +
        `<span class="a-hbtn" data-t="theme">${i(s.dark ? 'white-balance-sunny' : 'weather-night')}</span>` +
        `<span class="a-avatar" data-t="avatar">AM</span>`;
    return `${statusBar()}${banner(s)}<div class="a-header">${lead}<h3>${title}</h3>${right}</div>`;
  }

  function field(s, key, label, placeholder, o = {}) {
    const v = s[key] || '';
    const focused = s.focus === key;
    const shown = o.pass ? '•'.repeat(v.length) : esc(v);
    const content = v
      ? `<span class="v">${shown}</span>`
      : `${focused ? '<span class="v"></span>' : ''}<span class="ph">${placeholder}</span>`;
    return (
      `<div class="a-field">${label ? `<span class="a-label">${label}</span>` : ''}` +
      `<div class="a-input${o.area ? ' area' : ''}${focused ? ' focus' : ''}" data-t="${key}">` +
      `${o.icon ? i(o.icon) : ''}${content}</div></div>`
    );
  }

  const staticField = (label, value) =>
    `<div class="a-field"><span class="a-label">${label}</span><div class="a-input"><span>${value}</span></div></div>`;

  const select = (s, key, placeholder) =>
    `<div class="a-input" data-t="${key}"><span class="${s[key] ? '' : 'ph'}" style="flex:1">${s[key] || placeholder}</span>${i('chevron-down')}</div>`;

  const chips = (s, key, options, fallback) =>
    `<div class="a-chips">${options
      .map(o => `<span class="a-chip${(s[key] || fallback) === o ? ' on' : ''}" data-t="${key}-${o}">${o}</span>`)
      .join('')}</div>`;

  const search = (s, placeholder) =>
    `<div class="a-search${s.busca ? ' has' : ''}" data-t="busca">${i('magnify')}<span>${s.busca ? esc(s.busca) : placeholder}</span></div>`;

  const fab = () => `<div class="a-fab" data-t="fab">${i('plus')}</div>`;

  const label = t => `<span class="a-label">${t}</span>`;

  const row = (...cols) => `<div class="a-row">${cols.join('')}</div>`;

  const num = v => Number(String(v || '0').replace(',', '.')) || 0;

  /* ---------- Carrinho do POS ---------- */

  function carrinho(s) {
    const cart = s.cart || {};
    const ids = Object.keys(cart).filter(id => cart[id] > 0);
    const total = ids.reduce((acc, id) => acc + cart[id] * produto(id).p, 0);
    const itens = ids.reduce((acc, id) => acc + cart[id], 0);
    return {cart, ids, total, itens};
  }

  /* ---------- Painel de licença (LicencaPainel.tsx) ---------- */

  function painelLicenca(s, renovar) {
    const estados = {
      none: ['', 'key-outline', 'Sem licença', 'Nenhuma licença instalada neste aparelho.'],
      warn: ['warn', 'alert-outline', 'Licença ativa', 'A licença vence em 3 dias. Renove para não parar.'],
      ok: ['ok', 'shield-check-outline', 'Licença ativa', 'Mercearia Central · plano Anual · até 30/09/2027'],
    };
    const [cls, icon, titulo, msg] = estados[s.lic || 'none'];
    return (
      `<div class="a-status-card ${cls}" data-k="lic-${s.lic || 'none'}">${i(icon)}<div><b>${titulo}</b><p>${msg}</p></div></div>` +
      label('ID DESTE APARELHO') +
      `<div class="a-idbox" data-t="idbox"><span>A3F9-72C1-0B4E-9D25</span><span class="a-idbtn" data-t="enviar">${i('share-variant-outline')}Enviar</span></div>` +
      `<div class="a-btn outline" data-t="qr">${i('qrcode-scan')}Ler QR code</div>` +
      `<div class="a-or">ou cole o código</div>` +
      field(s, 'codigo', 'CÓDIGO DE LICENÇA', 'YPOS1.xxxxxxxx.xxxxxxxx', {area: true}) +
      `<div class="a-btn" data-t="ativarbtn">${renovar ? 'Renovar licença' : 'Ativar licença'}</div>`
    );
  }

  /* ---------- Dados do Painel ---------- */

  const PERIODOS = {
    Hoje: {vendas: 12450, qtd: 18, ticket: 691.67, lucro: 3210, desp: 850, compras: 3800, cq: 2, bars: [30, 55, 40, 80, 65, 95, 50]},
    '7 dias': {vendas: 86320, qtd: 131, ticket: 658.93, lucro: 21940, desp: 5200, compras: 24600, cq: 9, bars: [60, 72, 48, 90, 66, 84, 100]},
  };

  /* ---------- Ecrãs ---------- */

  const screens = {};

  screens.ativar = {
    tab: null,
    render: s =>
      statusBar(true) +
      `<div class="a-body a-scroll pad"><div class="a-title">Ativar YPOS</div>` +
      `<div class="a-sub">Este aparelho precisa de uma licença válida para continuar.</div>${painelLicenca(s)}</div>`,
  };

  screens.licenca = {
    tab: null,
    render: s => header('Licença', s, {back: true, plain: true}) + `<div class="a-body a-scroll pad">${painelLicenca(s, true)}</div>`,
  };

  screens.setup1 = {
    tab: null,
    render: s =>
      statusBar(true) +
      `<div class="a-body a-scroll pad"><div class="a-dots"><span class="on"></span><span></span></div>` +
      `<div class="a-title">Bem-vindo ao YPOS</div><div class="a-sub">Configure a sua empresa para começar</div>` +
      `<div class="a-h">Dados da empresa</div>` +
      field(s, 'emp', 'Nome da empresa *', 'Ex: Mercearia Central, Lda') +
      field(s, 'nuit', 'NUIT', 'Ex: 123456789') +
      field(s, 'tel', 'Telefone', 'Ex: 84 123 4567') +
      field(s, 'end', 'Endereço', 'Ex: Av. Julius Nyerere, Maputo') +
      `<div class="a-btn" data-t="seguinte">Seguinte</div></div>`,
  };

  screens.setup2 = {
    tab: null,
    render: s =>
      statusBar(true) +
      `<div class="a-body a-scroll pad"><div class="a-dots"><span class="on"></span><span class="on"></span></div>` +
      `<div class="a-title">Bem-vindo ao YPOS</div><div class="a-sub">Configure a sua empresa para começar</div>` +
      `<div class="a-h">Administrador da empresa</div>` +
      field(s, 'anome', 'Nome *', 'Nome completo') +
      field(s, 'aemail', 'E-mail *', 'nome@exemplo.com') +
      field(s, 'asenha', 'Senha *', 'Mínimo 4 caracteres', {pass: true}) +
      field(s, 'aconf', 'Confirmar senha *', 'Repita a senha', {pass: true}) +
      row(`<div class="a-btn outline" data-t="voltar">Voltar</div>`, `<div class="a-btn" data-t="concluir">Concluir</div>`) +
      `</div>`,
  };

  screens.login = {
    tab: null,
    render: s =>
      statusBar(true) +
      `<div class="a-body a-login pad"><div class="a-logo">${i('point-of-sale')}</div>` +
      `<div class="a-title">YPOS</div><div class="a-sub">Entre para gerenciar seu ponto de venda</div>` +
      `<div class="a-panel">` +
      field(s, 'email', 'E-MAIL', 'seu@email.com', {icon: 'email-outline'}) +
      field(s, 'senha', 'SENHA', '••••••••', {icon: 'lock-outline', pass: true}) +
      `<div class="a-btn" data-t="entrar">Entrar</div></div></div>`,
  };

  screens.pos = {
    tab: 'venda',
    render: s => {
      const {cart, ids, total, itens} = carrinho(s);
      const cards = PRODUTOS.map(p => {
        const q = cart[p.id] || 0;
        return (
          `<div class="a-card${q ? ' on' : ''}" data-t="p-${p.id}">` +
          (q ? `<span class="a-qty" data-k="q${p.id}-${q}">${q}</span>` : '') +
          `<div class="a-card-name">${p.n}</div><div class="a-price">${fmt(p.p)}</div>` +
          `<div class="a-stock${p.low ? ' low' : ''}">${p.low ? i('alert-circle-outline') : ''}Estoque: ${p.e}</div></div>`
        );
      }).join('');
      const linhas = ids
        .map(id => {
          const p = produto(id);
          return (
            `<div class="a-line"><span class="n">${p.n}</span>` +
            `<span class="a-step"><i data-t="minus-${id}">−</i><b>${cart[id]}</b><i data-t="plus-${id}">+</i></span>` +
            `<span class="s">${fmt(cart[id] * p.p)}</span></div>`
          );
        })
        .join('');
      const rodape = ids.length
        ? `<div class="a-cart" data-k="cart">${linhas}<div class="a-total" data-t="total"><span>${itens} item(ns)</span><b>${fmt(total)}</b></div>` +
          `<div class="a-btn" data-t="finalizar">Finalizar Venda</div></div>`
        : '';
      return (
        header('POS', s) +
        `<div class="a-body a-scroll${ids.length ? ' tight' : ''}">${search(s, 'Buscar produto...')}<div class="a-grid">${cards}</div></div>` +
        rodape
      );
    },
  };

  screens.painel = {
    tab: 'painel',
    render: s => {
      const per = s.per || 'Hoje';
      const d = PERIODOS[per];
      const kpi = (lbl, val, sub, cls = '') =>
        `<div class="a-kpi ${cls}"><small>${lbl}</small><b>${val}</b>${sub ? `<em>${sub}</em>` : ''}</div>`;
      return (
        header('Painel', s) +
        `<div class="a-body a-scroll">` +
        chips(s, 'per', ['Hoje', '7 dias', 'Este mês', 'Mês anterior', 'Personalizado'], 'Hoje') +
        `<div class="a-kpis" data-t="kpis" data-k="k-${per}">` +
        kpi(per === 'Hoje' ? 'VENDAS HOJE' : 'VENDAS NO PERÍODO', fmt(d.vendas), `${d.qtd} vendas`, 'wide') +
        kpi('TICKET MÉDIO', fmt(d.ticket)) +
        kpi('LUCRO ESTIMADO', fmt(d.lucro)) +
        kpi('DESPESAS PAGAS', fmt(d.desp)) +
        kpi('COMPRAS', fmt(d.compras), `${d.cq} compras`) +
        kpi('ESTOQUE BAIXO', '3 produtos', '', 'low wide') +
        `</div><div class="a-btn outline" data-t="resumo">${i('printer-outline')}${per === 'Hoje' ? 'Imprimir resumo do dia' : 'Imprimir resumo do período'}</div>` +
        `<div class="a-bars" data-k="bars-${per}">${d.bars.map((h, n) => `<span style="height:${h}%;animation-delay:${n * 50}ms"></span>`).join('')}</div>` +
        `</div>`
      );
    },
  };

  screens.produtos = {
    tab: 'produtos',
    render: s => {
      const nova = s.novo
        ? `<div class="a-item new" data-k="novo-prod"><div class="ic">${i('package-variant-closed')}</div><div class="t"><b>Farinha 2kg</b><small>Mercearia · Estoque: 30</small></div><div class="r">${fmt(150)}</div></div>`
        : '';
      const lista = PRODUTOS.map(
        p =>
          `<div class="a-item" data-t="prod-${p.id}"><div class="ic">${i('package-variant-closed')}</div>` +
          `<div class="t"><b>${p.n}</b><small>${p.cat} · Estoque: ${p.id === 4 && s.estoque != null ? s.estoque : p.e}</small>` +
          `${p.low ? ' <span class="a-badge warn">Estoque baixo</span>' : ''}</div><div class="r">${fmt(p.p)}</div></div>`,
      ).join('');
      return header('Produtos', s) + `<div class="a-body a-scroll">${search(s, 'Buscar produto...')}<div class="a-list">${nova}${lista}</div></div>${fab()}`;
    },
  };

  screens.produtoForm = {
    tab: null,
    render: s =>
      header('Novo Produto', s, {close: true, plain: true}) +
      `<div class="a-body a-scroll pad">` +
      field(s, 'pnome', 'NOME DO PRODUTO', 'Ex: Arroz 5kg') +
      label('CATEGORIA') +
      chips(s, 'cat', ['Mercearia', 'Bebidas', 'Limpeza', 'Padaria']) +
      row(field(s, 'ppreco', 'PREÇO DE VENDA', '0,00'), field(s, 'pcusto', 'CUSTO DE PRODUÇÃO', '0,00')) +
      row(field(s, 'pest', 'ESTOQUE INICIAL', '0'), field(s, 'pmin', 'ESTOQUE MÍNIMO', '0')) +
      `<div class="a-btn" data-t="salvar">Salvar</div></div>`,
  };

  screens.produtoDet = {
    tab: null,
    render: s => {
      const est = s.estoque != null ? s.estoque : 3;
      return (
        header('Coca-Cola 2L', s, {close: true, plain: true}) +
        `<div class="a-body a-scroll pad"><div class="a-panel">${label('ESTOQUE ATUAL')}` +
        `<div class="a-row" style="align-items:center"><b style="font-size:20px;font-weight:800" data-k="est-${est}">${est} UN</b>` +
        `<div class="a-btn outline small" style="flex:0" data-t="ajustar">${i('swap-vertical')}Ajustar</div></div>` +
        `<span class="a-badge warn" style="align-self:flex-start">Estoque baixo</span></div>` +
        staticField('NOME DO PRODUTO', 'Coca-Cola 2L') +
        row(staticField('PREÇO DE VENDA', '120,00'), staticField('UNIDADE DE MEDIDA', 'UN')) +
        staticField('CATEGORIA', 'Bebidas') +
        `<div class="a-btn">Salvar alterações</div></div>`
      );
    },
  };

  screens.compras = {
    tab: 'compras',
    render: s => {
      const item = (forn, sub, v, k) =>
        `<div class="a-item${k ? ' new' : ''}"${k ? ` data-k="${k}"` : ''}><div class="ic">${i('receipt')}</div><div class="t"><b>${forn}</b><small>${sub}</small></div>` +
        `<div class="r">${fmt(v)}<br><span class="a-badge">Paga</span></div></div>`;
      return (
        header('Compras', s) +
        `<div class="a-body a-scroll">${search(s, 'Buscar fornecedor...')}<div class="a-list">` +
        (s.nova ? item('Distribuidora Maputo', 'Hoje · 1 item', 3800, 'nova-compra') : '') +
        item('Grossista Xiquelene', '28/09/2026 · 4 itens', 2450) +
        item('Não informado', '27/09/2026 · 1 item', 600) +
        item('Distribuidora Maputo', '22/09/2026 · 6 itens', 7120) +
        `</div></div>${fab()}`
      );
    },
  };

  screens.compraForm = {
    tab: null,
    render: s => {
      const total = num(s.cqtd) * num(s.cpreco);
      return (
        header('Nova Compra', s, {close: true, plain: true}) +
        `<div class="a-body a-scroll pad">${label('FORNECEDOR')}` +
        chips(s, 'forn', ['Não informado', 'Distribuidora Maputo', 'Grossista Xiquelene']) +
        label('ITENS') +
        `<div class="a-panel">${chips(s, 'tipo', ['Produto', 'Avulso'], 'Produto')}${select(s, 'cprod', 'Selecione o produto...')}` +
        row(field(s, 'cqtd', '', 'Qtd'), field(s, 'cpreco', '', 'Preço unit.')) +
        `</div>` +
        (s.linha2
          ? `<div class="a-panel" data-k="linha2">${chips({}, 'tipo2', ['Produto', 'Avulso'], 'Produto')}${select({}, 'cprod2', 'Selecione o produto...')}` +
            `<div class="a-link" style="color:var(--app-danger);text-align:right" data-t="remover2">Remover</div></div>`
          : '') +
        `<div class="a-link" style="color:var(--app-primary);text-align:left" data-t="additem">${i('plus')} Adicionar item</div>` +
        `<div class="a-total" data-t="ctotal"><span>Total previsto</span><b>${fmt(total)}</b></div>` +
        `<div class="a-btn" data-t="salvarc">Salvar Compra</div></div>`
      );
    },
  };

  screens.faturas = {
    tab: 'faturas',
    render: s => {
      const item = (id, num, cli, v, badge, cls, k) =>
        `<div class="a-item${k ? ' new' : ''}" data-t="fat-${id}"${k ? ` data-k="${k}"` : ''}><div class="ic">${i('file-document-outline')}</div>` +
        `<div class="t"><b>${cli}</b><small>${num}</small></div><div class="r">${fmt(v)}<br><span class="a-badge ${cls}">${badge}</span></div></div>`;
      const aberto = 4330 + (s.nova ? 1080 : 0) - (s.recibos ? 500 : 0);
      return (
        header('Faturas', s) +
        `<div class="a-body a-scroll"><div class="a-panel">${label('TOTAL EM ABERTO')}<b style="font-size:17px;font-weight:800;color:var(--app-warning)">${fmt(aberto)}</b></div>` +
        chips(s, 'filtro', ['Todas', 'Em aberto', 'Pagas', 'Canceladas'], 'Todas') +
        `<div class="a-list">` +
        (s.nova ? item(9, 'FT 2026/0043 · vence 30/10', 'João Tembe', 1080, 'Pendente', 'warn', 'nova-fat') : '') +
        item(1, 'FT 2026/0041', 'Loja Mavalane', 1080, s.recibos ? 'Parcialmente Paga' : 'Pendente', 'warn') +
        item(2, 'FT 2026/0040', 'Rosa Cossa', 2450, 'Paga', '') +
        item(3, 'FT 2026/0039', 'Hotel Polana', 3250, 'Parcialmente Paga', 'warn') +
        `</div></div>${fab()}`
      );
    },
  };

  screens.faturaForm = {
    tab: null,
    render: s => {
      const preco = s.fsel ? 180 : 0;
      return (
        header('Nova Fatura', s, {close: true, plain: true}) +
        `<div class="a-body a-scroll pad">${label('CLIENTE')}${select(s, 'cliente', 'Selecione o cliente...')}` +
        field(s, 'venc', 'VENCIMENTO (OPCIONAL)', 'AAAA-MM-DD', {icon: 'calendar-outline'}) +
        label('ITENS') +
        `<div class="a-panel">${chips(s, 'tipo', ['Produto', 'Avulso'], 'Produto')}${select(s, 'fsel', 'Selecione o produto...')}` +
        row(field(s, 'fqtd', '', 'Qtd'), `<div class="a-field"><div class="a-input"><span class="${preco ? '' : 'ph'}">${preco ? '180,00' : 'Preço unit.'}</span></div></div>`) +
        `</div><div class="a-total"><span>Total da fatura</span><b>${fmt(num(s.fqtd) * preco)}</b></div>` +
        `<div class="a-btn" data-t="salvarf">Salvar Fatura</div></div>`
      );
    },
  };

  screens.faturaDet = {
    tab: null,
    render: s => {
      const pago = s.recibos ? 500 : 0;
      const linha = (t, v, style = '') =>
        `<div class="a-row" style="justify-content:space-between"><span class="a-sub" style="flex:0 auto">${t}</span><b style="flex:0 auto;text-align:right;${style}">${v}</b></div>`;
      return (
        header('FT 2026/0041', s, {close: true, plain: true}) +
        `<div class="a-body a-scroll pad"><div class="a-panel"><div class="a-row" style="align-items:center"><b style="font-size:12px">Loja Mavalane</b>` +
        `<span style="flex:0 auto" class="a-badge warn" data-k="st-${pago}">${pago ? 'Parcialmente Paga' : 'Pendente'}</span></div>` +
        linha('Total da fatura', fmt(1080)) +
        linha('Total pago', fmt(pago)) +
        linha('Saldo em aberto', fmt(1080 - pago), 'color:var(--app-warning)') +
        `</div>${label('REGISTRAR RECIBO')}` +
        field(s, 'valor', '', 'Valor recebido') +
        label('FORMA DE PAGAMENTO') +
        chips(s, 'fp', ['Dinheiro', 'M-Pesa', 'e-Mola', 'Cartão Débito', 'Transferência'], 'Dinheiro') +
        `<div class="a-btn" data-t="registrar">Registrar Recibo</div>${label('RECIBOS EMITIDOS')}` +
        (s.recibos
          ? `<div class="a-list" data-t="recibos"><div class="a-item new" data-k="rec1"><div class="ic">${i('cash-check')}</div><div class="t"><b>RC 2026/0018</b><small>M-Pesa · hoje</small></div>` +
            `<div class="r">${fmt(500)}</div><span class="mdi mdi-close-circle" style="color:var(--app-danger);font-size:16px"></span></div></div>`
          : `<div class="a-sub" data-t="recibos">Nenhum recibo emitido para esta fatura ainda.</div>`) +
        row(`<div class="a-btn outline small">${i('file-pdf-box')}PDF da Fatura</div>`, pago ? '' : `<div class="a-btn outline small">${i('pencil-outline')}Editar</div>`) +
        `</div>`
      );
    },
  };

  screens.usuarios = {
    tab: 'none',
    render: s => {
      const u = (ini, nome, perfil, k) =>
        `<div class="a-item${k ? ' new' : ''}"${k ? ` data-k="${k}"` : ''}><span class="a-avatar" style="width:28px;height:28px">${ini}</span>` +
        `<div class="t"><b>${nome}</b><small>${perfil}</small></div>${i('chevron-right')}</div>`;
      return (
        header('Utilizadores', s, {back: true}) +
        `<div class="a-body a-scroll"><div class="a-list">` +
        u('AM', 'Ana Macuácua', 'Administrador') +
        u('RS', 'Rui Sitoe', 'Gestor') +
        (s.novo ? u('CN', 'Carlos Nhantumbo', 'Vendedor', 'novo-user') : '') +
        `</div></div>${fab()}`
      );
    },
  };

  screens.userForm = {
    tab: null,
    render: s =>
      header('Utilizador', s, {close: true, plain: true}) +
      `<div class="a-body a-scroll pad">` +
      field(s, 'unome', 'NOME', 'Nome completo') +
      field(s, 'uemail', 'E-MAIL', 'nome@exemplo.com') +
      field(s, 'usenha', 'SENHA', 'Mínimo 4 caracteres', {pass: true}) +
      label('PERFIL') +
      chips(s, 'perfil', ['Vendedor', 'Gestor', 'Administrador']) +
      `<div class="a-btn" data-t="usalvar">Salvar</div></div>`,
  };

  /* ---------- Camadas por cima do ecrã (folhas, alertas, menus) ---------- */

  const scrim = (k = 'scrim', clear) => `<div class="a-scrim" data-k="${k}"${clear ? ' style="background:transparent"' : ''}></div>`;

  const SHEETS = {
    pay: s => {
      const {total} = carrinho(s);
      return (
        `<div class="a-grab"></div><div class="a-h" style="font-size:14px">Pagamento</div>` +
        `<div class="a-sub">Total a pagar: ${fmt(total)}</div>` +
        field(s, 'pago', 'VALOR PAGO (OPCIONAL)', fmt(total)) +
        `<div class="a-btn" data-t="confirmar">Confirmar</div><div class="a-link" data-t="cancelar">Cancelar</div>`
      );
    },

    ajuste: s => {
      const tipo = s.tipo || 'Entrada';
      const q = num(s.qtd);
      const novo = tipo === 'Entrada' ? 3 + q : 3 - q;
      return (
        `<div class="a-grab"></div><div class="a-h" style="font-size:14px">Ajustar estoque</div>` +
        `<div class="a-sub">Coca-Cola 2L · atual: 3 UN</div>${label('TIPO DE MOVIMENTO')}` +
        chips(s, 'tipo', ['Entrada', 'Saída', 'Perda'], 'Entrada') +
        row(field(s, 'qtd', 'QUANTIDADE', '0'), field(s, 'motivo', 'MOTIVO', 'Ex: Contagem física')) +
        `<div class="a-panel" data-t="novo" style="flex-direction:row;justify-content:space-between;align-items:center">` +
        `<span class="a-sub">Novo estoque após o ajuste</span><b style="font-size:14px;color:var(--app-primary)">${novo} UN</b></div>` +
        `<div class="a-btn" data-t="confirmar-aj">Confirmar ajuste</div>`
      );
    },

    share: () =>
      `<div class="a-grab"></div><div class="a-h">Partilhar</div>` +
      `<div class="a-panel" style="font-size:9.5px">Pedido de licença YPOS<br>ID do aparelho: <b>A3F9-72C1-0B4E-9D25</b></div>` +
      `<div class="a-share">` +
      `<div data-t="wa"><i style="background:#25d366">${i('whatsapp')}</i>WhatsApp</div>` +
      `<div><i style="background:#ea4335">${i('email-outline')}</i>E-mail</div>` +
      `<div><i style="background:#2563eb">${i('message-text-outline')}</i>SMS</div>` +
      `<div><i style="background:#6b7280">${i('content-copy')}</i>Copiar</div></div>`,

    imp: s => {
      const lista = s.scan
        ? `<div class="a-scan"><span class="a-spin"></span>A procurar impressoras…</div>`
        : s.devices
        ? `<div class="a-list" data-k="devs">` +
          `<div class="a-item" data-t="dev-1"><div class="ic">${i('printer-pos')}</div><div class="t"><b>MPT-II</b><small>86:67:7A:12:0C:3F</small></div>${s.ligada ? i('check-circle', 'ok-ic') : ''}</div>` +
          `<div class="a-item"><div class="ic">${i('headphones')}</div><div class="t"><b>Galaxy Buds</b><small>F4:7B:09:88:21:AA</small></div></div></div>`
        : '';
      return (
        `<div class="a-row" style="align-items:center"><b style="font-size:14px">Impressora</b>${i('close')}</div>` +
        `<div class="a-sub">Impressora térmica Bluetooth de 58 mm.</div>` +
        (s.ligada
          ? `<div class="a-status-card ok" data-k="ligada">${i('bluetooth-connect')}<div><b>Ligada: MPT-II</b><p>Os talões saem sozinhos em cada venda.</p></div></div>`
          : '') +
        `<div class="a-row" style="align-items:center">${label('DISPOSITIVOS ENCONTRADOS')}<span style="flex:0" class="mdi mdi-refresh" data-t="refresh"></span></div>` +
        lista +
        (s.print ? recibo('TESTE DE IMPRESSÃO', ['Impressora ligada', 'ao YPOS com sucesso.']) : '') +
        `<div class="a-btn${s.ligada ? '' : ' outline'}" data-t="testar">${i('printer-outline')}Testar impressão</div>`
      );
    },

    resumo: () =>
      `<div class="a-h" style="font-size:14px">A imprimir…</div><div class="a-sub">Resumo do dia enviado para MPT-II.</div>` +
      recibo('RESUMO DO DIA', ['Vendas: 18', 'Total: 12.450,00', 'Operador: Ana M.']),
  };

  function recibo(titulo, linhas) {
    return (
      `<div class="a-printer" data-k="print-${titulo}"><div class="a-receipt"><b>MERCEARIA CENTRAL</b><hr>` +
      `<b>${titulo}</b>${linhas.map(l => `<div>${l}</div>`).join('')}<hr><div>30/09/2026 18:42</div></div>` +
      `<div class="a-printer-body">${i('printer-pos')}</div></div>`
    );
  }

  function overlays(s) {
    let html = '';
    if (s.sheet && SHEETS[s.sheet]) {
      html += scrim('scrim-' + s.sheet) + `<div class="a-sheet" data-k="sheet-${s.sheet}">${SHEETS[s.sheet](s)}</div>`;
    }
    if (s.menu) {
      const r = (icon, t, key, cls = '') => `<div class="a-menu-row ${cls}"${key ? ` data-t="${key}"` : ''}>${i(icon)}${t}</div>`;
      html +=
        scrim('scrim-menu', true) +
        `<div class="a-menu" data-k="menu"><div class="a-menu-head"><span class="a-avatar">AM</span><div><b>Ana Macuácua</b><small>Administrador</small></div></div>` +
        r('account-multiple-outline', 'Clientes', 'm-clientes') +
        r('truck-outline', 'Fornecedores', 'm-fornecedores') +
        r('account-cog-outline', 'Utilizadores', 'm-usuarios') +
        r('key-outline', 'Licença', 'm-licenca') +
        r('logout', 'Sair', 'm-sair', 'danger') +
        `</div>`;
    }
    if (s.notif) {
      html +=
        `<div class="a-notif" data-k="notif">${i('whatsapp')}<div><b>${s.notif.t}</b><p>${s.notif.m}</p></div></div>`;
    }
    if (s.toast) {
      html += `<div class="a-toast" data-k="toast-${esc(s.toast)}">${esc(s.toast)}</div>`;
    }
    if (s.alert) {
      const btns = s.alert.btns || [['OK', 'ok']];
      html +=
        scrim('scrim-alert') +
        `<div class="a-alert" data-k="alert-${esc(s.alert.t)}"><b>${s.alert.t}</b><p>${s.alert.m}</p>` +
        `<div class="a-alert-btns">${btns.map(([t, k]) => `<span class="ok" data-t="${k}">${t}</span>`).join('')}</div></div>`;
    }
    return html;
  }

  function tabbar() {
    return (
      `<div class="a-tabbar"><div class="a-tabbar-bg">` +
      `<svg class="a-notch" viewBox="0 0 86 39" aria-hidden="true"><path d="${NOTCH_PATH}" fill="currentColor"/></svg>` +
      TABS.map(([id, icon, lbl]) => `<div class="a-tab" data-t="tab-${id}" data-tab="${id}">${i(icon)}<span>${lbl}</span></div>`).join('') +
      `</div><div class="a-fabcol"><div class="a-fabcircle"></div><div class="a-fablabel"></div></div></div>`
    );
  }

  Y.app = {screens, overlays, tabbar, TABS, fmt};
})(window.YPOS);
