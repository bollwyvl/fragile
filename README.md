# [Fragile](https://fra.gl)
For when you have too many issues... too many GitHub issues. And pull requests.

## Screenshot
A picture is worth a thousand words:
![fra.gl screenshot](http://bollwyvl.github.com/fragile/docs/assets/screenshot_fragile.png)
_A view of fragile's own development on fra.gl_

## What's it do?
Show the relationships between the core artifacts of an open source project through public APIs
_TODO: across many data providers_.
- Repos
- Issues
- Pull Requests
- Collaborators
- TODO: Mailing list threads
- TODO: wiki pages

## How do I use it?
Right now, you can check out the proof-of-concept confections on
[fra.gl](https://fra.gl) for
[IPython](https://fra.gl/?/config/ipython) and
[fragile](https://fra.gl/?/config/ipython) itself. 

[An open issue](https://github.com/bollwyvl/fragile/issues/7) is making configs
referencable by gist id, like the superb [bl.ocks.org](http://bl.ocks.org), at
which point it will be much easier to add links to new configurations.

Several options for standalone deployment or local usage, are possible, including the
original deployment concept as a part of `gh-pages`, potentially as a submodule.

# Deployment
You don't have to deploy fragile. Getting OAuth working is kind of a pain, and I hope
[fra.gl](https://fra.gl) becomes useful. However, the original concept, still supported,
is less centralized.

Fragile is a single page app: you can deploy it easily in your `gh-pages` 
branch, and once your users sign into github it should automagically pull in the right 
issues, pull requests and other things from the GitHub API to make your life 
better.

## Register
If you want to use the `gh-pages` approach, you'll need to 
[register](https://github.com/settings/applications/new) your 
_`sweetusername`_.github.com domain. Otherwise, you'll get nasty XHTTPrequest 
errors when you try to load the page.

### Secretsss
You won't use the client secret received during the registration process unless you actually deploy
the [OAuth backend](https://github.com/bollwyvl/fragile/issues/2)... which needs better
documentation. The following instructions will work securely with basic auth, as no information
is passed to the (fragile) server, but your users will be required to log in with the "keys
to the kingdom" on APIs.

## Get it
In your repo:

```sh
git checkout -b gh-pages    # -b will create it, if you don't have it
mkdir fragile               # or whatever you want to call it
cd fragile
git clone git clone -b gh-pages git://github.com/bollwyvl/fragile.git . 
rm -rf .git                 # whoa, watch out, there
git add fragile
git commit -m "enabling ticket pull request fusion goodness"
git push origin gh-pages
```

Then go to your GitHub page http://sweetusername.github.com/yourrepo/fragile, 
login and BOOM!

# Customization with `fragile.json`
Fragile should handle the sunny day pretty easily: serving from GitHub Pages on 
the single repo you want to view. However, if you have a more complicated setup 
(multiple repositories in an organization, perhaps), Fragile can meet your 
needs without any javascript hackery. Create a `fragile.json` next to 
`index.html`, and fiddle with the things you see below.

### `title`
_Default: the title of the repo from which GitHub Page it is served_
A nice little title that gets added up in the top right. Also rocks it into the
footer with a snazzy &copy;. Man, I wish my keyboard had an &copy; key. I would
&copy; everything.

```json
{
  "title": "My Repo"
}
```

### `repos`
_Default: the repo from which GitHub Page it is served_

A list of repositories to track. If specified, you won't get the "default" repo 
(the one you are looking at), so make sure to put that one in.

```json
{
  "repositories": ["user/repo", "other-user/other-repo"]
}
```

#### Future Feature: show more than `master`
By default, you'll get the `master` for each of your repos. If this is not cool,
like you use a `devel` branch for pull requests, you can use it like this:

```json
{
   "repositories": {
     "user/repo": "master",
     "other-user/other-repo": ["master", "devel"]
   }
}
```

### `collaborators`
_Default: the folks listed as collaborators on the repos(s)_

All developers are created equal... except for some, who are more equal: they
can commit to the offical repo. Several of the columns light up collaborators 
who are doing stuff on tickets and pull requests. If you want to set this 
manually, you'll get what you ask for.

```json
{
  "collaborators": ["user1", "user2"]
}
````

### `landing`
_Default: the distributed what is fragile intro_

A path to an SVG file (probably needs to be relative), such as can be made with 
the excellent [Inkscape](http://inkscape.org). It has a few configurations 
styles:

#### basic
```json
{
  "landing": "landing.svg"
}
```

#### TODO: build
```json
{
  "landing":[
    "landing.svg",
    "thankyou.svg"
  ],
}
```
Will load `landing.svg`, then wait for the user to click before hiding 
`landing.svg` and showing `thankyou.svg`. You can split PDFs, such as could be 
printed from [LibreOffice](http://libreoffice.org) then converted into SVG with 
Inkscape or  [pdf2svg](http://www.cityinthesky.co.uk/opensource/pdf2svg).

#### Single Inkscape SVG Build
If a landing SVG uses the inkscape namespace `sodipodi`, and you specify an 
empty list, the Inkscape layers will be built at a nice 3 second delay.

if you specify a number of seconds, it will wait that long instead of 3 seconds.
```json
{
  "landing.svg":[2.5],
}
```

## Multiple Customizations
The easiest way to have multiple customized setups is by using the `?` in the 
address bar. For example:
http://bollwyvl.github.com/fragile/?ipython
will pick load `ipython.json`.

TODO: The browser will remember your previous setups in `localStorage`.

# What is this repo?
Even though Fragile is just HTML and JavaScript, I still haven't found the love 
that is node.js development: this is my cut-down development stack based on 
Flask that lets me use Jinja templates and python for sysadmin tasks as a build 
system for an optimized web app.

This repo will maintain the development process: code, build, test, 
documentation and design. A separate effort, providing feature input to this 
one, is described in the [Roadmap](#roadmap).

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

# Roadmap
This project sprang from general interest in open source projects, but
also to support ongoing research into free/libre open source communities. One
short-term goal in forming the bulk of the experimentation data for a 
paper/competition entry/workshop at one or more conferences.

The current goal is to structure a monthly release cycle around the lifecycle 
of the conference schedules: while the user is king, certain features may be 
prioritized to support experiments and visualization techniques. The research 
for the documents will be managed in a 
[separate repo](http://github.com/bollwyvl/fragile-papers) on GitHub.

### 1.1

#### Proof of concept
- Meet needs of [Motivation](#motivation), gain feature input
- 
### *See Future Features*

### 10.14

#### Start of Conferences

## Future Features
See issues/pull requests. Maybe on the [demo](http://fra.gl/?/config/fragile)?


# Motivation
Successful free software projects grow, sometimes primarily because they are on 
high-involvement sites like GitHub or SourceForge! At scale, the management of 
issues and pull requests can become daunting, especially if multiple core 
developers are involved. From [Carreau](/Carreau) on ipython-dev:

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
 
_source: http://mail.scipy.org/pipermail/ipython-dev/2012-December/010930.html_

I want more lasers in my development!

# Free Software, Thanks!
Fragile is free for you to use and extend under the terms of the
[MIT License](LICENSE). Its development would not be possible without the
help of the many libraries and frameworks it uses.

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

# Name Origin

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
    
_source: http://bednark.com/big.lebowski.script.html_
