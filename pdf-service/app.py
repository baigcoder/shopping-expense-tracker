# PDF Service - Bank Statement Analyzer
# Uses pdfplumber for text and table extraction

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pdfplumber
import io
import re
import json
from datetime import datetime
from typing import Optional
import uuid

app = FastAPI(
    title="PDF Statement Analyzer",
    description="Extract text and transactions from bank statement PDFs",
    version="1.0.0"
)

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_transactions_from_text(text: str) -> list:
    """
    Extract transaction-like patterns from text.
    Looks for date + description + amount patterns.
    """
    transactions = []
    
    # Common patterns for transactions
    patterns = [
        # DD/MM/YYYY or DD-MM-YYYY + description + amount
        r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s*(DR|CR|Cr|Dr)?',
        # PKR/Rs amount pattern
        r'(?:PKR|Rs\.?)\s*([\d,]+\.?\d*)',
    ]
    
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if len(line) < 10:
            continue
            
        # Try to match transaction pattern
        match = re.search(patterns[0], line)
        if match:
            date_str = match.group(1)
            description = match.group(2).strip()[:100]  # Limit description length
            amount_str = match.group(3).replace(',', '')
            dr_cr = match.group(4) if match.lastindex >= 4 else None
            
            try:
                amount = float(amount_str)
                if amount > 0 and amount < 100000000:  # Reasonable amount range
                    tx_type = 'expense' if dr_cr in ['DR', 'Dr'] else 'income' if dr_cr in ['CR', 'Cr'] else 'expense'
                    transactions.append({
                        'id': str(uuid.uuid4()),
                        'date': date_str,
                        'description': description,
                        'amount': amount,
                        'type': tx_type,
                        'confidence': 0.7
                    })
            except ValueError:
                pass
    
    return transactions[:100]  # Limit to 100 transactions

def detect_bank_name(text: str) -> str:
    """Detect bank name from statement text."""
    banks = [
        'HBL', 'Habib Bank', 'UBL', 'United Bank', 'MCB', 'Muslim Commercial',
        'Allied Bank', 'Bank Alfalah', 'Meezan Bank', 'Standard Chartered',
        'Faysal Bank', 'JS Bank', 'Bank of Punjab', 'Askari Bank',
        'HDFC', 'ICICI', 'SBI', 'Axis Bank', 'Kotak'
    ]
    
    text_upper = text.upper()
    for bank in banks:
        if bank.upper() in text_upper:
            return bank
    
    return 'Unknown Bank'

@app.get("/")
def read_root():
    return {"status": "ok", "service": "PDF Statement Analyzer", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/extract")
async def extract_pdf(file: UploadFile = File(...)):
    """
    Extract text and transactions from uploaded PDF.
    
    Returns:
    - extracted_text: Full text from all pages
    - page_count: Number of pages
    - transactions: Auto-detected transactions
    - bank_name: Detected bank name
    - tables: Extracted tables (if any)
    """
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    try:
        # Read file content
        content = await file.read()
        pdf_file = io.BytesIO(content)
        
        extracted_text = ""
        tables = []
        page_texts = []
        
        with pdfplumber.open(pdf_file) as pdf:
            page_count = len(pdf.pages)
            
            for i, page in enumerate(pdf.pages):
                # Extract text with layout preservation
                page_text = page.extract_text(layout=True) or ""
                page_texts.append({
                    'page': i + 1,
                    'text': page_text
                })
                extracted_text += f"\n--- Page {i + 1} ---\n{page_text}\n"
                
                # Extract tables
                page_tables = page.extract_tables()
                for table in page_tables:
                    if table and len(table) > 1:
                        tables.append({
                            'page': i + 1,
                            'rows': len(table),
                            'data': table[:20]  # Limit rows
                        })
        
        # Detect bank and extract transactions
        bank_name = detect_bank_name(extracted_text)
        transactions = extract_transactions_from_text(extracted_text)
        
        return JSONResponse({
            "success": True,
            "file_name": file.filename,
            "page_count": page_count,
            "bank_name": bank_name,
            "extracted_text": extracted_text,
            "page_texts": page_texts,
            "transactions": transactions,
            "transaction_count": len(transactions),
            "tables": tables,
            "table_count": len(tables)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

@app.post("/extract-text-only")
async def extract_text_only(file: UploadFile = File(...)):
    """
    Extract only text from PDF (faster, no transaction detection).
    """
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    try:
        content = await file.read()
        pdf_file = io.BytesIO(content)
        
        extracted_text = ""
        
        with pdfplumber.open(pdf_file) as pdf:
            page_count = len(pdf.pages)
            
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text(layout=True) or ""
                extracted_text += f"\n--- Page {i + 1} ---\n{page_text}\n"
        
        return JSONResponse({
            "success": True,
            "file_name": file.filename,
            "page_count": page_count,
            "extracted_text": extracted_text
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
