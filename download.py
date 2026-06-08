import paramiko

host = "195.35.56.82"
user = "root"
pwd = "AskidaBandirma.21"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=pwd)
    
    sftp = ssh.open_sftp()
    sftp.get("/var/www/askidagmtid.com/html/assets/index-DDUJqJ4f.js", r"e:\projelerim\askida\old_index.js")
    sftp.close()
    ssh.close()
    print("Download successful")
except Exception as e:
    print(e)
