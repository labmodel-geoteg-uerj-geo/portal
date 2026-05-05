export default async function handler(req, res) {
  const query = req.url.split('?')[1] || '';
  const url = "http://207.246.112.88:8080/geoserver/wms?" + query;

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(buffer));

  } catch (error) {
    res.status(500).send("Erro no proxy");
  }
}
