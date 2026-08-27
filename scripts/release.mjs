/**
 * Bump the package version, push the default branch, and create a GitHub
 * release for the pushed commit.
 *
 * Usage: npm run release -- minor
 */
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const git = 'git';
const gh = process.platform === 'win32' ? 'gh.exe' : 'gh';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const stableSemver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const bumpTypes = new Set(['major', 'minor', 'patch']);

function commandText(command, args) {
  return [command, ...args].join(' ');
}

function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

  if (result.error) {
    throw new Error(`${commandText(command, args)}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const details = capture && result.stderr ? `\n${result.stderr.trim()}` : '';
    throw new Error(`Command failed: ${commandText(command, args)}${details}`);
  }

  return capture ? result.stdout.trim() : '';
}

function check(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: 'ignore',
  });
  return !result.error && result.status === 0;
}

function fail(message) {
  throw new Error(message);
}

function bumpVersion(version, type) {
  if (!stableSemver.test(version)) {
    fail(`package.json must contain a stable semantic version. Found ${JSON.stringify(version)}.`);
  }

  const [major, minor, patch] = version.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }
  return 0;
}

async function main() {
  const requested = process.argv[2];
  if (!requested || process.argv.length > 3) {
    fail('Usage: npm run release -- <major|minor|patch|version>');
  }

  if (!bumpTypes.has(requested) && !stableSemver.test(requested.replace(/^v/, ''))) {
    fail(`Use major, minor, patch, or a stable version such as 3.1.0. Found ${JSON.stringify(requested)}.`);
  }

  run(gh, ['auth', 'status', '--hostname', 'github.com']);
  const repository = run(gh, ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], { capture: true });
  const defaultBranch = run(gh, ['repo', 'view', '--json', 'defaultBranchRef', '--jq', '.defaultBranchRef.name'], { capture: true });
  const currentBranch = run(git, ['branch', '--show-current'], { capture: true });

  if (currentBranch !== defaultBranch) {
    fail(`Check out the default branch (${defaultBranch}) before releasing. Current branch: ${currentBranch || 'detached HEAD'}.`);
  }

  const status = run(git, ['status', '--porcelain=v1', '--untracked-files=all'], { capture: true });
  if (status) {
    fail(`The working tree is not clean. Commit or remove these changes before releasing:\n${status}`);
  }

  run(git, ['fetch', '--quiet', 'origin', `refs/heads/${defaultBranch}:refs/remotes/origin/${defaultBranch}`]);
  const localHead = run(git, ['rev-parse', 'HEAD'], { capture: true });
  const remoteHead = run(git, ['rev-parse', `refs/remotes/origin/${defaultBranch}`], { capture: true });
  if (localHead !== remoteHead) {
    fail(`The local ${defaultBranch} branch is not up to date with origin. Pull or push it before releasing.`);
  }

  run(git, ['diff', '--check']);
  run(npm, ['run', 'build']);
  const distChanges = run(git, ['status', '--porcelain=v1', '--untracked-files=all', '--', 'dist'], { capture: true });
  if (distChanges) {
    fail(`The build changed dist/. Commit the generated files before releasing:\n${distChanges}`);
  }

  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const currentVersion = packageJson.version;
  if (!stableSemver.test(currentVersion)) {
    fail(`package.json must contain a stable semantic version. Found ${JSON.stringify(currentVersion)}.`);
  }
  const requestedVersion = requested.replace(/^v/, '');
  const targetVersion = bumpTypes.has(requested)
    ? bumpVersion(currentVersion, requested)
    : requestedVersion;
  if (!stableSemver.test(targetVersion)) {
    fail(`The release version is not a stable semantic version: ${targetVersion}`);
  }
  if (compareVersions(targetVersion, currentVersion) < 0) {
    fail(`The release version ${targetVersion} is older than package.json version ${currentVersion}.`);
  }

  const tag = targetVersion;
  if (check(git, ['show-ref', '--tags', '--verify', '--quiet', `refs/tags/${tag}`])) {
    fail(`The local tag ${tag} already exists.`);
  }
  if (check(git, ['ls-remote', '--exit-code', '--refs', 'origin', `refs/tags/${tag}`])) {
    fail(`The remote tag ${tag} already exists.`);
  }

  if (currentVersion !== targetVersion) {
    run(npm, [
      'version',
      targetVersion,
      '--no-git-tag-version',
      '--ignore-scripts',
      '--package-lock=false',
    ]);

    run(git, ['add', 'package.json']);
    if (check(git, ['ls-files', '--error-unmatch', 'package-lock.json'])) {
      run(git, ['add', 'package-lock.json']);
    }
    run(git, ['commit', '-m', `Release ${targetVersion}`]);
  } else {
    console.log(`package.json already uses ${targetVersion}; creating the missing release from the current commit.`);
  }

  const releaseHead = run(git, ['rev-parse', 'HEAD'], { capture: true });
  run(git, ['push', 'origin', `HEAD:refs/heads/${defaultBranch}`]);
  run(gh, [
    'release',
    'create',
    tag,
    '--repo',
    repository,
    '--target',
    releaseHead,
    '--generate-notes',
    '--fail-on-no-commits',
  ]);

  console.log(`Published GitHub release ${tag}. The npm publish workflow will now run.`);
}

main().catch((error) => {
  console.error(`Release stopped: ${error.message}`);
  process.exit(1);
});
