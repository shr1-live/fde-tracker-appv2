// DevOps programme, week 1 study notes (Linux, Bash, networking, NGINX), in plain English.
// Each topic: what it is, why it matters, one small example, and where to read more.
// Every link below was opened and answered with HTTP 200 on 2026-11-23.
import type { DayNotes, Link } from "../studyNotes";

const L = {
  fhs: { label: "Filesystem Hierarchy Standard 3.0 (Linux Foundation)", url: "https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html" },
  hier: { label: "hier(7): description of the filesystem hierarchy (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man7/hier.7.html" },
  proc: { label: "proc(5): the /proc pseudo-filesystem (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man5/proc.5.html" },
  chmod: { label: "chmod(1): change file mode bits (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man1/chmod.1.html" },
  chown: { label: "chown(1): change file owner and group (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man1/chown.1.html" },
  sudoers: { label: "sudoers manual (sudo project)", url: "https://www.sudo.ws/docs/man/sudoers.man/" },
  doPerms: { label: "An introduction to Linux permissions (DigitalOcean)", url: "https://www.digitalocean.com/community/tutorials/an-introduction-to-linux-permissions" },
  kkPrereq: { label: "DevOps Pre-Requisite course (KodeKloud)", url: "https://kodekloud.com/courses/devops-pre-requisite-course/" },
  systemctl: { label: "systemctl(1) manual (systemd, freedesktop.org)", url: "https://www.freedesktop.org/software/systemd/man/latest/systemctl.html" },
  journalctl: { label: "journalctl(1) manual (systemd, freedesktop.org)", url: "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html" },
  signal: { label: "signal(7): signals and how processes react (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man7/signal.7.html" },
  ubuntuPkg: { label: "Package management (Ubuntu Server documentation)", url: "https://ubuntu.com/server/docs/package-management" },
  aptMan: { label: "apt(8) manual page (Ubuntu manpages)", url: "https://manpages.ubuntu.com/manpages/noble/man8/apt.8.html" },
  htop: { label: "htop, an interactive process viewer (htop project)", url: "https://htop.dev/" },
  vmstat: { label: "vmstat(8): memory, swap and CPU activity (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man8/vmstat.8.html" },
  iostat: { label: "iostat(1): disk and CPU statistics (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man1/iostat.1.html" },
  df: { label: "df(1): report free disk space (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man1/df.1.html" },
  sshdConfig: { label: "sshd_config manual (OpenSSH, OpenBSD)", url: "https://man.openbsd.org/sshd_config" },
  ubuntuSsh: { label: "OpenSSH server (Ubuntu Server documentation)", url: "https://ubuntu.com/server/docs/openssh-server" },
  doSsh: { label: "How to harden OpenSSH on Ubuntu (DigitalOcean)", url: "https://www.digitalocean.com/community/tutorials/how-to-harden-openssh-on-ubuntu-20-04" },
  bashFaq105: { label: "Why set -e is tricky: Bash FAQ 105 (Greg's Wiki)", url: "https://mywiki.wooledge.org/BashFAQ/105" },
  bashPractices: { label: "Bash scripting practices (Greg's Wiki)", url: "https://mywiki.wooledge.org/BashGuide/Practices" },
  bashMan: { label: "bash(1) manual page (Ubuntu manpages)", url: "https://manpages.ubuntu.com/manpages/noble/man1/bash.1.html" },
  bashGuide: { label: "The Bash guide for beginners (Greg's Wiki)", url: "https://mywiki.wooledge.org/BashGuide" },
  bashTests: { label: "Tests and conditionals in Bash (Greg's Wiki)", url: "https://mywiki.wooledge.org/BashGuide/TestsAndConditionals" },
  kkShell: { label: "Shell Scripts for Beginners course (KodeKloud)", url: "https://kodekloud.com/courses/shell-scripts-for-beginners/" },
  absRedir: { label: "I/O redirection (Advanced Bash-Scripting Guide, The Linux Documentation Project)", url: "https://tldp.org/LDP/abs/html/io-redirection.html" },
  absGuide: { label: "Advanced Bash-Scripting Guide (The Linux Documentation Project)", url: "https://tldp.org/LDP/abs/html/" },
  grep: { label: "grep(1): search text with patterns (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man1/grep.1.html" },
  awk: { label: "awk language reference (POSIX, The Open Group)", url: "https://pubs.opengroup.org/onlinepubs/9699919799/utilities/awk.html" },
  sed: { label: "sed stream editor reference (POSIX, The Open Group)", url: "https://pubs.opengroup.org/onlinepubs/9699919799/utilities/sed.html" },
  jq: { label: "jq manual (jq project)", url: "https://jqlang.github.io/jq/manual/" },
  crontab: { label: "crontab(5): the cron table format (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man5/crontab.5.html" },
  doCron: { label: "How to use cron to automate tasks on Ubuntu (DigitalOcean)", url: "https://www.digitalocean.com/community/tutorials/how-to-use-cron-to-automate-tasks-ubuntu-1804" },
  doNetTerms: { label: "An introduction to networking terminology, interfaces and protocols (DigitalOcean)", url: "https://www.digitalocean.com/community/tutorials/an-introduction-to-networking-terminology-interfaces-and-protocols" },
  rfc9293: { label: "RFC 9293: Transmission Control Protocol (IETF)", url: "https://www.rfc-editor.org/rfc/rfc9293" },
  mdnTcp: { label: "TCP glossary entry (MDN Web Docs, Mozilla)", url: "https://developer.mozilla.org/en-US/docs/Glossary/TCP" },
  mdnDns: { label: "DNS glossary entry (MDN Web Docs, Mozilla)", url: "https://developer.mozilla.org/en-US/docs/Glossary/DNS" },
  doDns: { label: "An introduction to DNS terminology, components and concepts (DigitalOcean)", url: "https://www.digitalocean.com/community/tutorials/an-introduction-to-dns-terminology-components-and-concepts" },
  dig: { label: "dig(1) manual page (Ubuntu manpages)", url: "https://manpages.ubuntu.com/manpages/noble/man1/dig.1.html" },
  doCidr: { label: "Understanding IP addresses, subnets and CIDR notation (DigitalOcean)", url: "https://www.digitalocean.com/community/tutorials/understanding-ip-addresses-subnets-and-cidr-notation-for-networking" },
  mdnHttp: { label: "An overview of HTTP (MDN Web Docs, Mozilla)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview" },
  mdnTls: { label: "Transport Layer Security (MDN Web Docs, Mozilla)", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security" },
  rfc8446: { label: "RFC 8446: TLS version 1.3, including the handshake (IETF)", url: "https://www.rfc-editor.org/rfc/rfc8446" },
  ufw: { label: "UFW, the uncomplicated firewall (Ubuntu community help)", url: "https://help.ubuntu.com/community/UFW" },
  ubuntuFw: { label: "Firewalls (Ubuntu Server documentation)", url: "https://ubuntu.com/server/docs/firewalls" },
  netfilter: { label: "Linux packet filtering HOWTO (netfilter.org)", url: "https://www.netfilter.org/documentation/HOWTO/packet-filtering-HOWTO.html" },
  doIptables: { label: "How the iptables firewall works (DigitalOcean)", url: "https://www.digitalocean.com/community/tutorials/how-the-iptables-firewall-works" },
  curl: { label: "curl command line manual (curl project)", url: "https://curl.se/docs/manpage.html" },
  ss: { label: "ss(8): inspect network sockets (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man8/ss.8.html" },
  traceroute: { label: "traceroute(8): trace the route packets take (Linux man pages, man7.org)", url: "https://man7.org/linux/man-pages/man8/traceroute.8.html" },
  doTraceroute: { label: "How to use traceroute and MTR to diagnose network issues (DigitalOcean)", url: "https://www.digitalocean.com/community/tutorials/how-to-use-traceroute-and-mtr-to-diagnose-network-issues" },
  tcpdump: { label: "tcpdump manual page (tcpdump.org)", url: "https://www.tcpdump.org/manpages/tcpdump.1.html" },
  nginxProxyGuide: { label: "NGINX reverse proxy guide (NGINX documentation)", url: "https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/" },
  nginxProxy: { label: "ngx_http_proxy_module reference (nginx.org)", url: "https://nginx.org/en/docs/http/ngx_http_proxy_module.html" },
  nginxLb: { label: "Using nginx as an HTTP load balancer (nginx.org)", url: "https://nginx.org/en/docs/http/load_balancing.html" },
  nginxUpstream: { label: "ngx_http_upstream_module reference (nginx.org)", url: "https://nginx.org/en/docs/http/ngx_http_upstream_module.html" },
  nginxHttps: { label: "Configuring HTTPS servers (nginx.org)", url: "https://nginx.org/en/docs/http/configuring_https_servers.html" },
  nginxCore: { label: "ngx_http_core_module, including location (nginx.org)", url: "https://nginx.org/en/docs/http/ngx_http_core_module.html" },
  nginxLimit: { label: "ngx_http_limit_req_module reference (nginx.org)", url: "https://nginx.org/en/docs/http/ngx_http_limit_req_module.html" },
  mdn502: { label: "502 Bad Gateway (MDN Web Docs, Mozilla)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502" },
  mdn504: { label: "504 Gateway Timeout (MDN Web Docs, Mozilla)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504" },
} satisfies Record<string, Link>;

export const W1: DayNotes[] = [
  {
    day: 1,
    intro:
      "Almost every server you will run, container you will build and pipeline you will debug sits on Linux, so this day is about knowing where things live and who is allowed to touch them. Most 'it works on my machine' and 'permission denied' problems come back to these two ideas. Get comfortable here and the rest of the month gets easier.",
    notes: [
      {
        topic: "Linux (Ubuntu): filesystem hierarchy standard (/etc, /var, /proc, /sys)",
        plain:
          "Linux puts everything under one tree that starts at /, and the Filesystem Hierarchy Standard says what each top folder is for: /etc holds configuration, /var holds data that changes (logs, caches), /proc and /sys are windows into the running kernel (the core of the operating system). Knowing the map tells you where to look when a service misbehaves.",
        example:
          "A web server is failing: read its settings in /etc/nginx/nginx.conf, its logs in /var/log/nginx/error.log, and check the kernel's view of a process with cat /proc/<pid>/status.",
        links: [L.hier, L.fhs, L.proc],
      },
      {
        topic: "User and group permissions (chmod, chown, sudoers)",
        plain:
          "Every file has an owner, a group and three sets of read, write and execute rights (for the owner, the group and everyone else). chmod changes those rights, chown changes who owns the file, and the sudoers file decides who may run commands as the administrator (root). Getting these wrong is the most common cause of both broken deployments and security holes.",
        example:
          "chmod 600 ~/.ssh/id_ed25519 lets only you read your private key, and sudo chown -R www-data:www-data /var/www gives the web server's user ownership of the site files.",
        links: [L.doPerms, L.chmod, L.sudoers],
      },
      {
        topic: "KodeKloud DevOps Pre-Requisite course: Linux Basics labs (skip basic Git/YAML lessons)",
        plain:
          "This is the hands-on practice for the day: short browser-based labs where you run real Linux commands for navigation, files, users and permissions, and get a pass or fail check at the end. Typing the commands yourself is what makes them stick, which is why the labs are worth more than reading. The Git and YAML lessons are skipped because you already know them.",
        example:
          "A typical lab asks you to create a user, put them in a group, make a file only that group can edit, and then the grader checks the result.",
        links: [L.kkPrereq, L.hier],
      },
    ],
  },
  {
    day: 2,
    intro:
      "A server is a set of long-running programs, and your job is to keep them healthy. Today covers how Linux starts and supervises those programs, how to update software safely, how to see what is eating CPU, memory or disk, and how to lock down remote access. These are the first things you reach for in any incident.",
    notes: [
      {
        topic: "Process lifecycle (systemd, systemctl, journalctl)",
        plain:
          "A process is a running program. systemd is the manager that starts services at boot, restarts them if they crash and stops them cleanly with signals (small messages the kernel sends to a process). systemctl controls services and journalctl reads their logs, so together they answer 'is it running and why did it stop'.",
        example:
          "systemctl status nginx shows whether it is running, and journalctl -u nginx --since \"10 min ago\" shows what it logged just before it failed.",
        links: [L.systemctl, L.journalctl, L.signal],
      },
      {
        topic: "Package maintenance via apt",
        plain:
          "apt is Ubuntu's tool for installing, updating and removing software from trusted repositories (online catalogues of packages). Regular updates bring security fixes, and knowing the difference between refreshing the catalogue and upgrading the programs avoids surprises. On a server, careless upgrades can restart services or change versions you depend on.",
        example:
          "sudo apt update refreshes the list of available versions, then sudo apt install --only-upgrade openssl upgrades just one package.",
        links: [L.ubuntuPkg, L.aptMan],
      },
      {
        topic: "Resource diagnostics (htop, vmstat, iostat, df)",
        plain:
          "These four tools show whether a machine is short of CPU, memory, disk speed or disk space. htop lists processes by usage, vmstat shows memory and swap activity (swap is disk used as slow memory), iostat shows how busy the disks are, and df shows free space. Slowness has a cause, and these tools tell you which resource is the bottleneck.",
        example:
          "A service hangs: df -h shows / is 100 percent full, so the fix is clearing old logs rather than adding CPU.",
        links: [L.htop, L.vmstat, L.iostat],
      },
      {
        topic: "SSH hardening",
        plain:
          "SSH (Secure Shell) is how you log in to servers remotely, which also makes it the first thing attackers probe. Hardening means turning off password login in favour of key pairs, blocking direct root login, and limiting who can connect. A few lines in the SSH server config remove most of the risk.",
        example:
          "In /etc/ssh/sshd_config set PasswordAuthentication no and PermitRootLogin no, then run sudo systemctl reload ssh, keeping a second session open in case you lock yourself out.",
        links: [L.doSsh, L.sshdConfig, L.ubuntuSsh],
      },
    ],
  },
  {
    day: 3,
    intro:
      "Bash scripts are the glue of DevOps, and a script that fails quietly is worse than one that fails loudly. Today is about writing scripts that stop on errors, report what went wrong, make decisions and wire commands together. These habits carry straight into CI pipelines and container entrypoints.",
    notes: [
      {
        topic: "Defensive scripting (set -euo pipefail)",
        plain:
          "By default Bash keeps going after a command fails, which can turn a small error into real damage. set -e stops the script on the first failure, -u treats an unset variable as an error, and -o pipefail makes a pipeline fail if any step in it fails. Together they make scripts fail early and visibly.",
        example:
          "With set -euo pipefail at the top, rm -rf \"$BUILD_DIR/\" stops the script if BUILD_DIR was never set, instead of deleting from the wrong place.",
        links: [L.bashPractices, L.bashFaq105, L.bashMan],
      },
      {
        topic: "Exit code handling",
        plain:
          "Every command ends with a number: 0 means success and anything else means failure. Scripts and CI systems use that number to decide what to do next, and $? holds the code of the last command. Handling it on purpose lets you retry, clean up or give a clear message.",
        example:
          "if ! grep -q ERROR app.log; then echo \"clean\"; else echo \"errors found\"; exit 1; fi uses grep's exit code to pass or fail the script.",
        links: [L.bashGuide, L.bashMan],
      },
      {
        topic: "Flow control and functions (Shell Scripts for Beginners labs)",
        plain:
          "Flow control means if statements, loops and case blocks that let a script choose and repeat, and functions let you name a piece of logic and reuse it. The KodeKloud labs give you short exercises for each. Together they turn a list of commands into a program you can trust and maintain.",
        example:
          "for host in web1 web2 web3; do ping -c1 \"$host\" > /dev/null && echo \"$host up\" || echo \"$host down\"; done checks three servers in one line.",
        links: [L.kkShell, L.bashTests, L.bashGuide],
      },
      {
        topic: "Standard pipes and redirection",
        plain:
          "Each program has three streams: standard input, standard output and standard error (a separate channel for error messages). A pipe | sends one command's output into the next, and redirection > or 2> sends a stream to a file. This is how small tools combine into powerful one-liners, and how you keep logs and errors apart.",
        example:
          "./deploy.sh > deploy.log 2> deploy.err saves normal output and errors to separate files, while ps aux | grep nginx feeds one command into another.",
        links: [L.absRedir, L.bashGuide],
      },
    ],
  },
  {
    day: 4,
    intro:
      "Logs, config files and API responses are all text, and DevOps work is largely finding the right line in them and changing it safely. Today you pick up the standard text tools and learn to run scripts on a schedule. Then you apply it all in a small project.",
    notes: [
      {
        topic: "Text processing (grep, awk, sed, jq)",
        plain:
          "grep finds lines that match a pattern, awk pulls out and calculates on columns, sed rewrites text as it streams past, and jq does the same for JSON (the format most APIs return). Knowing these four means you can answer questions about huge logs without opening an editor.",
        example:
          "awk '{print $1}' access.log | sort | uniq -c | sort -rn | head lists the busiest client addresses, and kubectl get pods -o json | jq '.items[].metadata.name' prints pod names.",
        links: [L.grep, L.awk, L.sed],
      },
      {
        topic: "Streams and redirection (Advanced Bash Scripting modules)",
        plain:
          "This goes deeper into the three streams: sending error output into normal output, discarding noise, reading from files and from inline text. The Advanced Bash Scripting modules practise these with exercises. It matters because logging in scripts and CI jobs depends on getting each stream to the right place.",
        example:
          "command > all.log 2>&1 sends both normal and error output to one file, and command > /dev/null 2>&1 silences it completely.",
        links: [L.absRedir, L.absGuide],
      },
      {
        topic: "Cron jobs",
        plain:
          "Cron is the built-in scheduler that runs a command at set times, such as every night or every five minutes. Each job is one line with five time fields and a command. It is the simplest way to run backups, cleanups and reports, but jobs run with a bare environment, so they often fail in ways that do not happen in your shell.",
        example:
          "0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1 runs the backup script at 02:00 every day and keeps its output.",
        links: [L.doCron, L.crontab],
      },
      {
        topic: "The e-commerce project labs from Shell Scripts for Beginners",
        plain:
          "These are the course's project labs, where you use variables, conditions, loops and text tools together to build a small shop-style automation. A project forces you to join the pieces and handle real mistakes, which single-topic exercises do not. It is a good checkpoint on whether the week's skills hold together.",
        example:
          "A typical task is a script that reads an orders file, totals the amount per customer with awk, and writes a report only if the file is not empty.",
        links: [L.kkShell, L.bashGuide],
      },
    ],
  },
  {
    day: 5,
    intro:
      "When something is broken, it is very often the network: a name that does not resolve, a port that is blocked, a certificate that has expired. Today builds the mental model of how a request travels, from name lookup to encrypted connection. It makes tomorrow's diagnostics and the NGINX work much easier to follow.",
    notes: [
      {
        topic: "TCP/IP stack",
        plain:
          "The TCP/IP stack is the layered set of rules computers use to talk: IP moves packets (small chunks of data) between machines by address, and TCP on top makes the connection reliable by ordering and resending lost packets. Applications such as HTTP sit above those. Knowing the layers tells you where a problem lives.",
        example:
          "If you can ping a server by IP but cannot open its web page, the IP layer works and the problem is higher up, such as a closed TCP port.",
        links: [L.doNetTerms, L.mdnTcp, L.rfc9293],
      },
      {
        topic: "DNS lookup and record resolution (dig, nslookup)",
        plain:
          "DNS (the Domain Name System) turns names such as example.com into IP addresses, using records of different types: A for an IPv4 address, CNAME for an alias, MX for mail. dig and nslookup ask DNS directly and show what it answers. Wrong or stale DNS is behind many outages that look like a dead server.",
        example:
          "dig +short example.com A prints the address, and dig example.com @8.8.8.8 asks Google's resolver instead of yours to compare answers.",
        links: [L.doDns, L.mdnDns, L.dig],
      },
      {
        topic: "Subnets and CIDR",
        plain:
          "A subnet is a block of addresses on one network, and CIDR (Classless Inter-Domain Routing) notation writes it as an address plus a prefix length, such as 10.0.1.0/24. The number after the slash says how many leading bits are fixed, so a smaller number means a bigger block. You need this to plan cloud networks, firewall rules and Kubernetes address ranges.",
        example:
          "10.0.1.0/24 holds 256 addresses (10.0.1.0 to 10.0.1.255), while 10.0.0.0/16 holds 65,536, so it contains 256 subnets of that size.",
        links: [L.doCidr, L.doNetTerms],
      },
      {
        topic: "HTTP/HTTPS communication and TLS handshakes",
        plain:
          "HTTP is the request and response format of the web, and HTTPS is the same thing wrapped in TLS (Transport Layer Security), which encrypts traffic and proves the server's identity with a certificate. Before any data flows, the two sides do a handshake to agree on keys. Expired or mismatched certificates are a common cause of sudden failures.",
        example:
          "curl -v https://example.com prints the handshake, the certificate details and the HTTP request and response headers in one go.",
        links: [L.mdnHttp, L.mdnTls, L.rfc8446],
      },
    ],
  },
  {
    day: 6,
    intro:
      "A firewall decides which traffic may reach a machine, and a handful of diagnostic tools tell you where traffic is being lost. Today you learn to open only what you need and to prove, with evidence, where a connection breaks. This is the skill that turns 'the network is flaky' into a specific fix.",
    notes: [
      {
        topic: "Host firewalls (ufw, iptables)",
        plain:
          "A host firewall is a set of rules on the machine itself that allows or drops traffic by port and address. iptables is the long-standing tool that talks to the Linux kernel's packet filter, and ufw (Uncomplicated Firewall) is a friendlier wrapper on Ubuntu. The safe default is to deny everything and allow only what the server needs.",
        example:
          "sudo ufw default deny incoming, then sudo ufw allow 22/tcp and sudo ufw allow 443/tcp, then sudo ufw enable (allow SSH first so you do not lock yourself out).",
        links: [L.ufw, L.doIptables, L.netfilter],
      },
      {
        topic: "Diagnostic utilities: curl -v, ss, traceroute, tcpdump",
        plain:
          "Each tool answers a different question. curl -v shows a full web request step by step, ss lists open ports and connections on the machine, traceroute shows each network hop to a destination, and tcpdump captures the actual packets. Using them in that order moves you from the application down to the wire.",
        example:
          "ss -tlnp shows which program is listening on port 8080, and sudo tcpdump -i any port 8080 -n shows whether requests are actually arriving.",
        links: [L.curl, L.ss, L.doTraceroute],
      },
    ],
  },
  {
    day: 7,
    intro:
      "NGINX is the web server and reverse proxy that sits in front of a huge share of real applications, and the ideas here (proxying, load balancing, TLS termination, rate limits) reappear in Kubernetes ingress later. Today you use everything from the week in one lab. It also covers the two errors you will see most often when a proxy cannot reach its backend.",
    notes: [
      {
        topic: "NGINX: reverse proxy architecture",
        plain:
          "A reverse proxy accepts requests from clients and forwards them to one or more backend servers, then returns the answer as if it came from itself. It hides the backends, lets you change them freely, and is a single place for security, caching and logging. NGINX does this with the proxy_pass directive.",
        example:
          "location / { proxy_pass http://127.0.0.1:3000; } sends all web traffic to an app listening on port 3000 on the same machine.",
        links: [L.nginxProxyGuide, L.nginxProxy],
      },
      {
        topic: "Upstream load balancing algorithms",
        plain:
          "An upstream is a named group of backend servers, and the load balancing algorithm decides which one gets each request. Round robin takes turns (the default), least_conn picks the server with the fewest active connections, and ip_hash sends the same client to the same server. The right choice depends on whether requests are equal in cost and whether sessions must stick.",
        example:
          "upstream app { least_conn; server 10.0.1.10:3000; server 10.0.1.11:3000; } followed by proxy_pass http://app; spreads load across two servers.",
        links: [L.nginxLb, L.nginxUpstream],
      },
      {
        topic: "SSL/TLS termination",
        plain:
          "TLS termination means NGINX handles the encryption at the edge and talks plain HTTP to the backends over the private network. You manage certificates in one place and the apps stay simple. The trade-off is that traffic behind the proxy is not encrypted unless you add that separately.",
        example:
          "listen 443 ssl; ssl_certificate /etc/ssl/site.crt; ssl_certificate_key /etc/ssl/site.key; then proxy_pass http://app; serves HTTPS to users and HTTP to the backend.",
        links: [L.nginxHttps, L.mdnTls],
      },
      {
        topic: "Location routing and rate limiting",
        plain:
          "location blocks send different URL paths to different places, for example /api to one backend and /static to files on disk. Rate limiting caps how many requests a client may make per second, which protects backends from abuse and runaway scripts. Both are set in a few lines of configuration.",
        example:
          "limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s; then location /api/ { limit_req zone=api burst=20; proxy_pass http://app; } allows ten requests a second per client address.",
        links: [L.nginxCore, L.nginxLimit],
      },
      {
        topic: "Debugging 502 and 504 errors",
        plain:
          "A 502 Bad Gateway means NGINX reached for the backend and got nothing usable, usually because the app is down, on the wrong port or crashed. A 504 Gateway Timeout means the backend was reached but took too long to answer. Telling them apart points you at either a dead service or a slow one.",
        example:
          "On a 502, check the error log with sudo tail /var/log/nginx/error.log (look for connection refused) and run ss -tlnp to see whether the app is listening; on a 504, raise proxy_read_timeout only after finding out why the app is slow.",
        links: [L.mdn502, L.mdn504, L.nginxProxy],
      },
    ],
  },
];
