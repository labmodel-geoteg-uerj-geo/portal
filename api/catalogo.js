export default async function handler(req, res) {
  // 1. Lê o IP da variável da Vercel (quando você trocar de VPS) ou mantém o IP padrão
  const vpsIp = process.env.VPS_IP || "207.246.112.88";
  const urlBackend = `http://${vpsIp}:9000/api/catalogo`;

  // 2. Cria um limite de espera de 3.5 segundos para não travar o site se a VPS estiver desligada
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(urlBackend, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Status HTTP ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    clearTimeout(timeoutId);
    // Devolve status 503 avisando ao mapa.html para ativar o Modo Econômico (/js/catalogo.json)
    return res.status(503).json({
      modo_economico: true,
      aviso: "VPS offline ou em manutenção. Ativando catálogo estático local.",
      detalhe: error.message
    });
  }
}
