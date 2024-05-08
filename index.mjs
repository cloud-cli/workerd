#!/usr/bin/env node

import * as Yaml from "js-yaml";
import { exec } from "node:child_process";
import { join } from "node:path";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";

const loadYaml = Yaml.default.load;
const logsFolder = process.env.SERVICE_LOGS_FOLDER || "/tmp/workerd";
const restartInterval = Number(process.env.RESTART_INTERVAL || 5000);
const servicesLog = createLogStream(join(logsFolder, "services.log"));

function startService(service) {
  if (!(service.name || service.run)) {
    servicesLog.write(`[ERROR] Invalid service: ${JSON.stringify(service)}`);
    return;
  }

  servicesLog.write(`[START] ${service.name || service.run}\n`);
  const env = { ...process.env, ...(service.env || {}) };
  const ps = exec(service.run, {
    cwd: service.cwd || process.cwd(),
    env,
  });

  const logs = createLogStream(
    join(logsFolder, service.name + "." + ps.pid + ".log")
  );

  ps.stdout.pipe(logs);
  ps.stderr.pipe(logs);

  ps.on("exit", (code) => {
    logs.write(`[EXIT] ${code}`);

    if (service.restart !== false) {
      const interval = service.restartInterval || restartInterval;
      setTimeout(() => startService(service), interval);
    }
  });
}

function createLogStream(file) {
  const log = createWriteStream(file, { flags: "a" });
  const write = log.write;

  log.write = (chunk, ...args) =>
    log.writable &&
    write.apply(log, [
      String(chunk)
        .split("\n")
        .map((line) =>
          line ? `[${new Date().toISOString().slice(0, 19)}] ${line}` : ""
        )
        .join("\n"),
      ...args,
    ]);

  return log;
}

function loadServices() {
  const candidates = [
    join(process.cwd(), "services.yml"),
    join(process.env.HOME || "", "services.yml"),
  ];

  for (const file of candidates) {
    if (existsSync(file)) {
      const list = loadYaml(readFileSync(file, "utf8")).services;

      if (!Array.isArray(list)) {
        throw new Error(
          `Invalid format in ${file}, expected an array. See documentation.`
        );
      }

      return list;
    }
  }

  return [];
}

function start() {
  const services = loadServices();

  mkdirSync(join(logsFolder), { recursive: true });

  for (const s of services) {
    startService(s);
  }
}

start();
