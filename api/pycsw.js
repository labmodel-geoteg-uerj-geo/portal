export default function handler(req, res) {
  const url = "http://207.246.112.88:8000/csw?" + req.url.split('?')[1];

  fetch(url)
    .then(r => r.text())
    .then(data => {
      res.setHeader("Content-Type", "text/xml");
      res.send(data);
    });
}
