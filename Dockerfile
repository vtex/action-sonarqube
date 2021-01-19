FROM sonarsource/sonar-scanner-cli

COPY . /
RUN npm install --global yarn
RUN yarn
ENTRYPOINT ["node", "/lib/index.js"]