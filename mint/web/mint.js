/* Feather & Iron mint page.
   Reads config.json (chain, RPC, contract) and abi.json, shows the mint status from the RPC,
   and sends claims and mints through the visitor's browser wallet (window.ethereum). */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const S = { cfg: null, abi: null, iface: null, read: null, account: null, claim: null, info: null, busy: false };
  const int = (n) => Number(n).toLocaleString('en-US');
  const short = (a) => a.slice(0, 6) + '…' + a.slice(-4);
  const ERRORS = {
    ClaimClosed: 'The free claim is not open right now.',
    SaleClosed: 'The public mint is not open right now.',
    NotOnList: 'This wallet is not on the Roostr list.',
    OverAllowance: 'That is more than this wallet has left to claim.',
    BadQuantity: 'Pick a quantity within the limit.',
    SoldOut: 'Not enough tickets left for that quantity.',
    WrongPayment: 'The payment did not match the price. Reload the page and try again.',
  };

  function status(html, kind) {
    const el = $('status');
    el.className = 'status ' + (kind || '');
    el.innerHTML = html;
    el.hidden = !html;
  }
  const explorer = (kind, id) => (S.cfg.explorer ? `${S.cfg.explorer.replace(/\/$/, '')}/${kind}/${id}` : '');
  const txLink = (hash) => (S.cfg.explorer ? ` <a href="${explorer('tx', hash)}" target="_blank" rel="noopener">View transaction</a>` : '');

  function explain(e) {
    const inner = e && e.info && e.info.error;
    if (e && (e.code === 'ACTION_REJECTED' || e.code === 4001 || (inner && inner.code === 4001))) return 'You cancelled in the wallet.';
    if (e && e.revert && ERRORS[e.revert.name]) return ERRORS[e.revert.name];
    const data = e && (e.data || (inner && inner.data) || (e.error && e.error.data));
    if (data && S.iface) {
      try { const p = S.iface.parseError(typeof data === 'string' ? data : data.data); if (p && ERRORS[p.name]) return ERRORS[p.name]; } catch (_) { /* not one of ours */ }
    }
    const msg = String((e && (e.shortMessage || e.message)) || e);
    if (/insufficient funds/i.test(msg)) return `Not enough ${S.cfg.currency.symbol} for the mint and the network fee.`;
    return msg.length > 200 ? msg.slice(0, 200) + '…' : msg;
  }

  // ---------------------------------------------------------------- reading
  async function refresh() {
    if (!S.read) return;
    const c = S.read;
    const [minted, max, price, perTx, claimOpen, publicOpen, avail, held] = await Promise.all([
      c.totalMinted(), c.maxSupply(), c.price(), c.maxPerTx(), c.claimOpen(), c.publicOpen(), c.publicAvailable(), c.claimHeldBack()]);
    S.info = { minted, max, price, perTx, claimOpen, publicOpen, avail, held };
    if (S.account) {
      const [balance, claimed] = await Promise.all([c.balanceOf(S.account), c.claimed(S.account)]);
      Object.assign(S.info, { balance, claimed });
    }
    render();
  }

  function clampQty(id, max) {
    const el = $(id);
    const v = Math.max(1, Math.min(Number(max) || 1, Math.floor(Number(el.value) || 1)));
    el.value = v;
    el.max = String(Math.max(1, Number(max) || 1));
    return v;
  }

  function claimLeft() {
    if (!S.claim || !S.info || S.info.claimed === undefined) return 0;
    const left = BigInt(S.claim.allowance) - S.info.claimed;
    return left > 0n ? Number(left) : 0;
  }

  function render() {
    const i = S.info, sym = S.cfg.currency.symbol;
    if (!i) return;
    $('minted').textContent = `${int(i.minted)} / ${int(i.max)}`;
    $('mintedBar').style.width = (Number(i.minted) / Number(i.max) * 100).toFixed(2) + '%';
    $('price').textContent = `${ethers.formatEther(i.price)} ${sym}`;
    $('perTx').textContent = `Up to ${i.perTx} per transaction`;
    $('claimState').textContent = i.claimOpen ? 'Open' : 'Closed';
    $('claimState').parentElement.className = 'stat ' + (i.claimOpen ? 'open' : 'closed');
    $('claimInfo').textContent = i.claimOpen ? `${int(i.held)} held for Roostr holders` : '';
    $('saleState').textContent = i.publicOpen ? 'Open' : 'Closed';
    $('saleState').parentElement.className = 'stat ' + (i.publicOpen ? 'open' : 'closed');
    $('saleInfo').textContent = `${int(i.avail)} available`;

    const left = claimLeft();
    let claimMsg;
    if (!S.account) claimMsg = 'Connect the wallet that held Roostr NFTs at the snapshot.';
    else if (!S.claim) claimMsg = 'This wallet is not on the Roostr list. You can still use the public mint.';
    else if (!left) claimMsg = `All <b>${int(S.claim.allowance)}</b> free tickets of this wallet are claimed.`;
    else claimMsg = `This wallet can claim <b>${int(S.claim.allowance)}</b> free. <b>${int(left)}</b> left.`;
    if (S.account && S.claim && left && !i.claimOpen) claimMsg += ' The claim opens soon.';
    $('claimMsg').innerHTML = claimMsg;
    clampQty('claimQty', left || 1);

    const maxMint = Math.min(Number(i.perTx), Number(i.avail)) || 1;
    const q = clampQty('mintQty', maxMint);
    $('saleMsg').textContent = !i.publicOpen ? 'The public mint is not open yet.' : Number(i.avail) ? 'Open to everyone while tickets are left.' : 'Sold out.';
    $('mintTotal').textContent = `Total ${ethers.formatEther(i.price * BigInt(q))} ${sym} plus the network fee.`;

    $('mine').hidden = !S.account;
    if (S.account) {
      const link = S.cfg.explorer ? ` <a href="${explorer('address', S.account)}" target="_blank" rel="noopener">See them on the explorer</a>` : '';
      $('mineMsg').innerHTML = `${short(S.account)} holds <b>${int(i.balance || 0n)}</b> Feather &amp; Iron ticket${Number(i.balance || 0n) === 1 ? '' : 's'}.${link}`;
    }
    setButtons();
  }

  function setButtons() {
    const i = S.info;
    $('claimBtn').disabled = !(i && S.account && i.claimOpen && claimLeft() > 0) || S.busy;
    $('mintBtn').disabled = !(i && S.account && i.publicOpen && Number(i.avail) > 0) || S.busy;
    $('connect').textContent = S.account ? short(S.account) : 'Connect wallet';
  }

  // ---------------------------------------------------------------- wallet
  async function ensureChain() {
    const want = '0x' + Number(S.cfg.chainId).toString(16);
    const have = await window.ethereum.request({ method: 'eth_chainId' });
    if (have && have.toLowerCase() === want) return;
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: want }] });
    } catch (e) {
      const code = e && (e.code || (e.data && e.data.originalError && e.data.originalError.code));
      if (code !== 4902) throw e;
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{ chainId: want, chainName: S.cfg.chainName, rpcUrls: [S.cfg.rpcUrl], nativeCurrency: S.cfg.currency, blockExplorerUrls: S.cfg.explorer ? [S.cfg.explorer] : undefined }],
      });
    }
  }

  async function useAccount(account) {
    S.account = account || null;
    S.claim = null;
    if (S.account) {
      const addr = S.account.toLowerCase();
      const r = await fetch(`claims/${addr.slice(2, 4)}.json`, { cache: 'no-store' }).catch(() => null);
      const bucket = r && r.ok ? await r.json().catch(() => ({})) : {};
      S.claim = bucket[addr] || null;
    }
    setButtons();
    await refresh().catch(() => {});
  }

  async function connect() {
    if (!window.ethereum) { status('No wallet found in this browser. Install a wallet such as MetaMask, then reload the page.', 'warn'); return; }
    if (!S.read) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      await ensureChain();
      await useAccount(accounts[0]);
      status('', '');
    } catch (e) { status(explain(e), 'bad'); }
  }

  async function send(label, call) {
    S.busy = true;
    setButtons();
    try {
      await ensureChain();
      const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
      const c = new ethers.Contract(S.cfg.contract, S.abi, signer);
      status(`${label}: confirm in your wallet…`);
      const tx = await call(c);
      status(`${label}: waiting for the network…${txLink(tx.hash)}`);
      const receipt = await tx.wait();
      const ids = receipt.logs
        .map((log) => { try { return S.iface.parseLog(log); } catch (_) { return null; } })
        .filter((p) => p && p.name === 'Transfer')
        .map((p) => '#' + p.args.tokenId.toString());
      status(`Done. You got ${ids.length} ticket${ids.length === 1 ? '' : 's'}: ${ids.join(', ')}.${txLink(tx.hash)}`, 'ok');
    } catch (e) {
      status(explain(e), 'bad');
    }
    S.busy = false;
    await refresh().catch(() => {});
  }

  // ---------------------------------------------------------------- start
  document.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (step) { const el = $(step.dataset.step); el.value = Number(el.value || 1) + Number(step.dataset.d); render(); return; }
    if (e.target.closest('#connect')) connect();
    else if (e.target.closest('#claimBtn')) {
      const q = clampQty('claimQty', claimLeft());
      send('Free claim', (c) => c.claim(S.claim.allowance, q, S.claim.proof));
    } else if (e.target.closest('#mintBtn')) {
      const q = clampQty('mintQty', Math.min(Number(S.info.perTx), Number(S.info.avail)));
      send('Mint', (c) => c.mint(q, { value: S.info.price * BigInt(q) }));
    }
  });
  document.addEventListener('change', (e) => { if (e.target.id === 'claimQty' || e.target.id === 'mintQty') render(); });

  (async () => {
    try {
      const [cfg, abi] = await Promise.all([
        fetch('config.json', { cache: 'no-store' }).then((r) => r.json()),
        fetch('abi.json', { cache: 'no-store' }).then((r) => r.json())]);
      S.cfg = cfg; S.abi = abi; S.iface = new ethers.Interface(abi);
      $('net').textContent = cfg.chainName || 'Network';
      if (!cfg.contract || !cfg.rpcUrl || !cfg.chainId) { status('The mint is not live yet. Check back soon.', 'warn'); return; }
      const rpc = new ethers.JsonRpcProvider(cfg.rpcUrl, Number(cfg.chainId), { staticNetwork: true });
      S.read = new ethers.Contract(cfg.contract, abi, rpc);
      if (cfg.explorer) $('contractLink').innerHTML = `Contract <a href="${explorer('address', cfg.contract)}" target="_blank" rel="noopener">${short(cfg.contract)}</a>`;
      await refresh();
      setInterval(() => { if (!S.busy) refresh().catch(() => {}); }, 15000);
      if (window.ethereum) {
        if (window.ethereum.on) {
          window.ethereum.on('accountsChanged', (acc) => useAccount(acc && acc[0]));
          window.ethereum.on('chainChanged', () => refresh().catch(() => {}));
        }
        const acc = await window.ethereum.request({ method: 'eth_accounts' }).catch(() => []);
        if (acc && acc[0]) await useAccount(acc[0]);
      }
    } catch (e) {
      status('Could not reach the network. Reload the page in a moment.', 'bad');
    }
  })();
})();
