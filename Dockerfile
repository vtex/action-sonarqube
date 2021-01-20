FROM sonarsource/sonar-scanner-cli

COPY ./dist /dist

ENTRYPOINT ["node", "/dist/index.js"] 