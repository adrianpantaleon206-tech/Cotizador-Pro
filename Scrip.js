document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cotizadorForm');
  const modoConversion = document.getElementById('modoConversion');
  const fiatSelect = document.getElementById('fiatSelect');
  const cryptoSelect = document.getElementById('cryptoSelect');
  const montoInput = document.getElementById('montoInput');
  const lblMontoInput = document.getElementById('lblMontoInput');
  const apiStatus = document.getElementById('apiStatus');
  const ratesGrid = document.getElementById('ratesGrid');

  const pantallaResultado = document.getElementById('pantallaResultado');
  const outMontoIngresado = document.getElementById('outMontoIngresado');
  const outPrecioUnitario = document.getElementById('outPrecioUnitario');
  const outTotal = document.getElementById('outTotal');

  // Diccionario interno de respaldo por si falla alguna red
  let cryptoPrices = {
    USDT: 1,
    BTC: 65000,
    ETH: 3500,
    SOL: 140,
    BNB: 580,
    XRP: 0.55,
    ADA: 0.35,
    DOGE: 0.10
  };

  let fiatRates = {
    VES: 36.5,
    ARS: 1250,
    COP: 4100,
    MXN: 18.0,
    CLP: 940,
    PEN: 3.75,
    BRL: 5.50,
    EUR: 0.92,
    GBP: 0.78,
    USD: 1.00
  };

  function actualizarEtiqueta() {
    const fiatOpt = fiatSelect.options[fiatSelect.selectedIndex];
    const cryptoOpt = cryptoSelect.options[cryptoSelect.selectedIndex];

    if (modoConversion.value === 'fiatToCrypto') {
      lblMontoInput.textContent = `Monto en ${fiatOpt.text.split(' ')[0]} (${fiatOpt.value}):`;
      montoInput.placeholder = "Ej: 300";
    } else {
      lblMontoInput.textContent = `Cantidad de ${cryptoOpt.value}:`;
      montoInput.placeholder = "Ej: 0.05";
    }
  }

  // Carga de datos con CoinGecko y ExchangeRate-API (Libre de CORS)
  async function cargarDatosMercado() {
    if (apiStatus) apiStatus.textContent = 'Actualizando...';
    
    try {
      // Petición a CoinGecko para Criptomonedas en USD
      const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin&vs_currencies=usd');
      const cryptoData = await cryptoRes.json();

      if (cryptoData) {
        if (cryptoData.tether) cryptoPrices.USDT = cryptoData.tether.usd;
        if (cryptoData.bitcoin) cryptoPrices.BTC = cryptoData.bitcoin.usd;
        if (cryptoData.ethereum) cryptoPrices.ETH = cryptoData.ethereum.usd;
        if (cryptoData.solana) cryptoPrices.SOL = cryptoData.solana.usd;
        if (cryptoData.binancecoin) cryptoPrices.BNB = cryptoData.binancecoin.usd;
        if (cryptoData.ripple) cryptoPrices.XRP = cryptoData.ripple.usd;
        if (cryptoData.cardano) cryptoPrices.ADA = cryptoData.cardano.usd;
        if (cryptoData.dogecoin) cryptoPrices.DOGE = cryptoData.dogecoin.usd;
      }

      // Petición para Divisas Fiat
      const fiatRes = await fetch('https://open.er-api.com/v6/latest/USD');
      const fiatData = await fiatRes.json();

      if (fiatData && fiatData.rates) {
        fiatrates = fiatData.rates;
        Array.from(fiatSelect.options).forEach(opt => {
          if (fiatData.rates[opt.value]) {
            opt.setAttribute('data-rate', fiatData.rates[opt.value]);
          }
        });
      }

      // Asignar los precios dinámicos a los atributos data-usd del selector
      Array.from(cryptoSelect.options).forEach(opt => {
        if (cryptoPrices[opt.value]) {
          opt.setAttribute('data-usd', cryptoPrices[opt.value]);
        }
      });

      // Renderizar panel visual de tasas de referencia en vivo
      if (ratesGrid) {
        ratesGrid.innerHTML = `
          <div class="rate-item"><span>USDT</span><span>$1.00</span></div>
          <div class="rate-item"><span>BTC</span><span>$${cryptoPrices.BTC?.toLocaleString('es-ES', {maximumFractionDigits: 0})}</span></div>
          <div class="rate-item"><span>ETH</span><span>$${cryptoPrices.ETH?.toLocaleString('es-ES', {maximumFractionDigits: 0})}</span></div>
          <div class="rate-item"><span>SOL</span><span>$${cryptoPrices.SOL?.toFixed(2)}</span></div>
          <div class="rate-item"><span>BNB</span><span>$${cryptoPrices.BNB?.toFixed(2)}</span></div>
          <div class="rate-item"><span>EUR</span><span>$${(1 / (fiatRates.EUR || 0.92)).toFixed(2)}</span></div>
        `;
      }

      if (apiStatus) {
        apiStatus.textContent = 'En Vivo ●';
        apiStatus.style.color = 'var(--accent-green)';
      }
    } catch (err) {
      console.warn('Usando valores locales por restricción de red:', err);
      if (apiStatus) {
        apiStatus.textContent = 'Modo Estándar';
        apiStatus.style.color = 'var(--text-muted)';
      }
    }
  }

  modoConversion.addEventListener('change', actualizarEtiqueta);
  fiatSelect.addEventListener('change', actualizarEtiqueta);
  cryptoSelect.addEventListener('change', actualizarEtiqueta);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const monto = parseFloat(montoInput.value) || 0;
    const fiatOpt = fiatSelect.options[fiatSelect.selectedIndex];
    const cryptoOpt = cryptoSelect.options[cryptoSelect.selectedIndex];

    const tasaFiat = parseFloat(fiatOpt.getAttribute('data-rate')) || fiatRates[fiatOpt.value] || 1;
    const simboloFiat = fiatOpt.getAttribute('data-symbol') || '$';
    const precioCryptoUSD = parseFloat(cryptoOpt.getAttribute('data-usd')) || cryptoPrices[cryptoOpt.value] || 1;

    const precioCryptoEnFiat = precioCryptoUSD * tasaFiat;

    if (modoConversion.value === 'fiatToCrypto') {
      const totalCrypto = monto > 0 ? monto / precioCryptoEnFiat : 0;

      outMontoIngresado.textContent = `${simboloFiat} ${monto.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      outPrecioUnitario.textContent = `1 ${cryptoOpt.value} = ${simboloFiat} ${precioCryptoEnFiat.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      outTotal.textContent = `${totalCrypto.toFixed(6)} ${cryptoOpt.value}`;
    } else {
      const totalFiat = monto > 0 ? monto * precioCryptoEnFiat : 0;

      outMontoIngresado.textContent = `${monto} ${cryptoOpt.value}`;
      outPrecioUnitario.textContent = `1 ${cryptoOpt.value} = ${simboloFiat} ${precioCryptoEnFiat.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      outTotal.textContent = `${simboloFiat} ${totalFiat.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }

    pantallaResultado.classList.remove('hidden');
  });

  actualizarEtiqueta();
  cargarDatosMercado();
});
