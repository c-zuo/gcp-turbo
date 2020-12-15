#!/usr/bin/env python3

from sys import stdin
import re

addition = re.compile(r"(\x1B\[3\dm)(.+?)(\x1B\[0m)")
heading = re.compile(r"(\x1B\[1m)( *# .+)")
emphasis = re.compile(r"(\x1B\[1m)(.+?)(\x1B\[0m)")
ansi_seqs = re.compile(r"\x1B\[.+?m")
print('<pre>')
for line in stdin:
    line = line.rstrip('\n')
    line = heading.sub("<h4>\\2</h4>", line)
    line = addition.sub("<b>\\2</b>", line)
    line = emphasis.sub("<b>\\2</b>", line)
    line = ansi_seqs.sub("", line)
    print(line)
print('</pre>')
