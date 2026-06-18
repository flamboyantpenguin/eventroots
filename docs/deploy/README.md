# Deploying EventRoots on your Server

## The Docker way

EventRoots is currently developed as two modules - persona and soul. Persona is the React JavaScript powered frontend and Soul is the Python FastAPI powered backend. Thus, you need to run both of these as seperate containers along with the database and optionally a redis container for hosting EventRoots on your server.

### Compose

We provide a sample compose config that allows you to startup the application instantly. Copy [the compose config](https://github.com/flamboyantpenguin/eventroots/tree/master/docs/deploy/docker-compose.yaml) and the [env sample](https://github.com/flamboyantpenguin/eventroots/tree/master/docs/deploy/.env.example) to your server. Change the volume mounts and environment variables according to your needs. Then run docker compose to spin up eventroots.

```bash
docker compose up
```

### Quadlets

Quadlets are the best way to run the application on a systemd powered server. Quadlets convert the conf to systemd units. This allows you to manage the containers in a pod and handle logs and operation via systemd.

Copy the files under [quadlets](https://github.com/flamboyantpenguin/eventroots/tree/master/docs/deploy/quadlets) to `$HOME/.config/containers/systemd/eventroots` and reload systemd to startup the containers.

```bash
systemctl --user daemon-reload
```
