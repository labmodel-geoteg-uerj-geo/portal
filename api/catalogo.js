export default async function handler(req, res) {
  const response = await fetch("http://207.246.112.88:9000/catalogo");

  const data = await response.text();

  res.status(response.status);
  res.setHeader("Content-Type", "application/json");
  res.send(data);
}
