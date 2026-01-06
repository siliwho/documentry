---
layout: post
title: "Advent of Embedded Linux — Day 2: Buildroot for QEMU + Custom Package"
date: 2025-12-06 12:00:00 +0100
categories: [embedded-linux, advent]
---

# Day 2 — Buildroot for QEMU + Custom Package

## Overview

Today, you'll work with Buildroot to build a complete embedded Linux system for RISC-V. Buildroot is a powerful build system that automates the creation of a bootable Linux system, including the cross-compilation toolchain, kernel, and root filesystem. You'll configure Buildroot for QEMU's RISC-V virt machine, create a custom package, and boot the system with an ext2 filesystem on a virtio disk.

## What is Buildroot?

**Buildroot** is a simple, efficient, and easy-to-use embedded Linux build system. It generates a complete, bootable Linux system by automating the process of:

- Building a cross-compilation toolchain for your target architecture
- Compiling the Linux kernel
- Building a root filesystem with your selected packages
- Generating bootable images (kernel, filesystem, firmware)

### Why is Buildroot Necessary?

Building an embedded Linux system from scratch involves many complex steps:
- Cross-compiling hundreds of packages
- Resolving dependencies between packages
- Managing different build systems (autotools, CMake, Meson, etc.)
- Handling different architectures and configurations
- Creating filesystem images in various formats

Doing this manually would be extremely time-consuming and error-prone. Buildroot solves this by:
- **Automation**: Handles all the build complexity automatically
- **Reproducibility**: Same configuration produces the same result every time
- **Simplicity**: Single `make` command builds everything
- **Flexibility**: Easy to customize and add your own packages
- **Speed**: Faster builds compared to alternatives like Yocto

I personally like Buildroot because it strikes the perfect balance between simplicity and power. It's straightforward enough to understand what's happening under the hood, yet powerful enough to build production-ready embedded systems. Unlike Yocto, which can be overwhelming for beginners, Buildroot has a gentle learning curve while still teaching you the fundamentals of embedded Linux builds.

## What You Will Do

- Download and configure Buildroot for RISC-V QEMU using `qemu_riscv64_virt_defconfig`
- Build a complete embedded Linux system with ext2 filesystem
- Create a custom package with proper directory structure
- Understand the files required for a Buildroot package and their significance
- Integrate your custom package into the build
- Boot the Buildroot system in QEMU with virtio disk

## Step-by-Step Guide

### Prerequisites

Install Buildroot dependencies:

```bash
sudo apt update
sudo apt install -y which sed make binutils build-essential gcc g++ \
    bash patch gzip bzip2 perl tar cpio unzip rsync file bc wget \
    python3 python3-setuptools
```

### Step 1: Download and Configure Buildroot

Download the latest stable Buildroot release:

```bash
mkdir -p ~/advent/day-02
cd ~/advent/day-02

# Download Buildroot (using github as example)
# personally i prefer the github mirror as compared to downloading the whole archive of specific release
git clone https://github.com/buildroot/buildroot
cd buildroot

# Use the RISC-V 64-bit defconfig for QEMU virt machine
make qemu_riscv64_virt_defconfig
```

This defconfig is pre-configured for QEMU's RISC-V virt machine with sensible defaults. The configuration includes:
- RISC-V 64-bit target architecture
- Linux kernel configured for QEMU virt machine
- OpenSBI firmware (fw_jump)
- ext2 filesystem image generation
- Basic packages including BusyBox

You can find other configurations for numerous boards inside the `config/` directory.

You can optionally customize the configuration:

```bash
# Open the configuration menu
make menuconfig
```

In menuconfig, there are multiple options, some of the interesting ones are:
- **Target packages** → Enable additional packages you want
- **Filesystem images** → Make modifications to the file system
- **Kernel** → Adjust kernel version or configuration if needed
- **Bootloaders** → Adjust the bootloader configuration

For this tutorial, the default configuration works perfectly. Save and exit if you made changes.

### Step 2: Create Custom Package Directory Structure

Buildroot uses a specific directory structure for custom packages. Let's create one:

```bash
cd ~/advent/day-02/buildroot

# Create custom package directory
mkdir -p package/custom-pkg

# Create the package directory structure
cd package/custom-pkg
```

### Step 3: Create Your Custom Package

Let's create a simple "hello world" program and its Buildroot package. A Buildroot package requires specific files to define how it's built and integrated into the system.

```bash
cd ~/advent/day-02/buildroot/package/custom-pkg

# Create the source code directory
mkdir -p src
cat > src/hello-buildroot.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(void) {
    printf("Hello from Buildroot!\n");
    printf("This is a custom package\n");
    printf("Running on RISC-V architecture\n");
    return 0;
}
EOF

# Create the Buildroot package Config.in
cat > Config.in << 'EOF'
config BR2_PACKAGE_CUSTOM_PKG
    bool "custom-pkg"
    help
      A simple hello world program demonstrating
      how to create custom packages in Buildroot.
EOF

# Create the package makefile
cat > custom-pkg.mk << 'EOF'
################################################################################
#
# custom-pkg
#
################################################################################

CUSTOM_PKG_VERSION = 1.0
CUSTOM_PKG_SITE = $(CUSTOM_PKG_PKGDIR)/src
CUSTOM_PKG_SITE_METHOD = local
CUSTOM_PKG_LICENSE = MIT

define CUSTOM_PKG_BUILD_CMDS
    $(TARGET_CC) $(TARGET_CFLAGS) $(TARGET_LDFLAGS) \
        $(@D)/hello-buildroot.c -o $(@D)/hello-buildroot
endef

define CUSTOM_PKG_INSTALL_TARGET_CMDS
    $(INSTALL) -D -m 0755 $(@D)/hello-buildroot \
        $(TARGET_DIR)/usr/bin/hello-buildroot
endef

$(eval $(generic-package))
EOF
```

#### Understanding Buildroot Package Files

A Buildroot package requires three essential files:

1. **`Config.in`**: This file defines the package's configuration option in Buildroot's menuconfig system.
   - `config BR2_PACKAGE_CUSTOM_PKG`: Creates a configuration option that can be enabled/disabled
   - `bool "custom-pkg"`: Makes it a boolean (yes/no) option with the display name "custom-pkg"
   - `help`: Provides a description shown in menuconfig
   - This file is included in `package/Config.in` to make the package visible in menuconfig

2. **`custom-pkg.mk`**: This is the Makefile that defines how the package is built and installed.
   - **Package metadata**: `CUSTOM_PKG_VERSION`, `CUSTOM_PKG_SITE`, `CUSTOM_PKG_LICENSE`
   - **`CUSTOM_PKG_SITE`**: Location of the source code (can be a URL or local path)
   - **`CUSTOM_PKG_SITE_METHOD`**: How to obtain the source (`local`, `git`, `wget`, etc.)
   - **`CUSTOM_PKG_BUILD_CMDS`**: Commands to compile the package (runs in the build directory)
   - **`CUSTOM_PKG_INSTALL_TARGET_CMDS`**: Commands to install files to the target filesystem
   - **`$(eval $(generic-package))`**: Tells Buildroot to use the generic package infrastructure

3. **Source code**: The actual program files (in this case, `src/hello-buildroot.c`)
   - Can be local (like ours) or downloaded from a remote location
   - Buildroot will copy or download the source to `output/build/custom-pkg-<version>/` during build

The build process works like this:
1. Buildroot reads `Config.in` to show the package in menuconfig
2. When enabled, Buildroot uses `custom-pkg.mk` to:
   - Extract/download source to `output/build/custom-pkg-1.0/`
   - Run `CUSTOM_PKG_BUILD_CMDS` to compile
   - Run `CUSTOM_PKG_INSTALL_TARGET_CMDS` to install to `output/target/`
3. The installed files become part of the root filesystem image

### Step 4: Integrate Custom Package into Buildroot

Now we need to tell Buildroot about our custom package by adding it to the main package configuration:

```bash
cd ~/advent/day-02/buildroot/package

# Add our package to the main Config.in
# We'll add it in a new section at the end
cat >> Config.in << 'EOF'

menu "Custom packages"
    source "package/custom-pkg/Config.in"
endmenu
EOF
```

This adds a new "Custom packages" menu section in Buildroot's menuconfig, which will include our `custom-pkg` option.

### Step 5: Configure Buildroot to Include Custom Package

Now configure Buildroot to include your package:

```bash
cd ~/advent/day-02/buildroot

make menuconfig
```

In menuconfig:
- Navigate to **Target packages** → **Custom packages** → Enable **custom-pkg**
- Save and exit

Alternatively, you can enable it directly in the defconfig:

```bash
# Enable the package in .config
echo 'BR2_PACKAGE_CUSTOM_PKG=y' >> .config
make olddefconfig
```

### Step 6: Build the System

Now build everything:

```bash
cd ~/advent/day-02/buildroot

# Build (this will take 20-40 minutes the first time)
make

# The build output will be in output/images/
```

The build process will:
1. Download and build the cross-compilation toolchain
2. Build the Linux kernel
3. Build OpenSBI firmware (fw_jump.bin)
4. Build BusyBox and other selected packages
5. Build your custom package
6. Create the root filesystem
7. Generate the ext2 filesystem image (rootfs.ext2)

### Step 7: Verify Build Artifacts

Check what was built:

```bash
cd ~/advent/day-02/buildroot

ls -lh output/images/

# You should see:
# - Image (kernel image)
# - rootfs.ext2 (ext2 filesystem image)
# - fw_jump.bin (OpenSBI firmware)
```

Verify your custom package was built:

```bash
# Check if hello-buildroot exists in the rootfs
ls -la output/target/usr/bin/hello-buildroot

# Or check the build log
grep -i "custom-pkg" output/build/build-time.log
```

### Step 8: Boot the Buildroot System

Boot the system in QEMU:

```bash
cd ~/advent/day-02/buildroot

qemu-system-riscv64 \
    -machine virt \
    -bios output/images/fw_jump.bin \
    -kernel output/images/Image \
    -drive file=output/images/rootfs.ext2,format=raw,if=virtio \
    -append "console=ttyS0 root=/dev/vda rw" \
    -nographic
```

**Understanding the QEMU command:**
- `-machine virt`: Use QEMU's RISC-V virt machine type
- `-bios output/images/fw_jump.bin`: Load OpenSBI firmware (provides SBI interface)
- `-kernel output/images/Image`: Load the Linux kernel
- `-drive file=output/images/rootfs.ext2,format=raw,if=virtio`: Attach the ext2 filesystem as a virtio disk
- `-append "console=ttyS0 root=/dev/vda rw"`: Kernel command line arguments
  - `console=ttyS0`: Use serial console for output
  - `root=/dev/vda`: Mount the first virtio disk as root filesystem
  - `rw`: Mount root filesystem as read-write
- `-nographic`: Disable graphical output, use serial console

Once booted, test your custom package:

```bash
hello-buildroot
```

You should see:
```
Hello from Buildroot!
This is a custom package
Running on RISC-V architecture
```

## Expected Outcome

After completing this challenge, you should have:

1. A working Buildroot build environment configured for RISC-V QEMU virt machine
2. A complete embedded Linux system with ext2 filesystem on virtio disk
3. Your own custom package (`custom-pkg`) integrated into Buildroot
4. A custom program (`hello-buildroot`) included in the root filesystem
5. A bootable system running in QEMU

When you boot the system and run `hello-buildroot`, you should see:
```
Hello from Buildroot!
This is a custom package
Running on RISC-V architecture
```

Verification steps:
- Check that `hello-buildroot` exists in `/usr/bin` on the target
- Run the program and verify output
- Check Buildroot's package list: `make show-info` or check `.config` for `BR2_PACKAGE_CUSTOM_PKG=y`
- Explore the root filesystem: `ls -la output/target/usr/bin/`

You've learned:
- What Buildroot is and why it's necessary for embedded Linux development
- How to configure and build with Buildroot using defconfigs
- The structure of Buildroot packages (Config.in and .mk files) and their significance
- How to create custom packages with local source code
- How to boot a system with ext2 filesystem on virtio disk
- The Buildroot build process and output structure

## Extras

Here you can find some exercises or documentation related to what we discussed above.

- **Package an external project**: Instead of local source, create a package that downloads and builds an external project (e.g., a simple utility from GitHub). Use `CUSTOM_PKG_SITE` with a URL and `CUSTOM_PKG_SITE_METHOD = git` or `wget`.

- **Add package dependencies**: Modify your package to depend on other Buildroot packages. Use `CUSTOM_PKG_DEPENDENCIES` in your .mk file.

- **Add package configuration options**: Create a Config.in with multiple options (e.g., enable/disable features) and use those in your .mk file.


- **Buildroot Documentation**: [Buildroot Manual](https://buildroot.org/downloads/manual/manual.html) - Comprehensive guide to using Buildroot

- **Buildroot Package Documentation**: [Adding Packages](https://buildroot.org/downloads/manual/manual.html#adding-packages) - Detailed guide on creating custom packages

---

