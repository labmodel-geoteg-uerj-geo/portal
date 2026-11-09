export default async function handler(req, res) {
  try {
    const vpsIp = process.env.VPS_IP || "207.246.112.88";
    const query = new URLSearchParams(req.query).toString();
    const url = `http://${vpsIp}:8080/geoserver/wms?${query}`;

    const response = await fetch(url);
    const data = await response.arrayBuffer();

    const contentType = response.headers.get("content-type") || "image/png";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=300");

    return res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    console.error("Erro proxy WMS:", error);
    return res.status(502).send("Serviço GeoServer WMS temporariamente indisponível");
  }
}
