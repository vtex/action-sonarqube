import { getInput, info } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import type { GitHub } from '@actions/github/lib/utils'
import * as exec from '@actions/exec'

import Sonarqube from './sonarqube'
import type { Annotation } from './utils'
import { issuesToAnnotations } from './utils'

// The Checks API limits the number of annotations to a maximum of 50 per API request
const MAX_ANNOTATIONS_PER_REQUEST = 50

const createCheckRun = async (
  octokit: InstanceType<typeof GitHub>,
  repo: { owner: string; repo: string },
  annotations: Annotation[],
  SQDetailsURL: string
) => {
  info('Creating check')
  const pullRequest = context.payload.pull_request
  const ref = pullRequest ? pullRequest.head.sha : context.sha

  try {
    await octokit.checks.create({
      ...repo,
      name: 'Automatic Review with SonarQube',
      head_sha: ref,
      status: 'completed',
      conclusion: 'neutral',
      details_url: SQDetailsURL,
      output: {
        title: 'SonarQube',
        summary: `See more details in [SonarQube](${SQDetailsURL})`,
        annotations,
      },
    })
  } catch (err) {
    throw new Error(err)
  }
}

async function run() {
  const { repo } = context
  const sonarqube = new Sonarqube(repo)

  const scannerCommand = sonarqube.getScannerCommand()

  await exec.exec(scannerCommand)
  // Wait for background tasks: https://docs.sonarqube.org/latest/analysis/background-tasks/
  await new Promise((r) => setTimeout(r, 5000))

  const issues = await sonarqube.getIssues({
    page: 1,
    pageSize: MAX_ANNOTATIONS_PER_REQUEST,
  })

  const annotations = issuesToAnnotations(issues)

  const octokit = getOctokit(getInput('githubToken'))

  const SQDetailsURL = `${sonarqube.host}/dashboard?id=${sonarqube.project.projectKey}`

  await createCheckRun(octokit, repo, annotations, SQDetailsURL)
}

run()
