export default async function handler(req, res) {

  const query = new URLSearchParams(req.query).toString();

  const url =
    `http://207.246.112.88:8080/geoserver/ide/wms?${query}`;

  try {

    const response = await fetch(url);

    const contentType = response.headers.get('content-type');

    const data = await response.arrayBuffer();

    res.setHeader(
      'Content-Type',
      contentType || 'image/png'
    );

    res.status(200).send(Buffer.from(data));

  } catch (error) {

    res.status(500).json({
      error: error.toString()
    });

  }
}
