---
layout: post
title:  "Let's Write a Patch"
date:   2024-08-31 10:03:43 +0530
categories: linux kernel opensource
author: Kanak Shilledar
---

You’ve done the research, you’ve learned the basics, and now it’s time to roll up
your sleeves and get your hands dirty. It’s time to create your first Linux kernel
patch and send it off to the mailing list. I know—it sounds a bit daunting, but
trust me, once you go through the process, you’ll see it’s not as scary as it
seems. Plus, nothing beats the feeling of seeing your code become part of something
as significant as the Linux kernel.

In this post, I’m going to walk you through the whole process, from setting up your
email client to generating your patch, and finally, sending it off to the mailing
list. This post may not be as heavily documented and indepth as compared to the
[official documentation](https://kernelnewbies.org/FirstKernelPatch), which should always be preferred.
Let's Get Started!

## Setting Up the email client

I use the `git send-email` to send the patches. As discussed in the previous blog post,
we need to send the patches via email to the mailing lists. I have created a separate
GMail account to handle the mailing lists tasks, but it's totally your preference.

To use GMail add the following in your **~/.gitconfig**

```Shell
[sendemail]
        smtpuser = <your_email@gmail.com>
        smtpserver = smtp.googlemail.com
        smtpencryption = tls
        smtpserverport = 587
        smtppass = <your password here>
```

> **NOTE:**
> You will need to generate a passkey for your gmail account from your google
> account security page. Your standard GMail account password won't work.

## Make some changes

Now that we have our email client ready we will make some changes to the source code.

Clone the kernel source using

```Shell
git clone  https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git
```

You can find some bugs to fix in their [bugzilla](https://bugzilla.kernel.org/),
or fix some documentation, or add some features, etc. Just remember that everytime
you start working or before sending the patch try to rebase your commits by pulling
first. (pull early and pull often)

## Writing Good Commit Messages

In the Linux kernel world, commit messages are super important. They need to be
clear, concise, and follow a specific format.

## The Structure of a Good Commit Message

* Subject Line: This should be short (50 characters or less) and describe what the
  patch does.
* Commit Body: Here, you explain why you’re making this change. Include any relevant
  context, like bug IDs or references to discussions on the mailing list.
* Sign-off: This is a Developer’s Certificate of Origin (DCO) that confirms you wrote
  the code or have the right to pass it on as open source. You add this with
  `git commit -s`.

> **TIP:**
> You can find good commit messages just by looking at the previous commits :)
>
> ```Shell
> $ git log
> Author: Kanak Shilledar <kanakshilledar@gmail.com>
> Date:   Sun Jun 9 14:51:06 2024 +0530
>
>   dt-bindings: riscv: cpus: add ref to interrupt-controller
>
>   removed the redundant properties for interrupt-controller
>   and provide reference to the riscv,cpu-intc.yaml which defines
>   the interrupt-controller. making the properties for riscv
>   interrupt-controller at a central place.
>
>   Reviewed-by: Conor Dooley <conor.dooley@microchip.com>
>   Signed-off-by: Kanak Shilledar <kanakshilledar@gmail.com>
> ```

## Generating a Patch

Once your commit message is set, it’s time to generate the patch file. This is what
you’ll be sending to the mailing list.

```Shell
git format-patch HEAD~<number of commits>
```

If you happen to make a lot of commits along with a lot of patches it's best suggested
to use a cover letter. You can do this via the following command

```Shell
git format-patch --base=auto -<number of commits> -o outgoing --cover-letter
```

## Running checkpatch

There is a **checkpatch.pl** script inside the **scripts/** directory which tries to
catch style and other issues related to your patch. You can run it via

```Shell
./scripts/checkpatch.pl patch-name.patch
```

Warnings can be ignored (to some extent) but errors should be fixed right away.
If you get any issues related to whitespace you can fix them just by running the
**cleanpatch** script. If there are some other errors fix them and ammend your changes.
Repeat this until all the errors are gone.

## Finding the Maintainers

Now that our patch is ready we need to send it to the maintainers on email.
There is another script which helps us find the maintainers for our area of change.

```Shell
$ ./scripts/get_maintainer.pl patch-name.patch
Jisheng Zhang <jszhang@kernel.org> (maintainer:RISC-V THEAD SoC SUPPORT)
Guo Ren <guoren@kernel.org> (maintainer:RISC-V THEAD SoC SUPPORT)
Fu Wei <wefu@redhat.com> (maintainer:RISC-V THEAD SoC SUPPORT)
Rob Herring <robh@kernel.org> (maintainer:OPEN FIRMWARE AND FLATTENED DEVICE TREE BINDINGS)
Krzysztof Kozlowski <krzk+dt@kernel.org> (maintainer:OPEN FIRMWARE AND FLATTENED DEVICE TREE BINDINGS)
Conor Dooley <conor+dt@kernel.org> (maintainer:OPEN FIRMWARE AND FLATTENED DEVICE TREE BINDINGS)
Paul Walmsley <paul.walmsley@sifive.com> (supporter:RISC-V ARCHITECTURE)
Palmer Dabbelt <palmer@dabbelt.com> (supporter:RISC-V ARCHITECTURE)
Albert Ou <aou@eecs.berkeley.edu> (supporter:RISC-V ARCHITECTURE)
linux-riscv@lists.infradead.org (open list:RISC-V THEAD SoC SUPPORT)
devicetree@vger.kernel.org (open list:OPEN FIRMWARE AND FLATTENED DEVICE TREE BINDINGS)
linux-kernel@vger.kernel.org (open list)
```

## Sending the Patch

Finally, the moment we have been waiting for is here. Let's send our patch to the
mailing list.

```Console
$ git send-email \
--cc-cmd='./scripts/get_maintainer.pl --norolestats your-patch.patch' \
your-patch.patch
```

Now just wait for the maintainers to respond and act accordingly.

## Monitoring and Responding

Now that our patch is sent to the mailing list you can view it in the [mailing list](https://lore.kernel.org)
or [patchwork](https://patchwork.kernel.org). If you don't get any feedback on
your patch it's best to wait for 14 days before sending again. If you are resending
send it with the **"RESEND"** subject prefix.

If the maintainers ask you to make some changes do them accordingly and generate a new
patch and send it again. This time try add a version tag to your patch and explain
what all changes you did in the current version. The version tag can be added by using
the `-v<version_number>` switch. If you are confused don't hesitate to ask questions
on your feedback. Also test thoroughly before sending the patches. So that it will be
accepted in very few iterations.

Congratulations on sending your first patch to the Linux Kernel!

Happy Coding :)
