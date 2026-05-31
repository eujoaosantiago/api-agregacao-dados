const request = require('supertest');
const axios = require('axios');
const app = require('../src/app');

jest.mock('axios');

describe('API de agregacao de dados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/v1/health deve retornar status healthy', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'healthy',
      versao: '1.0.0'
    });
    expect(response.body.timestamp).toBeDefined();
  });

  test('GET /api/v1/clima/Fortaleza deve retornar dados climaticos', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 4750,
            nome: 'Fortaleza',
            estado: 'CE'
          }
        ]
      })
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              name: 'Fortaleza',
              country_code: 'BR',
              latitude: -3.71722,
              longitude: -38.54306
            }
          ]
        }
      })
      .mockResolvedValueOnce({
        data: {
          current: {
            temperature_2m: 28.5
          },
          daily: {
            temperature_2m_min: [24],
            temperature_2m_max: [32],
            weather_code: [2]
          }
        }
      });

    const response = await request(app).get('/api/v1/clima/Fortaleza');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      codigo: 4750,
      nome: 'Fortaleza',
      estado: 'CE',
      coordenadas: {
        latitude: -3.71722,
        longitude: -38.54306
      },
      clima: {
        temperatura_atual: 28.5,
        temperatura_min: 24,
        temperatura_max: 32,
        condicao: 'Parcialmente Nublado',
        unidades: {
          temperatura: '°C'
        }
      }
    });
    expect(response.body.consultado_em).toBeDefined();
  });

  test('GET /api/v1/clima/CidadeInexistente deve retornar 404', async () => {
    axios.get.mockResolvedValueOnce({
      data: []
    });

    const response = await request(app).get('/api/v1/clima/CidadeInexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      erro: true,
      codigo: 'CIDADE_NAO_ENCONTRADA',
      mensagem: 'Nenhuma cidade encontrada com o nome informado',
      nome_informado: 'CidadeInexistente'
    });
  });

  test('GET /api/v1/clima/lifonodo deve retornar 404 quando CPTEC responde 404', async () => {
    axios.get.mockRejectedValueOnce({
      response: {
        status: 404,
        data: {
          message: 'Nenhuma cidade localizada',
          type: 'city_error',
          name: 'NO_CITY_NOT_FOUND'
        }
      }
    });

    const response = await request(app).get('/api/v1/clima/lifonodo');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      erro: true,
      codigo: 'CIDADE_NAO_ENCONTRADA',
      mensagem: 'Nenhuma cidade encontrada com o nome informado',
      nome_informado: 'lifonodo'
    });
  });

  test('GET /api/v1/clima/X deve retornar 400 para nome invalido', async () => {
    const response = await request(app).get('/api/v1/clima/X');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      erro: true,
      codigo: 'NOME_INVALIDO',
      mensagem: 'O nome da cidade deve conter pelo menos 2 caracteres',
      nome_informado: 'X'
    });
  });

  test('GET /api/v1/clima/Fortaleza deve retornar 503 quando Open-Meteo nao envia temperaturas', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 4750,
            nome: 'Fortaleza',
            estado: 'CE'
          }
        ]
      })
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              name: 'Fortaleza',
              country_code: 'BR',
              latitude: -3.71722,
              longitude: -38.54306
            }
          ]
        }
      })
      .mockResolvedValueOnce({
        data: {
          current: {},
          daily: {
            weather_code: [2]
          }
        }
      });

    const response = await request(app).get('/api/v1/clima/Fortaleza');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      erro: true,
      codigo: 'SERVICO_EXTERNO_INDISPONIVEL',
      mensagem: 'Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes',
      servico: 'CPTEC/Open-Meteo'
    });
  });

  test('GET /api/v1/cidades/CE deve retornar cidades limitadas', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { nome: 'Abaiara' },
        { nome: 'Acarape' },
        { nome: 'Acarau' }
      ]
    });

    const response = await request(app).get('/api/v1/cidades/CE?limite=2');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      uf: 'CE',
      quantidade_retornada: 2,
      cidades: [
        { nome: 'Abaiara' },
        { nome: 'Acarape' }
      ]
    });
    expect(response.body.consultado_em).toBeDefined();
  });

  test('GET /api/v1/cidades/ceara deve retornar 400 para UF invalida', async () => {
    const response = await request(app).get('/api/v1/cidades/ceara');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      erro: true,
      codigo: 'SIGLA_UF_INVALIDA',
      mensagem: 'A sigla do estado deve conter exatamente 2 letras',
      sigla_uf_informada: 'ceara'
    });
  });

  test('GET /api/v1/cidades/XX deve retornar 404 para UF nao encontrada', async () => {
    axios.get.mockResolvedValueOnce({
      data: []
    });

    const response = await request(app).get('/api/v1/cidades/XX');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      erro: true,
      codigo: 'UF_NAO_ENCONTRADA',
      mensagem: 'Estado com a sigla informada não foi encontrado',
      sigla_uf_informada: 'XX'
    });
  });
});
