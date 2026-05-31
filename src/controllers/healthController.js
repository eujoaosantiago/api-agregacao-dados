function health(req, res) {
  return res.status(200).json({
    status: 'healthy',
    versao: '1.0.0',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  health
};
