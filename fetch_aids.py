import urllib.request
import json

url = "https://api.askidagmtid.com/api/aids"
try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
