# Docker Introduction

## Setting the scene (Docker vs Hypervisor)

### Docker
![Docker-3](https://github.com/sobkulir/docker_intro/assets/14258647/53bae21e-5140-4076-8deb-11683c48725d)

Docker Containers:
* Feel like separate OS instances, think Virtual Machine from VirtualBox.
* In reality are "just" processes on Host OS.
* Therefore, all **containers share the same kernel** (i.e. the kernel of the host). As different Linux distros are built on the ~same kernel, this allows Ubuntu and Fedora containers run side-by-side in the figure above.

Isolation:
* Processes, network, memory, users, and other resources need to be isolated between containers (otherwise we wouldn't get benefits of separate OS instances).
* Achieved using built-in Linux kernel isolation support (LXC, cgroups, ...).

### Hypervisors (VirtualBox, VMware, ...)
![Hypervisor-2](https://github.com/sobkulir/docker_intro/assets/14258647/282ebb52-6bf1-41cf-a578-778dc2f53e4d)

Guest OSes:
* Are full-blown Operating Systems, including kernel.
* All **Guest OSes share the same CPU**. Therefore, all Guest OSes must support Host CPU instruction set (x86, x64, arm32, arm64, ...).

Isolation:
* Achieved by paravirtualization in Hypervisor or via Hardware support (AMD-V, ...).

### Comparison
* Docker containers can "boot" much faster -- a separate kernel does not need to be initialized.
* Docker images can be smaller in size as they don't require kernel to be compiled in. For example Alpine Linux docker image can be just 5MB. 
* Hypervisors can provide more security (see footnotes) and better resource management guarantees.

## Installation
See official docs: https://docs.docker.com/engine/install/

## Basics

As stated in the last section, Docker allows running lightweight instances (containers) which feel like VMs (Virtual Machines).
For VMs, it's typical to get the Operating System ISO image from web. For Docker, it's more typical to start with a base image
and tune it to our liking using `Dockerfile`s. These are then build into a new image. For example, to create a minimal Ubuntu 22
(jammy) image, create a file named `Dockerfile`:
```Dockerfile
FROM ubuntu:jammy
```

Now build the image running the following inside the directory where you created `Dockerfile`:
```bash
docker build -t my_ubuntu .
```

This pulls `ubuntu:jammy` image from the official Docker image repository into our machine.
An *image* can be thought of as a snapshot of a system. Someone created a snapshot of `ubuntu:jammy` that we can
base our own snapshots on. Similarly, there are many existing images ready to be used at the Docker repository:
https://hub.docker.com. The `-t <name>` flag gives the image a name. 

Now we can run the image and thus create the lightweight VM that Docker calls *container*, as follows:
```bash
docker run -it my_ubuntu
```

The flags `-it` allow us to create an interactive terminal session.
We appear inside a shell of the Ubuntu Jammy. We can play around, create files, install packages, etc.
After exiting the container (e.g. running `exit` or `Ctrl^D`) you can think of the changes as being lost,
although that is not completely true, one can restart exited containers. To see all containers including 
stopped ones, use `docker ps -a`.

### Extending base image (00-gcc)
The original example didn't do much, since our `Dockerfile` only had the base image and no custom changes, we could've just
ran it directly:
```bash
docker run -it ubuntu:jammy
```

However, now let's imagine a situation where we wanted to try something out in an older version of GCC (C compiler), say version 10. We could
install it globally on our computer, but it might be then not trivial to get rid of it. We could install the GCC 10 inside the
Docker image:
```
FROM ubuntu:jammy

RUN apt-get update \
    && apt-get install -y gcc-10
```

Now after rebuilding and running the container, we can use `gcc-10` inside of it:
```bash
docker build -t gcc .
docker run -it -v .:/app gcc
# (inside container)
cd /app
gcc-10 simple.c
# Run the compiled binary
./a.out
```
To fall through files into the container, we use `-v` flag -- in this example, contents of the current host directory will be mounted
into `/app` inside the container. Note that *host* here, in layman terms, means "where we're running the `docker` commands from", i.e., our machine.

In this example we saw how Docker can be used to quickly try out different software (`gcc-10` in this case), how to build an image, start a container, and how to mount host directories into container.

### Node server example (01-server)
In this example, there's a NodeJs HTTP server. However, running it with newer version of Node fails. Try:
```bash
cd 01-server
docker run -it -v .:/app node:22 /bin/bash
# (inside container)
cd /app
node main.js
# Expected:
# TypeError: util.print is not a function
```

Note that an extra argument `/bin/bash` was added to `docker run`. This leads to running `/bin/bash` (a shell) instead of
Node interpreter as the default command of the container. To see this difference, try running the above without `/bin/bash`.

Looking at the source code of `00-server/main.js` it can be observed that `util.print()` function was removed in Node12. Now
we could:
1. Fix the code
2. Install the archaic Node 11 on our machine
3. Run a Docker image with Node 11

You guessed it, we're going to take option 3). Run the following:
```
docker run -it -v .:/app node:11 /bin/bash
cd /app && node main.js
# Expected:
# Server is listening on port 3000
```

However, opening `http://localhost:3000` in your browser most likely won't work. The problem is that the container above is running
in an isolated network created by Docker. In order to *bind* a port of the isolated network to a port of the host, the `-p` flag can be used.
 Here we bind port `3000` inside the container into `4000` on host:
```bash
docker run -it -v .:/app -p 4000:3000 node:11 /bin/bash
cd /app && node main.js
```

Now opening `http://localhost:4000` should show message "Helloo". In this example, we've seen one more example of using Docker for
quickly changing versions, and also how ports can be bound to the host.

## Docker compose
Allows networking and using together multiple containers (services). The services can be started using `docker compose up`. 
To allow sharing and persisting data between containers, `docker volumes` are used. Below is a sample `docker-compose.yaml`
file:
```Dockerfile
version: '3'

services:
  web:
    image: nginx:1.32
    env_file:
      - .env
    volumes:
      - web-data:/data
    ports:
      - "80:80"
    depends_on:
      - db

  db:
    image: postgres:15.2
    restart: always
    env_file:
      - .env
    volumes:
      - db-data:/var/lib/postgresql/data
    ports:
      - "5434:5432"

volumes:
  db-data:
  web-data:
```

Although Docker compose is used prevalently, this guide doesn't go into detail and rather stops here
as the aim was to give a more broad introduction and show why one would want to have Docker in their toolkit.

## Wrap-up
Why use Docker:
* Fast prototyping 
    - Install things with easy cleanup.
    - Use pre-made images with needed versions.
* Fast deploying
    - Push images and run them on the server -- easy cleanup of the old versions.
* Reproducibility
    - Images are snapshots of full "operating systems" (except for kernel, see the first section), containing installed packages, user application, etc. Therefore, they are more likely to reproduce same results on different machines compared to for example following installation instructions.
* Resource management
    - Allows limiting CPU, memory, etc usage of a container.

## Street knowledge
### Dangers of :latest flag
Because `:latest` flag of an image is moved forward by developers of the image with each new release, it hinders reproducibility between
image rebuilds. I try to use more stable versions, i.e. `ubuntu:jammy` instead of `ubuntu:latest`.

### Entrypoint override
Override entrypoint with `docker run --entrypoint` to run `/bin/bash` for example, even on `nginx` image, etc. I suggest the following to understand [difference between Entrypoint and Command](https://stackoverflow.com/questions/21553353/what-is-the-difference-between-cmd-and-entrypoint-in-a-dockerfile).

### Exec
To get a shell into a running container, use:
```
docker exec -it <container_id> /bin/sh
```
### Bash script as entrypoint
When multiple commands should be executed at the containter startup, consider using a shell script with the commands and
override the entrypoint inside the `Dockerfile`:
```Dockerfile
ENTRYPOINT [ "/app/my_bash_script.sh" ]
```

### Wait for other containers
It's typical for Web stacks that the first `docker-compose up` fails because services trying to connect to the database fail because the database was not
set up in time. To remedy this, one can add a delay after starting a container. The `sleep 10` is a starting point, but one can play with it more, only
sleeping on the first container run, etc.

## Footnotes

On Docker security:
1. [Is Docker more secure than VMs or bare metal?](https://security.stackexchange.com/a/169649)

From random internet meanderings:
1. [Virtual machine vs Docker](https://stackoverflow.com/questions/16047306/how-is-docker-different-from-a-virtual-machine)
2. [How can Docker run distros with different kernels?](https://stackoverflow.com/questions/32841982/how-can-docker-run-distros-with-different-kernels)
3. [Understanding virtualization](https://www.vmware.com/content/dam/digitalmarketing/vmware/en/pdf/techpaper/VMware_paravirtualization.pdf)
