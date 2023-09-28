# Auto-Merge-Bot

Bot which enables or disable [`auto-merge`](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request) in a repository.

## Why?

This action was developed to help external parties merge their own Pull Requests.

If an external party makes a PR, and it is approved, they still cannot merge it. This bot gives them the ability to enable the `auto-merge` function so, once their PR gets approved, it is merged.

## Configuration
Be sure that **Allow auto-merge** is enabled in the repository options.

Create a file named `.github/workflows/auto-merge-bot.yml` and add the following:
```yaml
name: Auto Merge Bot

on:
  # GitHub considers PRs as issues
  issue_comment:
    types: [created]

jobs:
  set-auto-merge:
    runs-on: ubuntu-latest
    # Important! This forces the job to run only on comments on Pull Requests that starts with '/merge'
    if: ${{ github.event.issue.pull_request && startsWith(github.event.comment.body, '/merge') }}
    steps:
      - name: Set auto merge
        uses: paritytech/auto-merge-bot@main
        with:
          GITHUB_TOKEN: '${{ github.token }}'
          MERGE_METHOD: "SQUASH"
```

#### Inputs
You can find all the inputs in [the action file](./action.yml), but let's walk through each one of them:

- `GITHUB_TOKEN`: Token to access to the repository.
	-  **required**
	-  This is provided by the repo, you can simply use `${{ github.token }}`.
- `MERGE_METHOD`: Type of merge to enable.
	- **Optional**: Defaults to `SQUASH`.
	- Available types are `MERGE`, `REBASE` and `SQUASH`.
		- Make sure that the type of merge you selected is available in the repository merge options.
- `SILENT`: If the bot should be silent and not comment when enabling/disabling auto-merge.
	- **Optional**: Defaults to `false`.
- `WHITELISTED_USERS`: List of user accounts which are allowed to use the bot aside from the author and org members.
	- **Optional**
	- Must be a comma separated value: `user-1,user-2,user-3`.

## Usage

To trigger the bot, you need to write a comment in a Pull Request where the action is installed. The available actions are:
- `/merge`: Enables auto-merge for Pull Request
- `/merge cancel`: Cancels auto-merge for Pull Request
- `/merge help`: Shows this menu

The bot can only be triggered by the author of the PR or by users who *publicly* belongs to the organization of the repository.

By publicly, I refer to the members of an organization which can be seen by external parties. If you are not sure if you are part of an organization, simply open https://github.com/orgs/**your_organization**/people in a private window. If you don’t see your name there, you are not a public member.

Find related docs here: [Publicizing or hiding organization membership](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-your-membership-in-organizations/publicizing-or-hiding-organization-membership).
