"""
AI Document Parser Server
FastAPI server for extracting text and transactions from PDF bank statements
Also provides FREE text-to-speech using edge-tts (Microsoft neural voices)
Runs on port 8000
"""
import os
import re
import json
import asyncio
import tempfile
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import io

# Load environment variables
load_dotenv()

# PDF Libraries - try multiple options
pdfplumber = None
fitz = None  # PyMuPDF
edge_tts = None  # Free TTS

try:
    import pdfplumber
    print("✅ pdfplumber available")
except ImportError:
    print("⚠️ pdfplumber not installed")

try:
    import fitz  # PyMuPDF
    print("✅ PyMuPDF (fitz) available")
except ImportError:
    print("⚠️ PyMuPDF not installed")

try:
    import edge_tts
    print("✅ edge-tts available (FREE TTS!)")
except ImportError:
    print("⚠️ edge-tts not installed - run: pip install edge-tts")

try:
    from groq import Groq
except ImportError:
    Groq = None

app = FastAPI(title="AI Document Parser + Free TTS", version="1.1.0")

# CORS - allow frontend (production + development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://shopping-expense-tracker.vercel.app",
        "https://shopping-expense-tracker-svas.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Transaction(BaseModel):
    description: str
    amount: float
    date: Optional[str] = None
    category: Optional[str] = None
    type: str  # 'expense' or 'income'


class ParsedDocument(BaseModel):
    raw_text: str
    transactions: List[Transaction]
    detected_period: Optional[dict] = None
    page_count: int = 1


def extract_tables_from_pdf(file_path: str) -> list:
    """
    Extract tables from PDF using pdfplumber
    Best for structured bank statements with columns
    """
    all_tables = []
    
    if not pdfplumber:
        return []
    
    try:
        with pdfplumber.open(file_path) as pdf:
            print(f"📊 Extracting tables from {len(pdf.pages)} pages...")
            for i, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                if tables:
                    print(f"  ✓ Page {i + 1}: found {len(tables)} table(s)")
                    for table in tables:
                        all_tables.extend(table)
    except Exception as e:
        print(f"⚠️ Table extraction failed: {e}")
    
    return all_tables


def is_valid_description(desc: str) -> bool:
    """
    Validate that a description is meaningful, not a fragment
    Rejects: ': PM', 'Phone: ()', timestamps, pure punctuation, month names
    """
    if not desc:
        return False
    
    desc = desc.strip()
    
    # Too short - description should be at least 6 chars
    if len(desc) < 6:
        return False
    
    # Must have at least 4 consecutive letters (a real word)
    if not re.search(r'[a-zA-Z]{4,}', desc):
        return False
    
    # Reject standalone month names (with or without year)
    month_pattern = r'^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s*\d{0,4})?$'
    if re.match(month_pattern, desc, re.IGNORECASE):
        return False
    
    # Fragment patterns to reject - COMPREHENSIVE list
    fragment_patterns = [
        r'^:\s*(?:AM|PM|am|pm)?\s*$',              # ": PM", ": AM", ":"
        r'^:\s*\S{1,4}\s*$',                        # ": XX" or ": XXXX" short fragments
        r'^\s*:\s*.{0,5}$',                         # Starts with colon and very short
        r'^Phone:\s*\(?\s*\)?\s*$',                # "Phone: ()"
        r'^\d{1,2}:\d{2}\s*(?:AM|PM)?$',           # "2:30 PM" (time only)
        r'^[\s\-:.,;/\\]+$',                        # Just punctuation
        r'^(?:AM|PM)\s*$',                          # Just AM/PM
        r'^\(\s*\)\s*$',                            # Empty parentheses
        r'^[^a-zA-Z]*$',                            # No letters at all
        r'^\d+$',                                   # Just numbers
        r'^[A-Z]{1,3}\s*\d*$',                      # Just abbreviations like "PK", "CR", "DR 123"
        r'^\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?$',   # Just dates
        r'^\d{1,2}\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*$',  # Just "15 Aug"
        r'^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{0,4}$',  # "Aug" or "Aug 2025"
        r'^[A-Z]{1,4}$',                            # Just short caps like "PM", "ATM"
        r'^\d+\s*(?:AM|PM)$',                       # "3 PM"
        r'^(?:PKR|Rs\.?|USD|\$|EUR|€)\s*$',         # Just currency
        r'^OTHER\s*$',                              # Just "OTHER"
        r'^N/?A\s*$',                               # N/A
        r'^\s*-+\s*$',                              # Just dashes
        r'^(?:Debit|Credit|DR|CR)\s*$',             # Just transaction type
        r'^\d{4,}$',                                # Long number only (like reference nums)
    ]
    
    for pattern in fragment_patterns:
        if re.match(pattern, desc, re.IGNORECASE):
            return False
    
    # Check for meaningful content - at least one word with 5+ chars
    words = re.findall(r'[a-zA-Z]+', desc)
    if not any(len(w) >= 5 for w in words):
        # Allow if it has at least 3 words with 3+ chars each
        meaningful_words = [w for w in words if len(w) >= 3]
        if len(meaningful_words) < 2:
            return False
    
    return True




def parse_table_transactions(tables: list, statement_month: str = None, statement_year: int = None) -> list:
    """
    Enhanced transaction parsing from extracted table rows
    - Properly extracts dates from all cells
    - Combines multi-row transactions
    - Assigns statement period date when no date found
    """
    transactions = []
    seen = set()
    
    # Extended date patterns
    DATE_PATTERNS = [
        r'^(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})$',           # DD-MM-YYYY or DD/MM/YY
        r'^(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{2,4})?)$',  # 15 Aug 2025
        r'^(\d{4}[-/]\d{2}[-/]\d{2})$',                  # YYYY-MM-DD (ISO)
        r'^(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)',  # 15th August
    ]
    
    def find_date_in_row(row: list) -> str:
        """Search all cells for a date pattern"""
        for cell in row:
            if not cell or len(cell) < 4:
                continue
            cell = str(cell).strip()
            for pattern in DATE_PATTERNS:
                match = re.match(pattern, cell, re.IGNORECASE)
                if match:
                    return match.group(1)
        return None
    
    def is_amount(cell: str) -> float:
        """Check if cell is a valid amount, return value or None"""
        if not cell:
            return None
        cell = str(cell).strip().replace(',', '').replace(' ', '')
        # Remove currency symbols
        cell = re.sub(r'^[Rs.PKR₨\s]+', '', cell, flags=re.IGNORECASE)
        if re.match(r'^\d+(?:\.\d{1,2})?$', cell):
            try:
                val = float(cell)
                return val if val > 0 else None
            except:
                return None
        return None
    
    def is_text_cell(cell: str) -> bool:
        """Check if cell contains meaningful text (not just numbers/punctuation)"""
        if not cell or len(cell) < 3:
            return False
        cell = str(cell).strip()
        # Must have at least 3 letters
        if not re.search(r'[a-zA-Z]{3,}', cell):
            return False
        # Not a pure number
        if re.match(r'^[\d,]+(?:\.\d{1,2})?$', cell.replace(',', '')):
            return False
        # Not just time (e.g., "2:30 PM")
        if re.match(r'^\d{1,2}:\d{2}\s*(?:AM|PM)?$', cell, re.IGNORECASE):
            return False
        return True
    
    # First pass: identify column structure from header
    debit_col = credit_col = balance_col = -1
    
    for row in tables:
        if not row or not isinstance(row, list):
            continue
        row_str = ' '.join([str(c).lower() if c else '' for c in row])
        if 'date' in row_str or 'description' in row_str or 'debit' in row_str:
            for i, cell in enumerate(row):
                cell_lower = str(cell).lower() if cell else ''
                if 'debit' in cell_lower or 'withdrawal' in cell_lower:
                    debit_col = i
                elif 'credit' in cell_lower or 'deposit' in cell_lower:
                    credit_col = i
                elif 'balance' in cell_lower:
                    balance_col = i
            break
    
    print(f"📋 Column mapping: debit={debit_col}, credit={credit_col}, balance={balance_col}")
    
    # Second pass: extract transactions
    current_tx = None
    
    for row in tables:
        if not row or not isinstance(row, list):
            continue
        
        # Clean row
        row = [str(cell).strip() if cell else '' for cell in row]
        row_lower = ' '.join(row).lower()
        
        # Skip headers and special rows
        skip_keywords = ['date', 'description', 'particular', 'debit', 'credit', 
                         'narration', 'opening', 'closing', 'balance b/f', 'total', 'page']
        if any(kw in row_lower for kw in skip_keywords):
            continue
        
        # Skip empty rows
        if not any(cell for cell in row):
            continue
        
        # Check if this row has a date (starts new transaction)
        tx_date = find_date_in_row(row)
        
        # Find amounts in this row
        amounts = []
        for i, cell in enumerate(row):
            val = is_amount(cell)
            if val:
                amounts.append((i, val))
        
        # Collect text parts from this row
        text_parts = [cell for cell in row if is_text_cell(cell)]
        
        if tx_date:
            # Save previous transaction if valid
            if current_tx and current_tx.get('amount'):
                transactions.append(current_tx)
            
            # Start new transaction WITH DATE
            current_tx = {
                'date': tx_date,
                'description_parts': text_parts,
                'amount': None,
                'type': 'expense'
            }
            
            # Get amount from this row
            if amounts:
                if debit_col >= 0 and credit_col >= 0:
                    for col_idx, val in amounts:
                        if col_idx == debit_col:
                            current_tx['amount'] = val
                            current_tx['type'] = 'expense'
                            break
                        elif col_idx == credit_col:
                            current_tx['amount'] = val
                            current_tx['type'] = 'income'
                            break
                else:
                    # Take first non-balance amount
                    for col_idx, val in amounts:
                        if col_idx != balance_col and val < 1000000:  # Sanity check
                            current_tx['amount'] = val
                            break
        else:
            # Continuation row - add to current transaction
            if current_tx:
                current_tx['description_parts'].extend(text_parts)
                # If no amount yet, try to get from this row
                if not current_tx.get('amount') and amounts:
                    for col_idx, val in amounts:
                        if col_idx != balance_col:
                            current_tx['amount'] = val
                            break
    
    # Don't forget last transaction
    if current_tx and current_tx.get('amount'):
        transactions.append(current_tx)
    
    # Post-process: build final transaction list
    final_transactions = []
    rejected_count = 0
    
    for tx in transactions:
        # Combine description parts
        desc_parts = tx.get('description_parts', [])
        description = ' '.join(desc_parts).strip()
        
        # Clean up description
        description = re.sub(r'\s+', ' ', description)
        description = re.sub(r'^[:\-\s]+', '', description)  # Remove leading colons/dashes
        description = re.sub(r'[:\-\s]+$', '', description)  # Remove trailing colons/dashes
        
        # Use strict validation to filter out fragments
        if not is_valid_description(description):
            rejected_count += 1
            print(f"  ⚠️ Rejected fragment: '{description}'")
            continue
        
        amount = tx.get('amount', 0)
        if not amount or amount <= 0:
            continue
        
        # Avoid duplicates
        tx_key = f"{description[:30]}_{amount}"
        if tx_key in seen:
            continue
        seen.add(tx_key)
        
        # Auto-categorize
        desc_lower = description.lower()
        category = "Other"
        if any(w in desc_lower for w in ['food', 'restaurant', 'cafe', 'pizza', 'kfc', 'mcdonald', 'eat']):
            category = "Food"
        elif any(w in desc_lower for w in ['amazon', 'shop', 'store', 'mall', 'daraz', 'purchase']):
            category = "Shopping"
        elif any(w in desc_lower for w in ['uber', 'careem', 'fuel', 'petrol', 'bus', 'metro', 'transport']):
            category = "Transport"
        elif any(w in desc_lower for w in ['electric', 'gas', 'water', 'internet', 'ptcl', 'jazz', 'zong', 'bill']):
            category = "Utilities"
        elif any(w in desc_lower for w in ['transfer', 'sent to', 'received from']):
            category = "Transfer"
        
        # Detect type from description if not already set
        if any(kw in desc_lower for kw in ['credit', 'received', 'deposit', 'incoming', 'salary', 'refund']):
            tx['type'] = 'income'
        
        final_transactions.append({
            "description": description[:100],
            "amount": amount,
            "date": tx.get('date'),
            "type": tx.get('type', 'expense'),
            "category": category
        })
    
    print(f"📊 Parsed {len(final_transactions)} valid transactions ({rejected_count} fragments rejected)")
    return final_transactions


def extract_text_from_pdf(file_path: str) -> tuple[str, int, list]:
    """
    Extract text AND tables from PDF - supports multiple pages
    Returns: (text, page_count, table_transactions)
    """
    all_text = ""
    page_count = 0
    table_transactions = []
    
    # First try to extract tables (best for bank statements)
    tables = extract_tables_from_pdf(file_path)
    if tables:
        table_transactions = parse_table_transactions(tables)
        if table_transactions:
            print(f"✅ Found {len(table_transactions)} transactions from tables")
    
    # Also extract text for fallback/additional parsing
    if fitz:
        try:
            doc = fitz.open(file_path)
            page_count = len(doc)
            print(f"📄 [PyMuPDF] Processing PDF with {page_count} pages...")
            
            for i, page in enumerate(doc):
                page_text = page.get_text()
                if page_text.strip():
                    if page_count > 1:
                        all_text += f"\n--- PAGE {i + 1} of {page_count} ---\n"
                    all_text += page_text + "\n"
                    print(f"  ✓ Page {i + 1}: {len(page_text)} chars")
            
            doc.close()
            
            if all_text.strip():
                return all_text, page_count, table_transactions
        except Exception as e:
            print(f"⚠️ PyMuPDF failed: {e}, trying pdfplumber...")
    
    # Fallback to pdfplumber for text
    if pdfplumber:
        try:
            with pdfplumber.open(file_path) as pdf:
                page_count = len(pdf.pages)
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        if page_count > 1:
                            all_text += f"\n--- PAGE {i + 1} of {page_count} ---\n"
                        all_text += page_text + "\n"
                        
            if all_text.strip():
                return all_text, page_count, table_transactions
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")
    
    if not fitz and not pdfplumber:
        raise HTTPException(
            status_code=500, 
            detail="No PDF library installed. Run: pip install pymupdf pdfplumber"
        )
    
    raise HTTPException(
        status_code=400, 
        detail="Could not extract text from PDF. Document might be image-based or scanned."
    )


def extract_text_from_csv(file_content: bytes) -> str:
    """Extract text from CSV file"""
    try:
        return file_content.decode('utf-8')
    except:
        return file_content.decode('latin-1')


def parse_transactions_with_ai(text: str) -> dict:
    """Use Groq AI to extract transactions from text"""
    
    # Get API key from environment
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        # Try to read from backend .env
        backend_env = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
        if os.path.exists(backend_env):
            with open(backend_env, 'r') as f:
                for line in f:
                    if line.startswith('GROQ_API_KEY='):
                        api_key = line.split('=', 1)[1].strip()
                        break
    
    if not api_key or not Groq:
        # Fallback: simple regex-based parsing
        return parse_transactions_regex(text)
    
    try:
        client = Groq(api_key=api_key)
        
        prompt = f"""Analyze this bank statement text and extract all transactions.

For each transaction, identify:
1. Description (merchant/payee name)
2. Amount (as a positive number)
3. Date (if visible, in format like "Feb 15" or "2024-02-15")
4. Type: "expense" for debits/purchases/payments, "income" for credits/deposits
5. Category: Food, Shopping, Transport, Entertainment, Utilities, Health, Travel, Education, or Other

Also detect the statement period (month and year) if mentioned.

Return ONLY valid JSON in this exact format:
{{
    "transactions": [
        {{"description": "Store Name", "amount": 25.99, "date": "Feb 15", "type": "expense", "category": "Shopping"}},
        {{"description": "Salary Deposit", "amount": 3000.00, "date": "Feb 1", "type": "income", "category": "Other"}}
    ],
    "detected_period": {{"month": "February", "year": 2024}}
}}

Bank Statement Text:
{text[:8000]}"""  # Limit text length

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=4000,
        )
        
        content = response.choices[0].message.content
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            result = json.loads(json_match.group())
            return result
        else:
            return {"transactions": [], "detected_period": None}
            
    except Exception as e:
        print(f"AI parsing error: {e}")
        return parse_transactions_regex(text)


def parse_transactions_regex(text: str) -> dict:
    """
    Improved regex-based transaction parsing
    Extracts: name, date, amount, send/receive type
    """
    transactions = []
    seen = set()  # Avoid duplicates
    
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 8:
            continue
        
        # Skip headers and non-transaction lines
        skip_keywords = ['balance', 'total', 'opening', 'closing', 'date', 'description', 
                         'particular', 'narration', 'page', 'statement', 'account']
        if any(kw in line.lower() for kw in skip_keywords):
            continue
        
        # Try to find amounts in different formats
        # Pattern: Rs 1,234.56 or Rs. 1234.56 or PKR 1,234 or just 1,234.56
        amount_matches = re.findall(
            r'(?:Rs\.?\s*|PKR\s*|₨\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)',
            line
        )
        
        if not amount_matches:
            continue
        
        # Get the largest amount (usually the transaction amount, not running balance)
        amounts = []
        for m in amount_matches:
            try:
                val = float(m.replace(',', ''))
                if val > 0:
                    amounts.append(val)
            except:
                pass
        
        if not amounts:
            continue
        
        # Usually transaction amount is NOT the last (balance is last)
        amount = amounts[0] if len(amounts) == 1 else amounts[-2] if len(amounts) >= 2 else amounts[0]
        
        # Extract date - common formats
        date_match = re.search(
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{0,4})',
            line, re.IGNORECASE
        )
        tx_date = date_match.group(1) if date_match else None
        
        # Extract description - text that's not numbers/date/common words
        # Remove amounts and dates from line to get description
        desc_line = line
        for amt in amount_matches:
            desc_line = desc_line.replace(amt, ' ')
        if tx_date:
            desc_line = desc_line.replace(tx_date, ' ')
        
        # Clean up description
        desc_line = re.sub(r'(?:Rs\.?|PKR|₨)\s*', '', desc_line, flags=re.IGNORECASE)
        desc_line = re.sub(r'[-/.,\s]+', ' ', desc_line).strip()
        desc_line = re.sub(r'\s+', ' ', desc_line)
        
        # Skip if description is too short or just symbols
        if len(desc_line) < 3 or not re.search(r'[a-zA-Z]{2,}', desc_line):
            continue
        
        description = desc_line[:100]  # Limit length
        
        # Determine transaction type (send/receive)
        tx_type = 'expense'  # Default
        receive_keywords = ['credit', 'cr', 'deposit', 'received', 'salary', 'transfer in', 
                           'incoming', 'refund', 'cashback', 'reversal', 'credited']
        send_keywords = ['debit', 'dr', 'withdrawal', 'payment', 'purchase', 'transfer out',
                        'outgoing', 'debited', 'paid']
        
        line_lower = line.lower()
        if any(kw in line_lower for kw in receive_keywords):
            tx_type = 'income'
        elif any(kw in line_lower for kw in send_keywords):
            tx_type = 'expense'
        
        # Create unique key to avoid duplicates
        tx_key = f"{description[:30]}_{amount}"
        if tx_key in seen:
            continue
        seen.add(tx_key)
        
        # Simple category detection
        category = "Other"
        desc_lower = description.lower()
        if any(w in desc_lower for w in ['food', 'restaurant', 'cafe', 'pizza', 'kfc', 'mcdonald']):
            category = "Food"
        elif any(w in desc_lower for w in ['amazon', 'shop', 'store', 'mall', 'daraz']):
            category = "Shopping"
        elif any(w in desc_lower for w in ['uber', 'careem', 'fuel', 'petrol', 'bus', 'metro']):
            category = "Transport"
        elif any(w in desc_lower for w in ['electric', 'gas', 'water', 'internet', 'ptcl', 'jazz', 'zong']):
            category = "Utilities"
        
        transactions.append({
            "description": description,
            "amount": amount,
            "date": tx_date,
            "type": tx_type,
            "category": category
        })
    
    print(f"📊 Extracted {len(transactions)} transactions")
    return {"transactions": transactions[:100], "detected_period": None}


@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Document Parser is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/parse-document", response_model=ParsedDocument)
async def parse_document(file: UploadFile = File(...)):
    """
    Parse a document (PDF, image, or CSV) and extract transactions
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    filename = file.filename.lower()
    content = await file.read()
    
    # Create temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Extract text based on file type
        page_count = 1
        table_transactions = []
        
        if filename.endswith('.pdf'):
            raw_text, page_count, table_transactions = extract_text_from_pdf(tmp_path)
            print(f"📊 PDF parsed: {page_count} pages, {len(raw_text)} chars, {len(table_transactions)} table transactions")
        elif filename.endswith('.csv'):
            raw_text = extract_text_from_csv(content)
        elif filename.endswith(('.png', '.jpg', '.jpeg', '.webp')):
            # For images, we'd need OCR - for now return error
            raise HTTPException(
                status_code=400, 
                detail="Image OCR requires tesseract. Please use PDF or CSV files."
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {filename}")
        
        if not raw_text.strip() and not table_transactions:
            raise HTTPException(status_code=400, detail="Could not extract text from document")
        
        # Use table transactions if found (better for bank statements)
        # Otherwise, fall back to AI/regex parsing
        if table_transactions:
            print(f"✅ Using {len(table_transactions)} transactions from table extraction")
            transactions = table_transactions
            detected_period = None
        else:
            # Parse transactions using AI or regex
            result = parse_transactions_with_ai(raw_text)
            transactions = result.get("transactions", [])
            detected_period = result.get("detected_period")
        
        return ParsedDocument(
            raw_text=raw_text[:10000],
            transactions=transactions,
            detected_period=detected_period,
            page_count=page_count
        )
        
    finally:
        # Cleanup temp file
        try:
            os.unlink(tmp_path)
        except:
            pass


# =============================================================================
# FREE TEXT-TO-SPEECH (edge-tts - Microsoft Neural Voices)
# =============================================================================

# Popular voice options (all FREE!)
VOICE_OPTIONS = {
    # English US
    "jenny": "en-US-JennyNeural",       # Female, friendly
    "guy": "en-US-GuyNeural",           # Male, professional
    "aria": "en-US-AriaNeural",         # Female, expressive
    "davis": "en-US-DavisNeural",       # Male, calm
    "sara": "en-US-SaraNeural",         # Female, cheerful
    # English UK
    "sonia": "en-GB-SoniaNeural",       # Female, British
    "ryan": "en-GB-RyanNeural",         # Male, British
    # Other languages
    "xiaoxiao": "zh-CN-XiaoxiaoNeural", # Chinese Female
    "nanami": "ja-JP-NanamiNeural",     # Japanese Female
}

class TTSRequest(BaseModel):
    text: str
    voice: str = "jenny"  # Default voice
    rate: str = "+0%"     # Speed adjustment (-50% to +100%)
    pitch: str = "+0Hz"   # Pitch adjustment


@app.get("/voices")
async def list_voices():
    """List available TTS voices"""
    if not edge_tts:
        return {"error": "edge-tts not installed", "voices": []}
    
    return {
        "voices": [
            {"id": k, "name": v, "lang": v.split("-")[0] + "-" + v.split("-")[1]}
            for k, v in VOICE_OPTIONS.items()
        ],
        "default": "jenny"
    }


@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech using Microsoft's FREE neural voices
    Returns MP3 audio stream
    """
    if not edge_tts:
        raise HTTPException(
            status_code=500, 
            detail="edge-tts not installed. Run: pip install edge-tts"
        )
    
    # Get voice ID
    voice_id = VOICE_OPTIONS.get(request.voice.lower(), VOICE_OPTIONS["jenny"])
    
    # Limit text length
    text = request.text[:5000]
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    
    print(f"🎤 TTS: '{text[:50]}...' with voice {voice_id}")
    
    try:
        # Create TTS communicator
        communicate = edge_tts.Communicate(
            text, 
            voice_id,
            rate=request.rate,
            pitch=request.pitch
        )
        
        # Collect audio data
        audio_data = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.write(chunk["data"])
        
        audio_data.seek(0)
        
        return StreamingResponse(
            audio_data,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )
        
    except Exception as e:
        print(f"❌ TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tts/stream")
async def tts_stream(text: str, voice: str = "jenny"):
    """Stream TTS audio (for direct <audio> src)"""
    if not edge_tts:
        raise HTTPException(status_code=500, detail="edge-tts not installed")
    
    voice_id = VOICE_OPTIONS.get(voice.lower(), VOICE_OPTIONS["jenny"])
    
    async def generate():
        communicate = edge_tts.Communicate(text[:5000], voice_id)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield chunk["data"]
    
    return StreamingResponse(generate(), media_type="audio/mpeg")


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AI Document Parser + Free TTS on http://localhost:8000")
    print("📄 PDF parsing: /parse-document")
    print("🎤 Free TTS: /tts (POST) or /tts/stream (GET)")
    uvicorn.run(app, host="0.0.0.0", port=8000)
