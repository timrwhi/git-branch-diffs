const BASE_URL = 'https://api.github.com';
const headers = new Headers({'Authorization': `token ${getCookie('token')}`});
const fetchConfig = {
    method: 'GET',
    headers: headers,
    mode: 'cors',
    cache: 'default',
};



const COMMIT_TEMPLATE = document.getElementById('commit').text;
const TEMPLATE_PAGE = document.getElementById('page').text;
const TEMPLATE_EMPTY = document.getElementById('empty').text;
const TEMPLATE_LOGIN = document.getElementById('login').text;

const JUNK_KEYWORDS = ['master', 'release', 'pom.xml', '-snapshot'];
let COMMITS = [];
let HIDDEN = 0;
const REPOS = window.repos;



// UTIL

function getCookie(key) {
    const pairs = document.cookie.split(';');
    const cookie = pairs.find(pair => pair.includes(key));
    if (!cookie) {
        return false;
    }
    return cookie.trim().split('=')[1];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const rawMinutes = date.getMinutes();
    const minutes = rawMinutes < 10 ? `0${rawMinutes}` : rawMinutes;
    let night = false;
    if (hours > 12) {
        hours = hours - 12;
        night = true;
    }
    return `${date.getMonth() + 1}/${day}/${year} ${hours}:${minutes}${night ? 'pm' : 'am'}`;
}

function getRepoFromUrl(url) {
    const match = REPOS.find(info => url.includes(info.repo));
    return match ? match.repo : '';
}



// RENDERING

function renderEmpty() {
    const noCommits = doT.template(TEMPLATE_EMPTY);
    const el = document.createElement('div');
    el.className = 'empty';
    el.innerHTML = noCommits();
    document.body.appendChild(el);
}

function renderLogin() {    
    const loginPage = doT.template(TEMPLATE_LOGIN);
    const el = document.createElement('div');
    el.className = 'login';
    el.innerHTML = loginPage();
    document.body.appendChild(el);
}

function renderCommits(commits) {
    const render = doT.template(COMMIT_TEMPLATE);
    const page = doT.template(TEMPLATE_PAGE);
    document.body.innerHTML = page({hidden: HIDDEN});
    const $commits = document.getElementById('commits');
    commits.forEach(commit => {
        const commitData = Object.assign({}, commit, {
            formattedDate: formatDate(commit.commit.author.date),
            repo: getRepoFromUrl(commit.html_url)
        });
        const el = document.createElement('div');
        el.className = 'commit';
        el.innerHTML = render(commitData);
        $commits.appendChild(el);
    });
}

function renderPage(commits) {
    if (commits.length) {
        renderCommits(commits);
    } else {
        renderEmpty();
    }
}

function sortByDateDescending(commits) {
    return commits.sort((a, b) => {
        const date1 = new Date(a.commit.author.date);
        const date2 = new Date(b.commit.author.date);
        if (date1 > date2) {
            return -1
        }
        if (date1 < date2) {
            return 1
        }
        return 0;
    })
}

function combineDiffCommits(diffs) {
    return diffs
        .map(diff => diff.commits)
        .reduce((a, b) => a.concat(b));
}

function fetchDiff(data) {
    const { base, head, repo } = data;
    return fetch(`${BASE_URL}/repos/sproutsocial/${repo}/compare/${base}...${head}`, fetchConfig)
        .then(response => response.json())
}

function fetchAllDiffs(repos) {
    return Promise.all(repos.map(fetchDiff))
}

function filterJunk(commits) {
    const results = commits.filter(commit => !containsBlacklistedWord(commit.commit.message));
    HIDDEN = commits.length - results.length;
    return results;
}

function containsBlacklistedWord(string) {
    return JUNK_KEYWORDS.find(word => string.toLowerCase().includes(word));
}

function renderAllCommits() {
    HIDDEN = 0;
    const sorted = sortByDateDescending(COMMITS);
    renderCommits(sorted);
}

if (getCookie('token')) {
    fetchAllDiffs(REPOS)
        .then(combineDiffCommits)
        .then(commits => COMMITS = commits)
        .then(filterJunk)
        .then(sortByDateDescending)
        .then(renderCommits)
} else {
    renderLogin();
}
