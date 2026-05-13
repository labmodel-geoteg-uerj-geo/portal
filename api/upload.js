export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks);

  const response = await fetch("http://207.246.112.88:9000/upload", {
    method: "POST",
    headers: {
      "content-type": req.headers["content-type"],
    },
    body,
  });

  const text = await response.text();

  res.status(response.status);

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "content-encoding") {
      res.setHeader(key, value);
    }
  });

  res.send(text);
}
