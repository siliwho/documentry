---
layout: post
title:  "Hello OpenSBI"
date:   2024-09-08 10:03:43 +0530
categories: riscv kernel opensource opensbi
author: Kanak Shilledar
---

In this post we will discuss on how we can get a `Hello World!` printed on the
OpenSBI console. Let's dive into it

## What is OpenSBI?

OpenSBI (Open Source Supervisor Binary Interface) is a critical software layer
in the RISC-V ecosystem. SBI is an interface between the Supervisor Execution
Environment (SEE) and the supervisor. It allows the supervisor to execute some
privileged operations by using the ecall instruction. Examples of SEE and
supervisor are M-Mode and S-Mode on Unix-class platforms, where SBI si the only
interface between them, as well as the Hypervisor extended-supervisor (HS) and
the Virtualized Supervisor (VS). OpenSBI is an open-source reference
implementation of the RISCV SBI specification and acts as a minimal runtime
environment that executes in Machine Mode (M-Mode), the most privileged mode
of execution in RISC-V. The primary purpost of OpenSBI is to offer platform
services to operating systems running in Supervisor Mode (S-Mode).

## Why do we need OpenSBI?

The RISC-V spec is designed to be minimal and modular, which means the ISA
doesn't dictate how the firmware works beyond the most essential pieces.
The S-Mode Kernel can only access a subset of CSRs (Control and Status
Registers - these are auxiliary registers which are used for reading status
and changing the configurations), a lot of I/O in S-Mode can be accessed but
only a few things are done in the SBI implementation as per the current spec.
Here we have OpenSBI which is a reference implementation. This way, your OS
can call any SBI function and offload privileged tasks like setting up traps
or powering off the system to M-Mode. Technically you can go ahead without
OpenSBI by just writing your own interface or by using your own custom SBI
implementation ([oreboot](https://github.com/oreboot/oreboot) is a perfect example for
this).

## Two words on RISC-V

RISC-V is an open and extensible instruction set. It is governed by
the [RISC-V International](https://riscv.org). The RISC-V architecture has
two main specs

* Volume 1, Unprivileged Specification
* Volume 2, Privileged Specification

The unprivileged spec defines the main ISA but the privileged spec is responsible
for the modes.

RISC-V is split into four privilege levels.

* M-Mode (machine mode) highest and most privileged
* H (hypervisor) not yet available in hardware
* S-Mode (supervisor mode) used by kernels for regular OS-level operations.
* U-Mode (user mode) user applications

OpenSBI changes the environment from M-Mode to S-Mode to make the environment
suitable for the kernel to boot.

## Let's print Hello world

We will be printing hello world in RISC-V assembly.

You can view the source code on github: <https://github.com/kanakshilledar/hello-opensbi>

```assembly
_start:
  li  a0, 'H'
  li  a7, 0x01
  ecall
  li  a0, 'e'
  li  a7, 0x01
  ecall
  li  a0, 'l'
  li  a7, 0x01
  ecall
  li  a0, 'l'
  li  a7, 0x01
  ecall
  li  a0, 'o'
  li  a7, 0x01
  ecall
  li  a0, ' '
  li  a7, 0x01
  ecall
  li  a0, 'W'
  li  a7, 0x01
  ecall
  li  a0, 'o'
  li  a7, 0x01
  ecall
  li  a0, 'r'
  li  a7, 0x01
  ecall
  li  a0, 'l'
  li  a7, 0x01
  ecall
  li  a0, 'd'
  li  a7, 0x01
  ecall
  li  a0, '!'
  li  a7, 0x01
  ecall
  li  a0, '\n'
  li  a7, 0x01
  ecall
  li  a0, '\r'
  li  a7, 0x01
  ecall
  wfi
```

To compile this you will need the riscv64 toolchain which you can easily
get from distribution's package manager.

Before we run it lets take a closer look at the code.

* `_start`: This a lable which marks as the entry point for our program.
* `li a0, 'H'`: `li` is a mnemonic which stands for load immediate which
loads the value `H` into the register `a0`.
* `a7` is a systemcall number register in RISC-V and 0x01 corresponds
to the `write()` systemcall.
* `ecall`: This instruction triggers an environment call. It results in
printing the character stored in the `a0` register to the console.
* `wfi`: Wait for interrupt opcode tells the CPU to halt until any external
event occurs.

### Running the code

You can run the code via the included **Makefile** which will assemble the
code and run on qemu target.

```console
make run
```

You should get the following output.
![OpenSBI Output](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/awihfmf37im7tk5py1ru.png)

To exit out of qemu you can press `CTRL + ALT + X`

## Conclusion

You must be having a question that we have successfully printed hello
world but what's next? Why even bother printing it? The main purpose of
this activity is to be able to print to the console a lot of things which
are required in the early boot stages of the RISC-V system. The understanding
of how to interact with M Mode through OpenSBI opens up a lot of potential for
optimizing system-level operations, developing custom platform code, etc.
OpenSBI is foundational and knowing your way around it is crucial if you're
serious about RISC-V development.

Thanks for reading!
