FROM mcr.microsoft.com/dotnet/sdk:5.0
WORKDIR /app

RUN mkdir -p /usr/share/man/man1mkdir -p /usr/share/man/man1
RUN apt-get update && apt-get install -y openjdk-11-jdk

RUN dotnet tool install --global dotnet-sonarscanner

ENV PATH="${PATH}:/root/.dotnet/tools"

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - \ 
	&& apt update \
	&& apt install -y nodejs

COPY ./dist /dist


ENTRYPOINT ["node", "/dist/index.js"] 
