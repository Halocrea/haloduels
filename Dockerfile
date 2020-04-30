FROM node:alpine

# Create app directory
WORKDIR /app

# Save that must be shared to the host
RUN mkdir -p /app/data
VOLUME /app/data

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN apk add --no-cache tzdata
ENV TZ=Europe/Paris
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apk add --no-cache --virtual .gyp \
        python \
        make \
        g++ \
    && yarn \
    && apk del .gyp
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

CMD [ "node", "index.js" ]
