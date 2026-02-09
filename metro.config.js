const { getDefaultConfig } = require("expo/metro-config");
const fs = require("fs");
const path = require("path");

const config = getDefaultConfig(__dirname);

const originalMiddleware = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, metroServer) => {
    const enhanced = originalMiddleware
      ? originalMiddleware(metroMiddleware, metroServer)
      : metroMiddleware;

    return (req, res, next) => {
      const url = new URL(req.url, "http://localhost");

      if (url.pathname === "/client/index.bundle") {
        const platform = url.searchParams.get("platform");
        if (platform === "ios" || platform === "android") {
          const staticDir = path.resolve(__dirname, "static-build");
          if (fs.existsSync(staticDir)) {
            const entries = fs.readdirSync(staticDir).filter(e => {
              return !["ios", "android"].includes(e) && fs.statSync(path.join(staticDir, e)).isDirectory();
            });
            if (entries.length > 0) {
              const timestamp = entries.sort().pop();
              const bundlePath = path.join(staticDir, timestamp, "_expo", "static", "js", platform, "bundle.js");
              if (fs.existsSync(bundlePath)) {
                const bundle = fs.readFileSync(bundlePath);
                res.setHeader("content-type", "application/javascript");
                res.setHeader("content-length", bundle.length);
                res.end(bundle);
                return;
              }
            }
          }
        }
      }

      if (req.url && req.url.startsWith("/static-build/")) {
        const cleanPath = req.url.split("?")[0];
        const filePath = path.resolve(__dirname, cleanPath.slice(1));
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath);
          const ext = path.extname(filePath);
          const contentTypes = {
            ".js": "application/javascript",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
          };
          res.setHeader("content-type", contentTypes[ext] || "application/octet-stream");
          res.end(content);
          return;
        }
      }

      enhanced(req, res, next);
    };
  },
};

module.exports = config;
