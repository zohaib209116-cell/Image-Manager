import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import path from "path";
import pino from "esbuild-plugin-pino";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const externalPackages = [
  // Node.js built-ins
  "module",
  "path",
  "fs",
  "os",
  "net",
  "stream",
  "crypto",
  "zlib",
  "events",
  "util",
  "buffer",
  "assert",
  "url",
  "http",
  "https",
  "querystring",
  "perf_hooks",
  "worker_threads",
  "string_decoder",
  "timers",
  // Workspace packages
  "@workspace/api-zod",
  "@workspace/db",
  // Core dependencies (native modules)
  "pg",
  "pino",
  "pino-http",
  "express",
  "cors",
  "cookie-parser",
  "drizzle-orm",
  // Platform-specific externals
  "better-sqlite3",
  "sqlite3",
  "canvas",
  "bcrypt",
  "argon2",
  "fsevents",
  "re2",
  "farmhash",
  "xxhash-addon",
  "bufferutil",
  "utf-8-validate",
  "ssh2",
  "cpu-features",
  "dtrace-provider",
  "isolated-vm",
  "lightningcss",
  "pg-native",
  "oracledb",
  "mongodb-client-encryption",
  "nodemailer",
  "handlebars",
  "knex",
  "typeorm",
  "protobufjs",
  "onnxruntime-node",
  "@tensorflow/*",
  "@prisma/client",
  "@mikro-orm/*",
  "@grpc/*",
  "@swc/*",
  "@aws-sdk/*",
  "@azure/*",
  "@opentelemetry/*",
  "@google-cloud/*",
  "@google/*",
  "googleapis",
  "@parcel/watcher",
  "@sentry/profiling-node",
  "@tree-sitter/*",
  "aws-sdk",
  "classic-level",
  "dd-trace",
  "ffi-napi",
  "grpc",
  "hiredis",
  "kerberos",
  "leveldown",
  "miniflare",
  "mysql2",
  "newrelic",
  "odbc",
  "piscina",
  "realm",
  "ref-napi",
  "rocksdb",
  "sass-embedded",
  "sequelize",
  "serialport",
  "snappy",
  "tinypool",
  "usb",
  "workerd",
  "wrangler",
  "zeromq",
  "zeromq-prebuilt",
  "playwright",
  "puppeteer",
  "puppeteer-core",
  "electron",
];

const options = {
  entryPoints: [path.resolve(__dirname, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node24",
  outfile: path.resolve(__dirname, "dist/index.mjs"),
  external: externalPackages,
  sourcemap: "linked",
  plugins: [
    // pino relies on workers to handle logging, instead of externalizing it we use a plugin to handle it
    pino({ transports: ["pino-pretty", "pino/file"] }),
  ],
};

try {
  await esbuild.build(options);
  console.log("✅ Build completed successfully");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}
