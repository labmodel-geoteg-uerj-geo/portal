# Pacote Mestre — IDE LABMODEL / GEOTEG / UERJ

Este arquivo organiza toda a estrutura consolidada da IDE Geoespacial em padrão INDE/OGC.

## Estrutura de Pastas

- `docs/`
  - `IDE_LABMODEL_UERJ_Manual_Completo.docx` — Manual técnico completo formatado em Word (leitura, impressão, anexo acadêmico e arquivo institucional).
  - `ARQUITETURA_E_REPRODUTIBILIDADE_IDE.md` — Versão Markdown pronta para o GitHub e Zenodo.
- `portal/`
  - `mapa.html` — Visualizador oficial no **padrão INDE/OGC** (WMS + cursor `crosshair` + `GetFeatureInfo` sob demanda, sem WFS pesado).
  - `mapa_wfs_dinamico_referencia.html` — Versão salva como referência técnica com WFS dinâmico (`paneInterativo`, realce azul no *hover*).
  - `catalogo.html` — Catálogo institucional de metadados (sem emojis, com fallback Modo Econômico).
  - `submissao.html` — Formulário de submissão de dados e metadados ABNT (compatível com `/upload` e `/api/upload`).
- `scripts/`
  - `sync-portal-github.sh` — Sincronização automática GitHub -> VPS (`/var/www/ide`) a cada 2 minutos.
  - `sync-catalogo-json.sh` — Exportação automática de `/api/catalogo` para `/var/www/ide/public/js/catalogo.json`.
  - `gerar-backup-e-kit-ide.sh` — Gera simultaneamente o **Backup Privado** (`/root/backups/`) e o **Kit Público Sanitizado** (`/var/www/ide/public/downloads/`).
  - `fix-geoserver-global-xml.sh` — Corrige `<charset>UTF-8</charset>` e `<numDecimals>8</numDecimals>` no GeoServer.
  - `install.sh` — Instalador parametrizado para reprodução em novas VPS ou PCs locais.
- `templates/`
  - `.env.example` — Variáveis configuráveis sem senhas reais.
  - `docker-compose.template.yml` — Stack PostGIS + GeoServer + Pygeoapi + Pycsw.
  - `nginx.conf.template` — Configuração consolidada do proxy reverso Nginx HTTPS + CORS + 500M.

## Onde guardar cada parte
1. **GitHub (`labmodel-geoteg-uerj-geo/portal`):** Suba `docs/ARQUITETURA_E_REPRODUTIBILIDADE_IDE.md`, `portal/` (renomeando para `public/`), `scripts/` e `templates/`.
2. **Google Drive / HD Local:** Guarde este ZIP completo + o arquivo privado `backup_privado_ide_*.tar.gz` baixado da VPS via `scp`.
3. **Zenodo (Ciência Aberta):** Conecte o repositório GitHub para emitir DOI a cada Release pública (sempre sem senhas ou backups privados).
