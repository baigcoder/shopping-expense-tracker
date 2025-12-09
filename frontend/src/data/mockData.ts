// Mock Data for Static Testing
import { Transaction, Category } from '../types';

// Mock Categories
export const mockCategories: Category[] = [
    { id: '1', name: 'Shopping', icon: '🛍️', color: '#6366f1' },
    { id: '2', name: 'Electronics', icon: '📱', color: '#8b5cf6' },
    { id: '3', name: 'Food & Drinks', icon: '🍔', color: '#f59e0b' },
    { id: '4', name: 'Entertainment', icon: '🎬', color: '#ec4899' },
    { id: '5', name: 'Travel', icon: '✈️', color: '#06b6d4' },
    { id: '6', name: 'Subscriptions', icon: '📺', color: '#10b981' },
    { id: '7', name: 'Fashion', icon: '👕', color: '#f43f5e' },
    { id: '8', name: 'Health', icon: '💊', color: '#14b8a6' },
];

// Mock Cards
export const mockCards = [
    {
        id: '1',
        name: 'Main Card',
        cardNumber: '4532 •••• •••• 8547',
        expiryDate: '12/26',
        cardHolder: 'John Doe',
        type: 'visa',
        color: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        balance: 12458.32,
    },
    {
        id: '2',
        name: 'Shopping Card',
        cardNumber: '5412 •••• •••• 3214',
        expiryDate: '08/25',
        cardHolder: 'John Doe',
        type: 'mastercard',
        color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        balance: 3250.00,
    },
    {
        id: '3',
        name: 'Savings',
        cardNumber: '3782 •••• •••• 9012',
        expiryDate: '03/27',
        cardHolder: 'John Doe',
        type: 'amex',
        color: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        balance: 45892.15,
    },
];

// Mock Transactions
export const mockTransactions: Partial<Transaction>[] = [
    {
        id: '1',
        storeName: 'Amazon',
        productName: 'Apple AirPods Pro',
        amount: 249.99,
        purchaseDate: new Date().toISOString(),
        storeUrl: 'https://amazon.com',
        category: mockCategories[1],
    },
    {
        id: '2',
        storeName: 'Netflix',
        productName: 'Monthly Subscription',
        amount: 15.99,
        purchaseDate: new Date(Date.now() - 86400000).toISOString(),
        storeUrl: 'https://netflix.com',
        category: mockCategories[5],
    },
    {
        id: '3',
        storeName: 'Uber Eats',
        productName: 'Food Delivery',
        amount: 32.50,
        purchaseDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        storeUrl: 'https://ubereats.com',
        category: mockCategories[2],
    },
    {
        id: '4',
        storeName: 'Nike',
        productName: 'Air Max 90',
        amount: 189.00,
        purchaseDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        storeUrl: 'https://nike.com',
        category: mockCategories[6],
    },
    {
        id: '5',
        storeName: 'Spotify',
        productName: 'Premium Plan',
        amount: 9.99,
        purchaseDate: new Date(Date.now() - 86400000 * 5).toISOString(),
        storeUrl: 'https://spotify.com',
        category: mockCategories[5],
    },
    {
        id: '6',
        storeName: 'Best Buy',
        productName: 'Samsung Galaxy Watch',
        amount: 349.99,
        purchaseDate: new Date(Date.now() - 86400000 * 7).toISOString(),
        storeUrl: 'https://bestbuy.com',
        category: mockCategories[1],
    },
];

// Mock Notifications
export const mockNotifications = [
    {
        id: '1',
        type: 'transaction',
        title: 'New Purchase Detected',
        message: 'Amazon - $249.99',
        time: '2 min ago',
        read: false,
        icon: '🛍️',
    },
    {
        id: '2',
        type: 'alert',
        title: 'Budget Alert',
        message: 'Shopping category at 85% of monthly limit',
        time: '1 hour ago',
        read: false,
        icon: '⚠️',
    },
    {
        id: '3',
        type: 'subscription',
        title: 'Upcoming Renewal',
        message: 'Netflix subscription renews in 3 days',
        time: '3 hours ago',
        read: true,
        icon: '📺',
    },
    {
        id: '4',
        type: 'transaction',
        title: 'Purchase Confirmed',
        message: 'Nike - $189.00',
        time: '1 day ago',
        read: true,
        icon: '✅',
    },
    {
        id: '5',
        type: 'insight',
        title: 'Weekly Summary',
        message: 'You spent $847.46 this week',
        time: '2 days ago',
        read: true,
        icon: '📊',
    },
];

// Mock Analytics Summary
export const mockAnalyticsSummary = {
    totalSpent: 2847.46,
    totalTransactions: 24,
    averageTransaction: 118.64,
    topCategory: 'Electronics',
    monthlyChange: +12.5,
    weeklySpent: 847.46,
};

// Mock Monthly Spending (for charts)
export const mockMonthlySpending = [
    { month: 'Jul', total: 1890, transactionCount: 18 },
    { month: 'Aug', total: 2340, transactionCount: 22 },
    { month: 'Sep', total: 1780, transactionCount: 15 },
    { month: 'Oct', total: 2560, transactionCount: 28 },
    { month: 'Nov', total: 2120, transactionCount: 21 },
    { month: 'Dec', total: 2847, transactionCount: 24 },
];

// Mock Category Spending (for pie chart)
export const mockCategorySpending = [
    { category: 'Electronics', amount: 892, percentage: 31, color: '#8b5cf6' },
    { category: 'Shopping', amount: 654, percentage: 23, color: '#6366f1' },
    { category: 'Food & Drinks', amount: 432, percentage: 15, color: '#f59e0b' },
    { category: 'Subscriptions', amount: 289, percentage: 10, color: '#10b981' },
    { category: 'Fashion', amount: 312, percentage: 11, color: '#f43f5e' },
    { category: 'Other', amount: 268, percentage: 10, color: '#64748b' },
];
