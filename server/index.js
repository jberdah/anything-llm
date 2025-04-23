// server/index.js

// Chargement des variables d'environnement
if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
} else {
  require("dotenv").config();
}

// Initialisation du logger
require("./utils/logger")();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { reqBody } = require("./utils/http");

// Import des endpoints
const {
  systemEndpoints,
  workspaceEndpoints,
  chatEndpoints,
  embeddedEndpoints,
  embedManagementEndpoints,
  adminEndpoints,
  inviteEndpoints,
  utilEndpoints,
  developerEndpoints,
  extensionEndpoints,
  workspaceThreadEndpoints,
  documentEndpoints,
  experimentalEndpoints,
  browserExtensionEndpoints,
  communityHubEndpoints,
  agentFlowEndpoints,
  mcpServersEndpoints,
} = require("./endpoints");

// Bootstrap HTTPS/HTTP
const { bootHTTP, bootSSL } = require("./utils/boot");

const app = express();
const apiRouter = express.Router();
const FILE_LIMIT = "3GB";

// Middlewares globaux
app.use(cors({ origin: true }));
app.use(bodyParser.text({ limit: FILE_LIMIT }));
app.use(bodyParser.json({ limit: FILE_LIMIT }));
app.use(
  bodyParser.urlencoded({
    limit: FILE_LIMIT,
    extended: true,
  })
);

// WebSockets ou HTTPS
if (process.env.ENABLE_HTTPS) {
  bootSSL(app, process.env.SERVER_PORT || 3001);
} else {
  require("@mintplex-labs/express-ws").default(app);
}

// Montage des routes API
app.use("/api", apiRouter);
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

// Externally facing embedder endpoints
embeddedEndpoints(apiRouter);

// Developer API
developerEndpoints(app, apiRouter);

// En production (pas en dev), on sert le front
if (process.env.NODE_ENV !== "development") {
  const { MetaGenerator } = require("./utils/boot/MetaGenerator");
  const IndexPage = new MetaGenerator();

  // Sert tous les fichiers static (JS, CSS, images…) à la racine
  app.use(
    express.static(path.resolve(__dirname, "public"), {
      extensions: ["js"],
      setHeaders: (res) => {
        // Désactive l'i-framing et le header X-Powered-By
        res.removeHeader("X-Powered-By");
        res.setHeader("X-Frame-Options", "DENY");
      },
    })
  );

  // Fallback SPA : toutes les routes non-API redirigent vers index.html
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      // on laisse les 404 pour les APIs invalides
      return res.sendStatus(404);
    }
    return IndexPage.generate(res);
  });

  // robots.txt à la racine
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nDisallow: /").end();
  });
} else {
  // Debug route en développement pour VectorDB
  apiRouter.post("/v/:command", async (request, response) => {
    try {
      const VectorDb = require("./utils/helpers").getVectorDbClass();
      const { command } = request.params;
      if (!Object.getOwnPropertyNames(VectorDb).includes(command)) {
        return response.status(500).json({
          message: "invalid interface command",
          commands: Object.getOwnPropertyNames(VectorDb),
        });
      }
      const body = reqBody(request);
      const resBody = await VectorDb[command](body);
      response.status(200).json(resBody);
    } catch (e) {
      console.error(e);
      response.status(500).json({ error: e.message });
    }
  });
}

// Toutes les autres routes hors /api/* renvoient 404
app.all("*", (req, res) => {
  res.sendStatus(404);
});

// Démarrage du serveur HTTP si HTTPS n'est pas activé
if (!process.env.ENABLE_HTTPS) {
  bootHTTP(app, process.env.SERVER_PORT || 3001);
}
