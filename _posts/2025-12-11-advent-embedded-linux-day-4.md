---
layout: post
title: "Advent of Embedded Linux — Day 4: Writing Your First Kernel Module"
date: 2025-12-11 00:01:00 +0100
categories: [embedded-linux, advent]
---

# Day 4 — Writing Your First Kernel Module — Virtual Temperature Sensor Driver

## Overview

Today, you'll write your first Linux kernel module — a virtual temperature sensor driver that provides temperature readings through the sysfs interface. Unlike a simple "Hello World" driver, this module demonstrates concepts like creating sysfs attributes, generating random data, and integrating with the kernel's kobject framework.

This tutorial uses Buildroot and QEMU, and this will be our last post focusing on QEMU-based development. Future posts in this series will move to actual hardware, so this is your final chance to experiment in a safe virtual environment!

Writing kernel modules is essential for embedded linux development. Whether you're creating drivers for custom sensors, implementing protocol handlers, or adding system functionality, understanding how to write loadable kernel modules opens up a world of possibilities.

## What You Will Do

- Understand the structure of a Linux kernel module
- Write a virtual temperature sensor driver in C
- Learn about sysfs and kobject interfaces
- Package the driver as a Buildroot package
- Load and test the driver in QEMU
- Read temperature values through sysfs

## Prerequisites

- A working Buildroot environment [(as covered in day 2)](https://kanakshilledar.github.io/2025-12-06/advent-embedded-linux-day-2)
- QEMU configured with `qemu_riscv64_virt_defconfig`
- Basic understanding of C programming

## Step-by-Step Guide

### Step 1: Understanding the Driver Code

Let's start by examining the complete driver code. Create a file called `mocktemp.c` with the following content:

```c
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/kobject.h>
#include <linux/sysfs.h>
#include <linux/random.h>

static struct kobject *mock_kobj;

static ssize_t temp_show(struct kobject *kobj, struct kobj_attribute *attr, char *buf)
{
    int temp_value;
    
    temp_value = 30 + (get_random_u32() % 51);
    
    return sysfs_emit(buf, "%d\n", temp_value);
}

static struct kobj_attribute temp_attr = __ATTR_RO(temp);

static int __init mock_init(void)
{
    int ret;
    
    mock_kobj = kobject_create_and_add("mocktemp", kernel_kobj);
    if (!mock_kobj)
        return -ENOMEM;

    ret = sysfs_create_file(mock_kobj, &temp_attr.attr);
    if (ret) {
        kobject_put(mock_kobj);
        return ret;
    }
    
    return 0;
}

static void __exit mock_exit(void)
{
    sysfs_remove_file(mock_kobj, &temp_attr.attr);
    kobject_put(mock_kobj);
}

module_init(mock_init);
module_exit(mock_exit);
MODULE_LICENSE("<Your License>");
MODULE_AUTHOR("<Your Author Name>");
MODULE_DESCRIPTION("Mock Temperature Sensor Driver");
```

#### Code Explanation

Let's break down this driver step by step:

**Header Files:**
- `<linux/module.h>` — Essential for all kernel modules (module loading/unloading macros)
- `<linux/kernel.h>` — Kernel logging and core kernel functions
- `<linux/kobject.h>` — Kernel object management (for sysfs integration)
- `<linux/sysfs.h>` — Sysfs interface functions
- `<linux/random.h>` — Kernel random number generation

**Global Variables:**
```c
static struct kobject *mock_kobj;
```
- `mock_kobj` is a pointer to a kernel object that will represent our driver in sysfs

**Temperature Reading Function:**
```c
static ssize_t temp_show(struct kobject *kobj, struct kobj_attribute *attr, char *buf)
{
    int temp_value;
    
    temp_value = 30 + (get_random_u32() % 51);
    
    return sysfs_emit(buf, "%d\n", temp_value);
}
```

This function is called whenever someone reads from `/sys/kernel/mocktemp/temp`:
- `temp_show` follows sysfs naming convention: `<attribute>_show` for reading
- `get_random_u32()` generates a random 32-bit unsigned integer
- `% 51` gives us a value between 0-50
- Adding 30 gives us a temperature range of 30-80°C (simulating realistic values)
- `sysfs_emit()` safely writes formatted data to the buffer (preferred over `sprintf`)

**Sysfs Attribute Definition:**
```c
static struct kobj_attribute temp_attr = __ATTR_RO(temp);
```

- `__ATTR_RO()` creates a read-only attribute named "temp"
- This macro automatically creates the `temp_show` callback binding
- The macro expects a function named `temp_show` (which we defined above)

**Module Initialization:**
```c
static int __init mock_init(void)
{
    int ret;
    
    mock_kobj = kobject_create_and_add("mocktemp", kernel_kobj);
    if (!mock_kobj)
        return -ENOMEM;

    ret = sysfs_create_file(mock_kobj, &temp_attr.attr);
    if (ret) {
        kobject_put(mock_kobj);
        return ret;
    }
    
    return 0;
}
```

- `__init` marks this function for early memory cleanup (saves memory after init)
- `kobject_create_and_add()` creates a kobject and adds it to sysfs under `/sys/kernel/`
  - First argument: "mocktemp" — the directory name
  - Second argument: `kernel_kobj` — parent directory (`/sys/kernel/`)
- `sysfs_create_file()` creates the actual file `temp` in our directory
- Error handling: if anything fails, we clean up with `kobject_put()`

**Module Cleanup:**
```c
static void __exit mock_exit(void)
{
    sysfs_remove_file(mock_kobj, &temp_attr.attr);
    kobject_put(mock_kobj);
}
```

- `__exit` marks this for code that won't be needed after module removal
- Removes the sysfs file and then the kobject (reverse order of creation)

**Module Macros:**
```c
module_init(mock_init);
module_exit(mock_exit);
MODULE_LICENSE("<Your License>");
MODULE_AUTHOR("<Your Author Name>");
MODULE_DESCRIPTION("Mock Temperature Sensor Driver");
```

- `module_init()` — function called when module is loaded (`insmod` or `modprobe`)
- `module_exit()` — function called when module is unloaded (`rmmod`)
- License metadata (use "GPL" for GPL-licensed code, "Proprietary" for proprietary)
- Author and description are informational

### Step 2: Creating the Buildroot Package

Since Buildroot package creation was covered on [day 2](https://kanakshilledar.github.io/2025-12-06/advent-embedded-linux-day-2), we'll just skip over the basics. However, you'll need to create the package structure if it doesn't exist:

The driver should be packaged so that:
- The source file `mocktemp.c` is compiled into `mocktemp.ko`
- The compiled module is installed to `/lib/modules/$(KERNEL_VERSION)/updates/`

For reference, your Buildroot package would typically include:
- A `Config.in` entry (or add to existing menu)
- A `mocktemp.mk` Makefile that:
  - Defines the source location
  - Uses kernel module build system (`$(LINUX_DIR)/scripts` or Buildroot's kernel module infrastructure)
  - Installs to the target filesystem

My `mocktemp.mk` looks like this:
```Makefile
MOCKTEMP_VERSION = 1.0
MOCKTEMP_SITE = package/mocktemp/src
MOCKTEMP_SITE_METHOD = local

# Use the kernel module infrastructure
$(eval $(kernel-module))
$(eval $(generic-package))
```
After building Buildroot with the package enabled, the module might be at:
```
/lib/modules/6.12.47/updates/mocktemp.ko
```

### Step 3: Building with Buildroot

Assuming you've already set up your Buildroot environment:

```bash
cd ~/buildroot

# Configure for RISC-V QEMU (if not already done)
make qemu_riscv64_virt_defconfig

# Open menuconfig to enable your package
make menuconfig
```

Navigate to your package location in menuconfig and enable it. I usually suggest searching by the package name itself to make your life easy :)

After enabling:

```bash
# Build everything (this will take some time if rebuilding)
make
```

Buildroot will compile your kernel module along with the kernel and root filesystem.

### Step 4: Booting QEMU

After the build completes, boot QEMU using the convenient script that Buildroot generates:

```bash
cd output/images

# Boot QEMU (the script handles all the parameters)
./start_qemu.sh
```

Wait for the system to boot and log in (usually root with no password, or check Buildroot documentation).

### Step 5: Loading the Driver

Once you're logged into the QEMU system, load the kernel module:

```bash
# Load the module
insmod /lib/modules/6.12.47/updates/mocktemp.ko

# Verify it loaded successfully
lsmod | grep mocktemp

# Check kernel messages
dmesg | tail
```

If everything worked correctly, you should see the module in `lsmod` output. If there were errors, check `dmesg` for details.

### Step 6: Testing the Sysfs Interface

Now that the driver is loaded, the sysfs interface should be available:

```bash
# Check that the directory was created
ls -la /sys/kernel/mocktemp/

# Read the temperature
cat /sys/kernel/mocktemp/temp

# Read it a few more times to see different values
cat /sys/kernel/mocktemp/temp
cat /sys/kernel/mocktemp/temp
```

Each time you read from `/sys/kernel/mocktemp/temp`, you should get a different temperature value (since we're using random numbers). The values will be in the range 30-80°C.

### Step 7: Understanding Sysfs

Sysfs is a virtual filesystem that provides a view of the kernel's device model. Our driver creates:

```
/sys/kernel/mocktemp/
└── temp    (read-only file containing temperature)
```

- `/sys/kernel/` is the standard location for kernel subsystems
- `mocktemp` is the kobject directory we created
- `temp` is the attribute file that triggers our `temp_show()` function

When you `cat` the file, the kernel:
1. Recognizes it's a sysfs attribute
2. Calls our `temp_show()` function
3. Our function generates a random temperature
4. The value is formatted and returned as file content

### Step 8: Unloading the Driver

When you're done testing, unload the module:

```bash
# Unload the module
rmmod mocktemp

# Verify it's gone
lsmod | grep mocktemp

# Check that sysfs entry is removed
ls /sys/kernel/mocktemp/
# Should show: "No such file or directory"
```

The `mock_exit()` function handles cleanup, removing the sysfs entries.

## Expected Outcome

After completing this tutorial, you should have:

1. A working kernel module that creates a sysfs interface
2. Understanding of how kernel modules are structured
3. Experience with kobject and sysfs APIs
4. A virtual temperature sensor accessible at `/sys/kernel/mocktemp/temp`
5. Ability to load and unload kernel modules dynamically

When you read from `/sys/kernel/mocktemp/temp`, you should see:
```
67
```
Or any value between 30-80, changing each time you read it.

## Troubleshooting

**Module won't load:**
- Check `dmesg` for error messages
- Verify the module was compiled for the correct kernel version
- Ensure all dependencies are available

**Sysfs entry not appearing:**
- Check that `mock_init()` completed successfully (`dmesg`)
- Verify `kobject_create_and_add()` didn't fail
- Check that `sysfs_create_file()` succeeded

**Permission denied reading temp:**
- Sysfs files should be readable by default
- If issues persist, check filesystem permissions or SELinux/AppArmor policies

**Buildroot build fails:**
- Verify your package configuration files are correct
- Check that kernel headers are available during module build
- Review Buildroot logs in `output/build/mocktemp-*/`

## Key Concepts Learned

- **Kernel Modules**: Loadable code that extends kernel functionality
- **Kobjects**: Kernel objects that represent entities in the device model
- **Sysfs**: Filesystem interface for kernel objects and attributes
- **Module Lifecycle**: `module_init()` for loading, `module_exit()` for cleanup
- **Sysfs Attributes**: Files that provide read/write access to driver data
- **Random Number Generation**: Using kernel's `get_random_u32()` function

## What's Next?

This was our last QEMU-focused post! In upcoming days, we'll move to real hardware and explore:
- Work with Raspberry Pi and DS18B20 Temperature sensor.
- Build yocto images for it
- Create custom applications to access the sensor data, etc...

The concepts you've learned here (sysfs, kobjects, module structure) will directly apply when working with real hardware drivers.

## Extras

- **Add write support**: Modify the driver to accept temperature values via `temp_store()` function and use `__ATTR_RW(temp)` instead of `__ATTR_RO(temp)`.
- **Device class integration**: Instead of placing it under `/sys/kernel/`, integrate it with the device model using `device_create()` and place it under `/sys/class/`.
- **Procfs alternative**: Create a `/proc/mocktemp` interface as an alternative to sysfs.
- **Kernel Rust quick start guide**: [https://docs.kernel.org/rust/quick-start.html](https://docs.kernel.org/rust/quick-start.html) - Official kernel documentation for getting started with Rust in the Linux kernel.
- **Linux Driver Implementers API guide**: [https://docs.kernel.org/driver-api/index.html](https://docs.kernel.org/driver-api/index.html) - Comprehensive guide to the Linux driver API and driver development.

---