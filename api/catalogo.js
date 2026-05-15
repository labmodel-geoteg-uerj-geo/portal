module.exports = async function handler(req, res) {
  try {
    const response = await fetch("http://207.246.112.88:9000/api/catalogo");

    const data = await response.text();

    res.statusCode = response.status;
    res.setHeader("Content-Type", "application/json");
    res.end(data);

  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Erro ao buscar catálogo na FastAPI",
      details: error.message
    }));
  }
};
