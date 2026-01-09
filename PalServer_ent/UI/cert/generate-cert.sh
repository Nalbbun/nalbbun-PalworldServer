#!/bin/bash
mkdir -p certs

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout certs/selfsigned.key \
  -out certs/selfsigned.crt \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=Palworld/CN=palworld.local"

echo "Self-signed certificate generated:"
echo " - certs/selfsigned.crt"
echo " - certs/selfsigned.key"
