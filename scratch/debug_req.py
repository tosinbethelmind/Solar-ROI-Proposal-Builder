import urllib.request
import urllib.error

url = "http://localhost:3000/api/admin/overview"
try:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req) as response:
        print("STATUS:", response.status)
        print("HEADERS:", dict(response.info()))
        print("URL:", response.url)
        body = response.read().decode('utf-8', errors='ignore')
        print("BODY (first 500 chars):")
        print(body[:500])
except Exception as e:
    print("ERROR:", e)
