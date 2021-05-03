FROM ubuntu:21.04

ARG DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install nodejs npm curl -y
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash
RUN az aks install-cli

WORKDIR /app

COPY ./package*.json .
RUN npm install

COPY . .
RUN npm install -g


RUN useradd -ms /bin/bash boxboat
USER boxboat