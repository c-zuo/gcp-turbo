#!/bin/bash

# Remember to install titling package: tlmgr install titling

pandoc --pdf-engine=xelatex scripts/pandoc-header-includes.yaml README.md INSTALL.md -o 'Turbo Project Factory.pdf' --variable "geometry:margin=1in"  --variable "classoption=titlepage" --variable mainfont="Google Sans" --variable monofont="Roboto Mono"  --variable "monofontoptions=Scale=0.75"
ls -l 'Turbo Project Factory.pdf' 