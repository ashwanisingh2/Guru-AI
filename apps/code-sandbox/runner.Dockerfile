FROM node:20-alpine

RUN adduser -D runner
WORKDIR /sandbox
USER runner

COPY --chown=runner:runner runner.js /sandbox/runner.js

ENV MEMORY_LIMIT_MB=256
ENV TIME_LIMIT_MULTIPLIER=2

CMD ["node", "/sandbox/runner.js"]
