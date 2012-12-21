# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

with open('README.md') as f:
    readme = f.read()

with open('LICENSE') as f:
    license = f.read()

setup(
    name='fragile',
    version='0.0.1',
    description='fragile build systems',
    long_description=readme,
    author='Nicholas Bollweg',
    author_email='nick.bollweg@gmail.com',
    url='https://github.com/bollwyvl/fragile',
    license=license,
    install_requires=['minify'],
    packages=find_packages(exclude=('tests', 'docs'))
)
