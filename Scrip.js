document.addEventListener('DOMContentLoaded', () => {
  const amountCryptoInput = document.getElementById('amount-crypto');
  const amountFiatInput = document.getElementById('amount-fiat');
  const cryptoSelect = document.getElementById('crypto');
  const fiatSelect = document.getElementById('fiat');
  const labelAmount = document.getElementById('label-amount');
  
  const precioTotalEl = document.getElementById('precio-total');
  const precioUnitarioEl = document.getElementById('precio-unitario');
  const cambio24hEl = document.getElementById('cambio-24h');

  // Tasas Fiat
  const tasasFiat = {
    USD: 1,
    VES: 36.5,
    EUR: 0.92,
    COP: 3900,
    ARS: 950
  };

  let modoOrigen = 'crypto';
  let timerDebounce;

  const actualizarEtiqueta = () => {
    const symbol = cryptoSelect.options[cryptoSelect.selectedIndex].getAttribute('data-symbol');
    labelAmount.textContent = `Monto (${symbol})`;
  };

  const ejecutarConsulta = () => {
    clearTimeout(timerDebounce);
    timerDebounce = setTimeout(obtenerPrecios, 200);
  };

  amountCryptoInput.addEventListener('input', () => { modoOrigen = 'crypto'; ejecutarConsulta(); });
  amountFiatInput.addEventListener('input', () => { modoOrigen = 'fiat'; ejecutarConsulta(); });
  cryptoSelect.addEventListener('change', () => { actualizarEtiqueta(); modoOrigen = 'crypto'; ejecutarConsulta(); });
  fiatSelect.addEventListener('change', ejecutarConsulta);

  async function obtenerPrecios() {
    const pair = cryptoSelect.value;
    const symbol = cryptoSelect.options[cryptoSelect.selectedIndex].getAttribute('data-symbol');
    const fiat = fiatSelect.value;

    try {
      // Usamos Binance Spot API (no requiere API key ni auth, cors habilitado para lectura pública)
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);
      if (!res.ok) throw new Error('Error de conexión');

      const data = await res.json();
      const precioUSD = parseFloat(data.lastPrice);
      const cambioPorcentaje = parseFloat(data.priceChangePercent);

      const multiplicadorFiat = tasasFiat[fiat] || 1;
      const precioUnitarioFiat = precioUSD * multiplicadorFiat;

      if (modoOrigen === 'crypto') {
        const cantCrypto = parseFloat(amountCryptoInput.value) || 0;
        const totalCalculado = cantCrypto * precioUnitarioFiat;
        amountFiatInput.value = cantCrypto > 0 ? totalCalculado.toFixed(2) : '';
        precioTotalEl.textContent = formatearMoneda(totalCalculado, fiat);
      } else {
        const cantFiat = parseFloat(amountFiatInput.value) || 0;
        const totalCryptoCalculado = cantFiat / precioUnitarioFiat;
        amountCryptoInput.value = cantFiat > 0 ? totalCryptoCalculado.toFixed(6) : '';
        precioTotalEl.textContent = `${totalCryptoCalculado.toFixed(6)} ${symbol}`;
      }

      precioUnitarioEl.textContent = formatearMoneda(precioUnitarioFiat, fiat);
      cambio24hEl.textContent = `${cambioPorcentaje >= 0 ? '+' : ''}${cambioPorcentaje.toFixed(2)}%`;
      cambio24hEl.style.color = cambioPorcentaje >= 0 ? '#0ecb81' : '#f6465d';

    } catch (error) {
      console.error(error);
      precioTotalEl.textContent = 'Error al cargar';
    }
  }

  function formatearMoneda(monto, fiat) {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: fiat,
      maximumFractionDigits: monto < 1 ? 4 : 2
    }).format(monto);
  }

  actualizarEtiqueta();
  obtenerPrecios();
});