import paramiko
import sys
import os

host = "195.35.56.82"
user = "root"
pwd = "AskidaBandirma.21"

try:
    print("Connecting to VPS...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=pwd)
    
    print("Uploading deploy.zip...")
    sftp = ssh.open_sftp()
    sftp.put(r"e:\projelerim\askida\deploy.zip", "/root/deploy.zip")
    sftp.close()
    print("Upload complete!")

    commands = [
        "apt-get install unzip -y",
        "rm -rf /root/deploy",
        "mkdir -p /root/deploy",
        "unzip -o /root/deploy.zip -d /root/deploy",
        "cp -r /root/deploy/dist/* /var/www/askidagmtid.com/html/",
        "cp -r /root/deploy/Askida.Api/* /root/askida/Askida.Api/",
        "cd /root/askida && docker compose build api && docker compose stop api && docker compose up -d api"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        # We read lines so it doesn't block forever if output is huge
        exit_status = stdout.channel.recv_exit_status()
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        if out: print("STDOUT:", out.strip()[:500] + "..." if len(out) > 500 else out.strip())
        if err: print("STDERR:", err.strip()[:500] + "..." if len(err) > 500 else err.strip())
        print(f"Status: {exit_status}\n")

    ssh.close()
    print("Deployment completed successfully!")
except Exception as e:
    print("Error:", e)
