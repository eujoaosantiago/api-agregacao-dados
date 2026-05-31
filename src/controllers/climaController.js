const climaService = require('../services/climaService');

async function buscarClima(req, res) {
  const nomeInformado = req.params.nome_cidade;
  const nomeCidade = String(nomeInformado || '').trim();

  if (nomeCidade.length < 2) {
    return res.status(400).json({
      erro: true,
      codigo: 'NOME_INVALIDO',
      mensagem: 'O nome da cidade deve conter pelo menos 2 caracteres',
      nome_informado: nomeInformado
    });
  }

  try {
    const dadosClima = await climaService.buscarClimaPorCidade(nomeCidade);

    if (!dadosClima) {
      return res.status(404).json({
        erro: true,
        codigo: 'CIDADE_NAO_ENCONTRADA',
        mensagem: 'Nenhuma cidade encontrada com o nome informado',
        nome_informado: nomeInformado
      });
    }

    return res.status(200).json({
      codigo: dadosClima.codigo,
      nome: dadosClima.nome,
      estado: dadosClima.estado,
      coordenadas: dadosClima.coordenadas,
      clima: {
        temperatura_atual: dadosClima.temperaturaAtual,
        temperatura_min: dadosClima.temperaturaMin,
        temperatura_max: dadosClima.temperaturaMax,
        condicao: dadosClima.condicao,
        unidades: {
          temperatura: '°C'
        }
      },
      consultado_em: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      erro: true,
      codigo: 'SERVICO_EXTERNO_INDISPONIVEL',
      mensagem: 'Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes',
      servico: 'CPTEC/Open-Meteo'
    });
  }
}

module.exports = {
  buscarClima
};
