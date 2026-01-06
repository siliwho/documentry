---
layout: post
title: "Advent of Embedded Linux — Day 1: Build RISC-V Linux for QEMU"
date: 2025-12-04 12:00:00 +0100
categories: [embedded-linux, advent]
---

# Day 1 — Build RISC-V Linux for QEMU

## Overview

Welcome to the first day of the Advent of Embedded Linux! Today, you'll build a RISC-V Linux kernel from scratch and run it in QEMU. This challenge is hardware-independent, meaning you can complete it on any Linux machine without special hardware. By the end of this day, you'll have a working RISC-V Linux kernel which will boot an initramfs running on qemu.

This foundation is crucial for understanding how embedded Linux systems are constructed. You'll learn about cross-compilation toolchains, kernel configuration, and boot processes—all essential skills for embedded Linux development.

## What You Will Do

- Install the RISC-V cross-compilation toolchain
- Download and configure the Linux kernel for RISC-V
- Build the kernel with u-root initramfs
- Boot the complete system in QEMU and verify it works

## Understanding the RISC-V Boot Process

Before diving into building the kernel, it's important to understand how RISC-V systems boot and the different components involved.

### RISC-V Privilege Modes

RISC-V defines three privilege modes (also called privilege levels) that provide hardware-enforced isolation:

1. **Machine Mode (M-mode)**: The highest privilege level with full access to all hardware features. This is where firmware and bootloaders typically run. Machine mode is always present and cannot be disabled.

2. **Supervisor Mode (S-mode)**: Used by operating system kernels. Supervisor mode has restricted access compared to machine mode and relies on machine mode for certain operations like handling interrupts and managing memory protection.

3. **User Mode (U-mode)**: The lowest privilege level for application code. User mode has the most restrictions and cannot directly access privileged resources.

The privilege modes form a security hierarchy: Machine mode can control supervisor mode, and supervisor mode can control user mode.

### The Boot Chain

In a typical RISC-V embedded system, the boot process follows this chain, but it totally depends on the target hardware:

```
Hardware Reset → OpenSBI (M-mode) → u-boot (S-mode) → Linux Kernel (S-mode) → User Applications (U-mode)
```

**OpenSBI (Open Supervisor Binary Interface)** is a RISC-V platform firmware that runs in machine mode. It provides:
- Platform initialization (CPU, memory, devices)
- SBI (Supervisor Binary Interface) implementation for the kernel
- A standardized interface between the kernel and the hardware

**u-boot** is a bootloader that typically runs in supervisor mode. It handles:
- Loading the kernel from storage
- Device tree setup
- Passing boot parameters to the kernel
- Network booting and other advanced boot scenarios

**Linux Kernel** runs in supervisor mode and manages system resources, scheduling, and provides services to user applications.

### We are not building u-boot?

In our QEMU example, we're using a simplified boot process that skips u-boot:

```
QEMU Reset → OpenSBI (built into QEMU) → Linux Kernel (directly)
```

We don't need u-boot because:
- QEMU's `-kernel` option directly loads the kernel image
- QEMU handles the initial boot setup
- We're using a simple initramfs, so there's no need to load from storage
- This simplifies the setup for learning purposes

In real hardware or more complex scenarios, u-boot would be necessary to:
- Load the kernel from flash, SD card, or network
- Handle multiple boot options
- Provide a boot menu or recovery options
- Initialize complex hardware configurations


## Step-by-Step Guide

### Prerequisites

First, ensure you have the necessary build tools installed on your Ubuntu 22.04 system:

```bash
sudo apt update
sudo apt install -y build-essential git wget curl bc bison flex \
    libssl-dev libncurses-dev libelf-dev python3 python3-pip \
    qemu-system-riscv64
```

### Step 1: Create Workspace Directory

First, create a workspace directory for this project:

```bash
mkdir -p ~/advent/day-01
cd ~/advent/day-01
```

### Step 2: Install RISC-V Cross-Compilation Toolchain

#### What is a Cross-Compilation Toolchain?

A cross-compilation toolchain is a set of development tools (compiler, linker, assembler, etc.) that runs on one architecture (your host machine, typically x86_64) but produces binaries for a different architecture (the target, in this case RISC-V). The "cross" refers to crossing from one architecture to another.

#### Why is it Required?

When developing for embedded systems or different CPU architectures, you typically can't run the target hardware on your development machine. For example, if you're on an x86_64 laptop, you can't directly compile and test RISC-V binaries. A cross-compilation toolchain allows you to:

- Compile code on your host machine for the target architecture
- Build kernels, bootloaders, and applications without needing the target hardware
- Leverage the faster compilation speed of your host machine
- Develop and test embedded systems in a controlled environment

#### Understanding Toolchain Triples

A toolchain triple is a naming convention that identifies the target system. It has the format: `<arch>-<vendor>-<os>-<abi>`

For example, `riscv64-linux-gnu` breaks down as:
- **arch**: `riscv64` - The target architecture (64-bit RISC-V)
- **vendor**: (empty/omitted) - The toolchain vendor (often omitted for generic toolchains)
- **os**: `linux` - The target operating system
- **abi**: `gnu` - The application binary interface (GNU/Linux ABI)

Common variations you might see:
- `riscv64-unknown-linux-gnu` - Generic RISC-V Linux toolchain
- `riscv64-linux-gnu` - Distribution-provided RISC-V Linux toolchain
- `arm-linux-gnueabihf` - ARM hard-float Linux toolchain

#### Installing from Distribution Package Managers

The easiest way to install a cross-compilation toolchain is through your distribution's package manager. This ensures compatibility with your system and easy updates.

**On Debian/Ubuntu:**

```bash
sudo apt update
sudo apt install -y gcc-riscv64-linux-gnu
```


After installation, verify the toolchain is working:

```bash
riscv64-linux-gnu-gcc --version
```

You should see output showing the GCC version for RISC-V. The toolchain binaries will be prefixed with `riscv64-linux-gnu-`, such as:
- `riscv64-linux-gnu-gcc` - C compiler
- `riscv64-linux-gnu-g++` - C++ compiler
- `riscv64-linux-gnu-ld` - Linker
- `riscv64-linux-gnu-objdump` - Object file dumper

### Step 3: Download and Configure the Linux Kernel

We'll use the mainline Linux kernel. Let's clone and configure it:

```bash
cd ~/advent/day-01

# Clone Linux kernel
git clone https://github.com/torvalds/linux
cd linux

# Configure for QEMU RISC-V virt machine
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig

# Optional: Customize kernel configuration
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- menuconfig
```

In menuconfig, you can explore options, but the default configuration should work fine for QEMU. Exit and save if you made changes.

**Note:** The `ARCH=riscv` option specifies the target architecture (RISC-V), while `CROSS_COMPILE=riscv64-linux-gnu-` tells the build system which cross-compilation toolchain to use. These options are essential when building the kernel for an architecture different from your host machine.

### Step 4: Download u-root Initramfs

Instead of building BusyBox, we'll use u-root, a Go-based userspace that provides a complete root filesystem. Download a pre-built u-root image from the releases:

```bash
cd ~/advent/day-01

# Download u-root for RISC-V (choose the variant you prefer, e.g., minimal, core, or all)
# For this example, we'll use the minimal variant
wget https://github.com/linuxboot/u-root-builder/releases/download/v0.0.1/u-root_riscv64_minimal.cpio.xz

# Extract the cpio archive
unxz u-root_riscv64_minimal.cpio.xz
```

This gives you a CPIO archive containing a minimal root filesystem with essential utilities.

### Step 5: Configure Kernel with Initramfs

Now we need to configure the kernel to include the u-root initramfs. We'll do this through menuconfig:

```bash
cd ~/advent/day-01/linux

# Open kernel configuration menu
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- menuconfig
```

In menuconfig, navigate to:
- **General setup** → **Initramfs source file(s)**
- Enter the full path to your u-root cpio file: `/<your path to>/u-root_riscv64_minimal.cpio`


### Step 6: Build the Linux Kernel

Build the kernel with the embedded initramfs:

```bash
# Build kernel (this will take several minutes)
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc)

# The kernel image will be at: arch/riscv/boot/Image
```

Verify the build artifact:

```bash
ls -lh arch/riscv/boot/Image
```

### Step 7: Boot the System in QEMU

Now let's boot everything in QEMU:

```bash
cd ~/advent/day-01

qemu-system-riscv64 -machine virt -nographic -kernel linux/arch/riscv/boot/Image -append "console=ttyS0"
```

You should see the kernel boot messages and then land in a u-root shell. Try some commands:

```bash
ls
ps
uname -a
cat /proc/cpuinfo
```

To exit QEMU, press `Ctrl+A` then `X`.

#### Why OpenSBI Without Building It?

You might notice that OpenSBI messages appear during boot even though we haven't built or downloaded OpenSBI. This is because **QEMU includes OpenSBI firmware built-in** for the `virt` machine type.

When you run:
```bash
qemu-system-riscv64 -machine virt -kernel linux/arch/riscv/boot/Image
```

QEMU automatically:
1. Loads its built-in OpenSBI firmware into machine mode
2. Initializes the RISC-V platform (CPU, memory, devices)
3. Loads your kernel image and starts it in supervisor mode
4. The kernel then uses SBI calls to interact with OpenSBI for platform services

This built-in OpenSBI is convenient for development and testing, but in production systems, you would typically build and flash your own OpenSBI firmware tailored to your specific hardware platform.


## Expected Outcome

After completing this challenge, you should have:

1. A working RISC-V cross-compilation toolchain installed
2. A compiled Linux kernel for RISC-V with embedded u-root initramfs
3. A bootable system running in QEMU

When you boot the system, you should see:
- Kernel boot messages showing the RISC-V processor initialization
- OpenSBI (Supervisor Binary Interface) messages
- Kernel version and architecture information
- A functional u-root shell where you can run basic commands

Verification steps:
- Run `uname -a` and confirm it shows RISC-V architecture
- Run `cat /proc/cpuinfo` to see CPU information
- Run `ls /proc` to verify procfs is mounted
- Run `ps` to see running processes

You've learned:
- What cross-compilation toolchains are and why they're needed
- How to install and use a cross-compilation toolchain from distribution packages
- How to cross-compile the Linux kernel for a different architecture
- How to embed an initramfs (u-root) into the kernel
- How to use QEMU to emulate RISC-V hardware
- The boot process of an embedded Linux system

## Extras

Here you can find some exercises or documentation to what we discussed above.

- **Customize the kernel**: Rebuild the kernel with additional features enabled (e.g., network support, filesystem drivers), try building different branches as well such as Stable or LTS. Modify the QEMU command to add network support.

- **Try different u-root variants**: Download and test different u-root variants (minimal, core, embedded, all) to see the differences in available utilities and filesystem size.

- **OpenSBI Documentation**: [https://github.com/riscv-software-src/opensbi](https://github.com/riscv-software-src/opensbi) - Official OpenSBI repository and documentation
- **Hello OpenSBI**: [Hello OpenSBI](/_posts/2024-09-07-hello-opensbi/) - A hello world to OpenSBI.

- **Linux Documentation**: [Linux Documentation](https://docs.kernel.org/) - A detailed documentation of the Linux Kernel.

- **Contributing to Kernel**: [Writing a patch](/_posts/2024-08-31-lets-write-a-patch.md) - My notes on writing a patch in the Linux Kernel.

---

