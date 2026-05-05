export default async function handler(req, res) {
  const query = req.url.split('?')[1] || '';
  const url = `http://207.246.112.88:8080/geoserver/wms?${query}`;

  try {
    const response = await fetch(url);

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.send(Buffer.from(buffer));

  } catch (err) {
    res.status(500).send("Erro no proxy: " + err.message);
  }
}
