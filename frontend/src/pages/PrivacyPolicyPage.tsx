import StaticPageTemplate from '../components/StaticPageTemplate';

const PrivacyPolicyPage = () => {
    return (
        <StaticPageTemplate
            title="Privacy Policy"
            subtitle="Last updated: December 2024"
        >
            <h2>Introduction</h2>
            <p>
                At SpendSync, we take your privacy seriously. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our application.
            </p>

            <h2>Information We Collect</h2>
            <h3>Personal Information</h3>
            <ul>
                <li>Email address and name (when you sign up)</li>
                <li>Profile information you choose to provide</li>
                <li>Transaction data synced from your browser extension</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <ul>
                <li>Log data (IP address, browser type, operating system)</li>
                <li>Usage data (features used, time spent)</li>
                <li>Device information</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
                <li>Provide, operate, and maintain our services</li>
                <li>Improve, personalize, and expand our services</li>
                <li>Communicate with you about updates and features</li>
                <li>Generate analytics and insights</li>
                <li>Detect and prevent fraud</li>
            </ul>

            <h2>Data Security</h2>
            <p>
                We implement industry-standard security measures to protect your data. All data is
                encrypted in transit and at rest. We use Supabase for secure data storage and authentication.
            </p>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt-out of communications</li>
            </ul>

            <h2>Contact Us</h2>
            <p>
                If you have questions about this Privacy Policy, please contact us at
                privacy@spendsync.app
            </p>
        </StaticPageTemplate>
    );
};

export default PrivacyPolicyPage;
