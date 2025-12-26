"""
AI Document Parser Server - Lightweight Version
Fast PDF text extraction with Tesseract OCR fallback
Optimized for Railway deployment (low memory, no GPU required)
"""

import os
import io
import re
import time
import tempfile
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

app = FastAPI(
    title="AI Document Parser",
    description="Extract text and transactions from documents - Lightweight Version",
    version="2.0.0"
)

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractedTransaction(BaseModel):
    description: str
    amount: float
    date: Optional[str] = None
    category: Optional[str] = None
    type: str = "expense"

class DetectedPeriod(BaseModel):
    month: Optional[str] = None
    year: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    raw_text: Optional[str] = None

class ParseResult(BaseModel):
    success: bool
    raw_text: str
    transactions: List[ExtractedTransaction]
    page_count: int
    confidence: float
    processing_time: float = 0.0
    method: str = "unknown"
    detected_period: Optional[DetectedPeriod] = None

def extract_text_from_pdf_direct(content: bytes) -> tuple[str, int, bool]:
    """Extract text directly from PDF using PyMuPDF (instant for text PDFs)"""
    try:
        import fitz  # PyMuPDF
        
        print("📑 Attempting direct PDF text extraction...")
        start = time.time()
        
        pdf_document = fitz.open(stream=content, filetype="pdf")
        page_count = len(pdf_document)
        
        all_text = []
        has_text = False
        
        for i, page in enumerate(pdf_document):
            print(f"   📄 [Page {i+1}/{page_count}] Extracting text...")
            text = page.get_text()
            if text.strip():
                has_text = True
            all_text.append(text)
        
        pdf_document.close()
        
        combined_text = "\n\n".join(all_text)
        elapsed = time.time() - start
        
        if has_text and len(combined_text.strip()) > 50:
            print(f"   ✅ Direct extraction successful: {len(combined_text)} chars in {elapsed:.2f}s")
            return combined_text, page_count, True
        else:
            print(f"   ⚠️ PDF appears to be scanned (no text found)")
            return "", page_count, False
            
    except ImportError:
        print("   ⚠️ PyMuPDF not installed, falling back to OCR")
        return "", 0, False
    except Exception as e:
        print(f"   ❌ Direct extraction failed: {e}")
        return "", 0, False

def extract_text_with_tesseract(content: bytes) -> tuple[str, int]:
    """Extract text from PDF using Tesseract OCR (for scanned documents)"""
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
        
        print("🔍 Using Tesseract OCR for scanned PDF...")
        start = time.time()
        
        # Convert PDF to images
        print("   📑 Converting PDF to images...")
        images = convert_from_bytes(content, dpi=150)  # Lower DPI for speed
        page_count = len(images)
        print(f"   📑 {page_count} pages to process")
        
        all_text = []
        total_start = time.time()
        
        for i, img in enumerate(images):
            page_start = time.time()
            print(f"   🔍 [Page {i+1}/{page_count}] Running OCR...")
            
            # Run Tesseract OCR
            text = pytesseract.image_to_string(img)
            all_text.append(text)
            
            page_time = time.time() - page_start
            elapsed = time.time() - total_start
            remaining = (elapsed / (i + 1)) * (page_count - i - 1)
            
            print(f"   ✅ [Page {i+1}/{page_count}] Done in {page_time:.1f}s | Est. remaining: {remaining:.0f}s")
        
        combined_text = "\n\n".join(all_text)
        total_time = time.time() - start
        print(f"   🎉 OCR complete: {len(combined_text)} chars in {total_time:.1f}s ({total_time/page_count:.1f}s/page)")
        
        return combined_text, page_count
        
    except ImportError as e:
        print(f"   ❌ OCR dependencies missing: {e}")
        raise HTTPException(status_code=500, detail="OCR dependencies not installed. Install pytesseract and pdf2image.")
    except Exception as e:
        print(f"   ❌ OCR failed: {e}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

def extract_text_from_image_tesseract(image: Image.Image) -> str:
    """Extract text from image using Tesseract"""
    try:
        import pytesseract
        return pytesseract.image_to_string(image)
    except ImportError:
        raise HTTPException(status_code=500, detail="pytesseract not installed")

def detect_statement_period(raw_text: str) -> Optional[Dict[str, Any]]:
    """Detect statement period from bank statement text"""
    
    # Month names
    months = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12,
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'jun': 6, 'jul': 7,
        'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }
    
    text_lower = raw_text.lower()
    
    # Pattern 1: "December 2024" or "Dec 2024"
    month_year_pattern = r'(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)[,\s]+(\d{4})'
    match = re.search(month_year_pattern, text_lower)
    if match:
        month_name, year = match.groups()
        month_num = months.get(month_name, 1)
        month_full = list(months.keys())[list(months.values()).index(month_num)]
        if len(month_full) <= 3:
            month_full = [k for k, v in months.items() if v == month_num and len(k) > 3][0]
        
        return {
            "month": month_full.capitalize(),
            "year": int(year),
            "start_date": f"{year}-{month_num:02d}-01",
            "end_date": f"{year}-{month_num:02d}-28",  # Simplified
            "raw_text": match.group(0)
        }
    
    # Pattern 2: "Statement Period: 01/12/2024 - 31/12/2024"
    period_pattern = r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s*(?:to|-|–)\s*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})'
    match = re.search(period_pattern, raw_text)
    if match:
        d1, m1, y1, d2, m2, y2 = match.groups()
        year = int(y1) if len(y1) == 4 else 2000 + int(y1)
        month_num = int(m1)
        month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
        
        return {
            "month": month_names[month_num - 1] if 1 <= month_num <= 12 else None,
            "year": year,
            "start_date": f"{year}-{int(m1):02d}-{int(d1):02d}",
            "end_date": f"{year}-{int(m2):02d}-{int(d2):02d}",
            "raw_text": match.group(0)
        }
    
    # Pattern 3: Just find any year (2024, 2025)
    year_match = re.search(r'\b(202[4-9]|203\d)\b', raw_text)
    if year_match:
        year = int(year_match.group(1))
        # Default to current month
        current_month = datetime.now().month
        month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
        return {
            "month": month_names[current_month - 1],
            "year": year,
            "start_date": f"{year}-{current_month:02d}-01",
            "end_date": f"{year}-{current_month:02d}-28",
            "raw_text": str(year)
        }
    
    return None

def parse_transactions_from_text(raw_text: str) -> List[Dict[str, Any]]:
    """Parse transactions from extracted text using pattern matching"""
    transactions = []
    
    # Common patterns for transaction data
    # Pattern 1: Date Amount Description
    pattern1 = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+[Rs\.₹$]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(.+)'
    
    # Pattern 2: Description Amount
    pattern2 = r'(.+?)\s+[Rs\.₹$]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*$'
    
    # Pattern 3: Amount with currency symbols
    pattern3 = r'(?:Rs\.?|₹|\$|USD|PKR)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)'
    
    lines = raw_text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 5:
            continue
        
        # Skip header-like lines
        if any(skip in line.lower() for skip in ['total', 'subtotal', 'balance', 'date', 'description', 'amount']):
            continue
            
        # Try pattern 1 (with date)
        match = re.search(pattern1, line)
        if match:
            date_str, amount_str, desc = match.groups()
            amount = float(amount_str.replace(',', ''))
            if amount > 0:
                transactions.append({
                    "description": desc.strip()[:100],
                    "amount": amount,
                    "date": date_str,
                    "type": "expense",
                    "category": categorize_transaction(desc)
                })
            continue
        
        # Try pattern 2 (without date)
        match = re.search(pattern2, line)
        if match:
            desc, amount_str = match.groups()
            if len(desc) > 3:
                amount = float(amount_str.replace(',', ''))
                if 0 < amount < 1000000:  # Reasonable amount filter
                    transactions.append({
                        "description": desc.strip()[:100],
                        "amount": amount,
                        "date": datetime.now().strftime("%Y-%m-%d"),
                        "type": "expense",
                        "category": categorize_transaction(desc)
                    })
    
    return transactions

def categorize_transaction(description: str) -> str:
    """Auto-categorize transaction based on description keywords"""
    desc_lower = description.lower()
    
    categories = {
        "Food": ["restaurant", "food", "eat", "meal", "lunch", "dinner", "breakfast", "pizza", "burger", "coffee", "cafe", "kitchen", "dining"],
        "Shopping": ["amazon", "shop", "store", "mall", "market", "buy", "purchase", "order", "retail", "mart"],
        "Transport": ["uber", "lyft", "taxi", "bus", "train", "metro", "fuel", "gas", "petrol", "parking", "careem", "ride"],
        "Entertainment": ["movie", "cinema", "netflix", "spotify", "game", "concert", "show", "theatre"],
        "Utilities": ["electric", "water", "gas", "internet", "phone", "bill", "utility", "mobile", "ptcl", "wifi"],
        "Health": ["hospital", "doctor", "medicine", "pharmacy", "health", "clinic", "medical", "lab"],
        "Travel": ["flight", "hotel", "airbnb", "travel", "trip", "vacation", "booking", "airline"],
        "Education": ["school", "college", "university", "course", "book", "education", "tuition", "academy"]
    }
    
    for category, keywords in categories.items():
        if any(keyword in desc_lower for keyword in keywords):
            return category
    
    return "Other"

@app.on_event("startup")
async def startup_event():
    """Startup checks"""
    print("🚀 Starting Lightweight AI Document Parser Server...")
    print("📦 Checking dependencies...")
    
    # Check PyMuPDF
    try:
        import fitz
        print("   ✅ PyMuPDF installed")
    except ImportError:
        print("   ⚠️ PyMuPDF not installed - run: pip install PyMuPDF")
    
    # Check Tesseract
    try:
        import pytesseract
        pytesseract.get_tesseract_version()
        print("   ✅ Tesseract OCR available")
    except:
        print("   ⚠️ Tesseract not available - OCR will not work for scanned PDFs")
    
    # Check pdf2image
    try:
        from pdf2image import convert_from_bytes
        print("   ✅ pdf2image installed")
    except ImportError:
        print("   ⚠️ pdf2image not installed")
    
    print("✅ Server ready!")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0-lightweight",
        "features": ["direct_extraction", "tesseract_ocr"]
    }

@app.post("/parse-document", response_model=ParseResult)
async def parse_document(file: UploadFile = File(...)):
    """Parse a document and extract transactions"""
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    start_time = time.time()
    print(f"\n{'='*60}")
    print(f"📥 Received file: {file.filename}")
    
    # Read file content
    content = await file.read()
    file_ext = file.filename.split('.')[-1].lower()
    
    all_text = ""
    page_count = 1
    method = "unknown"
    
    try:
        if file_ext in ['png', 'jpg', 'jpeg', 'webp', 'bmp']:
            # Process single image
            print("🖼️ Processing image...")
            image = Image.open(io.BytesIO(content)).convert("RGB")
            all_text = extract_text_from_image_tesseract(image)
            method = "tesseract_image"
            
        elif file_ext == 'pdf':
            # Try direct extraction first (instant for text PDFs)
            all_text, page_count, success = extract_text_from_pdf_direct(content)
            
            if success:
                method = "direct_extraction"
            else:
                # Fall back to OCR for scanned PDFs
                all_text, page_count = extract_text_with_tesseract(content)
                method = "tesseract_ocr"
            
        elif file_ext in ['doc', 'docx']:
            # Extract text from Word documents
            try:
                from docx import Document
                print("📝 Processing Word document...")
                with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_ext}') as tmp:
                    tmp.write(content)
                    tmp_path = tmp.name
                
                doc = Document(tmp_path)
                all_text = "\n".join([para.text for para in doc.paragraphs])
                os.unlink(tmp_path)
                method = "docx_extraction"
                print(f"   ✅ Extracted {len(all_text)} chars")
            except ImportError:
                raise HTTPException(status_code=500, detail="python-docx not installed")
            
        elif file_ext == 'csv':
            # Parse CSV directly
            print("📊 Processing CSV...")
            all_text = content.decode('utf-8')
            method = "csv_direct"
            print(f"   ✅ Read {len(all_text)} chars")
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")
        
        # Parse transactions from extracted text
        print("🔍 Parsing transactions from text...")
        transactions = parse_transactions_from_text(all_text)
        
        # Detect statement period
        print("📅 Detecting statement period...")
        detected_period = detect_statement_period(all_text)
        if detected_period:
            print(f"   📅 Detected: {detected_period.get('month')} {detected_period.get('year')}")
        else:
            print("   ⚠️ No statement period detected")
        
        processing_time = time.time() - start_time
        
        print(f"\n{'='*60}")
        print(f"✅ Processing complete!")
        print(f"   📄 Pages: {page_count}")
        print(f"   📝 Characters: {len(all_text)}")
        print(f"   💰 Transactions found: {len(transactions)}")
        print(f"   ⏱️ Total time: {processing_time:.2f}s")
        print(f"   🔧 Method: {method}")
        print(f"{'='*60}\n")
        
        return ParseResult(
            success=True,
            raw_text=all_text[:10000],  # Limit response size
            transactions=[ExtractedTransaction(**t) for t in transactions],
            page_count=page_count,
            confidence=0.85 if transactions else 0.5,
            processing_time=processing_time,
            method=method,
            detected_period=DetectedPeriod(**detected_period) if detected_period else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
