# Arquitetura Técnica, Engenharia e Manual de Reprodutibilidade — IDE Geoespacial (Padrão INDE / OGC)

**Implementação de Referência:** IDE LABMODEL / GEOTEG — Departamento de Geografia / Universidade do Estado do Rio de Janeiro (UERJ)  
**Domínio de Produção:** `https://ide-labmodel-geoteg-uerj.com.br`  
**Repositório Front-end:** `https://github.com/labmodel-geoteg-uerj-geo/portal`  
**Padrões de Interoperabilidade:** OGC (WMS 1.1.1/1.3.0, WFS 1.0.0/2.0.0, OGC API Features, CSW, SLD), ISO 19115 / Perfil MGB-INDE  
**Licenciamento Recomendado (Ciência Aberta):** Código sob licença MIT; documentação técnica e metadados sob CC-BY 4.0.

---

## 1. Arquitetura Real Consolidada e Justificativa das Escolhas

### 1.1. Ambiente em Produção

| Camada | Tecnologia / Especificação Adotada | Justificativa Técnica e Econômica |
| :--- | :--- | :--- |
| **Servidor (VPS)** | **Contabo Cloud VPS** (`vmi3743230`) — ~96 GB SSD (`95.82 GB` em `/`), IPv4 + IPv6 dedicados, consumo típico ~21,4% disco e ~24–28% RAM | Melhor relação RAM + SSD por euro (~€5,24/mês no plano Core VPS 4 vCPU / 8 GB RAM / 100 GB SSD) e sem cobrança surpresa de tráfego de saída (egress) para WMS e downloads. |
| **Sistema Operacional** | **Ubuntu 24.04.5 LTS** (`Linux 6.8.0-147-generic x86_64`) | LTS até 2029, estabilidade nativa com Docker Engine, Nginx 1.24, Certbot/Let's Encrypt e GDAL/OGR/PROJ. |
| **Proxy Reverso & TLS** | **Nginx 1.24.0 (Ubuntu)** + **Let's Encrypt (Certbot)** | Centraliza serviços na porta 443 (HTTPS), oculta portas internas em `127.0.0.1`, gerencia CORS e suporta uploads até `500M`. |
| **Servidor de Mapas** | **GeoServer em Docker** (Apache Tomcat 11, porta `8080`) | Motor OGC padrão INDE (WMS, WFS, `GetFeatureInfo`, `GetLegendGraphic`, SLD). Workspaces: `base` e `ide`. |
| **Banco de Dados Espacial** | **PostgreSQL + PostGIS** (Docker, porta `5432`) | Índices espaciais GiST + catálogo relacional de metadados acadêmicos/ABNT, latência < 1 ms local. |
| **Orquestrador de Ingestão** | **FastAPI (Python)** (porta `9000`) | Recebe pacotes `.zip` (Shapefile ou GeoTIFF + SLD), registra metadados no PostGIS, publica no GeoServer e expõe `/api/catalogo` e `/upload`. |
| **Interoperabilidade OGC** | **Pygeoapi** (`127.0.0.1:5000`) e **Pycsw** (`127.0.0.1:8000`) | OGC API Features (JSON/REST moderno) e CSW / ISO 19115 (colheita automática por catálogos federados como a INDE). |
| **Front-end WebGIS** | **HTML5 / CSS3 / Leaflet** (`/var/www/ide/public`) | Estático, auditável e compatível com Nginx local ou espelhamento gratuito Vercel/GitHub Pages (**Modo Econômico**). |

### 1.2. Mapa de Roteamento Interno

```text
Internet (HTTPS :443 — ide-labmodel-geoteg-uerj.com.br)
 │
 └──► Nginx 1.24.0 (SSL Let's Encrypt + CORS + client_max_body_size 500M)
       ├── /                   ──► Arquivos estáticos (/var/www/ide/public)
       ├── /downloads/         ──► Kit sanitizado de Ciência Aberta (.tar.gz)
       ├── /upload             ──► FastAPI (127.0.0.1:9000/upload)
       ├── /api/               ──► FastAPI (127.0.0.1:9000/api/*)
       ├── /api/geoserver      ──► GeoServer OWS (127.0.0.1:8080/geoserver/ows$is_args$args)
       ├── /api/geoserver-wfs  ──► GeoServer OWS (127.0.0.1:8080/geoserver/ows$is_args$args)
       ├── /geoserver/         ──► GeoServer Web/REST (127.0.0.1:8080/geoserver/) [http->https]
       ├── /pygeoapi/          ──► Pygeoapi OGC API Features (127.0.0.1:5000/)
       └── /pycsw/             ──► Pycsw Catálogo CSW ISO 19115 (127.0.0.1:8000/)
```

---

## 2. Diário de Engenharia: Erros Críticos Resolvidos

1. **Erro `Null charset name` no GeoServer (`global.xml`):** Garantir `<charset>UTF-8</charset>` dentro de `<settings>` e `EXTRA_JAVA_OPTS="-Dfile.encoding=UTF-8"`.
2. **Polígonos colapsando em triângulos retos (`numDecimals`):** Garantir `<numDecimals>8</numDecimals>` no `global.xml` e reiniciar o container `geoserver`.
3. **Coordenadas UTM vs. WGS84:** Incluir `&srsName=EPSG:4326` nas requisições WFS consumidas pelo Leaflet.
4. **Query string truncada e CORS no Nginx:** Usar `proxy_pass http://127.0.0.1:8080/geoserver/ows$is_args$args;`, responder `OPTIONS` com `204`, limpar duplicidade com `proxy_hide_header Access-Control-Allow-Origin;` e injetar `add_header 'Access-Control-Allow-Origin' '*' always;`.
5. **Uploads grandes e rota `/upload`:** Configurar `client_max_body_size 500M;`, mapear `location = /upload` para `127.0.0.1:9000/upload` e enviar `referencia_abnt` e `ano` no `FormData` do `submissao.html`.
6. **Publicação na raiz (`Welcome to nginx!` e `403 Forbidden`):** Configurar `root /var/www/ide/public;` em `location /` com `chmod -R 755`.
7. **Estouro horizontal do popup Leaflet:** Travar `.leaflet-popup-content` (`min-width: 340px; max-width: 480px !important; max-height: 340px; overflow: auto;`) e filtrar colunas geométricas (`bbox`, `geom`, `the_geom`, `geometry`).
8. **Padrão INDE/OGC (WMS + `GetFeatureInfo`) vs. WFS Dinâmico:** Produção opera em WMS + cursor `crosshair` + `GetFeatureInfo` sob demanda (`portal/mapa.html`). O modo WFS dinâmico com realce azul permanece arquivado como referência técnica em `portal/mapa_wfs_dinamico_referencia.html`.
9. **Automação Contínua e Modo Econômico:** Crons `sync-portal-github.sh` (GitHub -> VPS a cada 2 min) e `sync-catalogo-json.sh` (PostGIS/FastAPI -> `/var/www/ide/public/js/catalogo.json` a cada 5 min).

---

## 3. Guia Completo de Infraestrutura (PC Local, VPS Gratuitos e VPS Econômicos)

### 3.1. Dimensionamento Técnico

| Perfil | CPU | RAM | Swap | Disco | Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mínimo Funcional** | 2 vCPUs | **4 GB** (`-Xmx1536m`) | 2–4 GB | 40 GB SSD | TCCs / Lab pequeno (~30–50 camadas) |
| **Recomendado (Padrão UERJ)** | 4 vCPUs | **8 GB** (`-Xmx2g` a `3g`) | 2–4 GB | 80–100 GB SSD/NVMe | Produção acadêmica completa |
| **Avançado** | 6–8 vCPUs | **16 GB+** | 4 GB | 200 GB–1 TB NVMe | Séries temporais / LiDAR / GeoWebCache |

> **Alerta:** Instâncias de 1 GB–2 GB RAM (`e2-micro`, `t2.micro`) não suportam GeoServer + PostGIS em produção.

### 3.2. PC/Notebook Local (Custo de Nuvem = R$ 0)
* Hardware: i3/i5 ou Ryzen 3+, 8 GB RAM, SSD 120 GB+, Ubuntu Server 24.04 LTS.
* Publicação HTTPS sem IP fixo nem abertura de portas: **Cloudflare Tunnel (`cloudflared`)** ou **Tailscale Funnel**.
* Custo real: energia (~11–25 kWh/mês ≈ R$ 10–25/mês) + domínio (~R$ 40/ano ou subdomínio universitário gratuito).

### 3.3. VPS Gratuitos (Free Tier Permanente — Ref. 2026)
* **Oracle Cloud Always Free (ARM Ampere A1):** Melhor opção gratuita (1.500 OCPU-h + 9.000 GB-h/mês ≈ 2 OCPUs + 12 GB RAM 24h em contas Free; até 4 OCPUs + 24 GB em PAYG dentro da cota; 200 GB disco; 10 TB egress). Exige cartão para verificação e imagens `linux/arm64`.
* **Google Cloud (`e2-micro`):** 1 GB RAM — insuficiente para GeoServer (apenas proxy/front-end).
* **AWS / Azure Free Tier:** Sem plano permanente compatível com GeoServer.

### 3.4. VPS Pagos Econômicos (Ref. 2026)
* **Contabo Cloud VPS 4 (Escolha UERJ):** 4 vCPU, 8 GB RAM, 100 GB SSD, ~€5,24–€7/mês. Opção **Storage VPS 3**: 6 vCPU, 18 GB RAM, 1 TB SSD (~€13,33/mês).
* **Hetzner Cloud:** CX23 (2 vCPU, 4 GB RAM, 40 GB SSD, €5,49–€5,99/mês) / CX33 (4 vCPU, 8 GB RAM, 80 GB SSD, 20 TB egress, €8,49–€8,99/mês).
* **Hostinger / IONOS:** 4 GB RAM, ~US$ 6,49–€9/mês.

---

## 4. Bancos de Dados Geoespaciais (PostGIS) e Arquiteturas Híbridas

| Instância | Custo | Armazenamento | Egress | PostGIS | Limite Crítico |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PostGIS Docker Local (Padrão)** | R$ 0 | Disco local (~75 GB+) | Ilimitado (< 1 ms) | Nativo | Nunca pausa |
| **Neon Serverless** | $0/mês | 1 GB/projeto | 5 GB/mês | Nativo | *Scale-to-zero* após 5 min; 100 CU-h/mês |
| **Supabase Free** | $0/mês | 500 MB DB + 1 GB Storage | 5 GB/mês | Nativo | Pausa após 7 dias sem uso; sem backup auto |
| **Aiven Free** | $0/mês | 1 GB | Incluso | Nativo | Máx. 20 conexões; desliga após inatividade |
| **Render Free** | $0 (30d) | 1 GB | Limitado | Nativo | Expira em 30 dias (inadequado) |

### Viabilidade de Arquiteturas Híbridas
1. **CDN Gratuito (Vercel/GitHub Pages) + Back-end VPS/PC:** Altamente viável (garante Modo Econômico 24/7).
2. **Metadados Nuvem Gratuita + Geometrias PostGIS Local:** Viável (mantém o banco remoto abaixo de 50 MB).
3. **PC do Laboratório + Cloudflare Tunnel:** Viável (custo de nuvem R$ 0).
4. **GeoServer na VPS + Vetores Pesados no Neon/Supabase:** **Não recomendado** (latência alta, esgotamento rápido dos 5 GB de egress e falhas por pausa/cold start).

---

## 5. Reprodução Rápida
1. Copie `templates/.env.example` para `.env` e edite suas variáveis.
2. Execute `sudo ./scripts/install.sh`.
3. Emita SSL com `certbot --nginx -d SEU_DOMINIO` (ou configure `cloudflared` em PC local).
4. Conecte o repositório GitHub ao **Zenodo** para gerar DOI citável nas *Releases* de Ciência Aberta.
