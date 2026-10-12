FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
RUN groupadd --gid 1001 app && useradd --uid 1001 --gid app --no-create-home app
COPY --from=builder --chown=app:app /app/.next/standalone ./
# Next bundles this driver; the unbundled migration/account scripts also need it.
COPY --from=dependencies --chown=app:app /app/node_modules/postgres ./node_modules/postgres
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
COPY --chown=app:app scripts ./scripts
COPY --chown=app:app db ./db
COPY --chown=app:app app/lib/database.mjs app/lib/passwords.mjs app/lib/questions.js ./app/lib/
COPY --chown=app:app docker/entrypoint.sh ./docker/entrypoint.sh
RUN mkdir -p /app/data/media /app/.next/cache && chown -R app:app /app/data /app/.next/cache
USER app
EXPOSE 3000
ENTRYPOINT ["sh", "docker/entrypoint.sh"]
CMD ["node", "server.js"]
