#!/usr/bin/env bash
set -euo pipefail
for port in 22 80 443; do
  /usr/sbin/iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null || \
    /usr/sbin/iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
done
