# Fragile
For when you have Too Many GitHub Issues.

                DUDE
    He's fragile, man!  He's very fragile!

Push fragile to gh-pages, view GitHub Issue analytics, pivot, react.

# Deployment
Fragile is a single page app: you can deploy it easily in your `gh-pages` 
branch, and if you're already signed into github and viewing 
`user.github.com/repo`, it should automagically pull in the right Issues, Users
and other things from the GitHub API to make your life better.

# Customization with `config.json`
Fragile should handle the sunny day pretty easily: serving from GitHub Pages on 
the repo you want to view. However, if you have a more complicated setup 
(multiple repositories in an organization, perhaps), without writing any 
javascript by creating a creating a `config.json` next to `index.html` 

### `repositories`
A list of repositories to track. If specified, you won't get the "default" repo 
(the one you are looking at), so make sure to put that one in.

    {
        "repositories": ["bollwyvl/fragile", "other-user/other-repo"]
    }

## What is the repo?
Even though Fragile is just HTML and JavaScript, I still haven't found the love 
that is node.js development: this is my cut-down development stack based on 
Flask that lets me use Jinja templates and python for sysadmin tasks as a build 
system for an optimized web app. 

## Motivation
Successful open source projects grow, sometimes primarily because they are on 
GitHub! At scale, the management of GitHub's fabulous Issues can become 
daunting, especially if multiple core developers are involved. From ipython-dev:

    I think the problem is you don't really know who is responsible for which
    PR/issue, so you lost time wondering whether you have to be involved,
    or if you are in a good place to review. 
    
    The longer part is to read the PR, unpacked the new UV laser, and wondering
    what the other dev thought about that are. I miss a small "involvement
    indicator" on PR that say "involved"/"neutral"/"don't care" on the side to
    know which PR I should take care of.

    Also the "who agree for merging" is a little confusing sometime.
    I would like a "ok to merge" button, that you just click and you get the
    count of +1 vote that goes back to 0 if a new commit
    is pushed.

    I think this would highly improved the merging /review rate with :

     * This pr has 3 "merge ok", I just have to read add mine and I can merge.
     * This PR has already 2 dev with are "involved" I can worry of others.
     * This one has nobody I'll look after it.

I want more lasers in my development!