# EVA Surgica

Landing page / web app statica per **EVA Surgica**.

## Struttura

```
.
├── index.html        # pagina principale
├── css/
│   ├── tokens.css    # design tokens (colori, spacing, tipografia)
│   ├── base.css      # reset e stili di base
│   ├── components.css # componenti UI
│   └── layout.css    # layout e griglie
├── js/
│   └── app.js        # logica e interazioni
└── assets/           # immagini, logo, animazioni (eva_knot, eva_blob, ...)
```

## Sviluppo locale

Essendo un sito statico, basta servire la cartella con un qualsiasi server statico:

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

oppure aprire direttamente `index.html` nel browser.
