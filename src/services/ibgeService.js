const axios = require('axios');

const IBGE_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

async function buscarCidadesPorUf(siglaUf) {
  const response = await axios.get(`${IBGE_BASE_URL}/estados/${siglaUf}/municipios`, {
    params: {
      orderBy: 'nome'
    },
    timeout: 8000
  });

  return Array.isArray(response.data) ? response.data : [];
}

module.exports = {
  buscarCidadesPorUf
};
