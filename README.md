# SonarQube Action

This is a Github action that runs the [SonarScanner](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/) and add SonarQube Issues as annotations in your pull requests.

## Usage

Before creating your workflow, you need set two secret variables in your repository: The SonarQube server URL and your [SonarQube token](https://docs.sonarqube.org/latest/user-guide/user-token/). The github token secret is automatically created by Github, you just need to reference on your workflow.

```yml
name: Some workflow
on:
    pull_request:
        branches: [master, main]
jobs:
  SonarScanner:
    runs-on: ubuntu-latest
    name: Sonar Scanner
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - name: Install dependencies
        run: yarn install --production=false
      - name: Scan code
        uses: vtex/action-sonarqube@dotnet
        with:
          githubToken: ${{ secrets.GITHUB_TOKEN }} # https://docs.github.com/en/actions/reference/authentication-in-a-workflow#about-the-github_token-secret
          host: ${{ secrets.SQHost }} # Variable set in the Github Secrets
          token: ${{ secrets.SQToken }} # Variable set in the Github Secrets          
          buildCommand: dotnet build <PATH TO SLN and aditional parameters> 
          restoreCommand: dotnet restore <PATH TO SLN and aditional parameters>
          analysisParameters: -d:sonar.exclusions="**/PATH_TO_EXCLUDE/**" -d:sonar.coverage.exclusions="**/PATH_TO_EXCLUDE/**" #parameters: https://docs.sonarqube.org/latest/analysis/analysis-parameters/
```

> If your project uses `typescript`, you need to install the dependencies. If not, you can remove the installation step.

## Variables

The key and name of the SonarQube project will follow the format `github-owner/github-repository` and project base dir will be the project root folder. But if you wish, you can customize the variables as in the example below:

```yml
with:
    githubToken: ${{ secrets.GITHUB_TOKEN }} #required
    host: ${{ secrets.SQHost }} # required
    token: ${{ secrets.SQToken }} # required
    projectKey: "my-custom-project"
    projectName: "my-custom-project-name"
    projectBaseDir: "/path/to/my-custom-project"
    buildCommand: dotnet build <PATH TO SLN and aditional parameters> 
    restoreCommand: dotnet restore <PATH TO SLN and aditional parameters> 
    lintReport:  "/path/to/lint-report-json" # https://docs.sonarqube.org/pages/viewpage.action?pageId=11639183
    analysisParameters: -d:sonar.exclusions="**/PATH_TO_EXCLUDE/**" -d:sonar.coverage.exclusions="**/PATH_TO_EXCLUDE/**" #parameters: https://docs.sonarqube.org/latest/analysis/analysis-parameters/
```

## Roadmap

Roadmap of the project

- [x] Run SonarScanner
- [x] Add annotations on pull requests with SonarQube issues
- [x] Genereate summary report with SonarQube analysis
- [x] Use lint report in the Sonar Scanner

## Developing

After cloning the repository, install the dependencies with [`yarn`](https://yarnpkg.com):

```sh
yarn
```

When you are ready to submit your code, you just need to commit and the husky pre-commit script will do the build for you. Make sure the build works correctly.

If for some reason you don't want to use husky and want to do the build by yourself, just use the following commands:

```sh
yarn build
git add .
git commit --no-verify
```
