# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

with open('README.md') as f:
    README = f.read()

with open('LICENSE') as f:
    LICENSE = f.read()
    
with open('requirements.txt') as f:
    REQUIREMENTS = f.read().strip().split("\n")

setup(
    name='fragile',
    version='0.0.1',
    description='fragile build systems',
    long_description=README,
    author='Nicholas Bollweg',
    author_email='nick.bollweg@gmail.com',
    url='https://github.com/bollwyvl/fragile',
    license=LICENSE,
    install_requires=REQUIREMENTS,
    packages=find_packages(exclude=('tests', 'docs'))
)
