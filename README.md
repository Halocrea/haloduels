# Halo Duels 

This is a Discord bot managing a "duels" mini-game.

## Install 

**With Docker:**
```
git clone https://github.com/tepec/haloduels.git
cd haloduels

cp .env.dist .env
vi .env
#provide the information required in the .env file

docker build -t haloduels .
docker run -d -v /home/docker/haloduels/saves:/app/saves --restart=always --name=haloduels haloduels
```

**Without Docker:**
Make sure you have Node.js and Yarn installed on your machine.
```
git clone https://github.com/tepec/haloduels.git
cd haloduels

yarn

node index.js
```
