FROM node:lts

RUN npm install typescript -g

COPY package*.json /app/

WORKDIR /app

RUN npm install

ENTRYPOINT [ "/bin/bash" ]