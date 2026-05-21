export default async function handler(req, res) {
  try {
    const query = new URLSearchParams(req.query).toString();

    const url =
      `http://207.246.112.88:8080/geoserver/wms?${query}`;

    const response = await fetch(url);
    const data = await response.arrayBuffer();

    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "image/png"
    );

    res.status(response.status).send(Buffer.from(data));

  } catch (error) {
    res.status(500).send("Erro no proxy GeoServer");
  }
}
