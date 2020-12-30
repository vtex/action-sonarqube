FROM sonarsource/sonar-scanner-cli

COPY entrypoint.sh /lala.sh

RUN chmod +x /lala.sh

ENTRYPOINT ["sh", "/lala.sh"]
