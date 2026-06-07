import re

file_path = r"e:\projelerim\askida\askida-admin-web\dist\assets\index-DDUJqJ4f.js"
try:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.search(r".{0,200}Onayla.{0,500}", content, re.IGNORECASE)
    with open("find_js_output.txt", "w", encoding="utf-8") as out:
        if match:
            out.write(match.group(0))
        else:
            out.write("Not found")

except Exception as e:
    with open("find_js_output.txt", "w", encoding="utf-8") as out:
        out.write("Error: " + str(e))
