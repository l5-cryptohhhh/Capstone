import os, re
p = os.path.join('src', 'features', 'method', 'MethodPage.tsx')
s = open(p, encoding='utf-8').read()
for k in ("limits", "seasons"):
    line = "  { title: 'method.%s.title', body: 'method.%s.body' },\n" % (k, k)
    assert line in s, k
    s = s.replace(line, '', 1)
open(p, 'w', encoding='utf-8').write(s)
for f in ('it.ts', 'en.ts'):
    p = os.path.join('src', 'i18n', f)
    s = open(p, encoding='utf-8').read()
    for k in ('limits', 'seasons'):
        s, n = re.subn(r"  'method\.%s\.title': '(?:[^'\]|\.)*',\r?\n  'method\.%s\.body':\r?\n    '(?:[^'\]|\.)*',\r?\n" % (k, k), '', s)
        assert n == 1, (f, k, n)
    open(p, 'w', encoding='utf-8').write(s)
