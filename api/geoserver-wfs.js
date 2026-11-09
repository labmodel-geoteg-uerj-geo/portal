export default async function handler(req, res) {
  try {
    const vpsIp = process.env.VPS_IP || "207.246.112.88";
    const query = new URLSearchParams(req.query).toString();
    const url = `http://${vpsIp}:8080/geoserver/wfs?${query}`;

    const response = await fetch(url);
    const data = await response.arrayBuffer();

    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/json"
    );

    return res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    console.error("Erro proxy WFS:", error);
    return res.status(502).json({ erro: "Serviço GeoServer WFS indisponível" });
  }
}
