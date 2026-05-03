// Netlify Serverless Function — Proxy Yahoo Finance
// URL appelée par l'app : /.netlify/functions/quotes
// Yahoo Finance v8 : gratuit, sans clé API, CORS bloqué côté browser → proxy nécessaire

exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  // 40 tickers CAC40
  const TICKERS = [
    'AI.PA','OR.PA','TTE.PA','BNP.PA','SAN.PA','MC.PA','CAP.PA','DG.PA',
    'CS.PA','KER.PA','HO.PA','RMS.PA','STM.PA','VIE.PA','ENR.PA','SGO.PA',
    'PUB.PA','RI.PA','WLN.PA','DSY.PA','SU.PA','SAF.PA','AIR.PA','BN.PA',
    'EL.PA','ORA.PA','ML.PA','GLE.PA','CA.PA','BK.PA','VIV.PA','URW.PA',
    'ERF.PA','LR.PA','SW.PA','AKE.PA','AF.PA','RNO.PA','PEU.PA','ATO.PA'
  ];

  try {
    // Yahoo Finance v8 crampfields endpoint — supporte jusqu'à 50 tickers par requête
    const symbols = TICKERS.join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketPreviousClose,shortName&lang=fr&region=FR`;

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CAC40Sim/1.0)',
        'Accept': 'application/json',
        'Accept-Language': 'fr-FR,fr;q=0.9'
      }
    });

    if (!resp.ok) {
      throw new Error(`Yahoo Finance HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const quotes = data?.quoteResponse?.result || [];

    if (!quotes.length) {
      throw new Error('Aucun résultat Yahoo Finance');
    }

    // Construire la réponse normalisée
    const prices = {};
    quotes.forEach(q => {
      if (q.symbol && q.regularMarketPrice != null) {
        prices[q.symbol] = {
          price: parseFloat(q.regularMarketPrice.toFixed(2)),
          change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
          prev: parseFloat((q.regularMarketPreviousClose || q.regularMarketPrice).toFixed(2)),
          name: q.shortName || q.symbol
        };
      }
    });

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        ok: true,
        prices,
        ts: new Date().toLocaleString('fr-FR', {
          day: '2-digit', month: '2-digit', year: '2-digit',
          hour: '2-digit', minute: '2-digit'
        }),
        source: 'yahoo'
      })
    };

  } catch (err) {
    // Fallback : retourner une erreur propre → l'app utilisera les cours enseignant ou simulés
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({
        ok: false,
        error: err.message
      })
    };
  }
};
