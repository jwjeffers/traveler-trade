import urllib.request, re
html = urllib.request.urlopen('https://www.youtube.com/playlist?list=PLP9BvyXK9FAGdZdjBxcrnzwiRWw-QArdL').read().decode('utf-8')
ids = list(dict.fromkeys(re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)))
print(ids[:15])
