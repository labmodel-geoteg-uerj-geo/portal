export default async function handler(req, res) {
  try {
    const vpsIp = process.env.VPS_IP || "207.246.112.88";
    const query = new URLSearchParams(req.query).toString();
    const path = req.query.path ? `/${req.query.path}` : "/collections/metadata:main/items";
    const url = `http://${vpsIp}:8000${path}${query ? `?${query}` : ""}`;

    const response = await fetch(url);
    const data = await response.arrayBuffer();

    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/json"
    );

    return res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    console.error("Erro proxy pycsw:", error);
    return res.status(503).json({
      modo_economico: true,
      erro: "Catálogo OGC pycsw offline no momento"
    });
  }
}
