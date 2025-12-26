# AI Document Parser Server

This server provides document parsing capabilities using PaddleOCR-VL.

## Setup

```bash
cd ai-server
pip install -r requirements.txt
python main.py
```

## API Endpoints

- `POST /parse-document` - Parse a document image/PDF and extract text
- `GET /health` - Health check endpoint

## Usage

The server expects multipart/form-data with a file field named "file".
It returns structured JSON with extracted transactions.
