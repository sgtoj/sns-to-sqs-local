# ------------------------------------------------------------------- build ---

FROM node:12-alpine as build

# directory for the app

RUN mkdir -p /opt/app
WORKDIR /opt/app

# set to dev env to install packages required tsc
ENV NODE_ENV development
ENV PATH /opt/node_modules/.bin:$PATH

# intentally not installing node_modules inside the /opt/app dir; this makes
# for a better experience when using image in development environment

ADD package*.json /opt/
RUN cd /opt/app \
    && npm install \
    && npm audit fix --only=prod \
    && npm cache clean --force

ADD ./ /opt/app

RUN tsc

# ------------------------------------------------------------------- prune ---

FROM build as prune

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

RUN npm prune

# ----------------------------------------------------------------- package ---

FROM alpine:latest as package

COPY --from=prune /opt/ /opt/

RUN apk add zip \
    && cd /opt/app \
    && mv /opt/node_modules ./node_modules \
    && cp -f /opt/package*.json ./ \
    && zip -r /tmp/package.zip .

# ----------------------------------------------------------------- runtime ---

FROM node:12-alpine as runtime

WORKDIR /opt/app


ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV PATH /opt/node_modules/.bin:$PATH

ADD ngrok.yml  /root/.ngrok2/ngrok.yml
COPY --from=prune /opt/ /opt/

CMD [ "node", "index.js" ]
