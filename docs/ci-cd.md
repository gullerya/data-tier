# Intro

`data-tier` is built with CI/CD automation.
CI/CD is performing quality checks on the pull requests, as well as scheduled tests on the `main` branch.

Release is also automated.

# Versioning

In development `data-tier` is versioned as per next candidate version to be released and marked with `-snapshot` suffix.
The version should be adjusted (manually, as of now) to the release version as per content in the trunk, while preserving `-snapshot` suffix during the ongoing work.

When the `data-tier` is being released, the automation will turn the `-snapshot` version into the regular one, release/publish the library and bump the `main` branch version to the next **patch** plus `-snapshot`.

# Development

During development, those NPM script are to help validate the quality:
- `npm run lint` - lint sources, static code analysis
- `npm run build` - build distribution (`dist` folder), needed each time running tests, which are running against `dist`
- `npm run test` - test the library (headless)

# Release

Adding tag `release` will trigger release cycle.
Release cycle includes the following steps:
- **Prepare** phase:
	- bump the version to released one (remove `-snapshot`)
	- build the sources
	- lint the sources
	- test the build (`dist`)
	- commit/push the newly versioned state
- **Publish** phase:
	- build the sources
	- publish to NPM
	- bump to the next **patch** plus `-snapshot`
	- commit/push the newly versioned state