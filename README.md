# API de Agregação de Dados Climáticos e Geográficos

Este projeto é uma API REST feita em Node.js com Express para consultar informações de cidades brasileiras e retornar dados climáticos junto com dados geográficos.

A ideia principal é simples: o usuário informa o nome de uma cidade, a API procura essa cidade em serviços públicos, busca suas coordenadas, consulta a previsão do tempo e devolve tudo em uma resposta JSON organizada.

## O que a API faz

- Consulta cidades brasileiras pelo nome.
- Busca código, nome e estado da cidade.
- Obtém latitude e longitude sem usar coordenadas fixas no código.
- Consulta temperatura atual, mínima, máxima e condição do tempo.
- Lista cidades de um estado pela sigla da UF.
- Trata erros de entrada inválida, cidade não encontrada e falhas em APIs externas.

## Tecnologias

- Node.js
- Express
- Axios
- CORS
- Jest
- Supertest
- Nodemon

## APIs utilizadas

### Brasil API CPTEC

Usada para localizar uma cidade a partir do nome informado na rota de clima.

Ela retorna dados como:

- código da cidade;
- nome da cidade;
- estado.

Endpoint usado:

```text
https://brasilapi.com.br/api/cptec/v1/cidade/{nome_cidade}
```

### Open-Meteo Geocoding

Usada para descobrir as coordenadas da cidade. Essa etapa é importante porque o trabalho pede que as coordenadas sejam obtidas dinamicamente, e não escritas manualmente no código.

Endpoint usado:

```text
https://geocoding-api.open-meteo.com/v1/search
```

### Open-Meteo Forecast

Usada para buscar os dados climáticos com base na latitude e longitude encontradas.

Endpoint usado:

```text
https://api.open-meteo.com/v1/forecast
```

### IBGE Localidades

Usada para listar os municípios de um estado brasileiro.

Endpoint usado:

```text
https://servicodados.ibge.gov.br/api/v1/localidades/estados/{UF}/municipios
```

## Fluxo da busca de clima

Na rota de clima, o usuário informa apenas o nome da cidade. A API faz o restante do processo.

Fluxo implementado:

```text
Cliente informa o nome da cidade
        ↓
API recebe a requisição
        ↓
API busca a cidade na Brasil API CPTEC
        ↓
API recebe código, nome e estado
        ↓
API busca latitude e longitude no Open-Meteo Geocoding
        ↓
API consulta o clima no Open-Meteo Forecast
        ↓
API combina dados geográficos e climáticos
        ↓
Cliente recebe a resposta JSON
```

## Estrutura do projeto

```text
/
├── README.md
├── INTEGRANTES.md
├── package.json
├── package-lock.json
├── src/
│   ├── app.js
│   ├── server.js
│   ├── routes.js
│   ├── controllers/
│   │   ├── cidadesController.js
│   │   ├── climaController.js
│   │   └── healthController.js
│   └── services/
│       ├── climaService.js
│       └── ibgeService.js
├── tests/
│   └── api.test.js
└── docs/
    └── postman_collection.json
```

## Como rodar o projeto

Primeiro, instale as dependências:

```bash
npm install
```

Depois, inicie a API:

```bash
npm start
```

Para desenvolvimento, também é possível usar:

```bash
npm run dev
```

A API roda por padrão em:

```text
http://localhost:3000
```

## Como rodar os testes

```bash
npm test
```

Os testes foram feitos com Jest e Supertest. Eles usam mock do Axios, então não dependem da internet nem da disponibilidade das APIs externas para passar.

## Endpoints

### Health check

Verifica se a API está funcionando.

```http
GET /api/v1/health
```

Exemplo:

```bash
curl http://localhost:3000/api/v1/health
```

Resposta:

```json
{
  "status": "healthy",
  "versao": "1.0.0",
  "timestamp": "2025-03-15T14:30:00.000Z"
}
```

### Buscar clima por cidade

Busca os dados geográficos e climáticos de uma cidade.

```http
GET /api/v1/clima/{nome_cidade}
```

Exemplo:

```bash
curl http://localhost:3000/api/v1/clima/Fortaleza
```

Resposta de sucesso:

```json
{
  "codigo": 4750,
  "nome": "Fortaleza",
  "estado": "CE",
  "coordenadas": {
    "latitude": -3.71722,
    "longitude": -38.54306
  },
  "clima": {
    "temperatura_atual": 28.5,
    "temperatura_min": 24,
    "temperatura_max": 32,
    "condicao": "Parcialmente Nublado",
    "unidades": {
      "temperatura": "°C"
    }
  },
  "consultado_em": "2025-03-15T14:30:00.000Z"
}
```

Campos principais:

| Campo | Descrição |
|-------|-----------|
| codigo | Código da cidade retornado pela Brasil API CPTEC. |
| nome | Nome da cidade encontrada. |
| estado | UF da cidade. |
| coordenadas.latitude | Latitude encontrada dinamicamente. |
| coordenadas.longitude | Longitude encontrada dinamicamente. |
| clima.temperatura_atual | Temperatura atual. |
| clima.temperatura_min | Temperatura mínima prevista. |
| clima.temperatura_max | Temperatura máxima prevista. |
| clima.condicao | Condição climática. |
| consultado_em | Data e hora da consulta. |

Erro quando o nome tem menos de 2 caracteres:

```json
{
  "erro": true,
  "codigo": "NOME_INVALIDO",
  "mensagem": "O nome da cidade deve conter pelo menos 2 caracteres",
  "nome_informado": "X"
}
```

Erro quando a cidade não existe:

```json
{
  "erro": true,
  "codigo": "CIDADE_NAO_ENCONTRADA",
  "mensagem": "Nenhuma cidade encontrada com o nome informado",
  "nome_informado": "CidadeInexistente"
}
```

Erro quando algum serviço externo falha:

```json
{
  "erro": true,
  "codigo": "SERVICO_EXTERNO_INDISPONIVEL",
  "mensagem": "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
  "servico": "CPTEC/Open-Meteo"
}
```

### Listar cidades por estado

Lista municípios de uma UF.

```http
GET /api/v1/cidades/{sigla_uf}
```

Exemplo:

```bash
curl "http://localhost:3000/api/v1/cidades/CE?limite=5"
```

Resposta de sucesso:

```json
{
  "uf": "CE",
  "quantidade_retornada": 5,
  "cidades": [
    { "nome": "Abaiara" },
    { "nome": "Acarape" },
    { "nome": "Acarau" },
    { "nome": "Acopiara" },
    { "nome": "Aiuaba" }
  ],
  "consultado_em": "2025-03-15T14:30:00.000Z"
}
```

Parâmetros:

| Parâmetro | Onde fica | Obrigatório | Descrição |
|-----------|-----------|-------------|-----------|
| sigla_uf | rota | sim | Sigla do estado com 2 letras. |
| limite | query string | não | Quantidade máxima de cidades retornadas. O padrão é 10 e o máximo é 100. |

Erro quando a UF é inválida:

```json
{
  "erro": true,
  "codigo": "SIGLA_UF_INVALIDA",
  "mensagem": "A sigla do estado deve conter exatamente 2 letras",
  "sigla_uf_informada": "ceara"
}
```

Erro quando a UF não é encontrada:

```json
{
  "erro": true,
  "codigo": "UF_NAO_ENCONTRADA",
  "mensagem": "Estado com a sigla informada não foi encontrado",
  "sigla_uf_informada": "XX"
}
```

Erro quando o IBGE não responde:

```json
{
  "erro": true,
  "codigo": "SERVICO_EXTERNO_INDISPONIVEL",
  "mensagem": "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
  "servico": "IBGE"
}
```

## Exemplos de uso no PowerShell

Com a API rodando em um terminal, abra outro terminal e execute:

```powershell
(Invoke-WebRequest -UseBasicParsing "http://localhost:3000/api/v1/clima/Quixada").Content
```

Cidade com espaço:

```powershell
(Invoke-WebRequest -UseBasicParsing "http://localhost:3000/api/v1/clima/São Paulo").Content
```

Listar cidades de um estado:

```powershell
(Invoke-WebRequest -UseBasicParsing "http://localhost:3000/api/v1/cidades/CE?limite=5").Content
```

Health check:

```powershell
(Invoke-WebRequest -UseBasicParsing "http://localhost:3000/api/v1/health").Content
```

## Regras de validação

### Nome da cidade

- Precisa ter pelo menos 2 caracteres.
- Pode conter acentos e espaços.
- Se a cidade não for encontrada, a API retorna `404`.

### Sigla da UF

- Precisa ter exatamente 2 letras.
- A API converte a sigla para maiúsculas antes da consulta.
- Valores como `ceara`, `C`, `123` ou `C3` retornam erro `400`.

### Limite de cidades

- Se não informar `limite`, a API usa `10`.
- O valor mínimo é `1`.
- O valor máximo é `100`.
- Se o valor não for número, a API usa `10`.

## Coleção Postman

A coleção do Postman está em:

```text
docs/postman_collection.json
```

Ela já contém exemplos para os endpoints de health, clima e cidades, incluindo casos de sucesso e erro.

## Scripts

| Script | Comando | Função |
|--------|---------|--------|
| start | `npm start` | Inicia a API. |
| dev | `npm run dev` | Inicia a API com Nodemon. |
| test | `npm test` | Executa os testes. |

## Observações

- A porta padrão é `3000`.
- Todas as respostas são em JSON.
- O CORS está habilitado.
- A API não usa coordenadas fixas no código.
- Em caso de falha nas APIs externas, o retorno esperado é `503`.
- Os integrantes da equipe estão no arquivo `INTEGRANTES.md`.
