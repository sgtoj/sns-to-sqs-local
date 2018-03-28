FROM node:8-alpine

ADD ngrok.yml  /root/.ngrok2/ngrok.yml

RUN mkdir -p /opt/app
ENV NODE_ENV development
ENV PATH /opt/app/node_modules/.bin:$PATH

ADD ./package.json /opt/app/package.json
RUN cd /opt/app && npm install && npm cache clean --force

ADD ./ /opt/app

WORKDIR /opt/app
CMD ["npm", "start"]