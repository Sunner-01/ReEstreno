"""Ensure the two public Docker Hub repositories exist before publishing images."""

import json
import os
import sys
import urllib.error
import urllib.request

BASE = "https://hub.docker.com"
NAMESPACE = "sunner01"
REPOSITORIES = ("reestreno-backend", "reestreno-frontend")


def request(method, path, token=None, payload=None):
    body = None if payload is None else json.dumps(payload).encode()
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return 404, None
        raise RuntimeError(f"Docker Hub HTTP {error.code} en {method} {path}") from error


def main():
    _, auth = request(
        "POST",
        "/v2/auth/token",
        payload={"identifier": NAMESPACE, "secret": os.environ["DOCKERHUB_TOKEN"]},
    )
    token = auth["access_token"]
    for name in REPOSITORIES:
        path = f"/v2/namespaces/{NAMESPACE}/repositories/{name}"
        status, repository = request("GET", path, token)
        if status == 404:
            request(
                "POST",
                f"/v2/namespaces/{NAMESPACE}/repositories",
                token,
                {
                    "name": name,
                    "namespace": NAMESPACE,
                    "registry": "docker.io",
                    "is_private": False,
                    "description": "ReEstreno marketplace",
                },
            )
            print(f"Creado: {NAMESPACE}/{name} (público)")
        elif repository["is_private"]:
            raise RuntimeError(f"{NAMESPACE}/{name} existe como privado; debe ser público para la VM")
        else:
            print(f"Existe: {NAMESPACE}/{name} (público)")


if __name__ == "__main__":
    try:
        main()
    except (KeyError, RuntimeError) as error:
        sys.exit(str(error))
