---
layout: post
title: "Advent of Embedded Linux — Day 3: Build Yocto Image + Custom Package"
date: 2025-12-09 00:12:00 +0100
categories: [embedded-linux, advent]
---

# Day 3 — Build Yocto Image + Custom Package

## Overview

Today, you'll learn how to use Yocto Project with **kas** (KAS is an Awesome Setup tool) to build a complete embedded Linux distribution. Yocto Project is an industry-standard build system used by many embedded Linux developers.

### Why Use kas?

While Yocto Project can be used with traditional BitBake commands, **kas** provides several advantages:

- **Declarative Configuration**: All build settings are defined in a single YAML file (`hello-yocto.yml`), making it easy to version control and share configurations
- **Automatic Environment Setup**: kas automatically sets up the build environment, clones required repositories, and configures layers
- **Reproducible Builds**: The YAML configuration ensures consistent builds across different machines and developers
- **Simplified Workflow**: No need to manually manage `local.conf`, `bblayers.conf`, or source build environments
- **Multi-Repository Management**: kas handles cloning and managing multiple Git repositories (Poky, meta-layers, etc.) automatically
- **Easy Collaboration**: Share a single YAML file instead of multiple configuration files

You'll build a minimal RISC-V image for QEMU and create your own custom package that gets included in the final image. This hands-on experience will teach you the fundamentals of Yocto recipes, layers, and the build process.

## What You Will Do

- Install kas and required dependencies
- Set up a kas configuration for RISC-V QEMU
- Create a custom layer and package recipe
- Build a minimal Yocto image
- Include your custom package in the image
- Enable root login without password
- Boot the Yocto-built system in QEMU

## Step-by-Step Guide

### Prerequisites

Install the required packages on Ubuntu 22.04:

```bash
sudo apt update
sudo apt install -y gawk wget git-core diffstat unzip texinfo \
    gcc-multilib build-essential chrpath socat cpio python3 \
    python3-pip python3-pexpect xz-utils debianutils iputils-ping \
    python3-git python3-jinja2 libegl1-mesa libsdl1.2-dev \
    pylint3 xterm python3-subunit mesa-common-dev zstd liblz4-tool
```

Install kas using pipx (recommended for isolated Python package installation):

```bash
# Install pipx if not already installed
sudo apt install -y pipx
pipx ensurepath

# Install kas
pipx install kas
```

Verify kas installation:

```bash
kas --version
```

### Step 1: Create Your Yocto Project Workspace

Set up your workspace directory:

```bash
mkdir -p ~/advent/day-03
cd ~/advent/day-03
```

### Step 2: Create a Custom Layer

Create your own layer to add a custom package using the `bitbake-layers` tool. First, we'll need to set up a temporary build environment to use bitbake-layers, or you can create the layer structure manually. For this guide, we'll use `bitbake-layers create-layer`:

```bash
cd ~/advent/day-03

# Create the layer using bitbake-layers
# Note: You may need a temporary build environment for this command
# Alternatively, create the layer structure manually
bitbake-layers create-layer meta-advent

# Create the recipe directory structure
cd meta-advent
mkdir -p recipes-hello/helloworld/files
```

Create our source file helloworld.c
```c
#include <stdio.h>

int main(void) {
    printf("Hello World\n");
    printf("Welcome to Advent of Embedded Linux\n");
    return 0;
}
```

Create the helloworld_0.1.bb recipe
```bash
SUMMARY = "simple hello world application"
LICENSE = "CLOSED"
LIC_FILES_CHKSUM = ""

SRC_URI = "file://helloworld.c"

S = "${UNPACKDIR}"

do_compile () {
        # Specify compilation commands here
        ${CC} ${LDFLAGS} helloworld.c -o helloworld
}

do_install () {
        # Specify install commands here
        install -d ${D}${bindir}
        install -m 0755 helloworld ${D}${bindir}
}
```

### Step 3: Create the kas Configuration File

```bash
cd meta-advent
mkdir kas
```
Create the `kas/hello-yocto.yml` file that defines your build configuration:

```yaml
header:
  version: 14
machine: qemuriscv64
distro: poky
target: core-image-minimal
repos:
  bitbake:
    url: https://git.openembedded.org/bitbake
    branch: master
    layers:
      bitbake: disabled
  openembedded-core:
    url: https://git.openembedded.org/openembedded-core
    branch: master
    layers:
      meta:
  meta-yocto:
    url: https://git.yoctoproject.org/meta-yocto
    branch: master
    layers:
      meta-poky:
  meta-openembedded:
    url: https://git.openembedded.org/meta-openembedded
    branch: master
    layers:
      meta-oe:
  meta-riscv:
    url: https://github.com/riscv/meta-riscv.git
    branch: master
  meta-advent:
    path: ..
    layers:
      .:
local_conf_header:
  qemuriscv64: |
    EXTRA_IMAGE_FEATURES = "empty-root-password allow-empty-password allow-root-login"
    KERNEL_DANGLING_FEATURES_WARN_ONLY = "1"
    IMAGE_INSTALL:append = " helloworld"
```

This kas configuration:
- Uses OpenEmbedded Core and meta-yocto from the master branch
- Adds the meta-riscv layer for RISC-V support
- Includes your custom [`meta-advent`](https://github.com/kanakshilledar/meta-advent) layer (using a local path)
- Targets the `qemuriscv64` machine (QEMU RISC-V 64-bit)
- Builds `core-image-minimal` image
- Enables root login without password
- Includes your `helloworld` package in the image

### Step 4: Build and Boot the Image

Kas will clone the necessary repositories, set up the build environment, build the image, and boot it in QEMU:

```bash
cd ~/advent/day-03

# Build the image and boot it in QEMU
kas shell hello-yocto.yml -c "runqemu snapshot nographic"
```

This single command will:
1. Clone all required repositories (if not already present)
2. Set up the build environment
3. Build the `core-image-minimal` image (this will take 30-60 minutes on first build)
4. Boot the image in QEMU using snapshot mode

The first build will take significant time as it builds:
- Cross-compilation toolchain
- Linux kernel
- Root filesystem
- All dependencies

Subsequent builds will be faster due to caching.

### Step 5: Test Your Custom Package

Once the system boots, login with `root` (no password required). Then test your custom package:

```bash
helloworld
```

You should see:
```
Hello World
Welcome to Advent of Embedded Linux
```

## Custom Layer
You can find the source code to the build configuration and the meta-advent layer here: [meta-advent](https://github.com/kanakshilledar/meta-advent)

## Expected Outcome

After completing this challenge, you should have:

1. A working Yocto Project build environment using kas
2. A complete embedded Linux distribution built for RISC-V
3. Your own custom layer (`meta-advent`) with a package recipe
4. A custom program (`helloworld`) included in the final image
5. A bootable system running in QEMU with your custom package
6. Root login enabled without password

When you boot the system and run `helloworld`, you should see:
```
Hello World
Welcome to Advent of Embedded Linux
```

Verification steps:
- Verify the package works by running it
- Verify you can login as root without a password
- Explore the build directory structure created by kas

You've learned:
- How to use kas for Yocto Project builds
- The structure of Yocto layers and recipes
- How to create custom packages
- How to integrate custom packages into images using kas configuration
- How to enable root login without password
- The Yocto build process and workflow with kas

## Extras

- **Package a more complex program**: Create a recipe for an existing open-source project by downloading its source tarball and writing a recipe to build and install it.

- **Create a custom image**: Develop your own image recipe instead of using `core-image-minimal`, including specific packages and configurations tailored to your needs.

- **Add patches to recipes**: Create patch files for your source code and apply them in recipes using `SRC_URI` with `file://` references.

- **Explore build artifacts**: Investigate the `build/tmp/work` directory to understand how Yocto builds packages, examining source, build, and install directories.

- **Experiment with kas configuration**: Try different machines, distros, or add additional layers to your `hello-yocto.yml` file to customize your build environment.

- Yocto project documentation: [https://docs.yoctoproject.org](https://docs.yoctoproject.org) - Official yocto project documentation
- meta-riscv: [https://github.com/riscv/meta-riscv](https://github.com/riscv/meta-riscv) - Yocto layer for riscv
- meta-raspberrypi: [https://github.com/agherzan/meta-raspberrypi](https://github.com/agherzan/meta-raspberrypi) - Yocto layer for raspberry pi


---
