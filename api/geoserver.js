export default function handler(req, res) {
  const url = "http://207.246.112.88:8080/geoserver/ide/wms?" + req.url.split('?')[1];

  fetch(url)
    .then(r => r.buffer())
    .then(data => {
      res.setHeader("Content-Type", "image/png");
      res.send(data);
    });
}
