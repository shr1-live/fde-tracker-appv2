// DevOps study notes, weeks 4 and 5: Kubernetes, Helm and the capstone.
// Every link below was opened and answered with HTTP 200 on 2026-11-23.
import type { DayNotes, Link } from "../studyNotes";

const L = {
  k8sComponents: { label: "Kubernetes components (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/overview/components/" },
  k8sNodes: { label: "Nodes (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/architecture/nodes/" },
  k8sBasics: { label: "Learn Kubernetes basics, interactive tutorial (Kubernetes docs)", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/" },
  k8sPods: { label: "Pods (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/workloads/pods/" },
  k8sPodLife: { label: "Pod lifecycle (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/" },
  k8sDeploy: { label: "Deployments (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/" },
  k8sSts: { label: "StatefulSets (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/" },
  k8sDs: { label: "DaemonSet (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/" },
  k8sJob: { label: "Jobs (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/workloads/controllers/job/" },
  kubectlRef: { label: "kubectl quick reference (Kubernetes docs)", url: "https://kubernetes.io/docs/reference/kubectl/quick-reference/" },
  kkBeginners: { label: "Kubernetes for the Absolute Beginners (KodeKloud course)", url: "https://kodekloud.com/courses/kubernetes-for-the-absolute-beginners-hands-on-tutorial/" },
  kkCkad: { label: "Certified Kubernetes Application Developer, CKAD (KodeKloud course)", url: "https://kodekloud.com/courses/certified-kubernetes-application-developer-ckad/" },
  kkCka: { label: "Certified Kubernetes Administrator, CKA (KodeKloud course)", url: "https://kodekloud.com/courses/certified-kubernetes-administrator-cka/" },
  kkHelm: { label: "Helm for the Absolute Beginners (KodeKloud course)", url: "https://kodekloud.com/courses/helm-for-beginners/" },
  k8sConfigMap: { label: "ConfigMaps (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/configuration/configmap/" },
  k8sSecret: { label: "Secrets (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/configuration/secret/" },
  k8sService: { label: "Service (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/services-networking/service/" },
  k8sIngress: { label: "Ingress (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/services-networking/ingress/" },
  k8sIngressCtl: { label: "Ingress controllers (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/" },
  ingressNginx: { label: "ingress-nginx user guide (Kubernetes project)", url: "https://kubernetes.github.io/ingress-nginx/" },
  ingressNginxDeploy: { label: "Installing ingress-nginx, including with Helm (Kubernetes project)", url: "https://kubernetes.github.io/ingress-nginx/deploy/" },
  k8sPv: { label: "Persistent volumes and claims (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/storage/persistent-volumes/" },
  k8sSc: { label: "Storage classes (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/storage/storage-classes/" },
  k8sNetpol: { label: "Network policies (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/services-networking/network-policies/" },
  k8sHpa: { label: "Horizontal Pod Autoscaling (Kubernetes docs)", url: "https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/" },
  k8sHpaWalk: { label: "Horizontal Pod Autoscaler walkthrough (Kubernetes docs)", url: "https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/" },
  k8sResources: { label: "Resource management for pods and containers (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/" },
  k8sProbes: { label: "Configure liveness, readiness and startup probes (Kubernetes docs)", url: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/" },
  k8sDebugPods: { label: "Debug Pods (Kubernetes docs)", url: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/" },
  k8sDebugRunning: { label: "Debug running Pods, including kubectl debug (Kubernetes docs)", url: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/" },
  k8sDebugCluster: { label: "Troubleshooting clusters (Kubernetes docs)", url: "https://kubernetes.io/docs/tasks/debug/debug-cluster/" },
  k8sImages: { label: "Images and pull policy (Kubernetes docs)", url: "https://kubernetes.io/docs/concepts/containers/images/" },
  k8sPullPrivate: { label: "Pull an image from a private registry (Kubernetes docs)", url: "https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/" },
  helmCharts: { label: "Charts: structure and files (Helm docs)", url: "https://helm.sh/docs/topics/charts/" },
  helmCreate: { label: "helm create (Helm docs)", url: "https://helm.sh/docs/helm/helm_create/" },
  helmStart: { label: "Getting started with a chart template (Helm docs)", url: "https://helm.sh/docs/chart_template_guide/getting_started/" },
  helmFunctions: { label: "Template functions and pipelines (Helm docs)", url: "https://helm.sh/docs/chart_template_guide/functions_and_pipelines/" },
  helmValues: { label: "Values files (Helm docs)", url: "https://helm.sh/docs/chart_template_guide/values_files/" },
  helmValuesPractice: { label: "Best practices for values (Helm docs)", url: "https://helm.sh/docs/chart_best_practices/values/" },
  helmUsing: { label: "Using Helm: install, upgrade, rollback (Helm docs)", url: "https://helm.sh/docs/intro/using_helm/" },
  helmInstall: { label: "helm install (Helm docs)", url: "https://helm.sh/docs/helm/helm_install/" },
  helmUpgrade: { label: "helm upgrade (Helm docs)", url: "https://helm.sh/docs/helm/helm_upgrade/" },
  helmRollback: { label: "helm rollback (Helm docs)", url: "https://helm.sh/docs/helm/helm_rollback/" },
  helmLint: { label: "helm lint (Helm docs)", url: "https://helm.sh/docs/helm/helm_lint/" },
  certMgr: { label: "cert-manager documentation", url: "https://cert-manager.io/docs/" },
  certMgrHelm: { label: "Installing cert-manager with Helm (cert-manager docs)", url: "https://cert-manager.io/docs/installation/helm/" },
  eksStart: { label: "Get started with Amazon EKS (AWS docs)", url: "https://docs.aws.amazon.com/eks/latest/userguide/getting-started.html" },
  aksStart: { label: "Deploy an Azure Kubernetes Service cluster with the Azure CLI (Microsoft docs)", url: "https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-cli" },
  ghaIntro: { label: "Understanding GitHub Actions (GitHub docs)", url: "https://docs.github.com/en/actions/get-started/understand-github-actions" },
  ghaSecrets: { label: "Using secrets in GitHub Actions (GitHub docs)", url: "https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions" },
} satisfies Record<string, Link>;

export const W4: DayNotes[] = [
  {
    day: 1,
    intro: "Kubernetes is a system that runs your containers across many machines and keeps them running. Today is the map: which parts make decisions, which parts run your code, and the handful of object types you will use all the time. Knowing this makes every later error message easier to read.",
    notes: [
      { topic: "Control plane vs worker nodes", plain: "A cluster has two kinds of machine. The control plane is the brain: it stores the desired state, decides where each pod should run and reacts when something breaks. Worker nodes are the machines that actually run your containers. If you know which side a problem is on, you know where to look.", example: "Run `kubectl get nodes` to list the machines, and `kubectl get pods -n kube-system` to see the control plane parts (API server, scheduler, etcd) running as pods on many clusters.", links: [L.k8sComponents, L.k8sNodes] },
      { topic: "Pods", plain: "A pod is the smallest thing Kubernetes runs: one or more containers that share a network address and storage. You rarely create a bare pod in real work, but every other object is built on pods, so you read and debug them constantly. A pod that dies is not repaired, it is replaced by a new one.", example: "`kubectl run web --image=nginx` starts one pod, and `kubectl get pod web -o wide` shows which node it landed on and its IP address.", links: [L.k8sPods, L.k8sPodLife, L.k8sBasics] },
      { topic: "Deployments, StatefulSets, DaemonSets and Jobs", plain: "These are the four common ways to say how pods should run. A Deployment keeps N identical copies of a stateless app and rolls out new versions. A StatefulSet is for apps that need a stable name and their own disk, like a database. A DaemonSet puts one pod on every node (log collectors), and a Job runs a task to completion and stops.", example: "`kubectl create deployment web --image=nginx --replicas=3` then `kubectl scale deployment web --replicas=5` adds two more pods without touching the first three.", links: [L.k8sDeploy, L.k8sSts, L.k8sDs, L.k8sJob] },
      { topic: "Kubernetes for the Absolute Beginners: foundational labs", plain: "This KodeKloud course teaches the core ideas with a hands-on terminal in the browser, so you type real kubectl commands instead of only watching. The early labs on architecture, pods and Deployments are the base for every other Kubernetes lab you will do. Doing them fast and with your own hands is worth more than reading about them.", example: "In a lab you might create a pod from a YAML file, break its image name on purpose, and use `kubectl describe pod` to find out why it did not start.", links: [L.kkBeginners, L.k8sBasics] },
    ],
  },
  {
    day: 2,
    intro: "A running pod is not useful until it has its settings and can be reached. Today covers keeping configuration and passwords out of the image, giving pods a stable address inside the cluster, and letting traffic in from outside. These are the objects behind almost every real deployment.",
    notes: [
      { topic: "ConfigMaps and Secrets", plain: "A ConfigMap holds ordinary settings (a URL, a feature flag) and a Secret holds sensitive values (a password, a token). Both are injected into pods as environment variables or files, so the same image runs in dev and prod with different values. Secrets are only base64 encoded by default, which is not encryption, so limit who can read them.", example: "`kubectl create secret generic db --from-literal=password=s3cret` then reference it in the pod with `valueFrom: secretKeyRef`.", links: [L.k8sConfigMap, L.k8sSecret] },
      { topic: "Services", plain: "Pods come and go and their IP addresses change. A Service gives a group of pods one stable name and address and spreads requests across them. The main types are ClusterIP (inside the cluster only), NodePort (opens a port on every node) and LoadBalancer (asks the cloud for an external address).", example: "`kubectl expose deployment web --port=80` creates a Service named web, so another pod can call `http://web` and reach any healthy copy.", links: [L.k8sService, L.k8sBasics] },
      { topic: "Ingress controllers", plain: "An Ingress is a set of rules that route outside web traffic to Services by host name or path. The rules do nothing alone: an ingress controller, such as ingress-nginx, is the program that reads them and does the routing. One controller and one load balancer can serve many apps, which is cheaper than one load balancer per app.", example: "A rule that sends `shop.example.com` to the shop Service and `shop.example.com/api` to the api Service, handled by one ingress-nginx pod set.", links: [L.k8sIngress, L.k8sIngressCtl, L.ingressNginx] },
    ],
  },
  {
    day: 3,
    intro: "Containers lose their files when they restart, and by default any pod can talk to any other pod. Today covers keeping data safe beyond a pod's life, and limiting who can talk to whom. Both matter as soon as you run a database or care about security.",
    notes: [
      { topic: "PV, PVC and StorageClasses", plain: "A PersistentVolume (PV) is a piece of real storage in the cluster. A PersistentVolumeClaim (PVC) is a pod's request for storage of a given size, like a ticket. A StorageClass describes a kind of storage (fast disk, cheap disk) and lets the cluster create a PV automatically when a claim appears. Data then survives pod restarts.", example: "A PVC asking for `storage: 5Gi` with `storageClassName: standard` is mounted into a database pod at `/var/lib/postgresql/data`.", links: [L.k8sPv, L.k8sSc] },
      { topic: "NetworkPolicies", plain: "A NetworkPolicy is a firewall rule for pods: it says which pods may send traffic to which. Without any policy everything can reach everything, which makes a single compromised pod dangerous. Policies only work if the cluster's network plugin supports them, so check that first.", example: "A policy on the database pods that allows incoming traffic on port 5432 only from pods labelled `app=api`.", links: [L.k8sNetpol] },
    ],
  },
  {
    day: 4,
    intro: "A production app has to cope with changing load and fail in a controlled way. Today covers adding and removing pods automatically, telling Kubernetes how much each pod needs, and letting it check whether a pod is really healthy. Together they decide whether an app stays up under pressure.",
    notes: [
      { topic: "Horizontal Pod Autoscaler (HPA)", plain: "The Horizontal Pod Autoscaler watches a metric, usually CPU use, and changes the number of pod copies to keep it near a target. More load adds pods, less load removes them, within a minimum and maximum you set. It needs the metrics server installed and CPU requests set on the pods, or it cannot calculate anything.", example: "`kubectl autoscale deployment web --cpu-percent=70 --min=2 --max=10` then `kubectl get hpa` shows current and target use.", links: [L.k8sHpa, L.k8sHpaWalk] },
      { topic: "Resource requests and limits", plain: "A request is the amount of CPU and memory a container is guaranteed, and the scheduler uses it to pick a node. A limit is the ceiling: going over the CPU limit slows the container, going over the memory limit kills it. Setting both stops one noisy app from starving the others.", example: "`resources: { requests: { cpu: \"250m\", memory: \"128Mi\" }, limits: { memory: \"256Mi\" } }` means a quarter of a CPU core guaranteed and a hard stop at 256 MiB of memory.", links: [L.k8sResources] },
      { topic: "Health probes", plain: "Probes are checks Kubernetes runs against a container. A liveness probe restarts a container that is stuck, a readiness probe holds back traffic until it is ready, and a startup probe gives slow apps time to boot. Good probes are what make rolling updates safe.", example: "A readiness probe doing `httpGet /healthz` on port 8080 every 5 seconds, so a new pod only gets requests once that endpoint answers.", links: [L.k8sProbes, L.k8sPodLife] },
    ],
  },
  {
    day: 5,
    intro: "Things will break, and the skill that sets people apart is finding the cause quickly. Today is a method: look at the status, read the events, read the logs, then fix. You will meet the two most common failures by name and practise on a deployment you break yourself.",
    notes: [
      { topic: "kubectl debugging", plain: "A small set of commands answers most questions. `get` shows status, `describe` shows events (the story of what the cluster tried), `logs` shows what the app printed, and `exec` opens a shell inside a container. Work from the outside in: status first, then events, then logs.", example: "`kubectl describe pod web-7d9 | tail -20` then `kubectl logs web-7d9 --previous` shows why the last run crashed.", links: [L.k8sDebugPods, L.k8sDebugRunning, L.kubectlRef] },
      { topic: "CrashLoopBackOff", plain: "This status means a container starts, exits, and Kubernetes keeps restarting it with longer and longer waits. The problem is almost always inside the app or its settings: a bad command, a missing environment variable, a failed connection or running out of memory. Read the previous run's logs and the exit code.", example: "`kubectl logs web-7d9 --previous` shows `DB_HOST not set`, so you add the missing value to the ConfigMap and restart.", links: [L.k8sDebugPods, L.k8sPodLife] },
      { topic: "ImagePullBackOff", plain: "This means the node cannot download the container image, so the pod never starts. The usual causes are a typo in the image name or tag, an image that does not exist, or a private registry with no credentials. The describe output names the exact reason.", example: "`kubectl describe pod web-7d9` shows `Failed to pull image \"nginx:1.99\": not found`, so you fix the tag in the Deployment.", links: [L.k8sImages, L.k8sPullPrivate] },
      { topic: "Cluster troubleshooting (CKAD/CKA labs)", plain: "These KodeKloud labs hand you a broken cluster or application and a clock. You practise the whole loop: find what is wrong with kubectl, fix it, and confirm it. The most useful exercise is the one in the plan: break a deployment on purpose, then repair it, because you learn what each error looks like.", example: "Set a Deployment's image to a name that does not exist, watch the pods go to ImagePullBackOff, then correct it with `kubectl set image`.", links: [L.kkCka, L.kkCkad, L.k8sDebugCluster] },
    ],
  },
  {
    day: 6,
    intro: "Helm is the package manager for Kubernetes: it bundles the many YAML files of an app into one chart you can install with a single command and configure with a values file. Today is how a chart is laid out and how templates turn values into real YAML. It removes a lot of copy and paste.",
    notes: [
      { topic: "Chart structure (Chart.yaml, values.yaml, templates/)", plain: "A chart is a folder. Chart.yaml holds its name and version, values.yaml holds the default settings, and the templates folder holds the Kubernetes YAML with gaps to be filled from the values. Knowing which file does what lets you read any chart you download.", example: "`helm create myapp` generates a working starter chart with all three, and `helm lint myapp` checks it for mistakes.", links: [L.helmCharts, L.helmCreate, L.helmLint] },
      { topic: "Go templating", plain: "Helm templates use the Go templating language: text between double curly braces is replaced with a value or the result of a small function. You can use values, conditions and loops, and pipes like `| quote` to change text. It is easy to get indentation wrong, so render the result and read it.", example: "`image: {{ .Values.image.repository }}:{{ .Values.image.tag }}` becomes `image: nginx:1.27` when those values are set. Preview with `helm template myapp ./myapp`.", links: [L.helmStart, L.helmFunctions] },
      { topic: "The chart anatomy labs from Helm for Beginners", plain: "This KodeKloud course gives you a terminal where you build, template and override a chart step by step. The labs on chart anatomy, templating and values.yaml overrides turn the ideas above into habit. Do them with `helm template` open so you see the YAML each change produces.", example: "In a lab you change `replicaCount` in values.yaml from 1 to 3 and confirm with `helm template` that the Deployment now says `replicas: 3`.", links: [L.kkHelm, L.helmValues] },
    ],
  },
  {
    day: 7,
    intro: "A chart earns its keep when the same package goes to dev and prod with different settings, and when you can upgrade or undo a release safely. Today covers value overrides, the release commands and installing other people's charts. These are the commands you will put in a pipeline.",
    notes: [
      { topic: "Environment overrides (values-dev.yaml, values-prod.yaml)", plain: "Keep one set of templates and one small values file per environment holding only what differs, such as replica count, host name and resource sizes. You pass them with `-f`, and later files win over earlier ones. This avoids a separate copy of the chart for each environment.", example: "`helm install web ./web -f values-prod.yaml` runs the same chart as dev but with `replicaCount: 5` and the production host name.", links: [L.helmValues, L.helmValuesPractice] },
      { topic: "Release operations: helm install, upgrade and rollback", plain: "Installing a chart creates a release, a named copy running in the cluster. Each upgrade makes a new numbered revision, and a rollback returns to an earlier one, so a bad change can be undone in seconds. The one command `helm upgrade --install` works for both first deploys and updates, which suits pipelines.", example: "`helm upgrade --install web ./web -f values-prod.yaml`, then if it misbehaves `helm history web` and `helm rollback web 1`.", links: [L.helmUsing, L.helmInstall, L.helmUpgrade, L.helmRollback] },
      { topic: "Third-party charts (ingress-nginx, cert-manager)", plain: "Many tools ship an official chart, so you install them with a few commands instead of writing YAML. ingress-nginx is the ingress controller from day 2, and cert-manager gets and renews TLS certificates (the lock icon in a browser) automatically. Read each chart's values before installing and pin the chart version.", example: "`helm repo add jetstack https://charts.jetstack.io` then `helm install cert-manager jetstack/cert-manager -n cert-manager --create-namespace --set crds.enabled=true`.", links: [L.ingressNginxDeploy, L.certMgrHelm, L.certMgr] },
    ],
  },
];

export const W5: DayNotes[] = [
  {
    day: 1,
    intro: "The capstone pulls the whole plan together: take a containerized app made of several services, run it on a real multi-node Kubernetes cluster and package it as a Helm chart. The aim is one repeatable install command per environment. Expect to hit and fix errors, which is the point.",
    notes: [
      { topic: "Deploying a multi-service containerized application onto a multi-node Kubernetes cluster or an EKS/AKS sandbox", plain: "Each service gets its own Deployment and Service, with settings in ConfigMaps and Secrets and a PVC for anything stateful. Use a KodeKloud multi-node cluster, or a managed cluster on Amazon EKS or Azure AKS, which are the cloud-run versions of Kubernetes. Deploy by hand first so you know what the chart has to produce.", example: "`kubectl apply -f api.yaml -f web.yaml -f db.yaml`, then `kubectl get pods -o wide` to confirm pods are spread over several nodes.", links: [L.k8sDeploy, L.k8sService, L.eksStart, L.aksStart] },
      { topic: "Packaging the components into a custom Helm chart with environment-specific values", plain: "Turn the working YAML into one chart: replace the fixed values with `.Values` entries, put defaults in values.yaml and add a values file per environment. Lint and render before installing. The result should deploy dev and prod from the same templates.", example: "`helm lint ./app && helm template app ./app -f values-dev.yaml | less`, then `helm install app ./app -f values-dev.yaml -n dev --create-namespace`.", links: [L.helmCharts, L.helmValues, L.helmValuesPractice, L.helmLint] },
    ],
  },
  {
    day: 2,
    intro: "Finish the capstone by making the app reachable and elastic, then having a pipeline deploy it for you. The final test is a code change that goes live with no manual kubectl or helm commands. This is the working loop of a DevOps engineer.",
    notes: [
      { topic: "Ingress routing for the application", plain: "Add an Ingress template to the chart so outside traffic reaches your services by host or path. It needs an ingress controller in the cluster, so install ingress-nginx first with its chart. Make the host name a value, so each environment has its own address.", example: "An Ingress with `host: {{ .Values.ingress.host }}` sending `/` to the web Service and `/api` to the api Service. Test with `curl -H \"Host: app.example.com\" http://<ingress-address>/`.", links: [L.k8sIngress, L.ingressNginxDeploy, L.helmStart] },
      { topic: "HPA rules", plain: "Add a HorizontalPodAutoscaler template to the chart with a minimum, a maximum and a CPU target, switched on by a value so dev can leave it off. It only works if the pods have CPU requests and the cluster runs a metrics server. Test it by generating load and watching the pod count rise.", example: "`kubectl get hpa -w` while a loop of requests hits the app shows replicas climbing from 2 toward 6, then falling back when the load stops.", links: [L.k8sHpa, L.k8sHpaWalk, L.k8sResources] },
      { topic: "Automated deployment through the CI/CD pipeline", plain: "CI/CD means a pipeline builds, tests and deploys on every change, with no hands on the keyboard. Add a deploy step that runs `helm upgrade --install` against the cluster, with the cluster credentials stored as pipeline secrets, never in the repository. Check the rollout and fail the pipeline if it does not become healthy.", example: "A step running `helm upgrade --install app ./app -f values-prod.yaml --set image.tag=$GIT_SHA --atomic --wait`, where `--atomic` rolls back if the release fails.", links: [L.ghaIntro, L.ghaSecrets, L.helmUpgrade] },
    ],
  },
];
