// DevOps program, week 2 (Docker and Docker Compose): plain-English study notes for every topic of days 1 to 7.
// Same shape as src/data/studyNotes.ts. The topic strings must match the plan text word for word.
// Every link below was opened and answered with HTTP 200 on 2026-11-23.
import type { DayNotes, Link } from "../studyNotes";

const L = {
  kkDocker: { label: "Docker for the absolute beginner (KodeKloud course page)", url: "https://kodekloud.com/courses/docker-for-the-absolute-beginner/" },
  kkDca: { label: "Docker Certified Associate exam course (KodeKloud course page)", url: "https://kodekloud.com/courses/docker-certified-associate-exam-course/" },
  layers: { label: "Understanding image layers (Docker docs)", url: "https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/" },
  overlay: { label: "OverlayFS storage driver (Docker docs)", url: "https://docs.docker.com/engine/storage/drivers/overlayfs-driver/" },
  drivers: { label: "Storage drivers overview (Docker docs)", url: "https://docs.docker.com/engine/storage/drivers/" },
  cache: { label: "Build cache (Docker docs)", url: "https://docs.docker.com/build/cache/" },
  cacheOpt: { label: "Optimize cache usage in builds (Docker docs)", url: "https://docs.docker.com/build/cache/optimize/" },
  multi: { label: "Multi-stage builds (Docker docs)", url: "https://docs.docker.com/build/building/multi-stage/" },
  best: { label: "Building best practices (Docker docs)", url: "https://docs.docker.com/build/building/best-practices/" },
  alpine: { label: "About Alpine Linux (Alpine project)", url: "https://alpinelinux.org/about/" },
  distroless: { label: "Distroless container images (Google, README)", url: "https://github.com/GoogleContainerTools/distroless" },
  user: { label: "The USER instruction (Dockerfile reference, Docker docs)", url: "https://docs.docker.com/reference/dockerfile/#user" },
  owasp: { label: "Docker security cheat sheet (OWASP)", url: "https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html" },
  context: { label: "Build context and .dockerignore (Docker docs)", url: "https://docs.docker.com/build/concepts/context/#dockerignore-files" },
  net: { label: "Networking overview (Docker docs)", url: "https://docs.docker.com/engine/network/" },
  bridge: { label: "Bridge network driver (Docker docs)", url: "https://docs.docker.com/engine/network/drivers/bridge/" },
  host: { label: "Host network driver (Docker docs)", url: "https://docs.docker.com/engine/network/drivers/host/" },
  volumes: { label: "Volumes (Docker docs)", url: "https://docs.docker.com/engine/storage/volumes/" },
  security: { label: "Docker Engine security (Docker docs)", url: "https://docs.docker.com/engine/security/" },
  compose: { label: "Docker Compose overview (Docker docs)", url: "https://docs.docker.com/compose/" },
  composeFile: { label: "The Compose file reference (Docker docs)", url: "https://docs.docker.com/reference/compose-file/" },
  composeNet: { label: "Networking in Compose (Docker docs)", url: "https://docs.docker.com/compose/how-tos/networking/" },
  startup: { label: "Control startup and shutdown order in Compose (Docker docs)", url: "https://docs.docker.com/compose/how-tos/startup-order/" },
  healthcheck: { label: "The HEALTHCHECK instruction (Dockerfile reference, Docker docs)", url: "https://docs.docker.com/reference/dockerfile/#healthcheck" },
  envPrec: { label: "Environment variable precedence in Compose (Docker docs)", url: "https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/" },
  envSet: { label: "Ways to set environment variables in Compose (Docker docs)", url: "https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/" },
  composeStart: { label: "Get started with Compose (Docker docs)", url: "https://docs.docker.com/compose/gettingstarted/" },
  nginxBegin: { label: "Beginner's guide (nginx.org)", url: "https://nginx.org/en/docs/beginners_guide.html" },
  nginxProxy: { label: "The proxy module and proxy_pass (nginx.org)", url: "https://nginx.org/en/docs/http/ngx_http_proxy_module.html" },
  redis: { label: "Redis documentation (redis.io)", url: "https://redis.io/docs/latest/" },
  redisStart: { label: "Get started with Redis (redis.io)", url: "https://redis.io/docs/latest/develop/get-started/" },
} satisfies Record<string, Link>;

export const W2: DayNotes[] = [
  {
    day: 1,
    intro:
      "Docker packages an application and everything it needs into an image, then runs that image as an isolated container. Today is about how an image is built from stacked layers, because that one idea explains why builds are fast or slow and why images are big or small.",
    notes: [
      {
        topic: "Docker course for the absolute beginner: containers, images and the hands-on labs",
        plain:
          "This KodeKloud course teaches containers from zero: what a container is, how images work, and the everyday commands, with a browser lab after each lesson so you type the commands yourself. It is worth doing because the whole of Docker, Compose and Kubernetes later in the plan rests on these basics.",
        example:
          "In the labs you run `docker run -d -p 8080:80 nginx`, open the page, then `docker ps` and `docker stop` to see the full life of a container.",
        links: [L.kkDocker, L.layers],
      },
      {
        topic: "Union filesystems",
        plain:
          "A union filesystem shows several read-only folders stacked on top of each other as if they were one folder, and Docker uses this for image layers. A container adds one thin writable layer on top, so many containers can share the same image layers on disk without copying them.",
        example:
          "Start two containers from the same 200 MB image and the disk only holds that image once, plus a tiny writable layer for each container.",
        links: [L.overlay, L.drivers],
      },
      {
        topic: "Image layer caching optimization",
        plain:
          "Every Dockerfile instruction makes a layer, and Docker reuses a layer from the last build if that instruction and everything above it is unchanged. Once one layer changes, every layer after it is rebuilt, so the order of instructions decides how fast your builds are.",
        example:
          "Copy `package.json` and run `npm ci` first, then copy the source code. Editing your code then reuses the cached install step instead of downloading every package again.",
        links: [L.cacheOpt, L.cache],
      },
    ],
  },
  {
    day: 2,
    intro:
      "A Dockerfile that works on your laptop is not yet fit for production. Today covers four habits that make images smaller, safer and quicker to build: multi-stage builds, minimal base images, a non-root user and a .dockerignore file.",
    notes: [
      {
        topic: "Multi-stage builds",
        plain:
          "A multi-stage build uses several FROM lines in one Dockerfile: an early stage with compilers and build tools, and a final stage that copies in only the finished program. The final image is much smaller and has fewer tools an attacker could use.",
        example:
          "Build a Go program in a `golang` stage, then use `COPY --from=build /app/server /server` in a final stage based on a tiny image.",
        links: [L.multi, L.best],
      },
      {
        topic: "Minimal base images (Alpine or Distroless)",
        plain:
          "The base image is the starting point of your image, and a smaller one means less to download and less that can have security holes. Alpine is a tiny Linux with a shell and a package manager, while distroless images hold only your app and its runtime, with no shell at all.",
        example:
          "Switching `FROM node:22` to `FROM node:22-alpine` can cut an image from about 1 GB to a few hundred MB.",
        links: [L.alpine, L.distroless],
      },
      {
        topic: "Running as a non-root user",
        plain:
          "By default a process in a container runs as root, the all-powerful user, so a bug in your app gives an attacker far more reach than it should. A Dockerfile can create an ordinary user and switch to it, so the app runs with only the rights it needs.",
        example:
          "Add `RUN adduser -D appuser` and then `USER appuser` before the `CMD` line, and `docker exec` into the container to check that `whoami` prints appuser.",
        links: [L.user, L.owasp],
      },
      {
        topic: "The .dockerignore file",
        plain:
          "When you build, Docker sends the whole project folder (the build context) to the builder. A `.dockerignore` file lists what to leave out, such as `.git`, `node_modules` and secret files, which makes builds faster and keeps secrets out of the image.",
        example:
          "A `.dockerignore` containing `.git`, `node_modules` and `.env` stops a `COPY . .` from dragging your local dependencies and passwords into the image.",
        links: [L.context, L.best],
      },
    ],
  },
  {
    day: 3,
    intro:
      "Containers are throwaway by design, so two questions come up fast: how do they talk to each other, and where does data live when a container is deleted? Today covers Docker networks, volumes and the storage drivers that sit under it all.",
    notes: [
      {
        topic: "Bridge and host container networking",
        plain:
          "The bridge network is the default: containers get private addresses on a virtual network inside the machine and reach the outside through published ports. The host network removes that wall and lets the container use the machine's own network directly, which is faster but gives up isolation.",
        example:
          "`docker run -p 8080:80 nginx` publishes container port 80 on the bridge as port 8080 on your machine, while `docker run --network host nginx` listens on the machine's port 80 directly.",
        links: [L.bridge, L.host, L.net],
      },
      {
        topic: "Volume persistence",
        plain:
          "Anything a container writes to its own filesystem disappears when the container is removed. A volume is storage managed by Docker that lives outside the container, so a database keeps its data across restarts and upgrades.",
        example:
          "`docker run -v pgdata:/var/lib/postgresql/data postgres` keeps the database files in the volume `pgdata`, so removing and recreating the container loses nothing.",
        links: [L.volumes],
      },
      {
        topic: "Storage drivers (DCA labs)",
        plain:
          "The storage driver is the part of Docker that stacks image layers and manages the writable layer of each container, and overlay2 is the usual choice on Linux. The Docker Certified Associate (DCA) labs on KodeKloud let you inspect the driver in use and practise storage tasks in a real environment.",
        example:
          "Run `docker info` and read the Storage Driver line, which normally says overlay2.",
        links: [L.kkDca, L.drivers, L.overlay],
      },
    ],
  },
  {
    day: 4,
    intro:
      "Today is hands-on practice with the two things that most separate a beginner image from a production one: size and security. The KodeKloud Docker Certified Associate (DCA) labs give you a real machine to try each idea on.",
    notes: [
      {
        topic: "Multi-stage builds and image optimization (DCA labs)",
        plain:
          "These labs have you shrink real images by using multi-stage builds, smaller base images and a tidy layer order, then compare the sizes. Doing it yourself shows how much a careless Dockerfile wastes, which affects pull time, storage cost and attack surface.",
        example:
          "Build the same app twice, once in a single stage and once in two, then compare with `docker images` to see the size drop.",
        links: [L.kkDca, L.multi, L.best],
      },
      {
        topic: "Container security (DCA labs)",
        plain:
          "These labs cover the basics of locking containers down: running as a non-root user, dropping extra Linux capabilities (special powers the kernel hands to root), read-only filesystems and limits on memory and CPU. They matter because a container shares the host's kernel, so a weak setup can put the whole machine at risk.",
        example:
          "Run `docker run --read-only --cap-drop ALL --user 1000 myapp` and see which parts of the app break, then add back only what it truly needs.",
        links: [L.kkDca, L.security, L.owasp],
      },
    ],
  },
  {
    day: 5,
    intro:
      "Real applications are rarely one container. Docker Compose lets you describe a whole stack in one YAML file and start it with one command, with the containers able to find each other by name.",
    notes: [
      {
        topic: "Declarative multi-container stack composition (docker-compose.yml)",
        plain:
          "A Compose file lists your services (containers), their images, ports, volumes and settings in YAML, which is a simple indented text format. You say what you want, and `docker compose up` creates it, so the whole stack is repeatable and can be kept in Git.",
        example:
          "A file with a `web` service and a `db` service starts both with `docker compose up -d` and stops and removes both with `docker compose down`.",
        links: [L.compose, L.composeFile, L.composeStart],
      },
      {
        topic: "Internal DNS service discovery between containers",
        plain:
          "Compose puts all the services of a stack on one private network and gives each service a name that works as a hostname. Your app connects to `db` rather than to an IP address that changes every time the container restarts.",
        example:
          "Set the app's database address to `postgres://db:5432/app` and it reaches the container of the service called `db`.",
        links: [L.composeNet, L.net],
      },
      {
        topic: "The Compose labs from the Docker beginner course",
        plain:
          "The labs at the end of the KodeKloud Docker beginner course have you write and run Compose files for small multi-container apps. They are worth doing because typing the YAML yourself is the quickest way to learn how services, networks and volumes fit together.",
        example:
          "In a typical lab you wire a voting web page to a Redis store and a database in one file, then bring it all up with a single command.",
        links: [L.kkDocker, L.compose],
      },
    ],
  },
  {
    day: 6,
    intro:
      "A database container that has started is not necessarily ready to accept connections, and one wrong guess brings the app down. Today covers health checks, which let Compose wait for real readiness, and how configuration values reach your containers.",
    notes: [
      {
        topic: "Dependency chains with runtime health checks (depends_on with condition: service_healthy)",
        plain:
          "A health check is a small command Docker runs again and again to ask whether a service is truly working. With `depends_on` and `condition: service_healthy`, Compose starts a service only after the one it needs reports healthy, instead of just started.",
        example:
          "Give `db` the check `pg_isready -U postgres`, then make `api` depend on `db` with `condition: service_healthy` so the API never starts before the database accepts connections.",
        links: [L.startup, L.healthcheck, L.composeFile],
      },
      {
        topic: "Environment variable injection hierarchy",
        plain:
          "Compose can take values from several places: the shell, an `.env` file, an `env_file`, and the `environment` key, and when the same name is set twice a fixed order decides which wins. Knowing that order saves you from the confusing case where a value you edited has no effect.",
        example:
          "If `DB_HOST=db` is in `.env` but you run `DB_HOST=other docker compose up`, the value from your shell wins.",
        links: [L.envPrec, L.envSet],
      },
    ],
  },
  {
    day: 7,
    intro:
      "The week 2 milestone puts everything together: a four-part stack with a web frontend, an API, a database and a cache, each with a lean image, behind one reverse proxy. If you can build and explain this, you have the working core of Docker.",
    notes: [
      {
        topic: "Multi-tier architecture: frontend, API server, relational database and Redis cache",
        plain:
          "A multi-tier app splits the work into layers: a frontend the user sees, an API that holds the logic, a relational database (tables with rows) for lasting data, and Redis, a fast in-memory store, as a cache for data that is read often. Each tier runs in its own container, so you can change or scale one without touching the rest.",
        example:
          "The API checks Redis for a product first, and only if it is missing does it query the database and save the answer in Redis for next time.",
        links: [L.composeStart, L.redisStart, L.redis],
      },
      {
        topic: "Optimized multi-stage Dockerfiles for every tier",
        plain:
          "Each tier gets its own Dockerfile that builds in one stage and ships only the result in a small final stage, with a non-root user and a good layer order. This keeps all four images small and quick to rebuild, and it applies the week's habits in one place.",
        example:
          "The frontend builds static files in a `node` stage and the final stage is an `nginx:alpine` image holding only those files.",
        links: [L.multi, L.best, L.cacheOpt],
      },
      {
        topic: "NGINX reverse proxy in front of the stack with Docker Compose",
        plain:
          "A reverse proxy is a server that receives all outside requests and passes each to the right service behind it. NGINX in front gives you one public port and keeps the API and the database private on the internal network.",
        example:
          "In `nginx.conf`, `location /api/ { proxy_pass http://api:3000; }` sends every path that starts with /api/ to the `api` service by its Compose name.",
        links: [L.nginxBegin, L.nginxProxy, L.composeNet],
      },
      {
        topic: "Explicit service dependency health checks and persistent storage volumes",
        plain:
          "Each service declares a health check and the services that need it wait with `condition: service_healthy`, so the stack starts in a safe order every time. Named volumes keep the database and the Redis data across restarts so a `docker compose down` does not wipe your work.",
        example:
          "Add `volumes: [pgdata:/var/lib/postgresql/data]` to the database and a `pg_isready` health check, then confirm the data survives `docker compose down` and `up` again.",
        links: [L.startup, L.volumes, L.healthcheck],
      },
    ],
  },
];
