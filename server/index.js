// server/index.js

// 1) Chargement des .env
if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
} else {
  require("dotenv").config();
}

// 2) Logger
require("./utils/logger")();

// 3) Récupération du préfixe (sans slash final)
const BASE = (process.env.BASE_URL || process.env.PUBLIC_URL || "/").replace(/\/+$/, "");

// 4) Imports génériques
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { reqBody } = require("./utils/http");
const { bootHTTP, bootSSL } = require("./utils/boot");

// 5) Imports point par point de chaque endpoint
const { systemEndpoints }           = require("./endpoints/system");
const { extensionEndpoints }        = require("./endpoints/extensions");
const { workspaceEndpoints }        = require("./endpoints/workspaces");
const { workspaceThreadEndpoints }  = require("./endpoints/workspaceThreads");
const { chatEndpoints }             = require("./endpoints/chat");
const { embedManagementEndpoints }  = require("./endpoints/embedManagement");
const { embeddedEndpoints }         = require("./endpoints/embed");
const { documentEndpoints }         = require("./endpoints/document");
const { utilEndpoints }             = require("./endpoints/utils");
const { developerEndpoints }        = require("./endpoints/api");           // attention : c’est un dossier avec index.js
const { adminEndpoints }            = require("./endpoints/admin");
const { inviteEndpoints }           = require("./endpoints/invite");
const { experimentalEndpoints }     = require("./endpoints/experimental");
const { browserExtensionEndpoints } = require("./endpoints/browserExtension");
const { communityHubEndpoints }     = require("./endpoints/communityHub");
const { agentFlowEndpoints }        = require("./endpoints/agentFlows");
const { mcpServersEndpoints }       = require("./endpoints/mcpServers");

// 6) Création de l’app Express
const app = express();
const apiRouter = express.Router();

// 7) Middlewares globaux
app.use(cors({ origin: true }));
app.use(bodyParser.text({ limit: "3GB" }));
app.use(bodyParser.json({ limit: "3GB" }));
app.use(bodyParser.urlencoded({ limit: "3GB", extended: true }));

// 8) WebSockets ou HTTPS
if (process.env.ENABLE_HTTPS) {
  bootSSL(app, process.env.SERVER_PORT || 3001);
} else {
  require("@mintplex-labs/express-ws").default(app);
}

// 9) Tous les endpoints REST sous `${BASE}/api`
app.use(`${BASE}/api`, apiRouter);
systemEndpoints(apiRouter);
extensionEndpoints(apiRouter);
workspaceEndpoints(apiRouter);
workspaceThreadEndpoints(apiRouter);
chatEndpoints(apiRouter);
adminEndpoints(apiRouter);
inviteEndpoints(apiRouter);
embedManagementEndpoints(apiRouter);
utilEndpoints(apiRouter);
documentEndpoints(apiRouter);
experimentalEndpoints(apiRouter);
browserExtensionEndpoints(apiRouter);
communityHubEndpoints(apiRouter);
agentFlowEndpoints(apiRouter);
mcpServersEndpoints(apiRouter);

// 10) Endpoints « embed » et « developer » (utilisent `app` + `apiRouter`)
embeddedEndpoints(apiRouter);
developerEndpoints(app, apiRouter);

// 11) En production, on sert la SPA derrière le même préfixe :
if (process.env.NODE_ENV !== "development") {
  const { MetaGenerator } = require("./utils/boot/MetaGenerator");
  const IndexPage = new MetaGenerator();

  // 11.a) tous les fichiers statiques (/index.js, /index.css, favicon…)  
  app.use(
    express.static(path.resolve(__dirname, "public"), {
      extensions: ["js"],
      setHeaders: (res) => {
        res.removeHeader("X-Powered-By");
        res.setHeader("X-Frame-Options", "DENY");
      },
    })
  );

  // 11.b) fallback SPA : toute URL `BASE/...` non /api renvoie index.html  
  app.get(`${BASE}/*`, (req, res) => {
    if (req.path.startsWith(`${BASE}/api/`)) {
      return res.sendStatus(404);
    }
    return IndexPage.generate(res);
  });

  // 11.c) robots.txt
  app.get(`${BASE}/robots.txt`, (_, res) => {
    res.type("text/plain").send("User-agent: *\nDisallow: /");
  });
}

// 12) Route de debug dev pour VectorDB
else {
  apiRouter.post("/v/:command", async (req, res) => {
    try {
      const VectorDb = require("./utils/helpers").getVectorDbClass();
      const { command } = req.params;
      if (!Object.hasOwnProperty.call(VectorDb, command)) {
        return res.status(500).json({
          message: "invalid interface command",
          commands: Object.getOwnPropertyNames(VectorDb),
        });
      }
      const body = reqBody(req);
      const result = await VectorDb[command](body);
      return res.status(200).json(result);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  });
}

// 13) Tout le reste fait 404
app.all("*", (_req, res) => res.sendStatus(404));

// 14) Démarrage HTTP si pas de TLS
if (!process.env.ENABLE_HTTPS) {
  bootHTTP(app, process.env.SERVER_PORT || 3001);
}
