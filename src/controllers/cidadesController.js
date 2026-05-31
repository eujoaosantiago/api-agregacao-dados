const ibgeService = require('../services/ibgeService');

function validarLimite(valor) {
  const limite = Number.parseInt(valor, 10);

  if (Number.isNaN(limite)) {
    return 10;
  }

  return Math.min(Math.max(limite, 1), 100);
}

async function listarPorUf(req, res) {
  const siglaInformada = req.params.sigla_uf;
  const siglaUf = String(siglaInformada || '').trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(siglaUf)) {
    return res.status(400).json({
      erro: true,
      codigo: 'SIGLA_UF_INVALIDA',
      mensagem: 'A sigla do estado deve conter exatamente 2 letras',
      sigla_uf_informada: siglaInformada
    });
  }

  try {
    const limite = validarLimite(req.query.limite);
    const cidades = await ibgeService.buscarCidadesPorUf(siglaUf);

    if (!cidades.length) {
      return res.status(404).json({
        erro: true,
        codigo: 'UF_NAO_ENCONTRADA',
        mensagem: 'Estado com a sigla informada não foi encontrado',
        sigla_uf_informada: siglaUf
      });
    }

    const cidadesLimitadas = cidades.slice(0, limite).map((cidade) => ({
      nome: cidade.nome
    }));

    return res.status(200).json({
      uf: siglaUf,
      quantidade_retornada: cidadesLimitadas.length,
      cidades: cidadesLimitadas,
      consultado_em: new Date().toISOString()
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        erro: true,
        codigo: 'UF_NAO_ENCONTRADA',
        mensagem: 'Estado com a sigla informada não foi encontrado',
        sigla_uf_informada: siglaUf
      });
    }

    return res.status(503).json({
      erro: true,
      codigo: 'SERVICO_EXTERNO_INDISPONIVEL',
      mensagem: 'Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes',
      servico: 'IBGE'
    });
  }
}

module.exports = {
  listarPorUf
};
