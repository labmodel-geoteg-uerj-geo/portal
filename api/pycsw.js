export default async function handler(req, res) {
  try {
    // pega parâmetros corretamente
    const params = new URLSearchParams(req.query).toString();

    const url = `http://207.246.112.88:8000/csw?${params}`;

    console.log("Chamando:", url);

    const response = await fetch(url);
    const data = await response.text();

    res.setHeader("Content-Type", "text/xml");
    res.status(200).send(data);

  } catch (error) {
    console.error(error);
    res.status(500).send("Erro no proxy pycsw");
  }
}
