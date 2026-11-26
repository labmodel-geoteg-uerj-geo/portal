# Arquitetura Técnica, Engenharia e Manual de Reprodutibilidade — IDE Geoespacial (Padrão INDE / OGC)

**Implementação de Referência:** IDE LABMODEL / GEOTEG — Departamento de Geografia / Universidade do Estado do Rio de Janeiro (UERJ)  
**Domínio de Produção:** `https://ide-labmodel-geoteg-uerj.com.br`  
**Repositório Front-end:** `https://github.com/labmodel-geoteg-uerj-geo/portal`  
**Padrões de Interoperabilidade:** OGC (WMS 1.1.1/1.3.0, WFS 1.0.0/2.0.0, OGC API Features, CSW, SLD), ISO 19115 / Perfil MGB-INDE  
**Licenciamento Recomendado (Ciência Aberta):** Código sob licença MIT; documentação técnica e metadados sob CC-BY 4.0.

---

## 1. Arquitetura Real Consolidada e Justificativa das Escolhas

A IDE LABMODEL/GEOTEG/UERJ foi projetada sob o princípio de **custo mínimo (ou nulo)** sem abrir mão de **soberania de dados, interoperabilidade plena com QGIS/INDE e automação ponta a ponta**.

### 1.1. O Ambiente Escolhido em Produção e Por Que Foi Escolhido

| Camada | Tecnologia / Especificação Adotada | Justificativa Técnica e Econômica |
| :--- | :--- | :--- |
| **Servidor (VPS)** | **Contabo Cloud VPS** (`vmi3743230`) — ~96 GB SSD (`95.82 GB` montados em `/`), IPv4 dedicado + IPv6, consumo típico em operação leve: ~21% disco e ~24–28% RAM | Melhor relação **RAM + armazenamento por euro** do mercado (a partir de €5,24/mês no plano Core VPS 4 vCPU / 8 GB RAM / 100 GB SSD) e tráfego de saída incluso sem cobrança surpresa de egress, essencial para entrega contínua de tiles WMS e downloads de Shapefile/GeoTIFF. |
| **Sistema Operacional** | **Ubuntu 24.04.5 LTS** (`GNU/Linux 6.8.0-147-generic x86_64`) | Suporte de longo prazo (LTS até 2029), compatibilidade nativa com Docker Engine, Nginx 1.24, Certbot/Let's Encrypt e bibliotecas geoespaciais (GDAL/OGR/PROJ). |
| **Proxy Reverso & TLS** | **Nginx 1.24.0 (Ubuntu)** + **Let's Encrypt (Certbot)** | Centraliza todos os microsserviços sob um único domínio HTTPS (porta 443), oculta portas internas (`8080`, `9000`, `5000`, `8000`, `5432`) atrás do `127.0.0.1`, gerencia CORS unificado e suporta uploads de até `500M`. |
| **Servidor de Mapas** | **GeoServer em Docker** (Apache Tomcat 11, porta interna `8080`) | Motor OGC de referência na INDE brasileira; publica WMS, WFS, `GetFeatureInfo`, `GetLegendGraphic` e estilos cartográficos `SLD`. Organizado em dois workspaces: `base` (referências oficiais IBGE/SNIRH/ICMBio) e `ide` (produções científicas submetidas). |
| **Banco de Dados Espacial** | **PostgreSQL + PostGIS** (porta interna `5432`) | Armazenamento vetorial indexado espacialmente (índices GiST) + catálogo relacional de metadados acadêmicos/ABNT, com latência < 1 ms na comunicação local com GeoServer e FastAPI. |
| **Orquestrador de Ingestão** | **FastAPI (Python)** (porta interna `9000`) | Recebe pacotes `.zip` (Shapefile `.shp/.shx/.dbf/.prj` ou GeoTIFF `.tif/.tiff` + `.sld` opcional), grava metadados no PostGIS, publica no GeoServer e expõe `/api/catalogo` e `/upload`. |
| **Interoperabilidade OGC Moderna** | **Pygeoapi** (`127.0.0.1:5000`) e **Pycsw** (`127.0.0.1:8000`) | Expõem respectivamente **OGC API - Features** (JSON/REST moderno) e **CSW / ISO 19115** (colheita automática de metadados por catálogos federados como a INDE). |
| **Front-end WebGIS** | **HTML5 / CSS3 / Leaflet** (sem framework pesado de build) | Código estático auditável, leve, livre de dependências quebráveis de Node/Webpack; compatível tanto com Nginx local (`/var/www/ide/public`) quanto com espelhamento gratuito na Vercel/GitHub Pages (**Modo Econômico**). |

### 1.2. Mapa de Roteamento Interno (Nginx → Serviços)

```text
Internet (HTTPS :443 — ide-labmodel-geoteg-uerj.com.br)
 │
 └──► Nginx 1.24.0 (SSL Let's Encrypt + CORS + client_max_body_size 500M)
       ├── /                     ──► Arquivos estáticos (/var/www/ide/public)
       ├── /upload               ──► FastAPI (127.0.0.1:9000/upload)
       ├── /api/                 ──► FastAPI (127.0.0.1:9000/api/*)
       ├── /api/geoserver        ──► GeoServer OWS (127.0.0.1:8080/geoserver/ows$is_args$args)
       ├── /api/geoserver-wfs    ──► GeoServer OWS (127.0.0.1:8080/geoserver/ows$is_args$args)
       ├── /geoserver/           ──► GeoServer Web/REST (127.0.0.1:8080/geoserver/) [proxy_redirect http->https]
       ├── /pygeoapi/            ──► Pygeoapi OGC API Features (127.0.0.1:5000/)
       └── /pycsw/               ──► Pycsw Catálogo CSW ISO 19115 (127.0.0.1:8000/)
