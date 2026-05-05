export default async function handler(req, res) {
  try {
    const url = "http://207.246.112.88:8080/geoserver/ide/wms?" + new URL(req.url, "http://localhost").searchParams.toString();

    const response = await fetch(url);

    const contentType = response.headers.get("content-type");
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.send(Buffer.from(buffer));

  } catch (error) {
    res.status(500).send("Erro no proxy: " + error.message);
  }
}
