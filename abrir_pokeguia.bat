@echo off
rem Abre PokéGuía como app: arranca un servidor local (necesario para instalarla y usarla sin conexión) y abre el navegador.
cd /d "%~dp0"
start "" http://localhost:8765/index.html
python -m http.server 8765 --bind 127.0.0.1
