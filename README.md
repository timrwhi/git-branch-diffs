# git-branch-diffs
It's a thing that lets you aggregate diffs between branches across repos

## Running locally
create `.env` file:
```
CLIENT_ID=YOUR_GITHUB_CLIENT_ID
CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
```
add repos to `repos.json`:
```
{
  "name": "YOUR_REPO_NAME",
  "head": "BRANCH_NAME",
  "base:" "BRANCH_NAME"
}
```
`npm run dev`