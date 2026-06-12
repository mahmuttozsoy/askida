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
    
    print("Uploading dist.zip...")
    sftp = ssh.open_sftp()
    sftp.put(r"e:\projelerim\askida\dist.zip", "/root/dist.zip")
    sftp.close()
    print("Upload complete!")

    commands = [
        "apt-get install unzip -y",
        "unzip -o /root/dist.zip -d /var/www/askidagmtid.com/html/",
        "rm /root/dist.zip"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        exit_status = stdout.channel.recv_exit_status()
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        if out: print("STDOUT:", out.strip()[:500] + "..." if len(out) > 500 else out.strip())
        if err: print("STDERR:", err.strip()[:500] + "..." if len(err) > 500 else err.strip())
        print(f"Status: {exit_status}\n")

    ssh.close()
    print("Frontend deployment completed successfully!")
except Exception as e:
    print("Error:", e)
