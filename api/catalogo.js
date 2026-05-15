export default async function handler(req, res) {
  try {
    const response = await fetch("http://207.246.112.88:9000/api/catalogo");

    if (!response.ok) {
      const textoErro = await response.text();
      return res.status(response.status).json({
        erro: "Erro ao buscar catálogo no backend",
        status: response.status,
        detalhe: textoErro
      });
    }

    const data = await response.json();

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      erro: "Erro no proxy Vercel /api/catalogo",
      detalhe: error.message
    });
  }
}
