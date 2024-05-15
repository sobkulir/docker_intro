# Docker Introduction

## Installation
See official docs: https://docs.docker.com/engine/install/

## Basics

Docker allows creating lightweight instances (containers) which feel like VMs (Virtual Machines).
For actual differences been Docker and VMs see footnotes. For example, to create a minimal Ubuntu 22 (jammy)
image, create a file named `Dockerfile`:
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
https://hub.docker.com. The `-t <name>` flags gives the image a name. 

Now we can run the image and thus create the lightweight VM that Docker calls *container*, as follows:
```bash
docker run -it my_ubuntu
```

The flags `-it` allow us to create an interactive terminal session.
We appear inside a shell of the Ubuntu Jammy. We can play around, create files, install packages, etc.
After exiting the container (e.g. running `exit` or `Ctrl^D`) you can think of the changes as being lost,
although that is not completely true, one can restart exited containers. To all containers including 
stopped ones, use `docker ps -a`.

### Extending base image
The original example didn't do much, since our `Dockerfile` only had the base image and no custom changes, we could've just
ran it directly:
```bash
docker run -it ubuntu:jammy
```

However, now let's imagine a situation where we wanted to try something out in an older version of GCC (C compiler), say 3.4 . We could
install it globally on our computer, but it might be then not trivial to get rid of it. We could install the GCC 3.4 inside the
Docker image:
```
FROM ubuntu:jammy

RUN apt-get update \
    && apt-get install -y gcc-3.4
```

Now after rebuilding and running the container, we can use gcc3.4 inside of it:
```bash
docker run -it -v .:/app my_ubuntu
```
To fall through files into the container, we use `-v` flag -- in this example, contents of the current host directory will be mounted
into `/app` inside the container.

### Node server example
Shows port binding with `-p`.

## Docker compose
Allows networking and controlling together multiple services.

## My tricks
### Entrypoint override
Override entrypoint with `docker run --entrypoint` to run `/bin/bash` for example, even on `nginx` image, etc.

### Exec
To get a shell into a running container, use:
```
docker exec -it <container_id> /bin/sh
```

## Footnotes

### Differences to VMs
From my internet meanderings:
    1. [Virtual machine vs Docker](https://stackoverflow.com/questions/16047306/how-is-docker-different-from-a-virtual-machine)
    2. [How can Docker run distros with different kernels?](https://stackoverflow.com/questions/32841982/how-can-docker-run-distros-with-different-kernels)