document.addEventListener('DOMContentLoaded', () => {
  const amountFiatInput = document.getElementById('amount-fiat');
  const amountCryptoInput = document.getElementById('amount-crypto');
  const cryptoSelect = document.getElementById('crypto');
  const fiatSelect = document.getElementById('fiat');

  const precioTotalEl = document.getElementById('precio-total');
  const precioUnitarioEl = document.getElementById('precio-unitario');
  const cambio24hEl = document.getElementById('cambio-24h');

  // Tasas Fiat de referencia respecto a 1 USD
  const tasasFiat = {
    USD: 1,
    VES: 36.5,
    EUR: 0.92,
    COP: 3900,
    ARS: 950
  };

  let timerDebounce;

  const ejecutarConsulta = () => {
    clearTimeout(timerDebounce);
    timerDebounce = setTimeout(obtenerPrecios, 200);
  };

  // Eventos: Se calcula cuando cambias el dinero ingresado o la selección de monedas
  amountFiatInput.addEventListener('input', ejecutarConsulta);
  cryptoSelect.addEventListener('change', ejecutarConsulta);
  fiatSelect.addEventListener('change', ejecutarConsulta);

  async function obtenerPrecios() {
    const pair = cryptoSelect.value; // Ej: 'BTCUSDT'
    const symbol = cryptoSelect.options[cryptoSelect.selectedIndex].getAttribute('data-symbol') || 'CRIPTO';
    const fiat = fiatSelect.value;

    try {
      // Consulta de precio en tiempo real desde Binance Spot API
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);
      if (!res.ok) throw new Error('Error de conexión');

      const data = await res.json();
      const precioUSD = parseFloat(data.lastPrice);
      const cambioPorcentaje = parseFloat(data.priceChangePercent);

      // Precio unitario de la Cripto en la Moneda Local elegida
      const multiplicadorFiat = tasasFiat[fiat] || 1;
      const precioUnitarioFiat = precioUSD * multiplicadorFiat;

      // LÓGICA DIRECTA: Moneda Local ÷ Precio Unitario = Cripto a recibir
      const cantFiat = parseFloat(amountFiatInput.value) || 0;
      const totalCryptoCalculado = cantFiat > 0 ? (cantFiat / precioUnitarioFiat) : 0;

      // Asignar el resultado al input de cripto (si existe) y a la pantalla
      if (amountCryptoInput) {
        amountCryptoInput.value = totalCryptoCalculado > 0 ? totalCryptoCalculado.toFixed(6) : '';
      }

      precioTotalEl.textContent = `${totalCryptoCalculado.toFixed(6)} ${symbol}`;
      precioUnitarioEl.textContent = formatearMoneda(precioUnitarioFiat, fiat);

      // Porcentaje de cambio en 24h
      cambio24hEl.textContent = `${cambioPorcentaje >= 0 ? '+' : ''}${cambioPorcentaje.toFixed(2)}%`;
      cambio24hEl.style.color = cambioPorcentaje >= 0 ? '#0ecb81' : '#f6465d';

    } catch (error) {
      console.error(error);
      precioTotalEl.textContent = 'Error al cargar cotización';
    }
  }

  function formatearMoneda(monto, fiat) {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: fiat,
      maximumFractionDigits: monto < 1 ? 4 : 2
    }).format(monto);
  }

  // Ejecución inicial al cargar la página
  obtenerPrecios();
});
