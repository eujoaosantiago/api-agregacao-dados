const express = require('express');
const healthController = require('./controllers/healthController');
const cidadesController = require('./controllers/cidadesController');
const climaController = require('./controllers/climaController');

const router = express.Router();

router.get('/health', healthController.health);
router.get('/cidades/:sigla_uf', cidadesController.listarPorUf);
router.get('/clima/:nome_cidade', climaController.buscarClima);

module.exports = router;
