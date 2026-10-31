# History detectors (VEL/DOCS family) shell out to `git`; the base layer provides it
# (without a git binary those detectors degrade to unknown via the error contract).
# No build runs inside: the bundle is built on the host (`npm run build:cli`) and
# copied in, so the image holds exactly the tested artifact bytes.
FROM debian:12-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY --from=gcr.io/distroless/nodejs20-debian12:latest /nodejs /nodejs

FROM base
# `latest` is a local convenience tag; pin by digest for any real registry push.
LABEL org.opencontainers.image.source="https://github.com/open-legacyleap/leapscore" \
      org.opencontainers.image.title="leapscore-scan" \
      org.opencontainers.image.description="LeapScore scanner — single readable ESM bundle on Node 20"
COPY apps/scanner/dist/leapscore-scan.mjs /leapscore-scan.mjs

WORKDIR /work

# `leapscore-scan <argv…>` — pass `scan <path> --out <dir>` as the container args.
# The image is stateless: mount the repo and an output volume for the report trio.
ENTRYPOINT ["/nodejs/bin/node", "/leapscore-scan.mjs"]
CMD ["--help"]
