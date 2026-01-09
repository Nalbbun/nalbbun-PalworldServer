FROM python:3.11-slim

WORKDIR /app

# docker CLI 
RUN apt-get update && \
    apt-get install -y docker-cli docker-compose && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

#  
COPY . .

# users.json   
COPY users.json /app/users.json

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]