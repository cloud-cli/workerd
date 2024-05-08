# workerd

A daemon to spawn and monitor workers

## Install

```sh
npm i -g @cloud-cli/workerd
```

> Make sure the global NPM folder is part of `$PATH`.

## Usage

Create a file called `workers.yml` in the current folder or in your user home folder:

```yaml
- name: my-worker
  run: node my-worker.js
  cwd: /home/node-workers
  restart: true
  restartInterval: 1000
  env:
    API_KEY: b7ad65b347d6bb7ad65b347d6b
    API_URL: https://example.com

- name: other-worker
  run: python3 worker.py
  cwd: /home/python3-workers
  restart: false
```

## Defaults

- `cwd`: the path from where workerd is executed
- `restart`: true
- `restartInterval`: 5 seconds

## Logs

Logs are written per worker, using worker's name.
Specify `SERVICE_LOGS_FOLDER` variable to change the path, default is `/tmp/workerd`.
