const { getDefaultConfig } = require("expo/metro-config");
const http = require("http");
const fs = require("fs");
const path = require("path");

const config = getDefaultConfig(__dirname);

const originalCreateServer = http.createServer;

http.createServer = function (...args) {
  const server = originalCreateServer.apply(this, args);

  const originalListeners = server.listeners("request").slice();

  server.removeAllListeners("request");

  server.on("request", (req, res) => {
    const platform = req.headers["expo-platform"];
    if (
      platform &&
      (platform === "ios" || platform === "android") &&
      (req.url === "/" || req.url === "/manifest")
    ) {
      const manifestPath = path.resolve(
        __dirname,
        "static-build",
        platform,
        "manifest.json"
      );
      if (fs.existsSync(manifestPath)) {
        res.writeHead(200, {
          "expo-protocol-version": "1",
          "expo-sfv-version": "0",
          "content-type": "application/json",
        });
        res.end(fs.readFileSync(manifestPath, "utf-8"));
        return;
      }
    }

    const urlPath = (req.url || "").split("?")[0];

    const staticBuildDir = path.resolve(__dirname, "static-build");
    const candidatePath = path.resolve(staticBuildDir, urlPath.slice(1));
    if (
      candidatePath.startsWith(staticBuildDir) &&
      fs.existsSync(candidatePath) &&
      fs.statSync(candidatePath).isFile()
    ) {
      const ext = path.extname(candidatePath);
      const types = {
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".ttf": "font/ttf",
        ".otf": "font/otf",
      };
      res.writeHead(200, {
        "content-type": types[ext] || "application/octet-stream",
      });
      fs.createReadStream(candidatePath).pipe(res);
      return;
    }

    for (const listener of originalListeners) {
      listener.call(server, req, res);
    }
  });

  http.createServer = originalCreateServer;

  return server;
};

module.exports = config;
