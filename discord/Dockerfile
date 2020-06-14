FROM node:lts

# create and enter working dir
RUN mkdir /app
WORKDIR /app

# install nodemon globally
RUN npm add nodemon -g

# copy and install npm packages
COPY package*.json ./
RUN npm install

# and everything else
COPY . ./

# run with nodemon to restart on changes
CMD [ "nodemon", "--legacy-watch", "./dist/index.js" ]