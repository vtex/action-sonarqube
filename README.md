# VTEX app store review action
> This project is a working in progress and is subject to breaking changes.

This is a Github action that runs the [SonarScanner](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/) and send the generated analysis to VTEX SonarQube Server.

## Usage

Before creating your workflow, you need set two secret variables in your repository: The SonarQube server URL and your [SonarQube token](https://docs.sonarqube.org/latest/user-guide/user-token/).

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
      - name: Scan code
        uses: vtex/action-app-store-review@main
        with:
          host: ${{ secrets.SQHost }} # Variable set in the Github Secrets
          token: ${{ secrets.SQToken }} # Variable set in the Github Secrets
          githubToken: ${{ secrets.GITHUB_TOKEN }} # https://docs.github.com/en/actions/reference/authentication-in-a-workflow#about-the-github_token-secret
```

## Variables

The key and name of the SonarQube project will follow the format `github-owner/github-repository` and project base dir will be the project root folder. But if you wish, you can customize the variables as in the example below:

```yml
with:
    host: ${{ secrets.SQHost }} # required
    token: ${{ secrets.SQToken }} # required
    projectKey: "my-custom-project"
    projectName: "my-custom-project-name"
    projectBaseDir: "/path/to/my-custom-project"
```

## Roadmap

Roadmap of the project

- [x] Run SonarScanner
- [ ] Use lint report in the Sonar Scanner
- [ ] Comment on pull requests the analysis made by the SonarQube. 

