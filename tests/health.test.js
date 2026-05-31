const request = require('supertest');
const app = require('../src/app');

describe('Health check', () => {
  test('GET /api/v1/health deve retornar status healthy', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'healthy',
      versao: '1.0.0'
    });
    expect(response.body.timestamp).toBeDefined();
  });
});
