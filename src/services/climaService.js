const axios = require('axios');

const BRASIL_API_CPTEC_URL = 'https://brasilapi.com.br/api/cptec/v1';
const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const CONDICOES_OPEN_METEO = {
  0: 'Ceu Limpo',
  1: 'Principalmente Limpo',
  2: 'Parcialmente Nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina Com Geada',
  51: 'Garoa Fraca',
  53: 'Garoa Moderada',
  55: 'Garoa Forte',
  61: 'Chuva Fraca',
  63: 'Chuva Moderada',
  65: 'Chuva Forte',
  71: 'Neve Fraca',
  73: 'Neve Moderada',
  75: 'Neve Forte',
  80: 'Pancadas De Chuva Fracas',
  81: 'Pancadas De Chuva Moderadas',
  82: 'Pancadas De Chuva Fortes',
  95: 'Trovoadas',
  96: 'Trovoadas Com Granizo Fraco',
  99: 'Trovoadas Com Granizo Forte'
};

function formatarCondicao(condicao) {
  if (!condicao) {
    return 'Nao informado';
  }

  return String(condicao)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function escolherCidade(cidades, nomeCidade) {
  const nomeNormalizado = nomeCidade.toLocaleLowerCase('pt-BR');

  return cidades.find((cidade) => (
    String(cidade.nome || '').toLocaleLowerCase('pt-BR') === nomeNormalizado
  )) || cidades[0];
}

function escolherCoordenadas(resultados, nomeCidade) {
  const nomeNormalizado = nomeCidade.toLocaleLowerCase('pt-BR');
  const cidadesBrasileiras = resultados.filter((cidade) => cidade.country_code === 'BR');

  return cidadesBrasileiras.find((cidade) => (
    String(cidade.name || '').toLocaleLowerCase('pt-BR') === nomeNormalizado
  )) || cidadesBrasileiras[0] || null;
}

function primeiroNumero(lista) {
  if (!Array.isArray(lista)) {
    return null;
  }

  const valor = Number(lista[0]);

  return Number.isFinite(valor) ? valor : null;
}

function isErroCidadeNaoEncontrada(error) {
  const status = error.response && error.response.status;
  const data = error.response && error.response.data;

  return status === 404
    || (data && data.name === 'NO_CITY_NOT_FOUND')
    || (data && data.type === 'city_error');
}

async function buscarClimaPorCidade(nomeCidade) {
  let buscaResponse;

  try {
    buscaResponse = await axios.get(`${BRASIL_API_CPTEC_URL}/cidade/${encodeURIComponent(nomeCidade)}`, {
      timeout: 8000
    });
  } catch (error) {
    if (isErroCidadeNaoEncontrada(error)) {
      return null;
    }

    throw error;
  }

  const cidades = Array.isArray(buscaResponse.data) ? buscaResponse.data : [];

  if (!cidades.length) {
    return null;
  }

  const cidade = escolherCidade(cidades, nomeCidade);

  if (!cidade || !cidade.id) {
    return null;
  }

  const geocodingResponse = await axios.get(OPEN_METEO_GEOCODING_URL, {
    params: {
      name: cidade.nome,
      count: 10,
      language: 'pt',
      format: 'json'
    },
    timeout: 8000
  });

  const coordenadas = escolherCoordenadas(geocodingResponse.data.results || [], cidade.nome);

  if (!coordenadas) {
    return null;
  }

  const climaResponse = await axios.get(OPEN_METEO_FORECAST_URL, {
    params: {
      latitude: coordenadas.latitude,
      longitude: coordenadas.longitude,
      current: 'temperature_2m',
      daily: 'temperature_2m_min,temperature_2m_max,weather_code',
      timezone: 'auto',
      forecast_days: 1
    },
    timeout: 8000
  });

  const previsaoDiaria = climaResponse.data.daily || {};
  const previsaoAtual = climaResponse.data.current || {};
  const temperaturaAtual = Number(previsaoAtual.temperature_2m);
  const temperaturaMin = primeiroNumero(previsaoDiaria.temperature_2m_min);
  const temperaturaMax = primeiroNumero(previsaoDiaria.temperature_2m_max);
  const codigoCondicao = primeiroNumero(previsaoDiaria.weather_code);

  if (!Number.isFinite(temperaturaAtual) || temperaturaMin === null || temperaturaMax === null || codigoCondicao === null) {
    throw new Error('Dados climaticos incompletos retornados pelo Open-Meteo');
  }

  return {
    codigo: cidade.id,
    nome: cidade.nome,
    estado: cidade.estado,
    coordenadas: {
      latitude: Number(coordenadas.latitude),
      longitude: Number(coordenadas.longitude)
    },
    temperaturaAtual,
    temperaturaMin,
    temperaturaMax,
    condicao: formatarCondicao(CONDICOES_OPEN_METEO[codigoCondicao])
  };
}

module.exports = {
  buscarClimaPorCidade
};
