# Fragile
For when you have too many issues... too many GitHub issues. And pull requests.

    PARKING LOT

    Walter and the Dude walk to the Dude's car.  The Pomeranian 
    trots happily behind Walter who totes the empty carrier.

                      DUDE
          Walter, you can't do that.  These 
          guys're like me, they're pacificists.  
          Smokey was a conscientious objector.

                      WALTER
          You know Dude, I myself dabbled with 
          pacifism at one point.  Not in Nam, 
          of course--

                      DUDE
          And you know Smokey has emotional 
          problems!

                      WALTER
          You mean--beyond pacifism?

                      DUDE
          He's fragile, man!  He's very fragile!
    
    source: http://bednark.com/big.lebowski.script.html

Sign up for OAuth, push Fragile somewhere in your `gh-pages`, view GitHub issue 
and pull request analytics, pivot, react. Then go bowling.

# Deployment
Fragile is a single page app: you can deploy it easily in your `gh-pages` 
branch, and once you sign into github it should automagically pull in the right 
issues, pull requests and other things from the GitHub API to make your life 
better.

## Register
Before you get started, if you haven't done so, you'll need to 
[register](https://github.com/settings/applications/new) your 
_`sweetusername`_.github.com domain. Otherwise, you'll get nasty XHTTPrequest 
errors when you try to load the page. You won't use the keys received during 
the registration process until an [OAuth backend](https://github.com/bollwyvl/fragile/issues/2) is completed.

## Get it
In your repo:

  git checkout -b gh-pages    # -b will create it, if you don't have it
  mkdir fragile               # or whatever you want to call it
  cd fragile
  git clone git clone -b gh-pages git://github.com/bollwyvl/fragile.git . 
  rm -rf .git                 # whoa, watch out, there
  git add fragile
  git commit -m "enabling ticket pull request fusion goodness"
  git push origin gh-pages

Then go to your GitHub page http://sweetusername.github.com/yourrepo/fragile, 
login and BOOM!

# Customization with `config.json`
Fragile should handle the sunny day pretty easily: serving from GitHub Pages on 
the single repo you want to view. However, if you have a more complicated setup 
(multiple repositories in an organization, perhaps), Fragile can meet your 
needs without any javascript hackery. Create a `config.json` next to `index.html`, and fiddle with the things you see below.

### `title`
_Default: the title of the repo from which GitHub Page it is served_
A nice little title that gets added up in the top right. Also rocks it into the
footer with a snazzy &copy;. Man, I wish my keyboard had an &copy; key. I would
&copy; everything.

    {
      "title": "My Repo"
    }

### `repos`
_Default: the repo from which GitHub Page it is served_

A list of repositories to track. If specified, you won't get the "default" repo 
(the one you are looking at), so make sure to put that one in.

    {
      "repositories": ["user/repo", "other-user/other-repo"]
    }

#### Future Feature: show more than `master`
By default, you'll get the `master` for each of your repos. If this is not cool,
like you use a `devel` branch for pull requests, you can use it like this:

    {
       "repositories": {
         "user/repo": "master",
         "other-user/other-repo": ["master", "devel"]
       }
    }

### `collaborators`
_Default: the folks listed as collaborators on the repos(s)_

All developers are created equal... except for some, who are more equal: they
can commit to the offical repo. Several of the columns light up collaborators 
who are doing stuff on tickets and pull requests. If you want to set this 
manually, you'll get what you ask for.

    {
      "collaborators": ["user1", "user2"]
    }

# What is this repo?
Even though Fragile is just HTML and JavaScript, I still haven't found the love 
that is node.js development: this is my cut-down development stack based on 
Flask that lets me use Jinja templates and python for sysadmin tasks as a build 
system for an optimized web app.

## Contributing
Let's make this awesomer!

### Ideas
Make an [issue](http://github.com/bollwyvl/fragile/issues) for questions you'd 
want to be able see visually answered, and we'll see if we can't do it!

### Code
I am still working on the dev documentation! I feel like the process is still a 
little weird to generate the static pages.

Pull requests welcome! Custom handlers, new ways to view the repo structure, 
better tests & documentation, an OAuth backend, anything that you think would 
make Fragile cooler. 

It would be great if you pushed your Fragile to the `gh-pages` of a project you 
care about as a test case.

# Motivation
Successful free software projects grow, sometimes primarily because they are on 
high-involvement sites like GitHub or SourceForge! At scale, the management of 
issues and pull requests can become daunting, especially if multiple core 
developers are involved. From ipython-dev:

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

# Thanks
## API
- [GitHub](http://github.com)
## Frontend
- [Bootstrap](http://twitter.github.com/bootstrap)
- [moment.js](http://momentjs.com/)
- [d3.js](http://d3js.org/)
- [jQuery](http://jquery.com/)
- [underscore.js](http://underscorejs.org/)
- [github.js](https://github.com/michael/github)
## Backend
- [flask](http://flask.pocoo.org/)
- [werkzeug](http://werkzeug.pocoo.org/)