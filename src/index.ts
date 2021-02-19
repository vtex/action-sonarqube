import { getInput, info } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import type { GitHub } from '@actions/github/lib/utils'
import * as exec from '@actions/exec'

import Sonarqube, { ProjectStatusResponseAPI } from './sonarqube'
import type { Annotation } from './utils'
import { issuesToAnnotations } from './utils'

// The Checks API limits the number of annotations to a maximum of 50 per API request
const MAX_ANNOTATIONS_PER_REQUEST = 50

const createCheckRun = async ({
  octokit,
  repo,
  SQDetailsURL,
  annotations,
}: {
  octokit: InstanceType<typeof GitHub>
  repo: { owner: string; repo: string }
  SQDetailsURL: string
  annotations?: Annotation[]
}) => {
  info('Creating check')
  const pullRequest = context.payload.pull_request
  const ref = pullRequest ? pullRequest.head.sha : context.sha

  try {
    const {
      data: { id: checkRunId },
    } = await octokit.checks.create({
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

    return checkRunId
  } catch (err) {
    throw new Error(err)
  }
}

const generateSummary = (stats: ProjectStatusResponseAPI) => `
### Quality Gate ${stats.projectStatus.status === 'ERROR' ? 'failed': 'passed'}.
`


const updateCheckRun = async ({
  octokit,
  repo,
  checkRunId,
  annotations,
  SQDetailsURL,
}: {
  octokit: InstanceType<typeof GitHub>
  repo: { owner: string; repo: string }
  checkRunId: number
  annotations: Annotation[]
  SQDetailsURL: string
}) => {
  info('Updating check with annotations')
  try {
    await octokit.checks.update({
      ...repo,
      check_run_id: checkRunId,
      status: 'completed',
      conclusion: 'neutral',
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

  const octokit = getOctokit(getInput('githubToken'))

  const SQDetailsURL = `${sonarqube.host}/dashboard?id=${sonarqube.project.projectKey}`

  const checkRunId = await createCheckRun({ octokit, repo, SQDetailsURL })
  const stats = await sonarqube.getStatus()

  issues.map(async (batch) => {
    const annotations = issuesToAnnotations(batch)

    await updateCheckRun({
      octokit,
      repo,
      checkRunId,
      annotations,
      SQDetailsURL,
    })
  })
}

run()
