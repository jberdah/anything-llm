/**
 * @typedef MetaTagDefinition
 * @property {('link'|'meta'|'title')} tag - le type d’élément
 * @property {{string:string}|null} props - les attributs du tag
 * @property {string|null} content - contenu entre les balises (null = self-closing)
 */

/**
 * Génère à la volée le HTML de l’index en production, avec SSR des meta-tags.
 */
class MetaGenerator {
  name = "MetaGenerator";

  /** @type {MetaGenerator|null} */
  static _instance = null;

  /** @type {MetaTagDefinition[]|null} */
  #customConfig = null;

  constructor() {
    if (MetaGenerator._instance) return MetaGenerator._instance;
    MetaGenerator._instance = this;

    // on récupère le préfixe fourni par l’env (ex. "/anythingllm")
    const raw = process.env.BASE_URL || process.env.PUBLIC_URL || "/";
    // on s’assure d’un slash final
    this.base = raw.endsWith("/") ? raw : raw + "/";
  }

  #log(text, ...args) {
    console.log(`\x1b[36m[${this.name}]\x1b[0m ${text}`, ...args);
  }

  #defaultMeta() {
    return [
      { tag: "link", props: { type: "image/svg+xml", href: `${this.base}favicon.png` }, content: null },
      { tag: "title", props: null, content: "AnythingLLM | Your personal LLM trained on anything" },
      { tag: "meta", props: { name: "title", content: "AnythingLLM | Your personal LLM trained on anything" }, content: null },
      { tag: "meta", props: { name: "description", content: "AnythingLLM | Your personal LLM trained on anything" }, content: null },
      // etc. tu peux adapter tous les lien/og/twitter pour préfixer par this.base si besoin
    ];
  }

  async #fetchConfg() {
    this.#log(`fetching custom meta tag settings...`);
    const { SystemSettings } = require("../../models/systemSettings");
    const customTitle   = await SystemSettings.getValueOrFallback({ label: "meta_page_title" }, null);
    const faviconURL    = await SystemSettings.getValueOrFallback({ label: "meta_page_favicon" }, null);

    if (customTitle === null && faviconURL === null) {
      this.#customConfig = this.#defaultMeta();
    } else {
      this.#customConfig = [
        { tag: "link", props: { rel: "icon", href: faviconURL ?? `${this.base}favicon.png` }, content: null },
        { tag: "title", props: null, content: customTitle ?? "AnythingLLM | Your personal LLM trained on anything" },
      ];
    }
    return this.#customConfig;
  }

  #assembleMeta() {
    return this.#customConfig.map(tag => {
      let attrs = "";
      if (tag.props) {
        for (const [k,v] of Object.entries(tag.props)) {
          attrs += ` ${k}="${v}"`;
        }
      }
      if (tag.content != null) {
        return `<${tag.tag}${attrs}>${tag.content}</${tag.tag}>`;
      } else {
        return `<${tag.tag}${attrs} />`;
      }
    }).join("\n");
  }

  /**
   * Vide la config pour forcer un rechargement
   */
  clearConfig() {
    this.#customConfig = null;
  }

  /**
   * Génère et envoie le HTML de la page.
   * @param {import('express').Response} response
   * @param {number} code
   */
  async generate(response, code = 200) {
    if (this.#customConfig === null) {
      await this.#fetchConfg();
    }

    // on assemble enfin la page
    response.status(code).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <base href="${this.base}" />
  ${this.#assembleMeta()}
  <script type="module" crossorigin src="${this.base}index.js"></script>
  <link rel="stylesheet" href="${this.base}index.css" />
</head>
<body>
  <div id="root" class="h-screen"></div>
</body>
</html>`);
  }
}

module.exports.MetaGenerator = MetaGenerator;
