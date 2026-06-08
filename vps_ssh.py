import paramiko
import sys

cmd = sys.argv[1] if len(sys.argv) > 1 else "ls -la /root/askida"
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("195.35.56.82", username="root", password="AskidaBandirma.21")
print(f"Executing: {cmd}")
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:")
print(stdout.read().decode())
print("STDERR:")
print(stderr.read().decode())
ssh.close()
