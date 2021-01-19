const { getInput, info } = require('@actions/core')
const { context, getOctokit } = require('@actions/github')
const exec = require('@actions/exec')
const axios = require('axios').default

// The Checks API limits the number of annotations to a maximum of 50 per API request
const MAX_ANNOTATIONS_PER_REQUEST = 50

const getSQInfo = (repo) =>  ({
	projectKey: getInput('projectKey') ? getInput('projectKey') : `${repo.owner}-${repo.repo}`,
	projectName: getInput('projectName') ? getInput('projectName') : `${repo.owner}-${repo.repo}`,
	projectBaseDir: getInput('projectBaseDir'),
	host: getInput('host'),
	token: getInput('token')
})

const getScannerCommand = (sonarqube) => 
	`sonar-scanner -Dsonar.projectKey=${sonarqube.projectKey} -Dsonar.projectName=${sonarqube.projectName} -Dsonar.sources=. -Dsonar.projectBaseDir=${sonarqube.projectBaseDir} -Dsonar.login=${sonarqube.token} -Dsonar.host.url=${sonarqube.host}`

const getSQProjectIssues = async (sonarqube, pageSize, page) => {
	const tokenb64 = Buffer.from(sonarqube.token + ':').toString('base64')

	try {
		const response = await axios.get(`${sonarqube.host}/api/issues/search?componentKeys=${sonarqube.projectKey}&statuses=OPEN&ps=${pageSize}&p=${page}`, 
			{
				headers: {
					Authorization: `Basic ${tokenb64}`
				}
			}
		)
		const issues = response.data.issues
		if (pageSize * page >= response.data.paging.total) {
			return issues
		}

		return issues.concat(await getSQProjectIssues(sonarqube, pageSize, page + 1))
	} catch(err) {
		throw new Error('Error getting project issues from SonarQube. Please make sure you provided the host and token inputs.')
	}
}

const componentToPath = (component) => {
	if (!component.includes(':')) {
		return component
	}
	const [, path] = component.split(':')
	return path
}

const getAnnotationLevel = (severity) => {
	switch(severity) {
		case 'BLOCKER':
			return 'failure'
		case 'CRITICAL':
			return 'failure'
		case 'MAJOR':
			return 'failure'
		case 'MINOR':
			return 'warning'
		case 'INFO':
			return 'notice'
		default:
			return 'notice'
	}
}

const issuesToAnnotations = (issues) => {
	return issues.map(issue => {
		return {
			path: componentToPath(issue.component),
			start_line: issue.textRange ? issue.textRange.startLine : 1,
			end_line: issue.textRange ? issue.textRange.endLine : 1,
			annotation_level: getAnnotationLevel(issue.severity),
			message: issue.message
		}
	})
}

const createCheckRun = async (octokit, repo, annotations, SQDetailsURL) => {
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
			}
		})
	} catch(err) {
		throw new Error(err)
	}
}

async function run () {
	const repo = context.repo
	const sonarqube = getSQInfo(repo)

	const scannerCommand = getScannerCommand(sonarqube)
	await exec.exec(scannerCommand)
	// Wait for background tasks: https://docs.sonarqube.org/latest/analysis/background-tasks/
	await new Promise(r => setTimeout(r, 5000))
	
	const issues = await getSQProjectIssues(sonarqube, MAX_ANNOTATIONS_PER_REQUEST, 1)
	const annotations = issuesToAnnotations(issues)

	const octokit = getOctokit(getInput('githubToken'))

	const SQDetailsURL = sonarqube.host + `/dashboard?id=${sonarqube.projectKey}`

	await createCheckRun(octokit, repo, annotations, SQDetailsURL)
}

run()
