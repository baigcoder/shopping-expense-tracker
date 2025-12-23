// Merchant Categorization Service
import { supabase } from '../config/supabase';

interface MerchantMapping {
    id: string;
    merchant_name: string;
    category: string;
    confidence: number;
    user_id?: string; // null for global, set for user-specific
    created_at: string;
}

class MerchantCategorizationService {
    // Built-in merchant patterns (global knowledge base)
    private merchantPatterns = {
        'Food & Dining': [
            'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'mcdonald', 'kfc',
            'subway', 'domino', 'starbucks', 'dunkin', 'food', 'kitchen', 'grill',
            'bistro', 'diner', 'eatery', 'bakery', 'bar', 'pub'
        ],
        'Groceries': [
            'grocery', 'supermarket', 'mart', 'store', 'market', 'walmart',
            'target', 'costco', 'whole foods', 'trader joe', 'safeway', 'kroger'
        ],
        'Transportation': [
            'uber', 'lyft', 'taxi', 'gas', 'fuel', 'petrol', 'shell', 'exxon',
            'chevron', 'bp', 'parking', 'toll', 'metro', 'transit', 'bus'
        ],
        'Shopping': [
            'amazon', 'ebay', 'shop', 'store', 'mall', 'boutique', 'clothing',
            'fashion', 'apparel', 'shoes', 'nike', 'adidas', 'zara', 'h&m'
        ],
        'Healthcare': [
            'pharmacy', 'medical', 'hospital', 'clinic', 'doctor', 'dental',
            'cvs', 'walgreens', 'health', 'medicine', 'lab', 'urgent care'
        ],
        'Entertainment': [
            'cinema', 'movie', 'theater', 'netflix', 'spotify', 'hulu',
            'disney', 'game', 'entertainment', 'concert', 'event', 'ticket'
        ],
        'Utilities': [
            'electric', 'water', 'gas', 'internet', 'phone', 'utility',
            'telecom', 'verizon', 'at&t', 't-mobile', 'comcast', 'spectrum'
        ],
        'Subscriptions': [
            'subscription', 'membership', 'monthly', 'annual', 'premium',
            'pro', 'plus', 'prime'
        ]
    };

    // Categorize merchant using pattern matching
    categorizeMerchant(merchantName: string): { category: string; confidence: number } {
        const lowerMerchant = merchantName.toLowerCase();

        // Check each category's patterns
        for (const [category, patterns] of Object.entries(this.merchantPatterns)) {
            for (const pattern of patterns) {
                if (lowerMerchant.includes(pattern)) {
                    // Higher confidence if exact match, lower if partial
                    const confidence = lowerMerchant === pattern ? 1.0 : 0.8;
                    return { category, confidence };
                }
            }
        }

        // Default category with low confidence
        return { category: 'Other', confidence: 0.3 };
    }

    // Save user's category correction to improve future predictions
    async saveUserCorrection(
        userId: string,
        merchantName: string,
        category: string
    ): Promise<void> {
        const { error } = await supabase
            .from('merchant_mappings')
            .upsert({
                user_id: userId,
                merchant_name: merchantName.toLowerCase(),
                category,
                confidence: 1.0,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,merchant_name'
            });

        if (error) {
            console.error('Error saving merchant mapping:', error);
        }
    }

    // Get user's learned merchant mappings
    async getUserMappings(userId: string): Promise<MerchantMapping[]> {
        const { data, error } = await supabase
            .from('merchant_mappings')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching merchant mappings:', error);
            return [];
        }

        return data || [];
    }

    // Smart categorization using both patterns and user history
    async smartCategorize(
        userId: string,
        merchantName: string
    ): Promise<{ category: string; confidence: number; source: 'user' | 'pattern' | 'default' }> {
        // First, check user's learned mappings
        const userMappings = await this.getUserMappings(userId);
        const lowerMerchant = merchantName.toLowerCase();

        const userMapping = userMappings.find(m =>
            lowerMerchant.includes(m.merchant_name) ||
            m.merchant_name.includes(lowerMerchant)
        );

        if (userMapping) {
            return {
                category: userMapping.category,
                confidence: userMapping.confidence,
                source: 'user'
            };
        }

        // Fall back to pattern matching
        const patternResult = this.categorizeMerchant(merchantName);

        return {
            ...patternResult,
            source: patternResult.confidence > 0.5 ? 'pattern' : 'default'
        };
    }

    // Analyze transaction history to suggest categories
    async analyzeTransactionPatterns(userId: string): Promise<Map<string, string>> {
        const { data: transactions } = await supabase
            .from('transactions')
            .select('description, category')
            .eq('user_id', userId)
            .not('category', 'is', null)
            .limit(1000);

        const merchantCategories = new Map<string, Map<string, number>>();

        transactions?.forEach(tx => {
            const merchant = tx.description?.toLowerCase() || '';
            if (!merchantCategories.has(merchant)) {
                merchantCategories.set(merchant, new Map());
            }
            const categoryCount = merchantCategories.get(merchant)!;
            categoryCount.set(tx.category, (categoryCount.get(tx.category) || 0) + 1);
        });

        // Get most common category for each merchant
        const result = new Map<string, string>();
        merchantCategories.forEach((categories, merchant) => {
            let maxCount = 0;
            let mostCommonCategory = 'Other';
            categories.forEach((count, category) => {
                if (count > maxCount) {
                    maxCount = count;
                    mostCommonCategory = category;
                }
            });
            result.set(merchant, mostCommonCategory);
        });

        return result;
    }

    // Get category suggestions for a merchant
    getCategorySuggestions(merchantName: string): string[] {
        const lowerMerchant = merchantName.toLowerCase();
        const suggestions: string[] = [];

        // Find all matching categories
        for (const [category, patterns] of Object.entries(this.merchantPatterns)) {
            for (const pattern of patterns) {
                if (lowerMerchant.includes(pattern)) {
                    if (!suggestions.includes(category)) {
                        suggestions.push(category);
                    }
                }
            }
        }

        return suggestions.length > 0 ? suggestions : ['Other'];
    }
}

export const merchantCategorizationService = new MerchantCategorizationService();
