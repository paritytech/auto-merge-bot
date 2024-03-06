FROM node:20 as Builder

WORKDIR /action

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn run build

FROM node:20-slim

COPY --from=Builder /action/dist /action

ENTRYPOINT ["node", "/action/index.js"]
