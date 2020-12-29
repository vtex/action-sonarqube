#!/bin/sh -l

set -e

OWNER=$(dirname "${GITHUB_REPOSITORY}")
REPOSITORY=$(basename "${GITHUB_REPOSITORY}")

[[ -z ${INPUT_PROJECTKEY} ]] && SONAR_PROJECT="${OWNER}-${REPOSITORY}" || SONAR_PROJECT="${INPUT_PROJECTKEY}"
[[ -z ${INPUT_PROJECTNAME} ]] && SONAR_PROJECT="${OWNER}-${REPOSITORY}" || SONAR_PROJECT="${INPUT_PROJECTNAME}"

sonar-scanner \
  -Dsonar.projectKey=${SONAR_PROJECT} \
  -Dsonar.projectName=${SONAR_PROJECT} \
  -Dsonar.sources=. \
  -Dsonar.projectBaseDir=. \
  -Dsonar.host.url=${INPUT_HOST} \
  -Dsonar.login=${INPUT_TOKEN}