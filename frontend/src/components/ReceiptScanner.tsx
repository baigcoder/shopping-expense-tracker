// Receipt Scanner Component with OCR
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Camera, Upload, X, Scan, Loader2, Receipt, Check,
    AlertCircle, RefreshCw, DollarSign, Calendar, Store
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { currencyService, detectCurrencyFromString } from '@/services/currencyService';

interface ExtractedData {
    merchant: string;
    amount: number;
    currency: string;
    date: string;
    items: string[];
    confidence: number;
}

interface ReceiptScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { description: string; amount: number; date: string; category: string }) => void;
}

const ReceiptScanner = ({ isOpen, onClose, onConfirm }: ReceiptScannerProps) => {
    const [image, setImage] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState<ExtractedData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Handle file upload
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
                setError(null);
                setExtractedData(null);
            };
            reader.readAsDataURL(file);
        }
    };

    // Scan receipt with OCR
    const scanReceipt = useCallback(async () => {
        if (!image) return;

        setScanning(true);
        setProgress(0);
        setError(null);

        try {
            const result = await Tesseract.recognize(image, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            });

            const text = result.data.text;
            const extracted = parseReceiptText(text);

            if (extracted.amount === 0 && !extracted.merchant) {
                setError('Could not extract receipt data. Try a clearer image.');
            } else {
                setExtractedData(extracted);
                setEditedData(extracted);
            }
        } catch (err) {
            console.error('OCR Error:', err);
            setError('Failed to scan receipt. Please try again.');
        } finally {
            setScanning(false);
            setProgress(0);
        }
    }, [image]);

    // Parse OCR text to extract receipt data
    const parseReceiptText = (text: string): ExtractedData => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        let merchant = '';
        let amount = 0;
        let currency = currencyService.getCurrencyCode();
        let date = new Date().toISOString().split('T')[0];
        const items: string[] = [];
        let confidence = 0;

        // Find merchant (usually first few lines, often in caps)
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];
            // Skip common receipt headers
            if (/^(receipt|invoice|order|thank|welcome)/i.test(line)) continue;
            // Look for store name patterns
            if (line.length > 2 && line.length < 50 && !/^\d+$/.test(line)) {
                merchant = line.replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
                if (merchant.length > 2) {
                    confidence += 25;
                    break;
                }
            }
        }

        // Find amounts (look for total, subtotal, grand total)
        const amountPatterns = [
            /(?:total|amount|grand\s*total|balance|sum)[:\s]*[\$€£₹Rs]*\s*([\d,]+\.?\d*)/i,
            /[\$€£₹]\s*([\d,]+\.\d{2})/g,
            /(?:Rs\.?|PKR)\s*([\d,]+\.?\d*)/gi,
            /([\d,]+\.\d{2})(?:\s*(?:total|due))?/gi
        ];

        const foundAmounts: number[] = [];
        for (const pattern of amountPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const val = parseFloat(match[1].replace(/,/g, ''));
                if (val > 0 && val < 1000000) {
                    foundAmounts.push(val);
                }
            }
        }

        // Use the largest amount as total (usually the grand total)
        if (foundAmounts.length > 0) {
            amount = Math.max(...foundAmounts);
            confidence += 35;
        }

        // Detect currency from text
        const currencyDetected = detectCurrencyFromString(text);
        if (currencyDetected) {
            currency = currencyDetected.currency;
        }

        // Find date
        const datePatterns = [
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
            /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
            /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                try {
                    const parsed = new Date(match[1]);
                    if (!isNaN(parsed.getTime())) {
                        date = parsed.toISOString().split('T')[0];
                        confidence += 20;
                        break;
                    }
                } catch { }
            }
        }

        // Extract line items (lines with prices)
        const itemPattern = /([a-zA-Z][\w\s]+)\s+[\$€£₹Rs]*\s*([\d,]+\.?\d*)/g;
        let match;
        while ((match = itemPattern.exec(text)) !== null) {
            const itemName = match[1].trim();
            if (itemName.length > 2 && itemName.length < 50) {
                items.push(itemName);
            }
        }

        if (items.length > 0) confidence += 20;

        return {
            merchant: merchant || 'Unknown Store',
            amount,
            currency,
            date,
            items: items.slice(0, 10), // Limit to 10 items
            confidence: Math.min(100, confidence)
        };
    };

    // Handle confirm
    const handleConfirm = () => {
        const data = editMode ? editedData : extractedData;
        if (data) {
            onConfirm({
                description: `${data.merchant}${data.items.length > 0 ? ` - ${data.items[0]}` : ''}`,
                amount: data.amount,
                date: data.date,
                category: guessCategory(data.merchant, data.items)
            });
            resetScanner();
            onClose();
        }
    };

    // Guess category from merchant/items
    const guessCategory = (merchant: string, items: string[]): string => {
        const allText = `${merchant} ${items.join(' ')}`.toLowerCase();

        if (/grocery|mart|food|fresh|organic|vegeta|fruit/.test(allText)) return 'Groceries';
        if (/restaurant|cafe|coffee|pizza|burger|sushi|dining/.test(allText)) return 'Dining';
        if (/amazon|ebay|walmart|target|shop/.test(allText)) return 'Shopping';
        if (/uber|lyft|taxi|fuel|gas|petrol/.test(allText)) return 'Transportation';
        if (/pharmacy|drug|medicine|health/.test(allText)) return 'Health';
        if (/movie|cinema|netflix|spotify|entertainment/.test(allText)) return 'Entertainment';

        return 'Other';
    };

    // Reset scanner
    const resetScanner = () => {
        setImage(null);
        setExtractedData(null);
        setEditedData(null);
        setError(null);
        setEditMode(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-5 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-500 shadow-lg">
                                <Receipt className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Scan Receipt</h2>
                                <p className="text-sm text-muted-foreground">
                                    Upload or take a photo of your receipt
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4 overflow-y-auto flex-1">
                        {/* Upload Zone */}
                        {!image && (
                            <div className="space-y-4">
                                <div
                                    className="border-2 border-dashed rounded-2xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                    <p className="font-medium">Click to upload receipt</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        or drag and drop an image
                                    </p>
                                </div>

                                {/* Camera Button (Mobile) */}
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => cameraInputRef.current?.click()}
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Take Photo
                                    </Button>
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Image Preview */}
                        {image && !extractedData && (
                            <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden border">
                                    <img
                                        src={image}
                                        alt="Receipt"
                                        className="w-full max-h-64 object-contain bg-muted"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 bg-background/80 backdrop-blur"
                                        onClick={resetScanner}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {scanning ? (
                                    <div className="text-center py-4">
                                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-emerald-500 mb-3" />
                                        <p className="font-medium">Scanning receipt...</p>
                                        <div className="w-full bg-muted rounded-full h-2 mt-3">
                                            <div
                                                className="bg-gradient-to-r from-emerald-500 to-violet-500 h-2 rounded-full transition-all"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full gradient-primary text-white"
                                        onClick={scanReceipt}
                                    >
                                        <Scan className="mr-2 h-4 w-4" />
                                        Scan Receipt
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">Scan Failed</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Extracted Data */}
                        {extractedData && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-emerald-500" />
                                        <span className="font-medium">Receipt Scanned</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Confidence: {extractedData.confidence}%
                                    </div>
                                </div>

                                <Card>
                                    <CardContent className="p-4 space-y-4">
                                        {/* Merchant */}
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                <Store className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Merchant</p>
                                                {editMode ? (
                                                    <Input
                                                        value={editedData?.merchant || ''}
                                                        onChange={(e) => setEditedData(prev => prev ? { ...prev, merchant: e.target.value } : null)}
                                                        className="mt-1"
                                                    />
                                                ) : (
                                                    <p className="font-medium">{extractedData.merchant}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Amount</p>
                                                {editMode ? (
                                                    <Input
                                                        type="number"
                                                        value={editedData?.amount || 0}
                                                        onChange={(e) => setEditedData(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                                                        className="mt-1"
                                                    />
                                                ) : (
                                                    <p className="font-medium text-emerald-600">
                                                        {currencyService.formatCurrency(extractedData.amount, extractedData.currency)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                                <Calendar className="h-4 w-4 text-violet-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Date</p>
                                                {editMode ? (
                                                    <Input
                                                        type="date"
                                                        value={editedData?.date || ''}
                                                        onChange={(e) => setEditedData(prev => prev ? { ...prev, date: e.target.value } : null)}
                                                        className="mt-1"
                                                    />
                                                ) : (
                                                    <p className="font-medium">{extractedData.date}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Items */}
                                        {extractedData.items.length > 0 && (
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-2">Items detected:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {extractedData.items.slice(0, 5).map((item, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-xs px-2 py-1 bg-muted rounded-full"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Edit Button */}
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setEditMode(!editMode)}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {editMode ? 'Done Editing' : 'Edit Details'}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 gradient-primary text-white"
                            onClick={handleConfirm}
                            disabled={!extractedData || extractedData.amount === 0}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Add Transaction
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ReceiptScanner;
