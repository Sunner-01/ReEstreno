"""Create or update the ReEstreno A record, then enable strict HTTPS after TLS is ready."""

import json
import ipaddress
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://api.cloudflare.com/client/v4"


def api(method, path, payload=None):
    body = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(
        BASE + path,
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {os.environ['CLOUDFLARE_API_TOKEN']}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.load(response)
    except urllib.error.HTTPError as error:
        details = error.read().decode(errors="replace")
        raise RuntimeError(f"Cloudflare HTTP {error.code}: {details[:500]}") from error
    if not data.get("success"):
        raise RuntimeError(f"Cloudflare: {data.get('errors')}")
    return data["result"]


def main():
    stage = sys.argv[1] if len(sys.argv) == 2 else ""
    if stage not in {"prepare", "activate", "delete"}:
        raise ValueError("Uso: cloudflare_dns.py prepare|activate|delete")
    domain = os.environ["APP_DOMAIN"].lower().strip()
    ip = os.environ["PUBLIC_IP"].strip()
    zone = os.environ["CLOUDFLARE_ZONE_ID"].strip()
    if not re.fullmatch(r"[a-z0-9][a-z0-9.-]+\.[a-z]{2,}", domain):
        raise ValueError("APP_DOMAIN no es un dominio válido")
    ipaddress.IPv4Address(ip)
    records = api(
        "GET",
        f"/zones/{zone}/dns_records?type=A&name={urllib.parse.quote(domain)}",
    )
    if len(records) > 1:
        raise RuntimeError("Hay varios registros A para el dominio; revísalos en Cloudflare")
    record = records[0] if records else None
    if stage == "delete":
        if record and record["content"] == ip:
            api("DELETE", f"/zones/{zone}/dns_records/{record['id']}")
            print(f"Cloudflare: registro eliminado para {domain}")
        else:
            print(f"Cloudflare: no se eliminó ningún registro de {domain}")
        return
    if stage == "prepare" and record and record["content"] == ip and record.get("proxied"):
        print(f"Cloudflare: {domain} ya apunta a la VM; se conserva el proxy")
        return
    desired = {"type": "A", "name": domain, "content": ip, "proxied": stage == "activate", "ttl": 1}
    if stage == "activate":
        api("PATCH", f"/zones/{zone}/settings/ssl", {"value": "strict"})
    if record:
        api("PATCH", f"/zones/{zone}/dns_records/{record['id']}", desired)
    else:
        api("POST", f"/zones/{zone}/dns_records", desired)
    print(f"Cloudflare {stage}: {domain} -> {ip}")


if __name__ == "__main__":
    try:
        main()
    except (KeyError, ValueError, RuntimeError) as error:
        sys.exit(str(error))
